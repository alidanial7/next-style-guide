import fs from "fs-extra";
import path from "node:path";

import { addDependencies } from "../helpers/package-json.js";
import type { Installer } from "./types.js";

const THEME_PROVIDER = `"use client";

import { type ReactNode } from "react";

import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: "#0b5fff" },
  },
});

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

const RULE = `---
description: MUI (Material UI) conventions
globs: src/providers/mui-provider.tsx,src/**/*.{ts,tsx}
alwaysApply: false
---

# MUI

- Theme via \`MuiProvider\` (\`src/providers/mui-provider.tsx\`) in root layout.
- Prefer MUI components (\`Button\`, \`TextField\`, \`Stack\`, …) over ad-hoc CSS.
- Do not add shadcn — incompatible with this styling choice.
- Emotion cache: \`@mui/material-nextjs\` App Router provider (already wired).
`;

export const muiInstaller: Installer = {
  id: "mui",
  active: (o) => o.styling === "mui",
  async run({ projectDir }) {
    const providersDir = path.join(projectDir, "src", "providers");
    await fs.ensureDir(providersDir);
    await fs.remove(path.join(providersDir, ".gitkeep"));
    await fs.writeFile(
      path.join(providersDir, "mui-provider.tsx"),
      THEME_PROVIDER,
      "utf8",
    );
    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "mui.mdc"),
      RULE,
      "utf8",
    );

    const layoutPath = path.join(projectDir, "src", "app", "layout.tsx");
    let layout = await fs.readFile(layoutPath, "utf8");

    if (!layout.includes("MuiProvider")) {
      layout = layout.replace(
        'import "./globals.css";\n',
        'import "./globals.css";\n\nimport { MuiProvider } from "@/providers/mui-provider";\n',
      );

      if (layout.includes("<QueryProvider>")) {
        layout = layout.replace(
          "<QueryProvider>",
          "<MuiProvider>\n        <QueryProvider>",
        );
        layout = layout.replace(
          "</QueryProvider>",
          "</QueryProvider>\n        </MuiProvider>",
        );
      } else {
        layout = layout.replace(
          "<main>{children}</main>",
          "<MuiProvider>\n          <main>{children}</main>\n        </MuiProvider>",
        );
      }

      await fs.writeFile(layoutPath, layout, "utf8");
    }

    await addDependencies(projectDir, {
      "@mui/material": "^6.4.0",
      "@mui/material-nextjs": "^6.4.0",
      "@emotion/react": "^11.14.0",
      "@emotion/styled": "^11.14.0",
      "@emotion/cache": "^11.14.0",
    });
  },
};
