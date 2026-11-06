import fs from "fs-extra";
import path from "node:path";

const STANDALONE_FALLBACK = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
};

export default nextConfig;
`;

const NEXT_INTL_REQUEST_PATH = "./src/i18n/request.ts";

/** Ensure `output: "standalone"` without wiping other next.config plugins/wrappers. */
export async function ensureStandaloneOutput(
  projectDir: string,
): Promise<void> {
  const nextConfigPath = path.join(projectDir, "next.config.ts");
  if (!(await fs.pathExists(nextConfigPath))) {
    await fs.writeFile(nextConfigPath, STANDALONE_FALLBACK, "utf8");
    return;
  }

  const src = await fs.readFile(nextConfigPath, "utf8");
  if (/output\s*:\s*["']standalone["']/.test(src)) return;

  const next = src.replace(
    /(const\s+nextConfig(?::\s*NextConfig)?\s*=\s*\{)/,
    `$1\n  output: "standalone",`,
  );
  if (next === src) {
    throw new Error(
      'Could not set output: "standalone" in next.config.ts — add it manually.',
    );
  }
  await fs.writeFile(nextConfigPath, next, "utf8");
}

/**
 * Wire next-intl plugin around the existing next.config export.
 * Safe to call when already wired. Must run after any installer that
 * mutates next.config (e.g. docker standalone merge).
 */
export async function ensureNextIntlPlugin(projectDir: string): Promise<void> {
  const nextConfigPath = path.join(projectDir, "next.config.ts");
  if (!(await fs.pathExists(nextConfigPath))) return;

  let src = await fs.readFile(nextConfigPath, "utf8");

  const alreadyWrapped =
    src.includes("createNextIntlPlugin") &&
    /export\s+default\s+withNextIntl\s*\(/.test(src);

  if (alreadyWrapped) {
    // Keep request path explicit for Turbopack alias resolution.
    if (!src.includes(NEXT_INTL_REQUEST_PATH)) {
      src = src.replace(
        /createNextIntlPlugin\(\s*\)/,
        `createNextIntlPlugin("${NEXT_INTL_REQUEST_PATH}")`,
      );
      src = src.replace(
        /createNextIntlPlugin\(\s*['"][^'"]+['"]\s*\)/,
        `createNextIntlPlugin("${NEXT_INTL_REQUEST_PATH}")`,
      );
      await fs.writeFile(nextConfigPath, src, "utf8");
    }
    return;
  }

  if (!src.includes("createNextIntlPlugin")) {
    src = `import createNextIntlPlugin from "next-intl/plugin";\n\nconst withNextIntl = createNextIntlPlugin("${NEXT_INTL_REQUEST_PATH}");\n\n${src}`;
  } else if (!src.includes("withNextIntl")) {
    src = `const withNextIntl = createNextIntlPlugin("${NEXT_INTL_REQUEST_PATH}");\n\n${src}`;
  }

  if (!/export\s+default\s+withNextIntl\s*\(/.test(src)) {
    const wrapped = src.replace(
      /export\s+default\s+nextConfig\s*;/,
      "export default withNextIntl(nextConfig);",
    );
    if (wrapped === src) {
      throw new Error(
        "Could not wrap next.config.ts with next-intl plugin — wire createNextIntlPlugin manually.",
      );
    }
    src = wrapped;
  }

  await fs.writeFile(nextConfigPath, src, "utf8");
}
