#!/usr/bin/env node
// Copy the shared skills listed in catalog.json (`sharedSkills`) from a checkout
// of everruns/everruns, which owns them in skills/. Never edit the copies here.
//
//   node scripts/sync-shared-skills.mjs [path/to/everruns] [--check] [--bump]
//
// --bump raises the patch version of each plugin whose copies changed, so hosts
// pick the new skills up; everruns' skills-sync workflow passes it.
// --check fails when a copy differs; CI runs it against a fresh clone of
// everruns main so drift shows up on the next push or the weekly run.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const check = args.includes("--check");
const bump = args.includes("--bump");
const source = path.resolve(args.find((arg) => !arg.startsWith("--")) ?? path.join(ROOT, "../everruns"));
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "catalog.json"), "utf8"));

const files = (dir) =>
  fs.readdirSync(dir, { recursive: true })
    .filter((file) => fs.statSync(path.join(dir, file)).isFile())
    .sort();

const same = (from, to) => {
  const authored = files(from);
  return fs.existsSync(to) &&
    JSON.stringify(authored) === JSON.stringify(files(to)) &&
    authored.every((file) => fs.readFileSync(path.join(from, file)).equals(fs.readFileSync(path.join(to, file))));
};

let drift = 0;
let count = 0;
for (const entry of catalog.plugins) {
  let changed = false;
  for (const name of entry.sharedSkills ?? []) {
    const from = path.join(source, "skills", name);
    const to = path.join(ROOT, entry.path, "skills", name);
    if (!fs.existsSync(path.join(from, "SKILL.md"))) throw new Error(`Missing canonical skill: ${from}`);
    count++;
    if (same(from, to)) continue;
    if (check) {
      console.error(`drift: ${entry.path}/skills/${name} differs from everruns skills/${name}`);
      drift++;
      continue;
    }
    fs.rmSync(to, { recursive: true, force: true });
    fs.cpSync(from, to, { recursive: true });
    changed = true;
  }
  if (bump && changed) {
    const manifest = path.join(ROOT, entry.path, "plugin.json");
    const text = fs.readFileSync(manifest, "utf8");
    const version = JSON.parse(text).version;
    const [major, minor, patch] = version.split(".").map(Number);
    const next = `${major}.${minor}.${patch + 1}`;
    fs.writeFileSync(manifest, text.replace(`"version": "${version}"`, `"version": "${next}"`));
    console.log(`${entry.path}: ${version} -> ${next}`);
  }
}
if (drift) {
  console.error(`Run: node scripts/sync-shared-skills.mjs <everruns checkout> --bump (everruns skills-sync does this on every change).`);
  process.exit(1);
}
console.log(`${check ? "Verified" : "Synced"} ${count} shared skills.`);
