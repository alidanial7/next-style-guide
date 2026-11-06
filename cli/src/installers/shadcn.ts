import fs from "fs-extra";
import path from "node:path";

import { ADDONS_DIR } from "../constants.js";
import { addDependencies } from "../helpers/package-json.js";
import type { Installer } from "./types.js";

function componentsJson(iconLibrary: "lucide" | "tabler"): string {
  return `${JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema.json",
      style: "new-york",
      rsc: true,
      tsx: true,
      tailwind: {
        config: "",
        css: "src/app/globals.css",
        baseColor: "neutral",
        cssVariables: true,
        prefix: "",
      },
      iconLibrary,
      aliases: {
        components: "@/components",
        utils: "@/lib/utils",
        ui: "@/components/ui",
        lib: "@/lib",
        hooks: "@/hooks",
      },
    },
    null,
    2,
  )}\n`;
}

function ruleFor(set: "minimal" | "starter"): string {
  const setLine =
    set === "starter"
      ? "- Starter set: `button`, `input`, `card`, `dialog`."
      : "- Minimal set: `button` only.";
  return `---
description: shadcn/ui conventions
globs: components.json,src/components/ui/**,src/lib/utils.ts
alwaysApply: false
---

# shadcn

- Primitives live flat in \`src/components/ui/*\` (CLI-compatible).
${setLine}
- Add more with \`npx shadcn@latest add …\`.
- \`cn()\` from \`@/lib/utils\` for class merging.
- Config: \`components.json\`. Requires Tailwind.
`;
}

export const shadcnInstaller: Installer = {
  id: "shadcn",
  active: (o) => o.ui === "shadcn" && o.styling === "tailwind",
  async run({ projectDir, options }) {
    const iconLibrary = options.icons === "tabler" ? "tabler" : "lucide";
    const set = options.shadcnSet;
    const seedUi = path.join(ADDONS_DIR, "shadcn", "src", "components", "ui");
    const uiDir = path.join(projectDir, "src", "components", "ui");

    await fs.writeFile(
      path.join(projectDir, "components.json"),
      componentsJson(iconLibrary),
      "utf8",
    );
    await fs.ensureDir(uiDir);
    await fs.copy(
      path.join(seedUi, "button.tsx"),
      path.join(uiDir, "button.tsx"),
    );

    if (set === "starter") {
      for (const name of ["input.tsx", "card.tsx", "dialog.tsx"] as const) {
        await fs.copy(path.join(seedUi, name), path.join(uiDir, name));
      }
    }

    await fs.remove(path.join(uiDir, ".gitkeep"));
    await fs.remove(path.join(projectDir, "src", "components", ".gitkeep"));

    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "shadcn.mdc"),
      ruleFor(set),
      "utf8",
    );
    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "ui", "shadcn.md"),
      `# shadcn/ui

Set: **${set}**
${set === "starter" ? "- `button` · `input` · `card` · `dialog`\n" : "- `button`\n"}
Add more: \`npx shadcn@latest add …\`
`,
    );

    const deps: Record<string, string> = {
      "class-variance-authority": "^0.7.1",
    };
    if (set === "starter") {
      deps["@radix-ui/react-dialog"] = "^1.1.4";
    }
    await addDependencies(projectDir, deps);
  },
};
