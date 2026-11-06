import fs from "fs-extra";
import path from "node:path";

import type { ScaffoldOptions } from "../types.js";

export function needsAppProviders(options: ScaffoldOptions): boolean {
  return (
    options.data === "tanstack-query" ||
    options.store === "redux" ||
    options.styling === "mui" ||
    options.i18n ||
    options.darkMode ||
    options.direction === "both"
  );
}

/** Generate client `AppProviders` composing enabled providers (outer → inner). */
export function generateAppProvidersSource(options: ScaffoldOptions): string {
  const imports: string[] = [
    `"use client";`,
    ``,
    `import type { ReactNode } from "react";`,
  ];
  const props: string[] = [`children: ReactNode`];

  if (options.i18n) {
    imports.push(`import { NextIntlClientProvider } from "next-intl";`);
    props.push(`messages: Record<string, unknown>`);
  }
  if (options.direction === "both") {
    imports.push(
      `import { DirectionProvider } from "@/providers/direction-provider";`,
    );
  }
  if (options.darkMode) {
    imports.push(`import { ThemeProvider } from "@/providers/theme-provider";`);
  }
  if (options.styling === "mui") {
    imports.push(`import { MuiProvider } from "@/providers/mui-provider";`);
  }
  if (options.store === "redux") {
    imports.push(`import { StoreProvider } from "@/providers/store-provider";`);
  }
  if (options.data === "tanstack-query") {
    imports.push(`import { QueryProvider } from "@/providers/query-provider";`);
  }

  const openers: string[] = [];
  const closers: string[] = [];

  if (options.i18n) {
    openers.push(`    <NextIntlClientProvider messages={messages}>`);
    closers.unshift(`    </NextIntlClientProvider>`);
  }
  if (options.direction === "both") {
    openers.push(`    <DirectionProvider>`);
    closers.unshift(`    </DirectionProvider>`);
  }
  if (options.darkMode) {
    openers.push(`    <ThemeProvider>`);
    closers.unshift(`    </ThemeProvider>`);
  }
  if (options.styling === "mui") {
    openers.push(`    <MuiProvider>`);
    closers.unshift(`    </MuiProvider>`);
  }
  if (options.store === "redux") {
    openers.push(`    <StoreProvider>`);
    closers.unshift(`    </StoreProvider>`);
  }
  if (options.data === "tanstack-query") {
    openers.push(`    <QueryProvider>`);
    closers.unshift(`    </QueryProvider>`);
  }

  return `${imports.join("\n")}

type AppProvidersProps = {
  ${props.join(";\n  ")};
};

/**
 * Single composition root for client providers.
 * Feature installers add leaf providers; this file wraps them in a stable order.
 */
export function AppProviders({ children${options.i18n ? ", messages" : ""} }: AppProvidersProps) {
  return (
${openers.join("\n")}
      {children}
${closers.join("\n")}
  );
}
`;
}

export async function writeAppProviders(
  projectDir: string,
  options: ScaffoldOptions,
): Promise<void> {
  if (!needsAppProviders(options)) return;

  const providersDir = path.join(projectDir, "src", "providers");
  await fs.ensureDir(providersDir);
  await fs.remove(path.join(providersDir, ".gitkeep"));
  await fs.writeFile(
    path.join(providersDir, "app-providers.tsx"),
    generateAppProvidersSource(options),
    "utf8",
  );
}

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

  const bodyInner = useProviders
    ? i18n
      ? `        <AppProviders messages={messages}>
          <main>{children}</main>
        </AppProviders>`
      : `        <AppProviders>
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
