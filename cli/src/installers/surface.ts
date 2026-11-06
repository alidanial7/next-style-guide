import fs from "fs-extra";
import path from "node:path";

import { ADDONS_DIR } from "../constants.js";
import { appPagesDir } from "../helpers/app-paths.js";
import type { Installer } from "./types.js";
import {
  docsIndex,
  homePageSource,
  welcomeCardSource,
} from "./surface-templates.js";

export const surfaceInstaller: Installer = {
  id: "surface",
  active: () => true,
  async run({ projectDir, options }) {
    await fs.writeFile(
      path.join(
        projectDir,
        "src",
        "app",
        "_components",
        "welcome-card",
        "index.tsx",
      ),
      welcomeCardSource(options),
      "utf8",
    );
    const pagePath = path.join(appPagesDir(projectDir, options), "page.tsx");
    await fs.ensureDir(path.dirname(pagePath));
    await fs.writeFile(pagePath, homePageSource(options), "utf8");
    if (options.i18n) {
      const strayRootPage = path.join(projectDir, "src", "app", "page.tsx");
      if (await fs.pathExists(strayRootPage)) {
        await fs.remove(strayRootPage);
      }
    }

    if (options.data === "tanstack-query") {
      await fs.copy(
        path.join(ADDONS_DIR, "docs", "data", "tanstack-query.md"),
        path.join(
          projectDir,
          "docs",
          "style-guide",
          "data",
          "tanstack-query.md",
        ),
      );
    }
    if (options.icons !== "none") {
      await fs.copy(
        path.join(ADDONS_DIR, "docs", "ui", "icons.md"),
        path.join(projectDir, "docs", "style-guide", "ui", "icons.md"),
      );
    }

    if (options.auth === "jwt" && options.endpoints) {
      const exampleSrc = path.join(
        ADDONS_DIR,
        "docs",
        "examples",
        "api-app-crud.md",
      );
      if (await fs.pathExists(exampleSrc)) {
        await fs.copy(
          exampleSrc,
          path.join(projectDir, "docs", "examples", "api-app-crud.md"),
        );
      }
    }

    await fs.writeFile(
      path.join(projectDir, "docs", "style-guide", "README.md"),
      docsIndex(options),
      "utf8",
    );
  },
};
