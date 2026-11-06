import fs from "fs-extra";
import path from "node:path";

import { copyAddonFile, readAddonText } from "../helpers/addon-files.js";
import type { DirectionOption, ScaffoldOptions } from "../types.js";
import type { Installer } from "./types.js";

function defaultForBoth(options: ScaffoldOptions): "ltr" | "rtl" {
  return options.styling === "mui" ? "rtl" : "ltr";
}

export function needsRtlEmotion(options: ScaffoldOptions): boolean {
  return (
    options.styling === "mui" &&
    (options.direction === "rtl" || options.direction === "both")
  );
}

export const directionInstaller: Installer = {
  id: "direction",
  active: () => true,
  async run({ projectDir, options }) {
    const hooksDir = path.join(projectDir, "src", "hooks");
    const providersDir = path.join(projectDir, "src", "providers");
    await fs.ensureDir(hooksDir);
    await fs.ensureDir(providersDir);
    await fs.remove(path.join(hooksDir, ".gitkeep"));

    const mode: DirectionOption = options.direction;

    if (mode === "both") {
      const initial = defaultForBoth(options);
      await copyAddonFile(
        "direction/providers/direction-provider.tsx",
        path.join(providersDir, "direction-provider.tsx"),
        { DEFAULT_DIRECTION: initial },
      );
      await copyAddonFile(
        "direction/hooks/use-direction.both.ts",
        path.join(hooksDir, "use-direction.ts"),
      );

      const toggleDir = path.join(
        projectDir,
        "src",
        "app",
        "_components",
        "direction-toggle",
      );
      await fs.ensureDir(toggleDir);
      const toggleSeed =
        options.styling === "mui"
          ? "direction/components/direction-toggle.mui.tsx"
          : "direction/components/direction-toggle.default.tsx";
      await copyAddonFile(toggleSeed, path.join(toggleDir, "index.tsx"));
      await fs.remove(
        path.join(projectDir, "src", "components", "direction-toggle"),
      );
    } else {
      const hook = await readAddonText("direction/hooks/use-direction.fixed.ts", {
        DIRECTION: mode,
        IS_RTL: mode === "rtl" ? "true" : "false",
      });
      await fs.writeFile(path.join(hooksDir, "use-direction.ts"), hook, "utf8");
      await fs.remove(path.join(providersDir, "direction-provider.tsx"));
      await fs.remove(
        path.join(projectDir, "src", "components", "direction-toggle"),
      );
      await fs.remove(
        path.join(projectDir, "src", "app", "_components", "direction-toggle"),
      );
    }

    await copyAddonFile(
      "direction/.cursor/rules/direction.mdc",
      path.join(projectDir, ".cursor", "rules", "direction.mdc"),
    );
    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "ui", "direction.md"),
      `# Direction

Mode: **${mode}**

- Hook: \`useDirection()\` → \`@/hooks/use-direction\`
${mode === "both" ? "- Provider: `DirectionProvider` (persists to `localStorage`)\n- Sample: `src/app/_components/direction-toggle/` on the home page\n" : `- Fixed \`dir="${mode}"\` on \`<html>\`\n`}
${needsRtlEmotion(options) ? "- MUI Emotion RTL via `stylis-plugin-rtl` when `isRtl`\n" : ""}
`,
    );
  },
};
