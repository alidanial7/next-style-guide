/**
 * Copy repo README + LICENSE into cli/ so npm pack/publish show them on the package page.
 * Root README is the single source of truth — do not edit cli/README.md by hand.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cliDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.resolve(cliDir, "..");

for (const name of ["README.md", "LICENSE"]) {
  const from = path.join(rootDir, name);
  const to = path.join(cliDir, name);
  if (!fs.existsSync(from)) {
    console.warn(`sync-npm-meta: skip missing ${name}`);
    continue;
  }
  fs.copyFileSync(from, to);
  console.log(`sync-npm-meta: ${name} → cli/${name}`);
}
