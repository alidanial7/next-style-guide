import fs from "fs-extra";
import path from "node:path";

import { getPackageManager } from "../helpers/package-manager.js";
import type { Installer } from "./types.js";

/**
 * Normalize package.json `packageManager` field for the chosen tool.
 * Runs early so later installers can assume a consistent field.
 */
export const packageManagerInstaller: Installer = {
  id: "package-manager",
  active: () => true,
  async run({ projectDir, options }) {
    const meta = getPackageManager(options.packageManager);
    const pkgPath = path.join(projectDir, "package.json");
    const pkg = (await fs.readJson(pkgPath)) as Record<string, unknown>;

    if (meta.packageManagerField) {
      pkg.packageManager = meta.packageManagerField;
    } else {
      delete pkg.packageManager;
    }

    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  },
};
