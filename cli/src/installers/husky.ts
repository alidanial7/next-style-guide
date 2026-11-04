import fs from "fs-extra";
import path from "node:path";

import { ADDONS_DIR } from "../constants.js";
import {
  addDependencies,
  addScripts,
  mergePackageField,
} from "../helpers/package-json.js";
import type { Installer } from "./types.js";

export const huskyInstaller: Installer = {
  id: "husky",
  active: (o) => o.husky,
  async run({ projectDir }) {
    const addon = path.join(ADDONS_DIR, "husky");

    await fs.copy(path.join(addon, ".husky"), path.join(projectDir, ".husky"));
    await fs.copy(
      path.join(addon, ".prettierrc"),
      path.join(projectDir, ".prettierrc"),
    );
    await fs.copy(
      path.join(addon, "docs", "style-guide", "tooling", "husky.md"),
      path.join(projectDir, "docs", "style-guide", "tooling", "husky.md"),
    );

    // Ensure hook is executable when possible
    try {
      await fs.chmod(path.join(projectDir, ".husky", "pre-commit"), 0o755);
    } catch {
      // ignore on platforms that cannot chmod
    }

    await addDependencies(
      projectDir,
      {
        husky: "^9.1.7",
        "lint-staged": "^15.2.11",
        prettier: "^3.4.2",
        "eslint-config-prettier": "^9.1.0",
      },
      "devDependencies",
    );
    await addScripts(projectDir, {
      prepare: "husky",
      format: "prettier --write .",
    });
    await mergePackageField(projectDir, "lint-staged", {
      "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix"],
      "*.{json,css,scss,md,yaml,yml}": ["prettier --write"],
    });
  },
};
