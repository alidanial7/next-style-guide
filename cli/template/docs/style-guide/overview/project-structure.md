# Project structure

Lean App Router layout. Installers only add folders they need (e.g. `stores/`, `endpoints/`).

```text
__PROJECT_SLUG__/
├── src/
│   ├── app/                      # routes + layouts (thin)
│   │   ├── _components/          # layout / homepage UI
│   │   ├── [locale]/             # when i18n — localized pages/layouts
│   │   └── <route>/_components/  # route-only UI (folder-per-component)
│   ├── i18n/                     # when i18n — routing / navigation / request
│   ├── components/               # shared UI (≥2 routes); ui/ for primitives
│   ├── lib/                      # env, http, cn, seo, …
│   ├── utils/                    # API helpers (axios, errors, tokens, …)
│   ├── providers/                # client providers (Query, theme, Redux, …)
│   ├── stores/                   # client store slices (Zustand / Redux) — when enabled
│   ├── hooks/                    # shared hooks
│   ├── types/                    # shared types
│   └── constants/                # shared constants
├── messages/                     # when i18n — <locale>.json
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
| i18n pages (when enabled) | `src/app/[locale]/…` — see `docs/style-guide/i18n/overview.md` |

## Reuse before redesign

Search existing `src/components/`, `ui/`, and `_components/` first. Reuse or extend with props — do not rebuild the same buttons/fields/cards/headers per page. Details: `.cursor/rules/components.mdc`.
