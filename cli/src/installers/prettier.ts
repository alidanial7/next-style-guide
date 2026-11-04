import fs from "fs-extra";
import path from "node:path";

import { ADDONS_DIR } from "../constants.js";
import { addDependencies, addScripts } from "../helpers/package-json.js";
import type { Installer } from "./types.js";

export const prettierInstaller: Installer = {
  id: "prettier",
  active: (o) => o.prettier,
  async run({ projectDir }) {
    const addon = path.join(ADDONS_DIR, "prettier");

    await fs.copy(
      path.join(addon, ".prettierrc"),
      path.join(projectDir, ".prettierrc"),
    );
    await fs.copy(
      path.join(addon, ".cursor", "rules", "prettier.mdc"),
      path.join(projectDir, ".cursor", "rules", "prettier.mdc"),
    );
    await fs.copy(
      path.join(addon, "docs", "style-guide", "tooling", "prettier.md"),
      path.join(projectDir, "docs", "style-guide", "tooling", "prettier.md"),
    );

    await addDependencies(
      projectDir,
      { prettier: "^3.6.2" },
      "devDependencies",
    );
    await addScripts(projectDir, {
      format: "prettier --write .",
      "format:check": "prettier --check .",
    });
  },
};
