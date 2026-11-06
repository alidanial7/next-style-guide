import fs from "fs-extra";
import path from "node:path";

import { ADDONS_DIR } from "../constants.js";
import { copyAddonFile } from "../helpers/addon-files.js";
import { addDependencies } from "../helpers/package-json.js";
import type { ScaffoldOptions } from "../types.js";
import { needsRtlEmotion } from "./direction.js";
import type { Installer } from "./types.js";

/** Addon filename under `mui/src/providers/` (without path). */
function muiProviderSeedFilename(options: ScaffoldOptions): string {
  const dark = options.darkMode;
  const fixedRtl = options.direction === "rtl";
  const both = options.direction === "both";

  if (both && dark) return "mui-provider.both-dark.tsx";
  if (both) return "mui-provider.both.tsx";
  if (dark) return fixedRtl ? "mui-provider.dark-rtl.tsx" : "mui-provider.dark-ltr.tsx";
  return fixedRtl ? "mui-provider.rtl.tsx" : "mui-provider.ltr.tsx";
}

export const muiInstaller: Installer = {
  id: "mui",
  active: (o) => o.styling === "mui",
  async run({ projectDir, options }) {
    const addon = path.join(ADDONS_DIR, "mui");
    const themeDir = path.join(projectDir, "src", "theme");

    await fs.copy(path.join(addon, "src", "theme"), themeDir);
    await fs.copy(
      path.join(addon, "docs", "style-guide", "ui", "mui.md"),
      path.join(projectDir, "docs", "style-guide", "ui", "mui.md"),
    );

    const providersDir = path.join(projectDir, "src", "providers");
    await fs.ensureDir(providersDir);
    await fs.remove(path.join(providersDir, ".gitkeep"));
    await copyAddonFile(
      path.join("mui", "src", "providers", muiProviderSeedFilename(options)),
      path.join(providersDir, "mui-provider.tsx"),
    );

    await copyAddonFile(
      "mui/.cursor/rules/mui.mdc",
      path.join(projectDir, ".cursor", "rules", "mui.mdc"),
    );

    const deps: Record<string, string> = {
      "@mui/material": "^6.4.0",
      "@mui/material-nextjs": "^6.4.0",
      "@emotion/react": "^11.14.0",
      "@emotion/styled": "^11.14.0",
      "@emotion/cache": "^11.14.0",
    };
    if (needsRtlEmotion(options)) {
      deps.stylis = "^4.3.4";
      deps["stylis-plugin-rtl"] = "^2.1.1";
      await addDependencies(projectDir, deps);
      await addDependencies(
        projectDir,
        { "@types/stylis": "^4.2.7" },
        "devDependencies",
      );
      return;
    }
    await addDependencies(projectDir, deps);
  },
};
