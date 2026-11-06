import fs from "fs-extra";
import path from "node:path";

import type { ScaffoldOptions } from "../types.js";
import { appPagesDir } from "./app-paths.js";
import { needsAppProviders } from "./app-providers.js";

/** Rewrite root / `[locale]` layout for AppProviders, dir, and i18n. */
export async function wireRootLayout(
  projectDir: string,
  options: ScaffoldOptions,
): Promise<void> {
  const layoutPath = path.join(appPagesDir(projectDir, options), "layout.tsx");
  const useProviders = needsAppProviders(options);
  const dark = options.darkMode;
  const i18n = options.i18n;
  const bothDir = options.direction === "both";
  // Always set dir on <html> (including both → default) so SSR/portals match theme.
  const htmlDir =
    options.direction === "rtl"
      ? "rtl"
      : options.direction === "both" && options.styling === "mui"
        ? "rtl"
        : "ltr";

  const htmlLang = i18n
    ? "{locale}"
    : htmlDir === "rtl"
      ? `"fa"`
      : `"en"`;
  const htmlExtraParts: string[] = [];
  if (dark || bothDir) htmlExtraParts.push("suppressHydrationWarning");
  htmlExtraParts.push(`dir="${htmlDir}"`);
  const htmlExtra = ` ${htmlExtraParts.join(" ")}`;

  const cssImport = i18n ? `import "../globals.css";` : `import "./globals.css";`;

  const imports = [
    `import type { Metadata } from "next";`,
    ``,
    cssImport,
  ];
  if (useProviders) {
    imports.push(
      ``,
      `import { AppProviders } from "@/providers/app-providers";`,
    );
  }
  if (dark) {
    imports.push(
      `import { THEME_INIT_SCRIPT } from "@/lib/theme-init-script";`,
    );
  }
  if (i18n) {
    imports.push(`import { hasLocale } from "next-intl";`);
    imports.push(`import { notFound } from "next/navigation";`);
    imports.push(
      `import { getMessages, getTimeZone, setRequestLocale } from "next-intl/server";`,
    );
    imports.push(`import { routing } from "@/i18n/routing";`);
  }

  const providersOpen = i18n
    ? `        <AppProviders locale={locale} messages={messages} timeZone={timeZone}>`
    : `        <AppProviders>`;

  const themeScript = dark
    ? `        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />\n`
    : "";

  const bodyInner = useProviders
    ? `${themeScript}${providersOpen}
          <main>{children}</main>
        </AppProviders>`
    : `${themeScript}        <main>{children}</main>`;

  const fnBody = i18n
    ? `  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const timeZone = await getTimeZone();

  return (
    <html lang=${htmlLang}${htmlExtra}>
      <body>
${bodyInner}
      </body>
    </html>
  );`
    : `  return (
    <html lang=${htmlLang}${htmlExtra}>
      <body>
${bodyInner}
      </body>
    </html>
  );`;

  const layoutProps = i18n
    ? `export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
${fnBody}
}`
    : `export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
${fnBody}
}`;

  const staticParams = i18n
    ? `
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
`
    : "";

  const source = `${imports.join("\n")}

export const metadata: Metadata = {
  title: "__PROJECT_NAME__",
  description: "Generated with next-style-guide",
};
${staticParams}
${layoutProps}
`;

  let final = source;
  // Prefer existing title from either legacy root layout or locale layout.
  const candidates = [
    layoutPath,
    path.join(projectDir, "src", "app", "layout.tsx"),
  ];
  for (const candidate of candidates) {
    if (!(await fs.pathExists(candidate))) continue;
    const existing = await fs.readFile(candidate, "utf8");
    const titleMatch = existing.match(/title:\s*"([^"]+)"/);
    if (titleMatch?.[1] && titleMatch[1] !== "__PROJECT_NAME__") {
      final = final.replace(
        'title: "__PROJECT_NAME__"',
        `title: "${titleMatch[1]}"`,
      );
      break;
    }
  }

  await fs.ensureDir(path.dirname(layoutPath));
  await fs.writeFile(layoutPath, final, "utf8");

  // Locale layout owns <html>; remove stray root layout if present.
  if (i18n) {
    const rootLayout = path.join(projectDir, "src", "app", "layout.tsx");
    if (rootLayout !== layoutPath && (await fs.pathExists(rootLayout))) {
      await fs.remove(rootLayout);
    }
    const rootPage = path.join(projectDir, "src", "app", "page.tsx");
    if (await fs.pathExists(rootPage)) {
      await fs.remove(rootPage);
    }
  }
}
