import fs from "fs-extra";
import path from "node:path";

import { addDependencies } from "../helpers/package-json.js";
import type { Installer } from "./types.js";

const POSTCSS = `const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
`;

const GLOBALS = `@import "tailwindcss";

:root {
  color-scheme: light;
  --background: #f4f6f8;
  --foreground: #12181f;
  --muted: #5c6b7a;
  --accent: #2563eb;
  --card: #ffffff;
  --border: #d8dee6;
  --btn: #eef2f6;
  --btn-active: #2563eb;
  --btn-active-fg: #ffffff;
  --shadow: 0 1px 2px rgb(16 24 40 / 6%);
}

.dark {
  color-scheme: dark;
  --background: #0b1220;
  --foreground: #e8eef6;
  --muted: #93a4b8;
  --accent: #60a5fa;
  --card: #121a27;
  --border: #243246;
  --btn: #1a2433;
  --btn-active: #3b82f6;
  --btn-active-fg: #ffffff;
  --shadow: 0 1px 2px rgb(0 0 0 / 35%);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-card: var(--card);
  --color-border: var(--border);
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background:
    radial-gradient(
      ellipse 80% 50% at 10% -10%,
      color-mix(in srgb, var(--accent) 18%, transparent),
      transparent 55%
    ),
    var(--background);
  color: var(--foreground);
  font-family: ui-sans-serif, system-ui, sans-serif;
}

a {
  color: var(--accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

main {
  width: min(40rem, calc(100% - 2rem));
  margin: 0 auto;
  padding: 3.5rem 0 3rem;
}

.hero {
  display: grid;
  gap: 0.75rem;
}

.hero h1 {
  margin: 0;
  font-size: clamp(1.85rem, 4.5vw, 2.65rem);
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.hero p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
  max-width: 36rem;
}

.sample-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  margin-top: 1.5rem;
  padding: 1rem 1.1rem;
  background: color-mix(in srgb, var(--card) 88%, transparent);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow);
}

.sample-toggle {
  display: grid;
  gap: 0.45rem;
}

.sample-toggle__label {
  margin: 0;
  font-size: 0.8rem;
  color: var(--muted);
}

.sample-toggle__row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.sample-toggle__row button {
  appearance: none;
  border: 1px solid var(--border);
  background: var(--btn);
  color: var(--foreground);
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}

.sample-toggle__row button:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
}

.sample-toggle__row button.is-active {
  background: var(--btn-active);
  border-color: var(--btn-active);
  color: var(--btn-active-fg);
}

.sample-toggle__row button:disabled {
  opacity: 0.55;
  cursor: default;
}

.card {
  margin-top: 1.5rem;
  padding: 1.15rem 1.35rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow);
}

.card h2 {
  margin: 0 0 0.55rem;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
}

.card ul {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--muted);
  line-height: 1.7;
  font-size: 0.9rem;
}

.meta {
  margin-top: 1.5rem;
  font-size: 0.85rem;
  color: var(--muted);
  line-height: 1.55;
}

code {
  font-size: 0.86em;
}
`;

const UTILS = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

const RULE = `---
description: Tailwind CSS v4 conventions
globs: src/app/globals.css,src/**/*.{tsx,css},postcss.config.mjs
alwaysApply: false
---

# Tailwind

- Tailwind v4 via \`@import "tailwindcss"\` in \`globals.css\` + \`@tailwindcss/postcss\`.
- Prefer utility classes; keep semantic CSS variables in \`:root\` / \`@theme\`.
- Class merging: \`cn()\` from \`@/lib/utils\` (clsx + tailwind-merge).
`;

export const tailwindInstaller: Installer = {
  id: "tailwind",
  active: (o) => o.styling === "tailwind",
  async run({ projectDir }) {
    await fs.writeFile(
      path.join(projectDir, "postcss.config.mjs"),
      POSTCSS,
      "utf8",
    );
    await fs.writeFile(
      path.join(projectDir, "src", "app", "globals.css"),
      GLOBALS,
      "utf8",
    );
    await fs.writeFile(
      path.join(projectDir, "src", "lib", "utils.ts"),
      UTILS,
      "utf8",
    );
    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "tailwind.mdc"),
      RULE,
      "utf8",
    );

    await addDependencies(projectDir, {
      clsx: "^2.1.1",
      "tailwind-merge": "^3.6.0",
    });
    await addDependencies(
      projectDir,
      {
        tailwindcss: "^4",
        "@tailwindcss/postcss": "^4",
      },
      "devDependencies",
    );
  },
};
