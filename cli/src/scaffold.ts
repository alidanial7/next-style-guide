import fs from "fs-extra";
import path from "node:path";
import { execFileSync } from "node:child_process";
import * as p from "@clack/prompts";
import color from "picocolors";

import { TEMPLATE_DIR } from "./constants.js";
import { getPackageManager } from "./helpers/package-manager.js";
import {
  runPackageInstall,
  yieldUi,
} from "./helpers/run-package-install.js";
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
  await yieldUi();

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
  await yieldUi();
  await replaceTokensInTree(projectDir, {
    __PROJECT_NAME__: options.name,
    __PROJECT_SLUG__: options.slug,
    __PACKAGE_MANAGER__: pm.id,
  });

  const ran = await runInstallers({ projectDir, options }, async (step) => {
    spin.message(`Installer (${step.index}/${step.total}): ${step.id}`);
    await yieldUi();
  });

  spin.stop(
    ran.length
      ? `Scaffold ready · ${ran.length} installer${ran.length === 1 ? "" : "s"}`
      : "Scaffold ready · base template",
  );

  if (!options.noInstall) {
    if (options.husky) {
      try {
        execFileSync("git", ["init"], {
          cwd: projectDir,
          stdio: "ignore",
        });
      } catch {
        // husky prepare is best-effort without a repo
      }
    }

    p.log.step(
      `Installing dependencies with ${color.cyan(pm.id)} — live output below…`,
    );
    try {
      await runPackageInstall(projectDir, pm);
      p.log.success("Dependencies installed");
    } catch (error) {
      if (pm.id !== "npm") {
        p.log.warn(`${pm.id} failed — retrying with npm…`);
        const npm = getPackageManager("npm");
        await runPackageInstall(projectDir, npm);
        p.log.success("Dependencies installed (npm)");
      } else {
        const message =
          error instanceof Error ? error.message : String(error);
        throw new Error(`Dependency install failed: ${message}`);
      }
    }
  } else {
    p.log.info(
      color.dim(`Skipped install · run ${pm.id} install in the project folder`),
    );
  }

  if (ran.length) {
    p.log.info(`Installers: ${ran.join(", ")}`);
  } else {
    p.log.step(color.dim("No optional installers (base template only)."));
  }

  return projectDir;
}
