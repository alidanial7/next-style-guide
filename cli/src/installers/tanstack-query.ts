import fs from "fs-extra";
import path from "node:path";

import { addDependencies } from "../helpers/package-json.js";
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
globs: "src/**/*.{ts,tsx}"
alwaysApply: false
---

# TanStack Query

- Wrap the app with \`QueryProvider\` from \`src/providers/query-provider.tsx\` (already in root layout).
- Prefer \`useQuery\` / \`useMutation\` for client data; keep Server Components for RSC-friendly fetches.
- Avoid ad-hoc string query keys — centralize keys next to the fetch helper when you add endpoints.
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

    if (!layout.includes("QueryProvider")) {
      layout = layout.replace(
        'import "./globals.css";\n',
        'import "./globals.css";\n\nimport { QueryProvider } from "@/providers/query-provider";\n',
      );
      layout = layout.replace(
        "<main>{children}</main>",
        "<QueryProvider>\n          <main>{children}</main>\n        </QueryProvider>",
      );
      await fs.writeFile(layoutPath, layout, "utf8");
    }

    const ruleDir = path.join(projectDir, ".cursor", "rules");
    await fs.ensureDir(ruleDir);
    await fs.writeFile(
      path.join(ruleDir, "tanstack-query.mdc"),
      RULE,
      "utf8",
    );
  },
};
