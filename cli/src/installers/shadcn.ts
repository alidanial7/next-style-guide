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

const BUTTON = `import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-neutral-900 text-white hover:bg-neutral-800",
        outline: "border border-neutral-300 bg-transparent hover:bg-neutral-100",
        ghost: "hover:bg-neutral-100",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}
`;

const RULE = `---
description: shadcn/ui conventions
globs: components.json,src/components/ui/**,src/lib/utils.ts
alwaysApply: false
---

# shadcn

- Primitives live flat in \`src/components/ui/*\` (CLI-compatible).
- Starter \`Button\` is included — add more with \`npx shadcn@latest add …\`.
- \`cn()\` from \`@/lib/utils\` for class merging.
- Config: \`components.json\`. Requires Tailwind.
`;

export const shadcnInstaller: Installer = {
  id: "shadcn",
  active: (o) => o.ui === "shadcn" && o.styling === "tailwind",
  async run({ projectDir, options }) {
    const iconLibrary = options.icons === "tabler" ? "tabler" : "lucide";

    await fs.writeFile(
      path.join(projectDir, "components.json"),
      componentsJson(iconLibrary),
      "utf8",
    );
    await fs.ensureDir(path.join(projectDir, "src", "components", "ui"));
    await fs.writeFile(
      path.join(projectDir, "src", "components", "ui", "button.tsx"),
      BUTTON,
      "utf8",
    );
    await fs.remove(path.join(projectDir, "src", "components", "ui", ".gitkeep"));
    await fs.remove(path.join(projectDir, "src", "components", ".gitkeep"));

    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "shadcn.mdc"),
      RULE,
      "utf8",
    );

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
