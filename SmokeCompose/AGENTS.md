# Agents (SmokeCompose)

Generated from [next-style-guide](https://github.com/alidanial7/next-style-guide).

## Maintenance

Stack-wide → here. Feature detail → `.cursor/rules/*.mdc` (glob-scoped — only load when editing matching files). Don't re-read this file mid-task.

## Stack

App Router · TS strict · Zod/Yup env (`src/lib/env.ts`) · pnpm.
Optional features (Query, store, endpoints, i18n, SEO, tests, Docker, CI, …) exist only when enabled at scaffold.

## Do

- Thin `page.tsx` / `layout.tsx` — UI in folder-per-component `_components/`.
- Route-only → `src/app/<route>/_components/<name>/index.tsx`.
- Layout / home → `src/app/_components/<name>/`.
- Shared (≥2 routes) → `src/components/` (`ui/` flat for shadcn).
- Infra → `src/lib/`; API helpers → `src/utils/`; client state → `src/stores/` (when present).
- Named exports `function Foo()`; default only for Next route files.
- Prefer Server Components; `"use client"` only when needed.
- Single `<main>` in root layout — never nest `<main>` in pages/components.

## Don't

- Park single-route UI in `src/components/`.
- Flat files in `_components/` (use `<name>/index.tsx`).
- Invent a second folder convention without updating this file + `docs/style-guide/`.
- Auto `git commit` / `git push` — leave that to the developer.

## Read when needed

| Task | Open |
|------|------|
| Conventions | `docs/style-guide/README.md` |
| Architecture | `docs/style-guide/overview/architecture.md` |
| Cursor rules | `.cursor/rules/` (glob-scoped) |
