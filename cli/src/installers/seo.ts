import fs from "fs-extra";
import path from "node:path";

import type { Installer } from "./types.js";

const SEO_TS = `import type { Metadata } from "next";

import { env } from "@/lib/env";

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "__PROJECT_NAME__";
export const DEFAULT_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION?.trim() ||
  "Generated with next-style-guide";

/** Absolute public origin (no trailing slash). */
export function getAppUrl(): string {
  try {
    return new URL(env.NEXT_PUBLIC_APP_URL).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function absoluteUrl(path: string): string {
  const base = getAppUrl();
  if (!path || path === "/") return base;
  return \`\${base}\${path.startsWith("/") ? path : \`/\${path}\`}\`;
}

export type SitemapChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export function buildPublicMetadata(input: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: string;
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(input.path);
  return {
    title: input.absoluteTitle ?? input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: input.absoluteTitle ?? input.title,
      description: input.description,
      url,
      siteName: SITE_NAME,
      type: "website",
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
`;

const PUBLIC_ROUTES = `import {
  buildPublicMetadata,
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  type SitemapChangeFrequency,
} from "@/lib/seo";

/**
 * Indexable URLs — single source of truth for sitemap + page metadata.
 * Add a route under \`src/app/\`, then register it here.
 */
export type PublicRoute = {
  path: string;
  title: string;
  description: string;
  absoluteTitle?: string;
  changeFrequency: SitemapChangeFrequency;
  priority: number;
  lastModified?: string;
  noIndex?: boolean;
};

export const STATIC_PUBLIC_ROUTES: PublicRoute[] = [
  {
    path: "/",
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    changeFrequency: "weekly",
    priority: 1,
    lastModified: "2026-01-01",
  },
];

export function publicPageMetadata(path: string) {
  const route = STATIC_PUBLIC_ROUTES.find((item) => item.path === path);
  if (!route) {
    throw new Error(\`Missing public route registration for \${path}\`);
  }
  return buildPublicMetadata(route);
}
`;

const SITEMAP = `import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";
import { STATIC_PUBLIC_ROUTES } from "@/lib/public-routes";

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_PUBLIC_ROUTES.filter((route) => !route.noIndex).map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
`;

const ROBOTS = `import type { MetadataRoute } from "next";

import { getAppUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const origin = getAppUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: \`\${origin}/sitemap.xml\`,
  };
}
`;

const RULE = `---
description: SEO + public routes
globs: src/lib/public-routes.ts,src/lib/seo.ts,src/app/sitemap.ts,src/app/robots.ts,src/app/**/page.tsx
alwaysApply: false
---

# SEO

- Register every indexable path in \`STATIC_PUBLIC_ROUTES\` (\`src/lib/public-routes.ts\`).
- Page metadata: \`publicPageMetadata("/path")\` — keep canonical/title/description in sync.
- \`sitemap.ts\` / \`robots.ts\` read from that registry — don't hardcode URLs twice.
- Single \`<main>\` in root layout only.
- Placeholders / thin pages: \`noIndex: true\` and keep them out of the sitemap.
- Prefer static \`lastModified\` dates over \`new Date()\` for every route.
`;

export const seoInstaller: Installer = {
  id: "seo",
  active: (o) => o.seo,
  async run({ projectDir, options }) {
    let seo = SEO_TS.replaceAll("__PROJECT_NAME__", options.name);
    await fs.writeFile(path.join(projectDir, "src", "lib", "seo.ts"), seo, "utf8");
    await fs.writeFile(
      path.join(projectDir, "src", "lib", "public-routes.ts"),
      PUBLIC_ROUTES,
      "utf8",
    );
    await fs.writeFile(
      path.join(projectDir, "src", "app", "sitemap.ts"),
      SITEMAP,
      "utf8",
    );
    await fs.writeFile(
      path.join(projectDir, "src", "app", "robots.ts"),
      ROBOTS,
      "utf8",
    );
    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "seo.mdc"),
      RULE,
      "utf8",
    );
    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "seo", "overview.md"),
      `# SEO

- Registry: \`src/lib/public-routes.ts\`
- Helpers: \`src/lib/seo.ts\`
- \`sitemap.ts\` / \`robots.ts\` under \`src/app/\`

Add a page → register the path → metadata/sitemap update automatically.
`,
    );
  },
};
