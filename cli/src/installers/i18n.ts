import fs from "fs-extra";
import path from "node:path";

import { ensureNextIntlPlugin } from "../helpers/next-config.js";
import { addDependencies } from "../helpers/package-json.js";
import type { Installer } from "./types.js";

/** next-intl v4 request config (App Router, no [locale] segment). */
const I18N_REQUEST = `import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  // Static for now — swap for cookie / header / routing when you add locales.
  const locale = "en";

  return {
    locale,
    messages: (await import(\`../../messages/\${locale}.json\`)).default,
  };
});
`;

const MESSAGES_EN = `{
  "Home": {
    "title": "Welcome",
    "body": "Scaffolded with next-style-guide."
  }
}
`;

const RULE = `---
description: next-intl i18n conventions (v4 + Next.js 16)
globs: src/i18n/**,messages/**,src/providers/app-providers.tsx,next.config.ts
alwaysApply: false
---

# i18n (next-intl v4)

- Request config: \`src/i18n/request.ts\` (wired by \`createNextIntlPlugin\` in \`next.config.ts\`).
- Messages: \`messages/<locale>.json\`.
- Prefer \`useTranslations\` / \`getTranslations\` — avoid hardcoded copy when a key exists.
- Root layout: \`getLocale()\` + \`getMessages()\` → pass into \`AppProviders\`.
- \`NextIntlClientProvider\` lives in client \`AppProviders\` — always pass \`locale\` + \`messages\` explicitly (inheritance only works when the provider itself is rendered from a Server Component).
- Keep \`next-intl@^4.5\` — v3 injects \`experimental.turbo\` which Next.js 16 rejects.
`;

export const i18nInstaller: Installer = {
  id: "i18n",
  active: (o) => o.i18n,
  async run({ projectDir }) {
    await fs.outputFile(
      path.join(projectDir, "src", "i18n", "request.ts"),
      I18N_REQUEST,
    );
    await fs.outputFile(
      path.join(projectDir, "messages", "en.json"),
      MESSAGES_EN,
    );
    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "i18n.mdc"),
      RULE,
      "utf8",
    );
    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "i18n", "overview.md"),
      `# i18n

next-intl **v4+**: \`src/i18n/request.ts\` + \`messages/en.json\`
Plugin: \`createNextIntlPlugin("./src/i18n/request.ts")\` in \`next.config.ts\`.
Layout loads \`locale\`/\`messages\` and passes them into client \`AppProviders\` → \`NextIntlClientProvider\`.

Requires Next.js 15.3+ / 16 — do not use next-intl v3 (breaks Turbopack config).
`,
    );

    await ensureNextIntlPlugin(projectDir);

    // v4.5+ uses top-level `turbopack` resolveAlias — required for Next.js 16
    await addDependencies(projectDir, {
      "next-intl": "^4.5.0",
    });
  },
};
