# Project structure

Lean App Router layout. Installers only add folders they need (e.g. `stores/`, `endpoints/`).

```text
smokecompose/
├── src/
│   ├── app/                      # routes + layouts (thin)
│   │   ├── _components/          # layout / homepage UI
│   │   └── <route>/_components/  # route-only UI (folder-per-component)
│   ├── components/               # shared UI (≥2 routes); ui/ for primitives
│   ├── lib/                      # env, http, cn, seo, …
│   ├── utils/                    # API helpers (axios, errors, tokens, …)
│   ├── providers/                # client providers (Query, theme, Redux, …)
│   ├── stores/                   # client store slices (Zustand / Redux) — when enabled
│   ├── hooks/                    # shared hooks
│   ├── types/                    # shared types
│   └── constants/                # shared constants
├── docs/style-guide/             # conventions that match enabled options
├── AGENTS.md
├── .cursor/rules/                # glob-scoped agent rules
├── .env.example
└── package.json
```

## Placement rules

| What | Where |
|------|--------|
| One route only | `src/app/<route>/_components/<name>/index.tsx` |
| Layout / home chrome | `src/app/_components/<name>/` |
| Shared across ≥2 routes | `src/components/` |
| Env / pure helpers | `src/lib/` |
| HTTP / API adapters | `src/utils/` (or generated `src/endpoints/`) |
| Client global state | `src/stores/` |
| Client providers | `src/providers/` |
