# Agents (next-style-guide)

This repo is a CLI that scaffolds Next.js apps. Generated app code lives under `cli/template/`. The publishable package is `cli/` (`create-next-style-guide`).

## Do

- Keep option types in `cli/src/types.ts` in sync with prompts + installers.
- Prefer discrete **installers** (add files/deps) over heavy string templating in TSX.
- Prune unused files when a feature flag is off.
- Keep generated agent surface slim: `AGENTS.md` + `.cursor/rules/*.mdc` (feature rules only when the option is on).
- Run `pnpm smoke` after scaffold / installer changes.
- After an npm publish / version tag (`vX.Y.Z`): `VERSION`, root `package.json`, and `cli/package.json` must match that semver (publish workflow commits this back to `main`; if publishing outside CI, sync + commit them yourself). Leave `cli/template/package.json` alone (app seed version).
- Keep the **root** `README.md` as the npm package readme source (`cli/prepack` copies it + `LICENSE` into `cli/` for publish). Do not hand-edit `cli/README.md`.

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
