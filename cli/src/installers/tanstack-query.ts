import fs from "fs-extra";
import path from "node:path";

import { addDependencies } from "../helpers/package-json.js";
import { wrapLayoutMain } from "../helpers/wrap-layout.js";
import type { Installer } from "./types.js";

const PROVIDER = `"use client";

import { type ReactNode, useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
`;

const RULE = `---
description: TanStack Query conventions
globs: src/providers/**,src/hooks/**,src/endpoints/**,src/**/*query*.{ts,tsx},src/**/use-*.{ts,tsx}
alwaysApply: false
---

# TanStack Query

- \`QueryProvider\` wraps root layout (\`src/providers/query-provider.tsx\`).
- Client data: \`useQuery\` / \`useMutation\`; keep RSC for server-friendly fetches.
- Query keys: use generated \`get<EndpointName>QueryKey(...)\` when endpoints codegen is on — never ad-hoc \`["resource"]\` strings.
- Default hook \`params\` to the matching \`*DefaultParams\` when present.
- Errors: \`getApiErrorMessage\` / field helpers from \`@/utils/api-error\`.
`;

export const tanstackQueryInstaller: Installer = {
  id: "tanstack-query",
  active: (o) => o.data === "tanstack-query",
  async run({ projectDir }) {
    await addDependencies(projectDir, {
      "@tanstack/react-query": "^5.62.8",
    });

    const providersDir = path.join(projectDir, "src", "providers");
    await fs.ensureDir(providersDir);
    await fs.remove(path.join(providersDir, ".gitkeep"));
    await fs.writeFile(
      path.join(providersDir, "query-provider.tsx"),
      PROVIDER,
      "utf8",
    );

    const layoutPath = path.join(projectDir, "src", "app", "layout.tsx");
    let layout = await fs.readFile(layoutPath, "utf8");
    layout = wrapLayoutMain(layout, {
      importStatement:
        'import { QueryProvider } from "@/providers/query-provider";',
      providerName: "QueryProvider",
    });
    await fs.writeFile(layoutPath, layout, "utf8");

    const ruleDir = path.join(projectDir, ".cursor", "rules");
    await fs.ensureDir(ruleDir);
    await fs.writeFile(
      path.join(ruleDir, "tanstack-query.mdc"),
      RULE,
      "utf8",
    );
  },
};
