import fs from "fs-extra";
import path from "node:path";

const STANDALONE_FALLBACK = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
};

export default nextConfig;
`;

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
 * Safe to call when already wired.
 */
export async function ensureNextIntlPlugin(projectDir: string): Promise<void> {
  const nextConfigPath = path.join(projectDir, "next.config.ts");
  if (!(await fs.pathExists(nextConfigPath))) return;

  let src = await fs.readFile(nextConfigPath, "utf8");
  if (
    src.includes("createNextIntlPlugin") &&
    /export\s+default\s+withNextIntl\s*\(/.test(src)
  ) {
    return;
  }

  if (!src.includes("createNextIntlPlugin")) {
    src = `import createNextIntlPlugin from "next-intl/plugin";\n\nconst withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");\n\n${src}`;
  } else if (!src.includes("withNextIntl")) {
    src = `const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");\n\n${src}`;
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
