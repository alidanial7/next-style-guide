import fs from "fs-extra";
import path from "node:path";

import type { Installer } from "./types.js";

const VERCEL_JSON = `{
  "framework": "nextjs",
  "regions": ["iad1"]
}
`;

const RULE = `---
description: Vercel deployment conventions
globs: vercel.json
alwaysApply: false
---

# Vercel

- Config: \`vercel.json\` (framework Next.js).
- Set \`NEXT_PUBLIC_APP_URL\` / \`NEXT_PUBLIC_API_URL\` (and \`AUTH_SECRET\` if Auth.js) in the Vercel project env.
- Prefer Preview env for staging; Production for live.
- Do not commit \`.vercel\` or production secrets.
`;

export const vercelInstaller: Installer = {
  id: "vercel",
  active: (o) => o.deploy === "vercel",
  async run({ projectDir }) {
    await fs.writeFile(
      path.join(projectDir, "vercel.json"),
      VERCEL_JSON,
      "utf8",
    );
    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "vercel.mdc"),
      RULE,
      "utf8",
    );
    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "ops", "vercel.md"),
      `# Vercel

- \`vercel.json\` — Next.js framework hint
- Link the repo in the Vercel dashboard (or \`npx vercel\`)
- Env: copy from \`.env.production.example\` into Project → Settings → Environment Variables
`,
    );
  },
};
