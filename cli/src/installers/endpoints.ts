import fs from "fs-extra";
import path from "node:path";

import { ADDONS_DIR } from "../constants.js";
import { addDependencies, addScripts } from "../helpers/package-json.js";
import type { Installer } from "./types.js";

export const endpointsInstaller: Installer = {
  id: "endpoints",
  active: (o) => o.endpoints,
  async run({ projectDir }) {
    const addon = path.join(ADDONS_DIR, "endpoints");

    await fs.copy(
      path.join(addon, "scripts"),
      path.join(projectDir, "scripts"),
    );
    await fs.copy(
      path.join(addon, "src", "endpoints"),
      path.join(projectDir, "src", "endpoints"),
    );

    for (const file of [
      "axios-instance.ts",
      "api-result.ts",
      "api-error.ts",
      "search-params.ts",
      "form-data.ts",
    ]) {
      await fs.copy(
        path.join(addon, "src", "utils", file),
        path.join(projectDir, "src", "utils", file),
      );
    }
    await fs.remove(path.join(projectDir, "src", "utils", ".gitkeep"));

    await fs.copy(
      path.join(addon, ".cursor", "rules", "endpoints.mdc"),
      path.join(projectDir, ".cursor", "rules", "endpoints.mdc"),
    );
    await fs.copy(
      path.join(addon, "docs", "style-guide", "http", "endpoints.md"),
      path.join(projectDir, "docs", "style-guide", "http", "endpoints.md"),
    );

    await addDependencies(projectDir, { axios: "^1.7.9" });
    await addDependencies(
      projectDir,
      { tsx: "^4.19.2" },
      "devDependencies",
    );
    await addScripts(projectDir, {
      "endpoints:generate": "tsx scripts/generate-endpoints.ts",
    });
  },
};
