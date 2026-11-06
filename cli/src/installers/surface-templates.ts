import type { ScaffoldOptions } from "../types.js";

export function stackLines(options: ScaffoldOptions): string[] {
  const stylingLabel =
    options.styling === "tailwind"
      ? options.ui === "shadcn"
        ? "Tailwind + shadcn/ui"
        : "Tailwind CSS"
      : options.styling === "mui"
        ? "MUI"
        : "Plain CSS";

  return [
    `Package manager: ${options.packageManager}`,
    `Styling: ${stylingLabel}`,
    `Validation: ${options.validation}`,
    `Auth: ${options.auth}`,
    options.store === "none"
      ? "No client store"
      : `Client store: ${options.store}`,
    options.darkMode ? "Dark mode (next-themes)" : "No dark mode",
    options.direction === "both"
      ? "Direction: both (runtime toggle)"
      : `Direction: ${options.direction}`,
    options.seo ? "SEO helpers (sitemap/robots)" : "No SEO helpers",
    options.data === "tanstack-query"
      ? "TanStack Query enabled"
      : "RSC / fetch (no TanStack Query)",
    options.icons === "none" ? "No icon library" : `Icons: ${options.icons}`,
    options.endpoints
      ? `OpenAPI endpoints codegen (\`${options.packageManager} endpoints:generate\`)`
      : "No endpoints codegen",
    options.dockerCompose
      ? "Docker Compose local API stub"
      : null,
    options.apiEnvelope ? "API envelope unwrap" : "No envelope unwrap",
    options.i18n
      ? "i18n (next-intl · en/fa · /[locale])"
      : "No i18n",
    options.testing
      ? options.playwright
        ? "Vitest + Playwright"
        : "Vitest"
      : "No tests",
    options.eslint ? "Enhanced ESLint" : "Minimal ESLint",
    options.prettier ? "Prettier" : "No Prettier",
    options.husky ? "Husky + lint-staged" : "No git hooks",
    options.ui === "shadcn"
      ? `shadcn set: ${options.shadcnSet}`
      : null,
    options.deploy === "docker"
      ? "Deploy: Docker standalone image"
      : options.deploy === "vercel"
        ? "Deploy: Vercel"
        : "No deploy target",
    options.ci === "github"
      ? "GitHub Actions CI"
      : options.ci === "gitlab"
        ? "GitLab CI"
        : "No CI workflow",
  ].filter((line): line is string => line !== null);
}

export function escapeJsx(text: string): string {
  return text.replaceAll("`", "\\`");
}

export function welcomeCardSource(options: ScaffoldOptions): string {
  const items = stackLines(options)
    .map((line) => `        <li>${escapeJsx(line)}</li>`)
    .join("\n");

  const directionHint =
    options.direction !== "ltr"
      ? " · direction via <code>useDirection()</code>"
      : "";
  const i18nHint = options.i18n
    ? " · copy via <code>getTranslations</code> · routes under <code>src/app/[locale]/</code>"
    : "";

  // Keep WelcomeCard free of client hooks so Vitest SSR smoke stays valid.
  return `/** Homepage sample — reflects scaffold choices; replace with real UI. */
export function WelcomeCard() {
  return (
    <div className="card">
      <h2>Your scaffold</h2>
      <ul>
${items}
      </ul>
      <p className="meta">
        Route UI → <code>src/app/&lt;route&gt;/_components/</code> · shared →{" "}
        <code>src/components/</code>${directionHint}${i18nHint}
      </p>
    </div>
  );
}
`;
}

