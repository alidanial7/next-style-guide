import fs from "fs-extra";
import path from "node:path";

import type { ScaffoldOptions } from "../types.js";
import { needsAppProviders } from "./app-providers.js";

/** Rewrite root layout to use AppProviders (+ i18n locale when enabled). */
export async function wireRootLayout(
  projectDir: string,
  options: ScaffoldOptions,
): Promise<void> {
  const layoutPath = path.join(projectDir, "src", "app", "layout.tsx");
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

  const imports = [
    `import type { Metadata } from "next";`,
    ``,
    `import "./globals.css";`,
  ];
  if (useProviders) {
    imports.push(
      ``,
      `import { AppProviders } from "@/providers/app-providers";`,
    );
  }
  if (i18n) {
    imports.push(
      `import { getLocale, getMessages } from "next-intl/server";`,
    );
  }

  const providersOpen = i18n
    ? `        <AppProviders locale={locale} messages={messages}>`
    : `        <AppProviders>`;

  const bodyInner = useProviders
    ? `${providersOpen}
          <main>{children}</main>
        </AppProviders>`
    : `        <main>{children}</main>`;

  const fnBody = i18n
    ? `  const locale = await getLocale();
  const messages = await getMessages();

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

  const source = `${imports.join("\n")}

export const metadata: Metadata = {
  title: "__PROJECT_NAME__",
  description: "Generated with next-style-guide",
};

export default ${i18n ? "async " : ""}function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
${fnBody}
}
`;

  let final = source;
  if (await fs.pathExists(layoutPath)) {
    const existing = await fs.readFile(layoutPath, "utf8");
    const titleMatch = existing.match(/title:\s*"([^"]+)"/);
    if (titleMatch?.[1] && titleMatch[1] !== "__PROJECT_NAME__") {
      final = final.replace(
        'title: "__PROJECT_NAME__"',
        `title: "${titleMatch[1]}"`,
      );
    }
  }

  await fs.writeFile(layoutPath, final, "utf8");
}
