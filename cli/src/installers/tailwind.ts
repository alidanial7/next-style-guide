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
  --background: #f7f8fa;
  --foreground: #14181f;
  --muted: #667085;
  --accent: #2f6fed;
  --card: #ffffff;
  --border: #e4e7ec;
  --btn: #ffffff;
  --btn-hover: #f2f4f7;
  --btn-active: #14181f;
  --btn-active-fg: #ffffff;
  --chip: #f2f4f7;
  --shadow: 0 1px 2px rgb(16 24 40 / 4%), 0 1px 3px rgb(16 24 40 / 6%);
  --radius: 14px;
}

.dark {
  color-scheme: dark;
  --background: #0c1118;
  --foreground: #eef2f6;
  --muted: #98a2b3;
  --accent: #6b9bff;
  --card: #151b24;
  --border: #2a3340;
  --btn: #1a222d;
  --btn-hover: #222b38;
  --btn-active: #eef2f6;
  --btn-active-fg: #0c1118;
  --chip: #1a222d;
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
      90% 60% at 0% 0%,
      color-mix(in srgb, var(--accent) 10%, transparent),
      transparent 55%
    ),
    var(--background);
  color: var(--foreground);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}

a {
  color: var(--accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

main {
  width: min(42rem, calc(100% - 2.5rem));
  margin: 0 auto;
  padding: 4.25rem 0 3.5rem;
}

.hero {
  display: grid;
  gap: 0.85rem;
}

.hero-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-logo {
  display: block;
  width: 3rem;
  height: 3rem;
  border-radius: 0.85rem;
  flex-shrink: 0;
}

.hero .eyebrow {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 560;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

.hero h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 2.85rem);
  font-weight: 650;
  letter-spacing: -0.04em;
  line-height: 1.1;
}

.hero p {
  margin: 0;
  color: var(--muted);
  font-size: 1.02rem;
  line-height: 1.65;
  max-width: 34rem;
}

.sample-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 1.15rem 1.75rem;
  margin-top: 1.75rem;
  padding: 1rem 1.15rem;
  background: color-mix(in srgb, var(--card) 92%, transparent);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.sample-toggle {
  display: grid;
  gap: 0.4rem;
}

.sample-toggle__label {
  margin: 0;
  font-size: 0.75rem;
  color: var(--muted);
}

.sample-toggle__row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.sample-toggle__row button {
  appearance: none;
  border: 1px solid var(--border);
  background: var(--btn);
  color: var(--foreground);
  border-radius: 999px;
  padding: 0.32rem 0.72rem;
  font: inherit;
  font-size: 0.78rem;
  line-height: 1.2;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.sample-toggle__row button:hover:not(:disabled) {
  background: var(--btn-hover);
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
  margin-top: 1.75rem;
  padding: 1.2rem 1.3rem 1.05rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.card h2 {
  margin: 0 0 0.85rem;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--muted);
}

.card ul {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--border);
}

.card li {
  padding: 0.55rem 0;
  border-bottom: 1px solid var(--border);
  color: var(--foreground);
  font-size: 0.9rem;
  line-height: 1.45;
}

.card li:last-child {
  border-bottom: none;
}

.card .meta {
  margin-top: 0.85rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--border);
}

.meta {
  margin-top: 1.75rem;
  font-size: 0.86rem;
  color: var(--muted);
  line-height: 1.6;
}

code {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.84em;
  padding: 0.12em 0.35em;
  border-radius: 6px;
  background: var(--chip);
  color: var(--foreground);
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