export function homePageSource(options: ScaffoldOptions): string {
  const themeImport = options.darkMode
    ? 'import { ThemeToggle } from "@/app/_components/theme-toggle";\n'
    : "";
  const directionImport =
    options.direction === "both"
      ? 'import { DirectionToggle } from "@/app/_components/direction-toggle";\n'
      : "";
  const localeImport = options.i18n
    ? 'import { LocaleSwitcher } from "@/app/_components/locale-switcher";\n'
    : "";

  const toolbarItems = [
    options.i18n ? "        <LocaleSwitcher />" : null,
    options.darkMode ? "        <ThemeToggle />" : null,
    options.direction === "both" ? "        <DirectionToggle />" : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const toolbar =
    toolbarItems.length > 0
      ? `
      <div className="sample-toolbar">
${toolbarItems}
      </div>
`
      : "";

  if (options.i18n) {
    const stylingLabel = escapeJsx(
      options.ui === "shadcn"
        ? `${options.styling}+shadcn`
        : options.styling,
    );
    const validationLabel = escapeJsx(options.validation);
    const iconsLabel = escapeJsx(options.icons);
    const dataLabel = escapeJsx(options.data);
    const nameLabel = escapeJsx(options.name);

    return `import { getTranslations, setRequestLocale } from "next-intl/server";

import { BrandLogo } from "@/app/_components/brand-logo";
import { WelcomeCard } from "@/app/_components/welcome-card";
${localeImport}${themeImport}${directionImport}
type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  return (
    <>
      <section className="hero">
        <div className="hero-brand">
          <BrandLogo />
          <p className="eyebrow">next-style-guide</p>
        </div>
        <h1>{t("title", { name: "${nameLabel}" })}</h1>
        <p>
          {t("body", {
            styling: "${stylingLabel}",
            validation: "${validationLabel}",
            icons: "${iconsLabel}",
            data: "${dataLabel}",
          })}
        </p>
      </section>
${toolbar}
      <WelcomeCard />

      <p className="meta">{t("meta")}</p>
    </>
  );
}
`;
  }

  const uiBit =
    options.ui === "shadcn" ? " · ui=<code>shadcn</code>" : "";

  return `import { BrandLogo } from "@/app/_components/brand-logo";
import { WelcomeCard } from "@/app/_components/welcome-card";
${themeImport}${directionImport}
export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-brand">
          <BrandLogo />
          <p className="eyebrow">next-style-guide</p>
        </div>
        <h1>${options.name}</h1>
        <p>
          Scaffolded with Next.js 16.
          styling=<code>${options.styling}</code>${uiBit} · validation=
          <code>${options.validation}</code> · icons=<code>${options.icons}</code> ·
          data=<code>${options.data}</code>.
        </p>
      </section>
${toolbar}
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

export function docsIndex(options: ScaffoldOptions): string {
  const rows: Array<[string, string]> = [
    [
      "[Architecture](overview/architecture.md)",
      "Layers: app / components / lib / utils",
    ],
    ["[Project structure](overview/project-structure.md)", "Folder map"],
    ["[Environment](ops/env.md)", "`.env.example` · staging · production"],
    ["[HTTP client](http/client.md)", "`apiFetch` helper"],
    [
      `[Validation](validation/${options.validation}.md)`,
      options.validation === "none"
        ? "plain env helpers"
        : options.validation.toUpperCase(),
    ],
  ];

  if (options.auth === "jwt") {
    rows.push(["[JWT auth](auth/jwt.md)", "token-storage + Bearer refresh"]);
  }
  if (options.auth === "authjs") {
    rows.push(["[Auth.js](auth/authjs.md)", "NextAuth stub"]);
  }
  if (options.store === "zustand") {
    rows.push(["[Zustand](state/zustand.md)", "client store"]);
  }
  if (options.store === "redux") {
    rows.push(["[Redux Toolkit](state/redux.md)", "client store"]);
  }
  if (options.darkMode) {
    rows.push(["[Dark mode](ui/dark-mode.md)", "next-themes"]);
  }
  rows.push([
    "[Direction](ui/direction.md)",
    options.direction === "both"
      ? "ltr ↔ rtl + useDirection"
      : `fixed ${options.direction}`,
  ]);
  if (options.dockerCompose) {
    rows.push([
      "[Docker Compose](ops/docker-compose.md)",
      "local API stub",
    ]);
  }
  if (options.seo) {
    rows.push(["[SEO](seo/overview.md)", "public-routes · sitemap · robots"]);
  }
  if (options.i18n) {
    rows.push([
      "[i18n](i18n/overview.md)",
      "next-intl · en/fa · /[locale]",
    ]);
  }
  if (options.apiEnvelope) {
    rows.push(["[API envelope](http/envelope.md)", "unwrap result"]);
  }
  if (options.testing) {
    rows.push(["[Testing](tooling/testing.md)", "Vitest"]);
  }
  if (options.styling === "tailwind") {
    rows.push(["Tailwind", "See `.cursor/rules/tailwind.mdc`"]);
  }
  if (options.ui === "shadcn") {
    rows.push([
      "[shadcn/ui](ui/shadcn.md)",
      `set=${options.shadcnSet}`,
    ]);
  }
  if (options.styling === "mui") {
    rows.push(["[MUI](ui/mui.md)", "`src/theme/` + MuiProvider"]);
  }
  if (options.endpoints) {
    rows.push([
      "[OpenAPI endpoints](http/endpoints.md)",
      `\`${options.packageManager} endpoints:generate\``,
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
  if (options.deploy === "docker") {
    rows.push(["[Docker](ops/docker.md)", "Standalone production image"]);
  }
  if (options.deploy === "vercel") {
    rows.push(["[Vercel](ops/vercel.md)", "vercel.json + env notes"]);
  }
  if (options.ci === "github") {
    rows.push(["[CI](ops/ci.md)", "GitHub Actions"]);
  }
  if (options.ci === "gitlab") {
    rows.push(["[CI](ops/ci.md)", "GitLab CI"]);
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
