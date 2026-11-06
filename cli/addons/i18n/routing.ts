import { defineRouting } from "next-intl/routing";

/**
 * Shared locale routing — used by middleware, navigation helpers, and request config.
 * Add locales here, then drop matching `messages/<locale>.json` files.
 */
export const routing = defineRouting({
  locales: ["en", "fa"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
