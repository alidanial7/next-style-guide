import fs from "fs-extra";
import path from "node:path";

import { copyAddonFile } from "../helpers/addon-files.js";
import { ensureNextIntlPlugin } from "../helpers/next-config.js";
import { addDependencies } from "../helpers/package-json.js";
import type { Installer } from "./types.js";

/**
 * Keep shared/non-localized artifacts at `src/app/` root.
 * Route UI (`layout`, `page`, `login`, …) moves under `[locale]/`.
 */
const APP_ROOT_KEEP = new Set([
  "api",
  "globals.css",
  "[locale]",
  "_components",
  "robots.ts",
  "sitemap.ts",
  "favicon.ico",
  "icon.svg",
  "icon.png",
  "icon.ico",
  "apple-icon.png",
  "opengraph-image.png",
  "twitter-image.png",
]);

async function moveAppIntoLocaleSegment(projectDir: string): Promise<void> {
  const appDir = path.join(projectDir, "src", "app");
  const localeDir = path.join(appDir, "[locale]");
  await fs.ensureDir(localeDir);

  const entries = await fs.readdir(appDir);
  for (const entry of entries) {
    if (APP_ROOT_KEEP.has(entry)) continue;
    const from = path.join(appDir, entry);
    const to = path.join(localeDir, entry);
    if (await fs.pathExists(to)) {
      await fs.remove(to);
    }
    await fs.move(from, to);
  }
}

async function pruneI18n(projectDir: string): Promise<void> {
  await fs.remove(path.join(projectDir, "src", "i18n"));
  await fs.remove(path.join(projectDir, "messages"));
  await fs.remove(
    path.join(projectDir, "src", "app", "_components", "locale-switcher"),
  );
  await fs.remove(path.join(projectDir, ".cursor", "rules", "i18n.mdc"));
  await fs.remove(
    path.join(projectDir, "docs", "style-guide", "i18n", "overview.md"),
  );

  // Only remove proxy/middleware if it looks like the next-intl seed (not a custom file).
  for (const name of ["proxy.ts", "middleware.ts"] as const) {
    const edgePath = path.join(projectDir, "src", name);
    if (!(await fs.pathExists(edgePath))) continue;
    const text = await fs.readFile(edgePath, "utf8");
    if (text.includes("next-intl/middleware")) {
      await fs.remove(edgePath);
    }
  }

  const localeDir = path.join(projectDir, "src", "app", "[locale]");
  if (!(await fs.pathExists(localeDir))) return;

  const appDir = path.join(projectDir, "src", "app");
  const entries = await fs.readdir(localeDir);
  for (const entry of entries) {
    const from = path.join(localeDir, entry);
    const to = path.join(appDir, entry);
    if (await fs.pathExists(to)) {
      await fs.remove(to);
    }
    await fs.move(from, to);
  }
  await fs.remove(localeDir);
}

export const i18nInstaller: Installer = {
  id: "i18n",
  active: () => true,
  async run({ projectDir, options }) {
    if (!options.i18n) {
      await pruneI18n(projectDir);
      return;
    }

    const i18nDir = path.join(projectDir, "src", "i18n");
    await fs.ensureDir(i18nDir);

    await copyAddonFile("i18n/routing.ts", path.join(i18nDir, "routing.ts"));
    await copyAddonFile(
      "i18n/navigation.ts",
      path.join(i18nDir, "navigation.ts"),
    );
    await copyAddonFile("i18n/request.ts", path.join(i18nDir, "request.ts"));

    await copyAddonFile(
      "i18n/messages/en.json",
      path.join(projectDir, "messages", "en.json"),
    );
    await copyAddonFile(
      "i18n/messages/fa.json",
      path.join(projectDir, "messages", "fa.json"),
    );

    const proxySeed =
      options.auth === "authjs" ? "i18n/proxy.with-auth.ts" : "i18n/proxy.ts";
    await copyAddonFile(proxySeed, path.join(projectDir, "src", "proxy.ts"));
    // Drop legacy middleware if a prior scaffold left it behind.
    await fs.remove(path.join(projectDir, "src", "middleware.ts"));

    const toggleDir = path.join(
      projectDir,
      "src",
      "app",
      "_components",
      "locale-switcher",
    );
    await fs.ensureDir(toggleDir);
    const toggleSeed =
      options.styling === "mui"
        ? "i18n/components/locale-switcher.mui.tsx"
        : "i18n/components/locale-switcher.default.tsx";
    await copyAddonFile(toggleSeed, path.join(toggleDir, "index.tsx"));

    await moveAppIntoLocaleSegment(projectDir);

    await copyAddonFile(
      "i18n/.cursor/rules/i18n.mdc",
      path.join(projectDir, ".cursor", "rules", "i18n.mdc"),
    );
    await copyAddonFile(
      "i18n/docs/style-guide/i18n/overview.md",
      path.join(projectDir, "docs", "style-guide", "i18n", "overview.md"),
    );

    await ensureNextIntlPlugin(projectDir);

    await addDependencies(projectDir, {
      "next-intl": "^4.5.0",
    });
  },
};
