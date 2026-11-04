import fs from "fs-extra";
import path from "node:path";
import * as p from "@clack/prompts";
import { execSync } from "node:child_process";
import color from "picocolors";

import { TEMPLATE_DIR } from "./constants.js";
import { getPackageManager } from "./helpers/package-manager.js";
import { replaceTokensInTree } from "./helpers/replace-tokens.js";
import { runInstallers } from "./installers/index.js";
import type { ScaffoldOptions } from "./types.js";

export async function scaffold(options: ScaffoldOptions): Promise<string> {
  const projectDir = path.resolve(process.cwd(), options.name);
  const pm = getPackageManager(options.packageManager);

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

  // npm never packs `.gitignore`; template ships as `gitignore` and we rename here.
  const gitignoreSrc = path.join(projectDir, "gitignore");
  const gitignoreDest = path.join(projectDir, ".gitignore");
  if (await fs.pathExists(gitignoreSrc)) {
    await fs.move(gitignoreSrc, gitignoreDest, { overwrite: true });
  }

  spin.message("Applying project tokens");
  await replaceTokensInTree(projectDir, {
    __PROJECT_NAME__: options.name,
    __PROJECT_SLUG__: options.slug,
    __PACKAGE_MANAGER__: pm.id,
  });

  spin.message("Running installers");
  const ran = await runInstallers({ projectDir, options });

  if (!options.noInstall) {
    spin.message(`Installing dependencies (${pm.id})`);
    try {
      execSync(`${pm.id} ${pm.installArgs.join(" ")}`, {
        cwd: projectDir,
        stdio: "ignore",
      });
    } catch {
      if (pm.id !== "npm") {
        spin.message(`${pm.id} failed — trying npm`);
        execSync("npm install", { cwd: projectDir, stdio: "ignore" });
      } else {
        throw new Error("npm install failed");
      }
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
