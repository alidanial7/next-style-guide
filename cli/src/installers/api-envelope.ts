import fs from "fs-extra";
import path from "node:path";

import type { Installer } from "./types.js";

const HTTP_ENVELOPE = `import { env } from "@/lib/env";

type ApiEnvelope<T> = {
  result?: T;
  status?: number;
  success?: boolean;
  messages?: unknown;
};

function unwrapEnvelope<T>(data: unknown): T {
  if (data && typeof data === "object" && "result" in data) {
    const result = (data as ApiEnvelope<T>).result;
    if (result !== undefined && result !== null) {
      return result;
    }
  }
  return data as T;
}

/**
 * JSON fetch helper that unwraps \`{ result, status, success, messages }\` envelopes.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = path.startsWith("http")
    ? path
    : \`\${env.NEXT_PUBLIC_API_URL.replace(/\\/$/, "")}/\${path.replace(/^\\//, "")}\`;

  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(\`API \${response.status}: \${response.statusText}\`);
  }

  const json: unknown = await response.json();
  return unwrapEnvelope<T>(json);
}
`;

const RULE = `---
description: API envelope unwrap for apiFetch
globs: src/lib/http.ts
alwaysApply: false
---

# API envelope

\`apiFetch\` unwraps \`{ result, status, success, messages }\` when present.
Prefer generated \`src/endpoints/*\` + axios when endpoints codegen is enabled.
`;

export const apiEnvelopeInstaller: Installer = {
  id: "api-envelope",
  active: (o) => o.apiEnvelope,
  async run({ projectDir, options }) {
    // When endpoints are on, axios path uses unwrapApiResult; still upgrade http.ts for RSC fetch.
    await fs.writeFile(
      path.join(projectDir, "src", "lib", "http.ts"),
      HTTP_ENVELOPE,
      "utf8",
    );
    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "api-envelope.mdc"),
      RULE,
      "utf8",
    );
    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "http", "envelope.md"),
      `# API envelope

\`src/lib/http.ts\` → \`apiFetch\` unwraps \`result\` from standard envelopes.
${options.endpoints ? "Endpoints/axios: use `unwrapApiResult` from `@/utils/api-result`.\n" : ""}
`,
    );
  },
};
