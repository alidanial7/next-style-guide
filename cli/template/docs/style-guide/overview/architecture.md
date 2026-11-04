# Architecture

```text
src/app/                 → routes + layouts (thin)
src/app/_components/     → layout / homepage UI only
src/app/<route>/_components/ → route-only UI
src/components/          → shared UI (≥2 routes) + ui/ primitives
src/lib/                 → env, http, shared helpers
src/utils/               → API client helpers (axios, errors, …)
src/providers/           → client providers (Query, theme, …)
src/hooks/               → shared hooks
src/types/ · constants/  → shared types / constants
```

## Rules of thumb

1. **Routes orchestrate** — load data, compose colocated `_components`.
2. **Colocate by usage** — one route → that route's `_components/`; two+ routes → `src/components/`.
3. **One HTTP doorway** — use `src/lib/http.ts` (envelope / axios helpers come later as options).
