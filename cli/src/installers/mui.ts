import fs from "fs-extra";
import path from "node:path";

import { ADDONS_DIR } from "../constants.js";
import { addDependencies } from "../helpers/package-json.js";
import type { Installer } from "./types.js";

const PROVIDER_LIGHT = `"use client";

import type { ReactNode } from "react";

import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

import themeOptions from "@/theme/theme";

const theme = createTheme(themeOptions);

export function MuiProvider({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
`;

const PROVIDER_DARK = `"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { useTheme } from "next-themes";

import themeOptions from "@/theme/theme";
import getPalette from "@/theme/theme-palette";

export function MuiProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = useMemo(() => {
    const mode =
      mounted && resolvedTheme === "dark" ? ("dark" as const) : ("light" as const);
    return createTheme({
      ...themeOptions,
      palette: getPalette(mode),
    });
  }, [mounted, resolvedTheme]);

  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className={theme.palette.mode}>{children}</div>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
`;

const RULE = `---
description: MUI (Material UI) theme + provider conventions
globs: src/theme/**,src/providers/mui-provider.tsx
alwaysApply: false
---

# MUI

- Theme modules live under \`src/theme/\` (\`theme.ts\` composes palette · typography · breakpoints · components).
- Provider: \`MuiProvider\` in \`src/providers/mui-provider.tsx\` (Emotion App Router cache + \`ThemeProvider\` + \`CssBaseline\`).
- Prefer MUI components over ad-hoc CSS; put shared overrides in \`theme-components.ts\`.
- Do not add shadcn — incompatible with this styling choice.
- Breakpoint \`xxs\` is enabled via module augmentation in \`theme.ts\`.
`;

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
    await fs.writeFile(
      path.join(providersDir, "mui-provider.tsx"),
      options.darkMode ? PROVIDER_DARK : PROVIDER_LIGHT,
      "utf8",
    );

    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "mui.mdc"),
      RULE,
      "utf8",
    );

    await addDependencies(projectDir, {
      "@mui/material": "^6.4.0",
      "@mui/material-nextjs": "^6.4.0",
      "@emotion/react": "^11.14.0",
      "@emotion/styled": "^11.14.0",
      "@emotion/cache": "^11.14.0",
    });
  },
};
