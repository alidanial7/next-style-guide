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
  async run({ projectDir, options }) {
    const addon = path.join(ADDONS_DIR, "husky");

    await fs.copy(path.join(addon, ".husky"), path.join(projectDir, ".husky"));
    await fs.copy(
      path.join(addon, "docs", "style-guide", "tooling", "husky.md"),
      path.join(projectDir, "docs", "style-guide", "tooling", "husky.md"),
    );

    try {
      await fs.chmod(path.join(projectDir, ".husky", "pre-commit"), 0o755);
    } catch {
      // ignore
    }

    await addDependencies(
      projectDir,
      {
        husky: "^9.1.7",
        "lint-staged": "^15.2.11",
      },
      "devDependencies",
    );
    await addScripts(projectDir, { prepare: "husky" });

    const tsHooks: string[] = [];
    if (options.prettier) tsHooks.push("prettier --write");
    if (options.eslint) tsHooks.push("eslint --fix");
    if (tsHooks.length === 0) tsHooks.push("echo 'husky: no lint/format tools'");

    const lintStaged: Record<string, string[]> = {
      "*.{js,jsx,ts,tsx}": tsHooks,
    };
    if (options.prettier) {
      lintStaged["*.{json,css,scss,md,yaml,yml}"] = ["prettier --write"];
    }

    await mergePackageField(projectDir, "lint-staged", lintStaged);
  },
};
