#!/usr/bin/env node
// Builds the ZIP the OpenAI plugin portal takes
// (https://developers.openai.com/plugins/deploy/submission).
//
//   node scripts/pack.mjs <plugin>    writes dist/<plugin>-<version>.zip
//
// Decisions:
// - The plugin folder is the ZIP root, with every host manifest kept: the
//   portal reads identity from plugin.json, servers from mcp.json, and listing
//   and review fields from .codex-plugin/plugin.json.
// - Only tracked files go in, minus evals/, so a local result or secret in the
//   working tree can never reach the upload.
// - Runs the build check first: a stale manifest is the one thing the portal
//   would accept and then show wrong.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const name = process.argv[2];
if (!name) {
  console.error("usage: node scripts/pack.mjs <plugin>");
  process.exit(2);
}
const dir = path.join(ROOT, "plugins", name);
if (!fs.existsSync(path.join(dir, "plugin.json"))) {
  console.error(`no plugin at plugins/${name}`);
  process.exit(2);
}
execFileSync(process.execPath, [path.join(ROOT, "scripts/build.mjs"), "--check"], { stdio: "inherit" });

const { version } = JSON.parse(fs.readFileSync(path.join(dir, "plugin.json"), "utf8"));
const files = execFileSync("git", ["ls-files", "-z", "--", "."], { cwd: dir, encoding: "utf8" })
  .split("\0")
  .filter((f) => f && !f.startsWith("evals/"));
const out = path.join(ROOT, "dist", `${name}-${version}.zip`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.rmSync(out, { force: true });
execFileSync("zip", ["-X", "-q", out, "-@"], { cwd: dir, input: files.join("\n") });
console.log(`wrote ${path.relative(ROOT, out)} (${files.length} files)`);
