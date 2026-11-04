# Agents (__PROJECT_NAME__)

Generated from [next-style-guide](https://github.com/alidanial7/next-style-guide).

## Do

- Keep `page.tsx` / `layout.tsx` thin — UI in folder-per-component `_components/`.
- Route-only UI → `src/app/<route>/_components/<name>/index.tsx`.
- Layout / homepage UI → `src/app/_components/<name>/index.tsx`.
- Shared (≥2 routes) → `src/components/` (`ui/` stays flat for shadcn).
- Shared infrastructure in `src/lib/`; API helpers in `src/utils/`.
- Follow `.cursor/rules/` (glob-scoped). Feature rules appear only when that option was enabled.
- Prefer Server Components; add client boundaries only when needed.
- Named exports for components (`function Foo()`); default exports only for Next route files.

## Don't

- Put single-route UI in `src/components/` — colocate under that route's `_components/`.
- Flat files in `_components/` — use `<name>/index.tsx`.
- Call the backend with ad-hoc `fetch` everywhere — go through `src/lib/http.ts` (or the envelope / axios helpers when enabled).
- Invent a second folder convention without updating this file + style-guide docs.

## Read when needed

| Task | Open |
|------|------|
| Conventions index | `docs/style-guide/README.md` |
| Architecture | `docs/style-guide/overview/architecture.md` |
| Cursor rules | `.cursor/rules/` |
