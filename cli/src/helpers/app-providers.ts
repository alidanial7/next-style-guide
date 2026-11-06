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
    // Required: AppProviders is a Client Component — locale / timeZone are NOT inherited.
    props.push(`locale: string`);
    props.push(`messages: Record<string, unknown>`);
    props.push(`timeZone: string`);
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
    openers.push(
      `    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>`,
    );
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

  const destructure = options.i18n
    ? "{ children, locale, messages, timeZone }"
    : "{ children }";

  return `${imports.join("\n")}

type AppProvidersProps = {
  ${props.join(";\n  ")};
};

/**
 * Single composition root for client providers.
 * Feature installers add leaf providers; this file wraps them in a stable order.
 */
export function AppProviders(${destructure}: AppProvidersProps) {
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
