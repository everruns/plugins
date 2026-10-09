#!/usr/bin/env node
// Fails when a skill names an `everruns <noun> <verb>` command that does not
// exist, so skills cannot teach commands the product never had or has dropped.
// Reads the command catalog's help tree from everruns/everruns `main`; runs
// weekly in CI.
//
//   node scripts/check-commands.mjs [path/to/everruns/checkout]
//
// Decisions:
// - The source is evals/platform-capability/help.json, the generated `--help`
//   output of every server command group. It is checked in and kept current
//   by everruns' own tests, so it is a stable contract to read.
// - Commands the CLI adds on top of the server catalog (sign-in, file sync,
//   chat) are listed here by hand; they change rarely.
// - Only the first two words after `everruns` are checked. Deeper verbs and
//   flags are left to `--help`, which the skills point at.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HELP = "evals/platform-capability/help.json";
const URL = `https://raw.githubusercontent.com/everruns/everruns/main/${HELP}`;

const CLI_LOCAL = {
  login: [], logout: [], status: [], chat: [],
  orgs: ["select"],
  connections: ["set", "list", "remove"],
  files: ["sync", "push", "pull", "ls"],
};

const checkout = process.argv[2];
const help = checkout
  ? JSON.parse(fs.readFileSync(path.join(checkout, HELP), "utf8"))
  : await (async () => {
      const res = await fetch(URL);
      if (!res.ok) throw new Error(`GET ${URL}: ${res.status}`);
      return res.json();
    })();

// "Commands:" sections list `  name  description` lines.
const children = (text) =>
  [...(text ?? "").split("Commands:")[1]?.matchAll(/^\s{2}([a-z][a-z0-9-]*)\s{2,}/gm) ?? []].map((m) => m[1]);

const nouns = new Map();
for (const noun of children(help[""])) nouns.set(noun, new Set(children(help[noun])));
for (const [noun, verbs] of Object.entries(CLI_LOCAL)) {
  const set = nouns.get(noun) ?? new Set();
  verbs.forEach((v) => set.add(v));
  nouns.set(noun, set);
}
if (nouns.size < 20) {
  console.error(`error: found only ${nouns.size} command groups; ${HELP} changed shape, update this script`);
  process.exit(1);
}

const errors = [];
const skillsRoot = path.join(ROOT, "plugins");
const files = fs
  .readdirSync(skillsRoot, { recursive: true })
  .filter((f) => f.endsWith("SKILL.md"))
  .map((f) => path.join(skillsRoot, f));

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, "utf8");
  // Commands appear in code: inline `everruns …` or fenced blocks.
  for (const m of text.matchAll(/(?:^|[`\s(])everruns ([a-z][a-z0-9-]*)(?: ([a-z][a-z0-9-]*))?/gm)) {
    const [, noun, verb] = m;
    if (!nouns.has(noun)) {
      // Prose like "everruns agents" is caught too; only flag words that look like commands.
      if (/^(is|are|runs|platform|cloud|mcp|cli|skill|plugin|command|and|or|to|in|on|for|the|a|an|id|ids|server|crate|framework|sdk|docs|account|deployment|records|keeps|via|with)$/.test(noun)) continue;
      errors.push(`${rel}: unknown command group 'everruns ${noun}'`);
      continue;
    }
    const verbs = nouns.get(noun);
    if (verb && verbs.size && !verbs.has(verb) && !verb.startsWith("-")) {
      errors.push(`${rel}: unknown command 'everruns ${noun} ${verb}'`);
    }
  }
}

if (errors.length) {
  for (const e of [...new Set(errors)]) console.error(`error: ${e}`);
  process.exit(1);
}
console.log(`commands: ok (${files.length} skills checked against ${nouns.size} command groups)`);
