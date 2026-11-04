# TanStack Query

`QueryProvider` wraps the root layout (`src/providers/query-provider.tsx`).

- Use `useQuery` / `useMutation` for client data.
- Prefer generated endpoint modules + query-key factories when OpenAPI codegen is enabled.
- Keep Server Components for RSC-friendly fetches when you do not need client cache.
