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
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
});
`;

const ROUTE = `import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
`;

const PROXY = `import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicPaths = ["/login", "/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(\`\${p}/\`),
  );

  if (!req.auth && !isPublic) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (req.auth && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
`;

const LOGIN_PAGE = `import { Suspense } from "react";

import { LoginForm } from "@/app/login/_components/login-form";

export default function LoginPage() {
  return (
    <section className="hero">
      <h1>Sign in</h1>
      <p>Auth.js Credentials demo — replace authorize with your API.</p>
      <Suspense fallback={<p>Loading…</p>}>
        <LoginForm />
      </Suspense>
    </section>
  );
}
`;

const LOGIN_FORM = `"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirect: false,
    });
    setPending(false);
    if (result?.error) {
      setError("Invalid credentials");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card" style={{ marginTop: "1.5rem" }}>
      <label style={{ display: "grid", gap: "0.35rem", marginBottom: "0.75rem" }}>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label style={{ display: "grid", gap: "0.35rem", marginBottom: "0.75rem" }}>
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </label>
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
`;

const RULE = `---
description: Auth.js (NextAuth) conventions
globs: src/lib/auth.ts,src/app/api/auth/**/*,src/proxy.ts,src/app/**/login/**
alwaysApply: false
---

# Auth.js

- Config: \`src/lib/auth.ts\` (Credentials demo — replace \`authorize\`).
- Route handlers: \`src/app/api/auth/[...nextauth]/route.ts\`.
- Proxy: \`src/proxy.ts\` protects non-public routes; public: \`/login\`, \`/api/auth\`.
- Login UI: \`src/app/login/\` (or \`src/app/[locale]/login/\` when i18n is on).
- With i18n: proxy is composed (next-intl + auth) by the i18n installer — locale-prefixed public paths like \`/en/login\`.
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
      path.join(projectDir, "src", "proxy.ts"),
      PROXY,
      "utf8",
    );
    await fs.remove(path.join(projectDir, "src", "middleware.ts"));
    await fs.outputFile(
      path.join(projectDir, "src", "app", "login", "page.tsx"),
      LOGIN_PAGE,
    );
    await fs.outputFile(
      path.join(
        projectDir,
        "src",
        "app",
        "login",
        "_components",
        "login-form",
        "index.tsx",
      ),
      LOGIN_FORM,
    );
    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "auth.mdc"),
      RULE,
      "utf8",
    );
    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "auth", "authjs.md"),
      `# Auth.js

- \`src/lib/auth.ts\` — Credentials demo (replace \`authorize\`)
- \`src/app/api/auth/[...nextauth]/route.ts\`
- \`src/proxy.ts\` — protect routes; public \`/login\` + \`/api/auth\`
- \`src/app/login/\` — sample login page (\`[locale]/login\` when i18n)
- With i18n: intl+auth proxy composition; prefer locale-aware navigation for post-login redirects
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
