import fs from "fs-extra";
import path from "node:path";

import { ADDONS_DIR } from "../constants.js";
import type { ScaffoldOptions } from "../types.js";
import type { Installer } from "./types.js";

function stackLines(options: ScaffoldOptions): string[] {
  const stylingLabel =
    options.styling === "tailwind"
      ? options.ui === "shadcn"
        ? "Tailwind + shadcn/ui"
        : "Tailwind CSS"
      : options.styling === "mui"
        ? "MUI"
        : "Plain CSS";

  return [
    `Styling: ${stylingLabel}`,
    `Validation: ${options.validation}`,
    `Auth: ${options.auth}`,
    options.seo ? "SEO helpers (sitemap/robots)" : "No SEO helpers",
    options.data === "tanstack-query"
      ? "TanStack Query enabled"
      : "RSC / fetch (no TanStack Query)",
    options.icons === "none" ? "No icon library" : `Icons: ${options.icons}`,
    options.endpoints
      ? "OpenAPI endpoints codegen (`pnpm endpoints:generate`)"
      : "No endpoints codegen",
    options.eslint ? "Enhanced ESLint" : "Minimal ESLint",
    options.prettier ? "Prettier" : "No Prettier",
    options.husky ? "Husky + lint-staged" : "No git hooks",
    options.docker ? "Docker standalone image" : "No Docker",
    options.ci ? "GitHub Actions CI" : "No CI workflow",
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
  const uiBit =
    options.ui === "shadcn" ? " · ui=<code>shadcn</code>" : "";

  return `import { WelcomeCard } from "@/app/_components/welcome-card";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <h1>${options.name}</h1>
        <p>
          Scaffolded with <strong>next-style-guide</strong> (Next.js 16).
          styling=<code>${options.styling}</code>${uiBit} · validation=
          <code>${options.validation}</code> · icons=<code>${options.icons}</code> ·
          data=<code>${options.data}</code>.
        </p>
      </section>

      <WelcomeCard />

      <p className="meta">
        Read <code>AGENTS.md</code> and <code>docs/style-guide/</code> before
        adding routes. Feature rules in <code>.cursor/rules/</code> load by glob.
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
    [
      `[Validation](validation/${options.validation}.md)`,
      options.validation.toUpperCase(),
    ],
  ];

  if (options.auth === "jwt") {
    rows.push(["[JWT auth](auth/jwt.md)", "token-storage + Bearer refresh"]);
  }
  if (options.auth === "authjs") {
    rows.push(["[Auth.js](auth/authjs.md)", "NextAuth stub"]);
  }
  if (options.seo) {
    rows.push(["[SEO](seo/overview.md)", "public-routes · sitemap · robots"]);
  }
  if (options.styling === "tailwind") {
    rows.push(["Tailwind", "See `.cursor/rules/tailwind.mdc`"]);
  }
  if (options.ui === "shadcn") {
    rows.push(["shadcn/ui", "See `.cursor/rules/shadcn.mdc` + `components.json`"]);
  }
  if (options.styling === "mui") {
    rows.push(["MUI", "See `.cursor/rules/mui.mdc`"]);
  }
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
  if (options.eslint) {
    rows.push(["[ESLint](tooling/eslint.md)", "Import sort + style rules"]);
  }
  if (options.prettier) {
    rows.push(["[Prettier](tooling/prettier.md)", "Formatting"]);
  }
  if (options.husky) {
    rows.push(["[Husky](tooling/husky.md)", "Pre-commit hooks"]);
  }
  if (options.docker) {
    rows.push(["[Docker](ops/docker.md)", "Standalone production image"]);
  }
  if (options.ci) {
    rows.push(["[CI](ops/ci.md)", "GitHub Actions"]);
  }

  const table = [
    "| Page | Topic |",
    "|------|--------|",
    ...rows.map(([page, topic]) => `| ${page} | ${topic} |`),
  ].join("\n");

  return `# Style guide — ${options.name}

Living conventions for this app. Open one page at a time.

${table}

Coding agents: start at [\`AGENTS.md\`](../../AGENTS.md) → [\`.cursor/rules/\`](../../.cursor/rules/) (glob-scoped).
`;
}

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
