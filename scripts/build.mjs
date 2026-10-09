#!/usr/bin/env node
// Generates every host-specific file from two sources of truth:
//   - each plugin's portable Agent Plugins files (plugin.json, mcp.json, skills/)
//   - catalog.json (marketplace listing and per-host metadata)
// and validates the result.
//
//   node scripts/build.mjs           write generated files
//   node scripts/build.mjs --check   fail if a generated file is stale or a rule is broken
//
// Decisions:
// - Portable files are authored by hand; host manifests are never edited by
//   hand. One description and one version reach every host, so listings
//   cannot drift apart.
// - No dependencies: plain Node, so CI and contributors need nothing installed.
// - The portable manifest schema is closed (agent-plugins.org 1.0.0), so host
//   metadata (Codex interface, Cursor tags) lives in catalog.json instead.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const errors = [];
const fail = (msg) => errors.push(msg);
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
const json = (value) => JSON.stringify(value, null, 2) + "\n";

const PLUGIN_FIELDS = new Set([
  "$schema", "name", "version", "description", "author", "homepage",
  "repository", "license", "keywords", "extensions",
]);
const PLUGIN_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
const MCP_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json";
const NAME_RE = /^[a-z0-9](?:[a-z0-9.-]{0,62}[a-z0-9])?$/;
const SKILL_NAME_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const SKILL_FIELDS = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools"]);

const outputs = new Map(); // relative path -> content

function emit(rel, value) {
  outputs.set(rel, typeof value === "string" ? value : json(value));
}

function frontmatter(text, file) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) {
    fail(`${file}: missing YAML frontmatter`);
    return {};
  }
  const fields = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z-]+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2];
  }
  return fields;
}

function checkSkills(pluginDir) {
  const skillsDir = path.join(ROOT, pluginDir, "skills");
  const names = [];
  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const rel = path.join(pluginDir, "skills", entry.name, "SKILL.md");
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) {
      fail(`${rel}: missing`);
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    const fm = frontmatter(text, rel);
    for (const key of Object.keys(fm)) {
      if (!SKILL_FIELDS.has(key)) fail(`${rel}: frontmatter field '${key}' is not in the Agent Skills spec`);
    }
    if (fm.name !== entry.name) fail(`${rel}: name '${fm.name}' must match its folder '${entry.name}'`);
    if (!SKILL_NAME_RE.test(fm.name ?? "") || fm.name.includes("--")) fail(`${rel}: invalid skill name`);
    if (!fm.description) fail(`${rel}: description is required`);
    else if (fm.description.length > 1024) fail(`${rel}: description is over 1024 characters`);
    const lines = text.split("\n").length;
    if (lines > 500) fail(`${rel}: ${lines} lines; keep a skill under 500 and move detail to references/`);
    names.push(fm.name);
  }
  if (names.length === 0) fail(`${pluginDir}: no skills`);
  return names.sort();
}

function hostMcp(portable) {
  // Claude Code, Codex and Cursor read the legacy `.mcp.json` shape, where a
  // Streamable HTTP server is `type: "http"`.
  const servers = {};
  for (const [name, server] of Object.entries(portable.mcpServers)) {
    if (server.type === "streamable-http") servers[name] = { type: "http", url: server.url, ...(server.headers ? { headers: server.headers } : {}) };
    else if (server.type === "stdio") servers[name] = { command: server.command, args: server.args, env: server.env };
    else fail(`mcp server '${name}': unsupported type '${server.type}'`);
  }
  return { mcpServers: servers };
}

const catalog = readJson("catalog.json");
const market = catalog.marketplace;
const claudeEntries = [];
const codexEntries = [];
const cursorEntries = [];
const readmeIndex = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");

