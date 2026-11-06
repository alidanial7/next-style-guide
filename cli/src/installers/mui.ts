import fs from "fs-extra";
import path from "node:path";

import { ADDONS_DIR } from "../constants.js";
import { addDependencies } from "../helpers/package-json.js";
import type { ScaffoldOptions } from "../types.js";
import { needsRtlEmotion } from "./direction.js";
import type { Installer } from "./types.js";

function muiProviderSource(options: ScaffoldOptions): string {
  const dark = options.darkMode;
  const rtlCapable = needsRtlEmotion(options);
  const fixedRtl = options.direction === "rtl";
  const both = options.direction === "both";

  const imports = [
    `"use client";`,
    ``,
    dark || both
      ? `import { useEffect, useMemo, useState, type ReactNode } from "react";`
      : `import type { ReactNode } from "react";`,
    ``,
    `import CssBaseline from "@mui/material/CssBaseline";`,
    `import { createTheme, ThemeProvider } from "@mui/material/styles";`,
    `import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";`,
  ];

  if (dark) {
    imports.push(`import { useTheme } from "next-themes";`);
  }
  if (both) {
    imports.push(`import { useDirection } from "@/hooks/use-direction";`);
  }
  if (rtlCapable) {
    imports.push(`import { prefixer } from "stylis";`);
    imports.push(`import rtlPlugin from "stylis-plugin-rtl";`);
  }

  imports.push(``);
  imports.push(`import themeOptions from "@/theme/theme";`);
  if (dark) {
    imports.push(`import getPalette from "@/theme/theme-palette";`);
  }

  let body: string;

  if (both && dark) {
    body = `
export function MuiProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const { direction, isRtl } = useDirection();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = useMemo(() => {
    const mode =
      mounted && resolvedTheme === "dark" ? ("dark" as const) : ("light" as const);
    return createTheme({
      ...themeOptions,
      direction,
      palette: getPalette(mode),
    });
  }, [mounted, resolvedTheme, direction]);

  // key swap remounts MUI subtree on LTR↔RTL (needed for stylis plugin change).
  return (
    <AppRouterCacheProvider
      key={isRtl ? "mui-rtl" : "mui-ltr"}
      options={
        isRtl
          ? { key: "mui-rtl", stylisPlugins: [prefixer, rtlPlugin] }
          : { key: "mui-ltr" }
      }
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className={theme.palette.mode} dir={direction}>
          {children}
        </div>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
`;
  } else if (both) {
    body = `
export function MuiProvider({ children }: { children: ReactNode }) {
  const { direction, isRtl } = useDirection();

  const theme = useMemo(
    () =>
      createTheme({
        ...themeOptions,
        direction,
      }),
    [direction],
  );

  // key swap remounts MUI subtree on LTR↔RTL (needed for stylis plugin change).
  return (
    <AppRouterCacheProvider
      key={isRtl ? "mui-rtl" : "mui-ltr"}
      options={
        isRtl
          ? { key: "mui-rtl", stylisPlugins: [prefixer, rtlPlugin] }
          : { key: "mui-ltr" }
      }
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div dir={direction}>{children}</div>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
`;
  } else if (dark) {
    const dir = fixedRtl ? "rtl" : "ltr";
    const cache = fixedRtl
      ? `
    <AppRouterCacheProvider
      key="mui-rtl"
      options={{ key: "mui-rtl", stylisPlugins: [prefixer, rtlPlugin] }}
    >`
      : `
    <AppRouterCacheProvider>`;
    const cacheClose = `    </AppRouterCacheProvider>`;
    body = `
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
      direction: "${dir}",
      palette: getPalette(mode),
    });
  }, [mounted, resolvedTheme]);

  return (
${cache}
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className={theme.palette.mode} dir="${dir}">
          {children}
        </div>
      </ThemeProvider>
${cacheClose}
  );
}
`;
  } else {
    const dir = fixedRtl ? "rtl" : "ltr";
    if (fixedRtl) {
      body = `
const theme = createTheme({
  ...themeOptions,
  direction: "rtl",
});

export function MuiProvider({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider
      key="mui-rtl"
      options={{ key: "mui-rtl", stylisPlugins: [prefixer, rtlPlugin] }}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div dir="rtl">{children}</div>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
`;
    } else {
      body = `
const theme = createTheme({
  ...themeOptions,
  direction: "ltr",
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
    }
  }

  return `${imports.join("\n")}\n${body}`;
}

const RULE = `---
description: MUI (Material UI) theme + provider conventions
globs: src/theme/**,src/providers/mui-provider.tsx
alwaysApply: false
---

# MUI

- Theme modules live under \`src/theme/\` (\`theme.ts\` composes palette · typography · breakpoints · components).
- Provider: \`MuiProvider\` in \`src/providers/mui-provider.tsx\` (Emotion App Router cache + \`ThemeProvider\` + \`CssBaseline\`).
- Direction: follows scaffold \`direction\` (fixed or \`useDirection\` when \`both\`); RTL uses \`stylis-plugin-rtl\`.
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
      muiProviderSource(options),
      "utf8",
    );

    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "mui.mdc"),
      RULE,
      "utf8",
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
