import { execFileSync } from "node:child_process";

import { ROOT } from "./paths.ts";

export function formatGeneratedWithPrettier(outDir: string, relFiles: string[]) {
  if (relFiles.length === 0) {
    return;
  }

  try {
    console.log("Formatting generated files with Prettier…");
    execFileSync("pnpm", ["exec", "prettier", "--write", outDir], {
      cwd: ROOT,
      stdio: "inherit",
    });
  } catch {
    console.log("Prettier not available — skipping format.");
  }

  try {
    console.log("Linting & sorting generated files with ESLint…");
    execFileSync("pnpm", ["exec", "eslint", "--fix", outDir], {
      cwd: ROOT,
      stdio: "inherit",
    });
  } catch {
    // ignore
  }
}
