import fs from "fs-extra";
import path from "node:path";
import * as p from "@clack/prompts";
import { execSync } from "node:child_process";
import color from "picocolors";

import { TEMPLATE_DIR } from "./constants.js";
import { replaceTokensInTree } from "./helpers/replace-tokens.js";
import { runInstallers } from "./installers/index.js";
import type { ScaffoldOptions } from "./types.js";

export async function scaffold(options: ScaffoldOptions): Promise<string> {
  const projectDir = path.resolve(process.cwd(), options.name);

  if (await fs.pathExists(projectDir)) {
    const entries = await fs.readdir(projectDir);
    if (entries.length > 0) {
      throw new Error(
        `Target directory already exists and is not empty: ${projectDir}`,
      );
    }
  }

  const spin = p.spinner();
  spin.start("Copying template");

  if (!(await fs.pathExists(TEMPLATE_DIR))) {
    spin.stop("Template missing");
    throw new Error(`Template directory not found at ${TEMPLATE_DIR}`);
  }

  await fs.copy(TEMPLATE_DIR, projectDir, {
    filter: (src) => {
      const base = path.basename(src);
      return base !== "node_modules" && base !== ".next" && base !== "dist";
    },
  });

  spin.message("Applying project tokens");
  await replaceTokensInTree(projectDir, {
    __PROJECT_NAME__: options.name,
    __PROJECT_SLUG__: options.slug,
  });

  spin.message("Running installers");
  const ran = await runInstallers({ projectDir, options });

  if (!options.noInstall) {
    spin.message("Installing dependencies (pnpm)");
    try {
      execSync("pnpm install", { cwd: projectDir, stdio: "ignore" });
    } catch {
      spin.message("pnpm failed — trying npm");
      execSync("npm install", { cwd: projectDir, stdio: "ignore" });
    }
  }

  spin.stop("Project ready");

  if (ran.length) {
    p.log.info(`Installers: ${ran.join(", ")}`);
  } else {
    p.log.step(color.dim("No optional installers (base template only)."));
  }

  return projectDir;
}
