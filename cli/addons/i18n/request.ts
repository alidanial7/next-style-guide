import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    // Stable default — avoids ENVIRONMENT_FALLBACK markup mismatches across hosts.
    timeZone: "UTC",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
