import fs from "fs-extra";
import path from "node:path";
import * as p from "@clack/prompts";
import color from "picocolors";

import { TEMPLATE_DIR } from "./constants.js";

const TRACKED = [
  "AGENTS.md",
  ".cursor/rules/core.mdc",
  ".cursor/rules/components.mdc",
  ".cursor/rules/forms.mdc",
] as const;

function rel(projectDir: string, file: string): string {
  return path.join(projectDir, file);
}

function templatePath(file: string): string {
  return path.join(TEMPLATE_DIR, file);
}

/**
 * Diff (and optionally apply) core agent surface files from the CLI template
 * into an existing generated app.
 */
export async function runUpgrade(options: {
  projectDir: string;
  apply: boolean;
}): Promise<void> {
  const { projectDir, apply } = options;

  if (!(await fs.pathExists(path.join(projectDir, "package.json")))) {
    throw new Error(`Not an app directory (missing package.json): ${projectDir}`);
  }
  if (!(await fs.pathExists(TEMPLATE_DIR))) {
    throw new Error(`Template missing at ${TEMPLATE_DIR}`);
  }

  p.intro(color.bgCyan(color.black(" next-style-guide upgrade ")));
  p.log.info(
    apply
      ? `Applying template agent files → ${projectDir}`
      : `Diff only (pass --apply to write). Target: ${projectDir}`,
  );

  let changed = 0;
  let missing = 0;
  let same = 0;

  for (const file of TRACKED) {
    const from = templatePath(file);
    const to = rel(projectDir, file);
    if (!(await fs.pathExists(from))) {
      p.log.warn(`Template missing ${file}`);
      continue;
    }

    const next = await fs.readFile(from, "utf8");
    // Preserve project name token already replaced in AGENTS.md
    let outgoing = next;
    if (file === "AGENTS.md" && (await fs.pathExists(to))) {
      const current = await fs.readFile(to, "utf8");
      const nameMatch = current.match(/^# Agents \((.+)\)$/m);
      if (nameMatch?.[1]) {
        outgoing = outgoing.replace("__PROJECT_NAME__", nameMatch[1]);
      }
      const pmMatch = current.match(/· ([a-z]+)(\.|$)/m);
      // Keep existing package manager word if present in Stack line
      if (current.includes("pnpm") || current.includes("npm") || current.includes("yarn")) {
        const stackPm = current.match(/· (pnpm|npm|yarn)\./);
        if (stackPm?.[1]) {
          outgoing = outgoing.replace("__PACKAGE_MANAGER__", stackPm[1]);
        }
      }
    }
    outgoing = outgoing
      .replaceAll("__PROJECT_NAME__", path.basename(projectDir))
      .replaceAll("__PACKAGE_MANAGER__", "pnpm")
      .replaceAll("__PROJECT_SLUG__", path.basename(projectDir));

    if (!(await fs.pathExists(to))) {
      missing += 1;
      p.log.warn(`missing  ${file}`);
      if (apply) {
        await fs.ensureDir(path.dirname(to));
        await fs.writeFile(to, outgoing, "utf8");
        p.log.success(`wrote    ${file}`);
      }
      continue;
    }

    const current = await fs.readFile(to, "utf8");
    if (current === outgoing) {
      same += 1;
      p.log.step(color.dim(`same     ${file}`));
      continue;
    }

    changed += 1;
    p.log.warn(`differs  ${file}`);
    if (apply) {
      await fs.writeFile(to, outgoing, "utf8");
      p.log.success(`updated  ${file}`);
    }
  }

  p.note(
    [
      `same=${same}  differs=${changed}  missing=${missing}`,
      apply
        ? "Applied template agent surface."
        : "Re-run with --apply to write differs/missing files.",
      "Feature rules (.cursor/rules/* beyond core/components/forms) are not overwritten — re-scaffold options or copy manually.",
    ].join("\n"),
    "Summary",
  );
  p.outro(color.green(apply ? "Upgrade applied." : "Diff complete."));
}
