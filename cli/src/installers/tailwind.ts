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
  --background: #f6f4ef;
  --foreground: #14201b;
  --muted: #5b6b63;
  --accent: #0b5fff;
  --card: #ffffff;
  --border: #d9e0db;
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
  background: radial-gradient(circle at top left, #eef3ff, transparent 40%),
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
  width: min(720px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 4rem 0 3rem;
}

.hero {
  display: grid;
  gap: 1rem;
}

.hero h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: -0.03em;
}

.hero p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
  max-width: 40rem;
}

.card {
  margin-top: 2rem;
  padding: 1.25rem 1.5rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.card h2 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.card ul {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--muted);
  line-height: 1.7;
}

.meta {
  margin-top: 2rem;
  font-size: 0.875rem;
  color: var(--muted);
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
