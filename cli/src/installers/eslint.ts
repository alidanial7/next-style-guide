import fs from "fs-extra";
import path from "node:path";

import { ADDONS_DIR } from "../constants.js";
import { addDependencies, addScripts } from "../helpers/package-json.js";
import type { Installer } from "./types.js";

export const eslintInstaller: Installer = {
  id: "eslint",
  active: (o) => o.eslint,
  async run({ projectDir }) {
    const addon = path.join(ADDONS_DIR, "eslint");

    await fs.copy(
      path.join(addon, "eslint.config.mjs"),
      path.join(projectDir, "eslint.config.mjs"),
    );
    await fs.copy(
      path.join(addon, ".cursor", "rules", "eslint.mdc"),
      path.join(projectDir, ".cursor", "rules", "eslint.mdc"),
    );
    await fs.copy(
      path.join(addon, "docs", "style-guide", "tooling", "eslint.md"),
      path.join(projectDir, "docs", "style-guide", "tooling", "eslint.md"),
    );

    await addDependencies(
      projectDir,
      {
        "eslint-config-prettier": "^10.1.8",
        "eslint-plugin-import": "^2.32.0",
        "eslint-plugin-simple-import-sort": "^12.1.1",
      },
      "devDependencies",
    );
    await addScripts(projectDir, {
      lint: "eslint .",
      "lint:fix": "eslint . --fix",
    });
  },
};
