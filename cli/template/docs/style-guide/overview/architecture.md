# Architecture

```text
src/app/                      → routes + layouts (thin)
src/app/_components/          → layout / homepage UI only
src/app/[locale]/             → localized routes (when i18n enabled)
src/app/<route>/_components/  → route-only UI
src/i18n/ · messages/         → next-intl wiring (when i18n enabled)
src/components/               → shared UI (≥2 routes) + ui/ primitives
src/lib/                      → env, http, shared helpers
src/utils/                    → API client helpers (when enabled)
src/providers/                → client providers (Query, theme, Redux, …)
src/stores/                   → client global state (Zustand / Redux, when enabled)
src/hooks/ · types/ · constants/
```

## Rules of thumb

1. **Routes orchestrate** — load data, compose colocated `_components`.
2. **Colocate by usage** — one route → that route's `_components/`; two+ routes → `src/components/`.
3. **Reuse before redesign** — use existing shared/UI components or extend them with props; do not rebuild chrome per page.
4. **Server first** — prefer RSC; `"use client"` only at the leaves that need interactivity.
5. **One HTTP doorway** — `src/lib/http.ts` and/or generated `src/endpoints/*` (when enabled). Avoid ad-hoc `fetch` in UI.
6. **Split server cache vs UI state** — When both are enabled: **TanStack Query** owns server/async cache (lists, refetch, mutations). **Zustand/Redux** owns client-only UI/session flags. Do not mirror API lists into the store.
