import fs from "fs-extra";
import path from "node:path";

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

const RULE = `---
description: shadcn/ui conventions
globs: components.json,src/components/ui/**,src/lib/utils.ts
alwaysApply: false
---

# shadcn

- Primitives live flat in \`src/components/ui/*\` (CLI-compatible).
- Add components with the shadcn CLI (\`npx shadcn@latest add …\`) — don't hand-roll duplicates.
- \`cn()\` from \`@/lib/utils\` for class merging.
- Config: \`components.json\`. Requires Tailwind (already enabled).
`;

export const shadcnInstaller: Installer = {
  id: "shadcn",
  active: (o) => o.ui === "shadcn" && o.styling === "tailwind",
  async run({ projectDir, options }) {
    const iconLibrary =
      options.icons === "tabler" ? "tabler" : "lucide";

    await fs.writeFile(
      path.join(projectDir, "components.json"),
      componentsJson(iconLibrary),
      "utf8",
    );
    await fs.ensureDir(path.join(projectDir, "src", "components", "ui"));
    await fs.writeFile(
      path.join(projectDir, "src", "components", "ui", ".gitkeep"),
      "",
      "utf8",
    );
    await fs.remove(path.join(projectDir, "src", "components", ".gitkeep"));

    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "shadcn.mdc"),
      RULE,
      "utf8",
    );

    // Ensure lucide if icons=none but shadcn expects an icon lib
    if (options.icons === "none") {
      await addDependencies(projectDir, {
        "lucide-react": "^0.469.0",
      });
    }

    await addDependencies(projectDir, {
      "class-variance-authority": "^0.7.1",
    });
  },
};
