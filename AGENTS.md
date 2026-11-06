# Agents (next-style-guide)

This repo is a CLI that scaffolds Next.js apps. Generated app code lives under `cli/template/`. The publishable package is `cli/` (`create-next-style-guide`).

## Do

- Keep option types in `cli/src/types.ts` in sync with prompts + installers + CLI flags + README option rows.
- Prefer discrete **installers** (add files/deps) over heavy string templating in TSX.
- Prune unused files when a feature flag is off.
- Keep generated agent surface slim: `AGENTS.md` + `.cursor/rules/*.mdc` (feature rules only when the option is on).
- Run `pnpm smoke` after scaffold / installer changes.
- After an npm publish / version tag (`vX.Y.Z`): `VERSION`, root `package.json`, and `cli/package.json` must match that semver (publish workflow commits this back to `main`; if publishing outside CI, sync + commit them yourself). Leave `cli/template/package.json` alone (app seed version).
- Keep the **root** `README.md` as the npm package readme source (`cli/prepack` copies it + `LICENSE` into `cli/` for publish). Do not hand-edit `cli/README.md`.

### Keep rule file bodies in sync

When a convention, option, or installer behavior changes, **also update the text inside the matching rule files** (not only TypeScript). Future agents will follow stale `.mdc` / `AGENTS.md` copy if you skip this.

| Source of truth for generated rules | Update when… |
|------|------|
| `cli/template/.cursor/rules/*` | Base conventions (core / components / forms seed) change |
| `cli/template/AGENTS.md` | Generated app agent entry changes |
| `cli/addons/**/.cursor/rules/*` | Addon-copied rules change |
| Installer-written strings (e.g. `validation.ts`, `direction.ts`, `docker-compose.ts`, `shadcn.ts`, …) | That feature’s agent guidance changes |
| Root `AGENTS.md` + `.cursor/rules/*.mdc` (this repo) | Maintainer / scaffold CLI guidance changes |

Also refresh related installer-written `docs/style-guide/**` pages when the convention changes.

## Don't

- Invent options without prompts, installer wiring, flags, and a README row.
- Leave feature docs or `.cursor/rules/*` when the feature is disabled.
- Change scaffold behavior without updating the emitted `.mdc` / docs that describe that behavior.
- Bulk-edit generated `docs/style-guide/` unless changing a convention.
- `git commit` / `git push` unless the user asks.

## Scaffold options (keep in sync with `types.ts`)

| Area | Values / notes |
|------|----------------|
| Presets | `minimal` · `api-app` · `marketing` · `dashboard` · `mui-app` · `custom` |
| Package manager | `pnpm` · `npm` · `yarn` |
| Styling | `none` · `tailwind` · `mui` |
| UI | `none` · `shadcn` (Tailwind only); set `minimal` \| `starter` |
| Validation | `none` · `zod` · `yup` |
| Auth | `none` · `jwt` · `authjs` |
| Store | `none` · `zustand` · `redux` |
| Icons | `none` · `lucide` · `tabler` — **shadcn forces lucide** unless tabler |
| Direction | `ltr` · `rtl` · `both` (`useDirection` · sample toggle when both) |
| i18n | next-intl **v4.5+** (never v3 — breaks Next 16 Turbopack config) |
| Dark mode | next-themes (requires Tailwind or MUI) |
| Data | RSC default · optional TanStack Query |
| Endpoints / envelope | OpenAPI codegen · optional unwrap |
| Docker Compose | opt-in local API stub — needs JWT + endpoints (`api-app` on by default) |
| Deploy | `none` · `vercel` · `docker` (prod image; separate from Compose) |
| CI | `none` · `github` (Actions) · `gitlab` (`.gitlab-ci.yml`) |
| Tooling | Enhanced ESLint (base Next ESLint always) · Prettier · Husky · Vitest · Playwright |

Normalize incompatible combos in `normalizeOptions` (`cli/src/types.ts`). Soft warnings: `collectOptionWarnings` (`cli/src/presets.ts`).

## Read when needed

| Task | Open |
|------|------|
| CLI entry / prompts / flags | `cli/src/index.ts`, `cli/src/prompts.ts` |
| Options + normalize | `cli/src/types.ts`, `cli/src/presets.ts` |
| Copy + replace | `cli/src/scaffold.ts`, `cli/src/helpers/` |
| Feature wiring | `cli/src/installers/` |
| Generated Next app | `cli/template/` |
| Addon rule/docs/UI seeds | `cli/addons/` (prefer file seeds over inline installer strings) |
| Endpoints codegen | `cli/addons/endpoints/scripts/` (+ `lib/*`) |
| Smoke | `scripts/smoke.sh` |
| Version | `VERSION` |
