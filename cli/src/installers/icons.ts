import fs from "fs-extra";
import path from "node:path";

import { addDependencies } from "../helpers/package-json.js";
import { ICON_PACKAGES } from "../types.js";
import type { Installer } from "./types.js";

const RULE = `---
description: Icon library conventions
globs: "src/**/*.{ts,tsx}"
alwaysApply: false
---

# Icons

__ICONS_BODY__
`;

const BODIES = {
  lucide: `- Use \`lucide-react\` icons (\`import { IconName } from "lucide-react"\`).
- Prefer Lucide when adding shadcn primitives later.`,
  tabler: `- Use \`@tabler/icons-react\` with the \`Icon*\` prefix (\`import { IconHome } from "@tabler/icons-react"\`).
- Do not mix Lucide and Tabler in the same app.`,
} as const;

export const iconsInstaller: Installer = {
  id: "icons",
  active: (o) => o.icons !== "none",
  async run({ projectDir, options }) {
    if (options.icons === "none") return;

    const pkg = ICON_PACKAGES[options.icons];
    await addDependencies(projectDir, { [pkg.name]: pkg.version });

    const ruleDir = path.join(projectDir, ".cursor", "rules");
    await fs.ensureDir(ruleDir);
    await fs.writeFile(
      path.join(ruleDir, "icons.mdc"),
      RULE.replace("__ICONS_BODY__", BODIES[options.icons]),
      "utf8",
    );
  },
};
