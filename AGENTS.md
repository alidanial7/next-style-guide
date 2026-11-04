# Agents (next-style-guide template)

This repo is a **T3-style CLI** that scaffolds Next.js apps. Generated app code lives under `cli/template/`. The publishable package is `cli/` (`create-next-style-guide`).

## Do

- Keep option types in `cli/src/types.ts` in sync with prompts + installers.
- Prefer discrete **installers** (add files/deps) over heavy string templating in TSX.
- Prune unused files when a feature flag is off (mirror django-style-guide `post_gen`).
- Keep generated agent surface slim: `AGENTS.md` + `.cursor/rules/*.mdc` (feature rules removed when option is off).
- Run `pnpm smoke` after scaffold / installer changes.

## Don't

- Invent options without prompts, installer wiring, and a README row.
- Leave feature docs or `.cursor/rules/*` when the feature is disabled.
- Bulk-edit generated `docs/style-guide/` unless changing a convention.
- `git commit` / `git push` unless the user asks.

## Read when needed

| Task | Open |
|------|------|
| CLI entry / prompts | `cli/src/index.ts`, `cli/src/prompts.ts` |
| Copy + replace | `cli/src/scaffold.ts`, `cli/src/helpers/` |
| Feature wiring | `cli/src/installers/` |
| Generated Next app | `cli/template/` |
| Smoke | `scripts/smoke.sh` |
| Version | `VERSION` |
