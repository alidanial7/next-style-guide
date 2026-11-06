import fs from "fs-extra";
import path from "node:path";

import { ensureNextIntlPlugin } from "../helpers/next-config.js";
import { addDependencies } from "../helpers/package-json.js";
import type { Installer } from "./types.js";

const I18N_REQUEST = `import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
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
description: next-intl i18n conventions
globs: src/i18n/**,messages/**,src/providers/app-providers.tsx
alwaysApply: false
---

# i18n (next-intl)

- Request config: \`src/i18n/request.ts\`.
- Messages: \`messages/<locale>.json\`.
- Prefer \`useTranslations\` / \`getTranslations\` — avoid hardcoded copy when a key exists.
- \`NextIntlClientProvider\` is composed in \`AppProviders\`; root layout loads locale/messages.
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

next-intl: \`src/i18n/request.ts\` + \`messages/en.json\`
Plugin wired in \`next.config.ts\`. Provider via \`AppProviders\`.
`,
    );

    await ensureNextIntlPlugin(projectDir);

    await addDependencies(projectDir, {
      "next-intl": "^3.26.3",
    });
  },
};
