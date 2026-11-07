# Agents (__PROJECT_NAME__)

Generated from [next-style-guide](https://github.com/alidanial7/next-style-guide).

## Maintenance

Stack-wide → here. Feature detail → `.cursor/rules/*.mdc` (glob-scoped — only load when editing matching files). Don't re-read this file mid-task.

When you change an app convention, **update the matching `.cursor/rules/*.mdc` and `docs/style-guide/` pages** in the same change so agents do not follow stale guidance.

## Stack

App Router · TS strict · public env via `src/lib/env.ts` · direction via `useDirection()` · __PACKAGE_MANAGER__.
Optional features (validation lib, Query, store, endpoints, i18n, SEO, dark mode, Compose, deploy, tests, CI, …) exist only when enabled at scaffold — see WelcomeCard / `docs/style-guide/README.md`.

## Do

- Thin `page.tsx` / `layout.tsx` — UI in folder-per-component `_components/`.
- **Reuse before redesign**: search existing shared/UI/`_components` first; reuse or extend with props — never rebuild the same chrome per page (see `.cursor/rules/components.mdc`).
- Route-only → `src/app/<route>/_components/<name>/index.tsx`.
- Layout / home → `src/app/_components/<name>/`.
- Shared (≥2 routes) → `src/components/` (`ui/` flat for shadcn).
- Infra → `src/lib/`; API helpers → `src/utils/`; client state → `src/stores/` (when present).
- Named exports `function Foo()`; default only for Next route files.
- Prefer Server Components; `"use client"` only when needed.
- Keep UI components focused (≈150 lines soft cap) — split rather than grow mega-components.
- Single `<main>` in root layout — never nest `<main>` in pages/components.
- Text direction: use `useDirection()` from `@/hooks/use-direction` (do not hardcode `dir` ad hoc).
- If `.cursor/rules/i18n.mdc` exists: routes under `src/app/[locale]/`; use `@/i18n/navigation` + `getTranslations` / `useTranslations` (see that rule).

## Don't

- Redesign page-local copies of existing buttons, fields, cards, headers, dialogs, or layout chrome — extend the shared component instead.
- Park single-route UI in `src/components/`.
- Flat files in `_components/` (use `<name>/index.tsx`).
- Dump unrelated UI/state/fetch into one component file.
- Invent a second folder convention without updating this file + matching `.cursor/rules/*.mdc` + `docs/style-guide/`.
- Auto `git commit` / `git push` — leave that to the developer.

## Read when needed

| Task | Open |
|------|------|
| Conventions | `docs/style-guide/README.md` |
| Architecture | `docs/style-guide/overview/architecture.md` |
| Cursor rules | `.cursor/rules/` (glob-scoped) |
