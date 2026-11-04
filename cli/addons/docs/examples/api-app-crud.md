# Example: tiny CRUD + login flow (`api-app`)

This walkthrough matches the **`api-app`** preset (Tailwind · shadcn · JWT · TanStack Query · Zustand · endpoints · envelope).

## 1. Scaffold

```bash
npx create-next-style-guide@latest inventory --yes --preset api-app
cd inventory
cp .env.example .env
# NEXT_PUBLIC_API_URL=http://localhost:8000
docker compose up -d   # stub API on :8000 — swap for your real backend
```

## 2. Generate endpoints

Point `scripts/endpoints.codegen.json` at your OpenAPI schema, then:

```bash
pnpm endpoints:generate
```

You get typed clients under `src/endpoints/` plus axios helpers that unwrap envelopes.

## 3. Login (JWT)

Store tokens with `src/utils/token-storage.ts`. After your API login:

```ts
import { setTokens } from "@/utils/token-storage";

await setTokens({
  accessToken: result.access,
  refreshToken: result.refresh,
});
```

Axios (`src/utils/axios-instance.ts`) attaches `Authorization` and refreshes on `401`.

## 4. List + create (Query)

```tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getItems, postItems } from "@/endpoints"; // names depend on your schema

export function ItemsPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["items"],
    queryFn: () => getItems(),
  });
  const create = useMutation({
    mutationFn: (body: { name: string }) => postItems(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });

  if (isLoading) return <p>Loading…</p>;
  return (
    <div>
      <ul>{data?.map((item) => <li key={item.id}>{item.name}</li>)}</ul>
      <button
        type="button"
        onClick={() => create.mutate({ name: "New item" })}
      >
        Add
      </button>
    </div>
  );
}
```

Colocate the panel under `src/app/(app)/items/_components/items-panel/`.

## 5. UI state (Zustand)

Keep server lists in Query; use the store for UI-only flags:

```ts
import { useAppStore } from "@/stores/app-store";

const hydrated = useAppStore((s) => s.hydrated);
```

## Conventions checklist

| Concern | Place |
|---------|--------|
| Route UI | `src/app/<route>/_components/<name>/` |
| Shared UI | `src/components/` |
| HTTP | generated `src/endpoints/*` / `apiFetch` |
| Providers | `src/providers/app-providers.tsx` |
| Agent rules | `AGENTS.md` + `.cursor/rules/` |
