import fs from "fs-extra";
import path from "node:path";

import type { Installer } from "./types.js";

function tokenStorage(slug: string): string {
  const accessKey = `${slug}.accessToken`;
  const refreshKey = `${slug}.refreshToken`;

  return `const ACCESS_TOKEN_KEY = "${accessKey}";
const REFRESH_TOKEN_KEY = "${refreshKey}";

export type AuthTokens = {
  access: string;
  refresh: string;
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens({ access, refresh }: AuthTokens) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
`;
}

const AXIOS_JWT = `import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { unwrapApiResult } from "@/utils/api-result";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/utils/token-storage";

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "";

/** Shared Axios client for \`src/endpoints/*\`. Do not call from UI directly. */
export const api = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.setAuthorization(\`Bearer \${accessToken}\`);
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh || !baseURL) {
    return null;
  }

  try {
    const { data } = await axios.post(\`\${baseURL}/auth/refresh/\`, { refresh });
    const payload = unwrapApiResult<{ access?: string; refresh?: string }>(data);
    const access = payload.access;
    if (!access) {
      clearTokens();
      return null;
    }
    setTokens({ access, refresh: payload.refresh ?? refresh });
    return access;
  } catch {
    clearTokens();
    return null;
  }
}

function shouldSkipRefresh(url: string | undefined) {
  if (!url) return false;
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  );
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;

    if (
      !original ||
      error.response?.status !== 401 ||
      original._retry ||
      shouldSkipRefresh(original.url)
    ) {
      return Promise.reject(error);
    }

    original._retry = true;
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });

    const access = await refreshPromise;
    if (!access) {
      return Promise.reject(error);
    }

    original.headers.setAuthorization(\`Bearer \${access}\`);
    return api(original);
  },
);
`;

const RULE = `---
description: JWT auth (Bearer + refresh) helpers
globs: src/utils/token-storage.ts,src/utils/axios-instance.ts,src/**/*auth*.{ts,tsx}
alwaysApply: false
---

# Auth (JWT)

- Tokens: \`src/utils/token-storage.ts\` (access + refresh in \`localStorage\`).
- Axios: Bearer on requests; 401 → \`/auth/refresh/\` once, then retry.
- Do not store tokens in cookies unless you intentionally change the strategy.
- Login/logout UI should call \`setTokens\` / \`clearTokens\` — never invent a second storage key.
`;

export const authJwtInstaller: Installer = {
  id: "auth-jwt",
  active: (o) => o.auth === "jwt",
  async run({ projectDir, options }) {
    await fs.ensureDir(path.join(projectDir, "src", "utils"));
    await fs.remove(path.join(projectDir, "src", "utils", ".gitkeep"));
    await fs.writeFile(
      path.join(projectDir, "src", "utils", "token-storage.ts"),
      tokenStorage(options.slug),
      "utf8",
    );

    if (options.endpoints) {
      await fs.writeFile(
        path.join(projectDir, "src", "utils", "axios-instance.ts"),
        AXIOS_JWT,
        "utf8",
      );
    }

    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "auth.mdc"),
      RULE,
      "utf8",
    );

    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "auth", "jwt.md"),
      `# JWT auth

- \`src/utils/token-storage.ts\` — access/refresh in localStorage
- When endpoints are enabled, \`axios-instance\` attaches Bearer and refreshes on 401 via \`POST /auth/refresh/\`
`,
    );
  },
};