for (const entry of catalog.plugins) {
  const dir = entry.path;
  const manifest = readJson(path.join(dir, "plugin.json"));
  const mcp = readJson(path.join(dir, "mcp.json"));

  for (const key of Object.keys(manifest)) {
    if (!PLUGIN_FIELDS.has(key)) fail(`${dir}/plugin.json: field '${key}' is not allowed by Agent Plugins 1.0`);
  }
  if (manifest.$schema !== PLUGIN_SCHEMA) fail(`${dir}/plugin.json: $schema must be ${PLUGIN_SCHEMA}`);
  if (!NAME_RE.test(manifest.name) || manifest.name !== path.basename(dir)) fail(`${dir}/plugin.json: name must be valid and match the folder`);
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version ?? "")) fail(`${dir}/plugin.json: version must be semver`);
  if (mcp.$schema !== MCP_SCHEMA) fail(`${dir}/mcp.json: $schema must be ${MCP_SCHEMA}`);
  for (const asset of [entry.logo, entry.codex?.composerIcon].filter(Boolean)) {
    if (!fs.existsSync(path.join(ROOT, dir, asset))) fail(`${dir}: asset ${asset} is missing`);
  }

  const skills = checkSkills(dir);
  for (const skill of skills) {
    if (!readmeIndex.includes(`\`${skill}\``)) fail(`README.md: skill '${skill}' is not listed`);
  }

  const { name, version, description, author, homepage, repository, license, keywords } = manifest;
  const common = { name, version, description, author, homepage, repository, license, keywords };

  emit(`${dir}/.mcp.json`, hostMcp(mcp));
  emit(`${dir}/.claude-plugin/plugin.json`, { ...common, skills: "./skills/", mcpServers: "./.mcp.json" });
  emit(`${dir}/.codex-plugin/plugin.json`, {
    ...common,
    skills: "./skills/",
    mcpServers: "./.mcp.json",
    interface: {
      displayName: entry.displayName,
      shortDescription: entry.codex.shortDescription,
      longDescription: entry.codex.longDescription,
      developerName: author.name,
      category: entry.category,
      capabilities: entry.codex.capabilities,
      websiteURL: author.url,
      defaultPrompt: entry.codex.defaultPrompt,
      brandColor: entry.codex.brandColor,
      composerIcon: `./${entry.codex.composerIcon}`,
      logo: `./${entry.logo}`,
      screenshots: [],
    },
  });
  emit(`${dir}/.cursor-plugin/plugin.json`, {
    name,
    displayName: entry.displayName,
    version,
    description,
    author,
    publisher: author.name,
    homepage,
    repository,
    license,
    logo: entry.logo,
    category: entry.category.toLowerCase(),
    tags: entry.tags,
    keywords,
    skills: "./skills/",
    mcpServers: "./.mcp.json",
  });

  if (catalog.gemini === dir) {
    // Gemini CLI installs an extension from a repository root, so the
    // extension manifest sits at the root and `skills` there links to this
    // plugin's skills.
    const servers = {};
    for (const [n, s] of Object.entries(mcp.mcpServers)) {
      if (s.type === "streamable-http") servers[n] = { httpUrl: s.url };
    }
    emit("gemini-extension.json", { name, version, description, mcpServers: servers });
    const link = path.join(ROOT, "skills");
    const target = path.join(dir, "skills");
    let ok = false;
    try {
      ok = fs.lstatSync(link).isSymbolicLink() && fs.readlinkSync(link) === target;
    } catch {}
    if (!ok) {
      if (CHECK) fail(`skills: must be a symlink to ${target} (run node scripts/build.mjs)`);
      else {
        fs.rmSync(link, { force: true, recursive: false });
        fs.symlinkSync(target, link);
      }
    }
  }

  const listing = { name, description, version, author, homepage, repository, license, keywords };
  claudeEntries.push({ ...listing, source: `./${dir}`, category: entry.category });
  codexEntries.push({
    name,
    source: { source: "local", path: `./${dir}` },
    policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
    category: entry.category,
    description,
  });
  cursorEntries.push({
    ...listing,
    source: `./${dir}`,
    logo: `${dir}/${entry.logo}`,
    category: entry.category.toLowerCase(),
    tags: entry.tags,
  });
}

emit(".claude-plugin/marketplace.json", {
  name: market.name,
  description: market.description,
  owner: market.owner,
  plugins: claudeEntries,
});
emit(".agents/plugins/marketplace.json", {
  name: market.name,
  interface: { displayName: market.displayName },
  description: market.description,
  plugins: codexEntries,
});
emit(".cursor-plugin/marketplace.json", {
  name: market.name,
  owner: market.owner,
  metadata: { description: market.description },
  plugins: cursorEntries,
});

for (const [rel, content] of outputs) {
  const file = path.join(ROOT, rel);
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (current === content) continue;
  if (CHECK) fail(`${rel}: out of date (run node scripts/build.mjs)`);
  else {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    console.log(`wrote ${rel}`);
  }
}

if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`);
  process.exit(1);
}
console.log(CHECK ? "check: ok" : "build: ok");
