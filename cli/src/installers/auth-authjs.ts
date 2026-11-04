import fs from "fs-extra";
import path from "node:path";

import { addDependencies } from "../helpers/package-json.js";
import type { Installer } from "./types.js";

const AUTH_TS = `import NextAuth from "next-auth";

/**
 * Auth.js (NextAuth) stub — configure providers for your app.
 * Docs: https://authjs.dev
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [],
  session: { strategy: "jwt" },
});
`;

const ROUTE = `import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
`;

const RULE = `---
description: Auth.js (NextAuth) conventions
globs: src/lib/auth.ts,src/app/api/auth/**/*
alwaysApply: false
---

# Auth.js

- Config: \`src/lib/auth.ts\` — add providers here.
- Route handlers: \`src/app/api/auth/[...nextauth]/route.ts\`.
- Prefer \`auth()\` in Server Components / Route Handlers; \`signIn\`/\`signOut\` on the client.
`;

export const authAuthjsInstaller: Installer = {
  id: "auth-authjs",
  active: (o) => o.auth === "authjs",
  async run({ projectDir }) {
    await fs.writeFile(
      path.join(projectDir, "src", "lib", "auth.ts"),
      AUTH_TS,
      "utf8",
    );
    await fs.outputFile(
      path.join(projectDir, "src", "app", "api", "auth", "[...nextauth]", "route.ts"),
      ROUTE,
    );
    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "auth.mdc"),
      RULE,
      "utf8",
    );
    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "auth", "authjs.md"),
      `# Auth.js

Stub at \`src/lib/auth.ts\` + \`src/app/api/auth/[...nextauth]/route.ts\`.
Add providers and env secrets (\`AUTH_SECRET\`, provider keys) before production.
`,
    );

    await addDependencies(projectDir, {
      "next-auth": "^5.0.0-beta.25",
    });
  },
};
