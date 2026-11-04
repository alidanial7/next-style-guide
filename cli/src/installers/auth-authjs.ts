import fs from "fs-extra";
import path from "node:path";

import { addDependencies } from "../helpers/package-json.js";
import type { Installer } from "./types.js";

const AUTH_TS = `import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Auth.js — Credentials demo provider.
 * Replace \`authorize\` with your API/DB lookup. Set \`AUTH_SECRET\` in env.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        // Demo only — wire to your backend.
        return {
          id: "1",
          email: String(credentials.email),
          name: "Demo User",
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  trustHost: true,
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

- Config: \`src/lib/auth.ts\` (Credentials demo included — replace \`authorize\`).
- Route handlers: \`src/app/api/auth/[...nextauth]/route.ts\`.
- Env: \`AUTH_SECRET\` (required in production).
- Prefer \`auth()\` in Server Components; \`signIn\` / \`signOut\` on the client.
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
      path.join(
        projectDir,
        "src",
        "app",
        "api",
        "auth",
        "[...nextauth]",
        "route.ts",
      ),
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

- \`src/lib/auth.ts\` — Credentials demo provider (replace \`authorize\`)
- \`src/app/api/auth/[...nextauth]/route.ts\`
- Env: \`AUTH_SECRET\`
`,
    );

    const envPath = path.join(projectDir, ".env.example");
    if (await fs.pathExists(envPath)) {
      let env = await fs.readFile(envPath, "utf8");
      if (!env.includes("AUTH_SECRET")) {
        env += `\n# Auth.js — generate with: openssl rand -base64 32\nAUTH_SECRET=\n`;
        await fs.writeFile(envPath, env, "utf8");
      }
    }

    await addDependencies(projectDir, {
      "next-auth": "^5.0.0-beta.25",
    });
  },
};
