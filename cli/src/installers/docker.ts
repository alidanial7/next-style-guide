import fs from "fs-extra";
import path from "node:path";

import { ADDONS_DIR } from "../constants.js";
import { ensureStandaloneOutput } from "../helpers/next-config.js";
import { getPackageManager } from "../helpers/package-manager.js";
import type { PackageManager } from "../types.js";
import type { Installer } from "./types.js";

function dockerfileSeedName(pm: PackageManager): string {
  if (pm === "npm") return "production.Dockerfile.npm";
  if (pm === "yarn") return "production.Dockerfile.yarn";
  return "production.Dockerfile.pnpm";
}

export const dockerInstaller: Installer = {
  id: "docker",
  active: (o) => o.deploy === "docker",
  async run({ projectDir, options }) {
    const addon = path.join(ADDONS_DIR, "docker");
    const pm = getPackageManager(options.packageManager);

    await fs.ensureDir(path.join(projectDir, "docker"));
    await fs.copy(
      path.join(addon, "docker", dockerfileSeedName(options.packageManager)),
      path.join(projectDir, "docker", "production.Dockerfile"),
    );
    await fs.copy(
      path.join(addon, ".dockerignore"),
      path.join(projectDir, ".dockerignore"),
    );
    await fs.copy(
      path.join(addon, ".cursor", "rules", "docker.mdc"),
      path.join(projectDir, ".cursor", "rules", "docker.mdc"),
    );

    let doc = await fs.readFile(
      path.join(addon, "docs", "style-guide", "ops", "docker.md"),
      "utf8",
    );
    doc = doc
      .replaceAll("__PROJECT_SLUG__", options.slug)
      .replaceAll("__PACKAGE_MANAGER__", pm.id);
    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "ops", "docker.md"),
      doc,
    );

    // Merge into existing next.config (do not wipe next-intl / other wrappers).
    await ensureStandaloneOutput(projectDir);
  },
};
