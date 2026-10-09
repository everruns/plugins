#!/usr/bin/env node
// Fails when the Everruns MCP server gains a tool the `everruns` skill does
// not mention, so the skill cannot silently fall behind the server.
// Reads the tool registry from everruns/everruns `main`; runs weekly in CI.
//
//   node scripts/check-mcp-tools.mjs [path/to/everruns/checkout]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://raw.githubusercontent.com/everruns/everruns/main/";
const REGISTRY = "crates/server/src/api/mcp_endpoint/tool_registry.rs";
const APPS = "crates/server/src/api/mcp_endpoint/apps/mod.rs";
// Tools only the MCP Apps panels call; their descriptions tell models not to.
const APP_ONLY = new Set(["session_view", "session_answer_question", "session_decide_approval"]);

const checkout = process.argv[2];
async function source(rel) {
  if (checkout) return fs.readFileSync(path.join(checkout, rel), "utf8");
  const res = await fetch(BASE + rel);
  if (!res.ok) throw new Error(`GET ${BASE + rel}: ${res.status}`);
  return res.text();
}
const registry = await source(REGISTRY);
const consts = Object.fromEntries(
  [...(await source(APPS)).matchAll(/const ([A-Z_]+): &str = "([a-z_]+)"/g)].map((m) => [m[1], m[2]]),
);

// Every tool is declared as `tool(protocol_version, <name>, "<title>", …)`,
// where <name> is a string literal or a `super::apps::` constant.
const tools = [
  ...registry.matchAll(/\btool\(\s*protocol_version,\s*(?:"([a-z_]+)"|super::apps::([A-Z_]+))/g),
].map((m) => m[1] ?? consts[m[2]] ?? `unresolved:${m[2]}`);
if (tools.length < 8) {
  console.error(`error: found only ${tools.length} tools; the registry format changed, update this script`);
  process.exit(1);
}

const skill = fs.readFileSync(path.join(ROOT, "plugins/everruns/skills/everruns/SKILL.md"), "utf8");
const missing = tools.filter((t) => !APP_ONLY.has(t) && !skill.includes(`\`${t}\``));
if (missing.length) {
  console.error(`error: the everruns skill does not mention these MCP tools: ${missing.join(", ")}`);
  process.exit(1);
}
console.log(`mcp-tools: ok (${tools.length} tools, ${APP_ONLY.size} app-only)`);
