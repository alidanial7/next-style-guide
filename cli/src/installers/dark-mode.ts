import fs from "fs-extra";
import path from "node:path";

import { copyAddonFile } from "../helpers/addon-files.js";
import { removeDependencies } from "../helpers/package-json.js";
import type { Installer } from "./types.js";

function ruleFor(styling: "tailwind" | "mui"): string {
  const extra =
    styling === "mui"
      ? "- MUI: `MuiProvider` reads `resolvedTheme` and swaps palette via `getPalette`."
      : "- Tailwind: use `dark:` variants; `html` gets `class=\"dark\"` from the theme provider.";
  return `---
description: Dark mode (class on html)
globs: src/providers/theme-provider.tsx,src/lib/theme-init-script.ts,src/providers/mui-provider.tsx,src/app/globals.css,src/app/_components/theme-toggle/**
alwaysApply: false
---

# Dark mode

- \`ThemeProvider\` + \`useTheme\` in \`src/providers/theme-provider.tsx\` (composed via \`AppProviders\`).
- FOUC script: \`src/lib/theme-init-script.ts\` injected from the Server Component layout (not a Client Component \`<script>\` — avoids React 19 warnings).
- Homepage sample \`ThemeToggle\` under \`src/app/_components/theme-toggle/\` (not shared \`components/\`).
${extra}
- Prefer default theme \`system\` (localStorage key \`theme\`).
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
    const themeInitPath = path.join(
      projectDir,
      "src",
      "lib",
      "theme-init-script.ts",
    );

    if (!darkModeEnabled(options)) {
      await fs.remove(path.join(providersDir, "theme-provider.tsx"));
      await fs.remove(themeInitPath);
      await fs.remove(toggleDir);
      await fs.remove(path.join(projectDir, ".cursor", "rules", "dark-mode.mdc"));
      await fs.remove(
        path.join(projectDir, "docs", "style-guide", "ui", "dark-mode.md"),
      );
      await removeDependencies(projectDir, ["next-themes"]);
      return;
    }

    await fs.ensureDir(providersDir);
    await fs.remove(path.join(providersDir, ".gitkeep"));
    await copyAddonFile(
      "dark-mode/providers/theme-provider.tsx",
      path.join(providersDir, "theme-provider.tsx"),
    );
    await copyAddonFile("dark-mode/theme-init-script.ts", themeInitPath);

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

\`ThemeProvider\` / \`useTheme\` + MUI palette swap in \`MuiProvider\`.
FOUC script from Server layout via \`src/lib/theme-init-script.ts\`.
Sample: \`src/app/_components/theme-toggle/\` on the home page.
`
        : `# Dark mode

\`ThemeProvider\` / \`useTheme\` + Tailwind \`dark:\` variants.
FOUC script from Server layout via \`src/lib/theme-init-script.ts\`.
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

    // Drop legacy next-themes if a prior scaffold left it behind.
    await removeDependencies(projectDir, ["next-themes"]);
  },
};
