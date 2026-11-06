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

const INPUT = `import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
`;

const CARD = `import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200 bg-white text-neutral-950 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
  );
}

export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-neutral-500", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
  );
}
`;

const DIALOG = `"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export function DialogOverlay({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out",
        className,
      )}
      {...props}
    />
  );
}

export function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border border-neutral-200 bg-white p-6 shadow-lg duration-200 sm:rounded-xl",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg font-semibold leading-none", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-neutral-500", className)}
      {...props}
    />
  );
}
`;

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
    const uiDir = path.join(projectDir, "src", "components", "ui");

    await fs.writeFile(
      path.join(projectDir, "components.json"),
      componentsJson(iconLibrary),
      "utf8",
    );
    await fs.ensureDir(uiDir);
    await fs.writeFile(path.join(uiDir, "button.tsx"), BUTTON, "utf8");

    if (set === "starter") {
      await fs.writeFile(path.join(uiDir, "input.tsx"), INPUT, "utf8");
      await fs.writeFile(path.join(uiDir, "card.tsx"), CARD, "utf8");
      await fs.writeFile(path.join(uiDir, "dialog.tsx"), DIALOG, "utf8");
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
