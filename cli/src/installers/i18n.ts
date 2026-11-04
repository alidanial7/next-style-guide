import fs from "fs-extra";
import path from "node:path";

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
globs: src/i18n/**,messages/**,src/app/**/layout.tsx
alwaysApply: false
---

# i18n (next-intl)

- Request config: \`src/i18n/request.ts\`.
- Messages: \`messages/<locale>.json\`.
- Prefer \`useTranslations\` / \`getTranslations\` — avoid hardcoded copy when a key exists.
- Root layout sets \`lang={locale}\` and wraps with \`NextIntlClientProvider\`.
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
Plugin wired in \`next.config.ts\`.
`,
    );

    const nextConfigPath = path.join(projectDir, "next.config.ts");
    if (await fs.pathExists(nextConfigPath)) {
      let nextConfig = await fs.readFile(nextConfigPath, "utf8");
      if (!nextConfig.includes("next-intl")) {
        if (!nextConfig.includes("createNextIntlPlugin")) {
          nextConfig = `import createNextIntlPlugin from "next-intl/plugin";\n\nconst withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");\n\n${nextConfig}`;
        }
        nextConfig = nextConfig.replace(
          "export default nextConfig;",
          "export default withNextIntl(nextConfig);",
        );
        await fs.writeFile(nextConfigPath, nextConfig, "utf8");
      }
    }

    const layoutPath = path.join(projectDir, "src", "app", "layout.tsx");
    let layout = await fs.readFile(layoutPath, "utf8");
    if (!layout.includes("NextIntlClientProvider")) {
      layout = layout.replace(
        'import "./globals.css";\n',
        'import "./globals.css";\n\nimport { NextIntlClientProvider } from "next-intl";\nimport { getLocale, getMessages } from "next-intl/server";\n',
      );
      layout = layout.replace(
        /export default function RootLayout/,
        "export default async function RootLayout",
      );
      layout = layout.replace(
        /export default async function RootLayout/,
        "export default async function RootLayout",
      );

      // Inject locale/messages before return
      if (!layout.includes("getLocale()")) {
        layout = layout.replace(
          /\) \{\n  return \(/,
          `) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (`,
        );
      }

      layout = layout.replace(/<html lang="en">/, "<html lang={locale}>");

      if (!layout.includes("NextIntlClientProvider")) {
        layout = layout.replace(
          /<body>\n/,
          "<body>\n        <NextIntlClientProvider messages={messages}>\n",
        );
        layout = layout.replace(
          /\n      <\/body>/,
          "\n        </NextIntlClientProvider>\n      </body>",
        );
      }

      await fs.writeFile(layoutPath, layout, "utf8");
    }

    await addDependencies(projectDir, {
      "next-intl": "^3.26.3",
    });
  },
};
