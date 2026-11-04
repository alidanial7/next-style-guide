import fs from "fs-extra";
import path from "node:path";

import { ADDONS_DIR } from "../constants.js";
import type { ScaffoldOptions } from "../types.js";
import type { Installer } from "./types.js";

function stackLines(options: ScaffoldOptions): string[] {
  return [
    options.data === "tanstack-query"
      ? "TanStack Query enabled"
      : "RSC / fetch (no TanStack Query)",
    options.icons === "none" ? "No icon library" : `Icons: ${options.icons}`,
    options.endpoints
      ? "OpenAPI endpoints codegen (`pnpm endpoints:generate`)"
      : "No endpoints codegen",
    options.husky ? "Husky + lint-staged + Prettier" : "No git hooks",
  ];
}

function welcomeCardSource(options: ScaffoldOptions): string {
  const items = stackLines(options)
    .map((line) => `        <li>${escapeJsx(line)}</li>`)
    .join("\n");

  return `/** Homepage sample — reflects scaffold choices; replace with real UI. */
export function WelcomeCard() {
  return (
    <div className="card">
      <h2>Your scaffold</h2>
      <ul>
${items}
      </ul>
      <p className="meta" style={{ marginTop: "1rem" }}>
        Route UI → <code>src/app/&lt;route&gt;/_components/</code> · shared →{" "}
        <code>src/components/</code>
      </p>
    </div>
  );
}
`;
}

function escapeJsx(text: string): string {
  return text.replaceAll("`", "\\`");
}

function homePageSource(options: ScaffoldOptions): string {
  return `import { WelcomeCard } from "@/app/_components/welcome-card";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <h1>${options.name}</h1>
        <p>
          Scaffolded with <strong>next-style-guide</strong>. Choices: icons=
          <code>${options.icons}</code>, data=<code>${options.data}</code>,
          endpoints=<code>${options.endpoints ? "on" : "off"}</code>, husky=
          <code>${options.husky ? "on" : "off"}</code>.
        </p>
      </section>

      <WelcomeCard />

      <p className="meta">
        Read <code>AGENTS.md</code> and <code>docs/style-guide/</code> before
        adding routes.
      </p>
    </>
  );
}
`;
}

function docsIndex(options: ScaffoldOptions): string {
  const rows: Array<[string, string]> = [
    [
      "[Architecture](overview/architecture.md)",
      "Layers: app / components / lib / utils",
    ],
    ["[Project structure](overview/project-structure.md)", "Folder map"],
    ["[HTTP client](http/client.md)", "`apiFetch` helper"],
  ];

  if (options.endpoints) {
    rows.push([
      "[OpenAPI endpoints](http/endpoints.md)",
      "`pnpm endpoints:generate`",
    ]);
  }
  if (options.data === "tanstack-query") {
    rows.push([
      "[TanStack Query](data/tanstack-query.md)",
      "Client cache + QueryProvider",
    ]);
  }
  if (options.icons !== "none") {
    rows.push(["[Icons](ui/icons.md)", `Icon library (${options.icons})`]);
  }
  if (options.husky) {
    rows.push(["[Husky](tooling/husky.md)", "Pre-commit Prettier + ESLint"]);
  }

  const table = [
    "| Page | Topic |",
    "|------|--------|",
    ...rows.map(([page, topic]) => `| ${page} | ${topic} |`),
  ].join("\n");

  return `# Style guide — ${options.name}

Living conventions for this app. Open one page at a time.

${table}

Coding agents: start at [\`AGENTS.md\`](../../AGENTS.md) → [\`.cursor/rules/\`](../../.cursor/rules/).
`;
}

/**
 * Rebuild choice-aware homepage + docs index (and copy feature doc pages).
 * Runs last so other installers' files already exist.
 */
export const surfaceInstaller: Installer = {
  id: "surface",
  active: () => true,
  async run({ projectDir, options }) {
    await fs.writeFile(
      path.join(
        projectDir,
        "src",
        "app",
        "_components",
        "welcome-card",
        "index.tsx",
      ),
      welcomeCardSource(options),
      "utf8",
    );
    await fs.writeFile(
      path.join(projectDir, "src", "app", "page.tsx"),
      homePageSource(options),
      "utf8",
    );

    if (options.data === "tanstack-query") {
      await fs.copy(
        path.join(ADDONS_DIR, "docs", "data", "tanstack-query.md"),
        path.join(
          projectDir,
          "docs",
          "style-guide",
          "data",
          "tanstack-query.md",
        ),
      );
    }
    if (options.icons !== "none") {
      await fs.copy(
        path.join(ADDONS_DIR, "docs", "ui", "icons.md"),
        path.join(projectDir, "docs", "style-guide", "ui", "icons.md"),
      );
    }

    await fs.writeFile(
      path.join(projectDir, "docs", "style-guide", "README.md"),
      docsIndex(options),
      "utf8",
    );
  },
};
