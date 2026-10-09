#!/usr/bin/env node
// Scenario evals: does the plugin actually help a coding agent do Everruns jobs?
// Runs the suite in plugins/everruns/evals/ with `claude plugin eval` in three arms
// and prints one table:
//
//   with      the plugin as shipped: skills + the Everruns MCP server
//   mcp-only  the same MCP server with no skills, which isolates what the skills add
//   without   no plugin at all (claude plugin eval's own baseline arm)
//
//   node scripts/eval.mjs [--runs N] [--model M] [--case GLOB] [-j N]
//
// Decisions:
// - The MCP server is mocked (plugins/everruns/evals/mocks/everruns/): a fake
//   organization "Acme" with known agents, a failed session, spend and channels,
//   so runs touch no real account and graders can check concrete facts.
//   `query`/`execute`/`discover` are played by a small model told the facts;
//   the rest are canned JSON.
// - Needs a Claude credential (ANTHROPIC_API_KEY or a signed-in `claude`).
//   Each run is a full agent loop, so it is manual, not part of CI.
// - Exit code is 0 unless an arm fails to run; scores are for reading, not gating.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLUGIN = path.join(ROOT, "plugins/everruns");
const passthrough = process.argv.slice(2);
const out = fs.mkdtempSync(path.join(os.tmpdir(), "everruns-evals-"));

function run(target, args, json) {
  const cmd = ["plugin", "eval", target, "--trust-plugin", "--no-publish", "--threshold", "0",
    "--allow-tools", "Write", "--json", json, ...args, ...passthrough];
  console.error(`$ claude ${cmd.join(" ")}`);
  const res = spawnSync("claude", cmd, { stdio: ["ignore", "inherit", "inherit"] });
  if (res.status !== 0 || !fs.existsSync(json)) {
    console.error(`error: claude plugin eval exited ${res.status}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(json, "utf8"));
}

// Arm 1 and 3: the shipped plugin, with claude plugin eval's no-plugin baseline.
const full = run(PLUGIN, ["--ablation", "with-without"], path.join(out, "with-without.json"));

// Arm 2: a copy with an empty skills folder; the evals and mocks come along.
const bare = path.join(out, "everruns-mcp-only");
fs.cpSync(PLUGIN, bare, { recursive: true, filter: (src) => !src.includes(`${path.sep}results`) });
fs.rmSync(path.join(bare, "skills"), { recursive: true });
fs.mkdirSync(path.join(bare, "skills"));
const mcpOnly = run(bare, ["--ablation", "none"], path.join(out, "mcp-only.json"));

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const pct = (x) => (Number.isNaN(x) ? "n/a" : `${Math.round(x * 100)}%`);
const score = (runs = []) => mean(runs.map((r) => r.score ?? 0));
// The skill-fired grader is an unscored indicator: the share of runs that loaded the right skill.
const fired = (runs = []) =>
  mean(runs.map((r) => ((r.graders ?? []).find((g) => g.name === "skill-fired")?.passed ? 1 : 0)));

const rows = full.cases.map((c) => {
  const bareCase = mcpOnly.cases.find((m) => m.name === c.name);
  return [c.name, pct(score(c.arms.with)), pct(score(bareCase?.arms.with)),
    pct(score(c.arms.without)), pct(fired(c.arms.with))];
});
const all = (pick) => pct(mean(rows.map(pick).map((s) => parseInt(s) / 100).filter((x) => !Number.isNaN(x))));
rows.push(["**mean**", all((r) => r[1]), all((r) => r[2]), all((r) => r[3]), all((r) => r[4])]);

console.log("\n| Case | With plugin | MCP only | No plugin | Right skill loaded |");
console.log("|---|---|---|---|---|");
for (const r of rows) console.log(`| ${r.join(" | ")} |`);
console.log(`\nRaw results: ${out}`);
