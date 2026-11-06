import fs from "fs-extra";
import path from "node:path";

import { copyAddonFile } from "../helpers/addon-files.js";
import { addDependencies } from "../helpers/package-json.js";
import type { Installer } from "./types.js";

const THEME_PROVIDER = `"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
`;

function ruleFor(styling: "tailwind" | "mui"): string {
  const extra =
    styling === "mui"
      ? "- MUI: \`MuiProvider\` reads \`resolvedTheme\` and swaps palette via \`getPalette\`."
      : "- Tailwind: use \`dark:\` variants; \`html\` gets \`class=\"dark\"\` from next-themes.";
  return `---
description: Dark mode (next-themes)
globs: src/providers/theme-provider.tsx,src/providers/mui-provider.tsx,src/app/globals.css,src/app/_components/theme-toggle/**
alwaysApply: false
---

# Dark mode

- \`ThemeProvider\` in \`src/providers/theme-provider.tsx\` (composed via \`AppProviders\`).
- Homepage sample \`ThemeToggle\` under \`src/app/_components/theme-toggle/\` (not shared \`components/\`).
${extra}
- Prefer \`defaultTheme="system"\`.
`;
}

function darkModeEnabled(options: {
  darkMode: boolean;
  styling: string;
}): boolean {
  return (
    options.darkMode &&
    (options.styling === "tailwind" || options.styling === "mui")
  );
}

export const darkModeInstaller: Installer = {
  id: "dark-mode",
  active: () => true,
  async run({ projectDir, options }) {
    const providersDir = path.join(projectDir, "src", "providers");
    const toggleDir = path.join(
      projectDir,
      "src",
      "app",
      "_components",
      "theme-toggle",
    );

    if (!darkModeEnabled(options)) {
      await fs.remove(path.join(providersDir, "theme-provider.tsx"));
      await fs.remove(toggleDir);
      await fs.remove(path.join(projectDir, ".cursor", "rules", "dark-mode.mdc"));
      await fs.remove(
        path.join(projectDir, "docs", "style-guide", "ui", "dark-mode.md"),
      );
      return;
    }

    await fs.ensureDir(providersDir);
    await fs.remove(path.join(providersDir, ".gitkeep"));
    await fs.writeFile(
      path.join(providersDir, "theme-provider.tsx"),
      THEME_PROVIDER,
      "utf8",
    );

    await fs.ensureDir(toggleDir);
    const toggleSeed =
      options.styling === "mui"
        ? "dark-mode/components/theme-toggle.mui.tsx"
        : "dark-mode/components/theme-toggle.default.tsx";
    await copyAddonFile(toggleSeed, path.join(toggleDir, "index.tsx"));

    const styling = options.styling === "mui" ? "mui" : "tailwind";
    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "dark-mode.mdc"),
      ruleFor(styling),
      "utf8",
    );

    const docBody =
      styling === "mui"
        ? `# Dark mode

next-themes + MUI palette swap in \`MuiProvider\`.
Provider: \`src/providers/theme-provider.tsx\` (via \`AppProviders\`).
Sample: \`src/app/_components/theme-toggle/\` on the home page.
`
        : `# Dark mode

next-themes + Tailwind \`dark:\` variants.
Provider: \`src/providers/theme-provider.tsx\` (via \`AppProviders\`).
Sample: \`src/app/_components/theme-toggle/\` on the home page.
`;

    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "ui", "dark-mode.md"),
      docBody,
    );

    if (options.styling === "tailwind") {
      const globalsPath = path.join(projectDir, "src", "app", "globals.css");
      if (await fs.pathExists(globalsPath)) {
        let css = await fs.readFile(globalsPath, "utf8");
        if (!css.includes("@custom-variant dark")) {
          css = css.replace(
            `@import "tailwindcss";\n`,
            `@import "tailwindcss";\n\n@custom-variant dark (&:where(.dark, .dark *));\n`,
          );
          await fs.writeFile(globalsPath, css, "utf8");
        }
      }
    }

    await addDependencies(projectDir, {
      "next-themes": "^0.4.4",
    });
  },
};
