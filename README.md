<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" width="72" alt="Next.js" />
</p>

<h1 align="center">Next Style Guide</h1>

<p align="center">
  <strong>Ship an opinionated Next.js app in minutes</strong><br/>
  App Router · route-colocated _components/ · Zod/Yup · Cursor rules · docs that match the code
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/create-next-style-guide"><img src="https://img.shields.io/npm/v/create-next-style-guide?style=for-the-badge&label=npm&color=CB3837" alt="npm" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node-%3E%3D20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node" /></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-2ea44f?style=for-the-badge" alt="License" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/pnpm-workspace-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm" />
  <a href="https://www.npmjs.com/package/create-next-style-guide"><img src="https://img.shields.io/badge/CLI-create--next--style--guide-111827?style=flat-square" alt="CLI" /></a>
</p>

---

Opinionated **Next.js** scaffold CLI: lean App Router layout, feature installers, agent rules, and docs that match what you enabled.

> Toggle options at create time — unused files and rules are not left behind.

---

## ✨ Why this template

| | | |
|:---:|:---|:---|
| 🏗️ | **App-colocated layout** | Thin routes · `_components/` per route · shared `components/` + `lib/` |
| 🎛️ | **Feature installers** | Flip options; prune what you did not pick |
| 🤖 | **Agent-ready** | Slim `AGENTS.md` + glob-scoped `.cursor/rules/` |
| 📚 | **Docs that match the code** | Generated `docs/style-guide/` |

---

## 🚀 Quick start

```bash
pnpm create next-style-guide
# or
npx create-next-style-guide@latest
```

Interactive prompts, or skip with a preset:

```bash
npx create-next-style-guide@latest my-app --yes --preset api-app
npx create-next-style-guide@latest shop --yes --preset marketing
npx create-next-style-guide@latest admin --yes --preset dashboard

# into the current directory (empty / only .git · README · LICENSE …)
mkdir my-app && cd my-app
npx create-next-style-guide@latest . --yes --preset minimal
```

### Presets

| Preset | Focus |
|:---|:---|
| `minimal` | Base App Router only |
| `api-app` | Tailwind · shadcn:starter · dark · JWT · Query · Zustand · endpoints · Vitest · CI |
| `marketing` | Tailwind · shadcn:minimal · dark · SEO · i18n · Vercel · Vitest · CI |
| `dashboard` | Tailwind · shadcn:starter · dark · Query · Zustand (no endpoints) · Vitest · CI |
| `mui-app` | MUI · dark · dir=both · Query · Zustand · Vitest · CI |
| `custom` | Answer every prompt (default in interactive mode) |

---

## 📦 What you get

```text
my-app/
├── src/
│   ├── app/                 # App Router + _components/
│   ├── components/          # shared UI (≥2 routes)
│   ├── lib/                 # env + helpers
│   ├── utils/ · providers/ · hooks/ · types/ · constants/
├── docs/style-guide/
├── AGENTS.md
├── .cursor/rules/
└── …
```

### Options

| | Choice |
|:---:|:---|
| 🎛️ | Preset: `minimal` / `api-app` / `marketing` / `dashboard` / `custom` |
| 📦 | Package manager: `pnpm` / `npm` / `yarn` |
| 🎨 | Styling: `none` / `tailwind` / `mui` |
| 🧩 | shadcn (Tailwind only): `minimal` (button) / `starter` (button · input · card · dialog) |
| ✅ | Validation: `none` / `zod` / `yup` |
| 🔑 | Auth: `none` / `jwt` / `authjs` |
| 🗃️ | Client store: `none` / `zustand` / `redux` |
| 🌙 | Dark mode (next-themes; Tailwind \`dark:\` or MUI palette) |
| ↔️ | Direction: `ltr` / `rtl` / `both` (hook `useDirection` · sample toggle when both) |
| ✨ | Icons: `none` / `lucide` / `tabler` (shadcn forces lucide unless tabler) |
| 📡 | TanStack Query |
| 🔌 | OpenAPI endpoints codegen |
| 📨 | API envelope unwrap |
| 🐳 | Docker Compose local API stub (JWT + endpoints; opt-in, on in `api-app`) |
| 🔎 | SEO (public-routes, sitemap, robots) |
| 🌐 | i18n (next-intl) |
| 🧪 | Vitest (+ optional Playwright) |
| 🧹 | Enhanced ESLint / Prettier / Husky (base Next ESLint always) |
| 🚀 | Deploy: `none` / `vercel` / `docker` |
| 🤖 | CI: `none` / `github` (Actions) / `gitlab` (`.gitlab-ci.yml`) |

Flags: `--preset`, `--pm`, `--store`, `--styling`, `--shadcn`, `--shadcn-set`, `--direction`, `--deploy`, `--ci`, `--dark-mode`, `--validation`, `--auth`, `--seo`, `--i18n`, `--testing`, `--playwright`, `--api-envelope`, `--docker-compose`, `--icons`, … (+ `--no-*`).

Default scaffold is a **neutral base** (no endpoints/envelope/store). Use presets for common stacks.

Upgrade an existing app’s agent surface:

```bash
npx create-next-style-guide upgrade --diff .
npx create-next-style-guide upgrade --apply .
```

Walkthrough: [`docs/examples/api-app-crud.md`](docs/examples/api-app-crud.md).

---

## 🗂️ Repo layout

```text
next-style-guide/
├── cli/                     # create-next-style-guide
│   ├── src/                 # prompts, scaffold, installers
│   ├── template/            # base app
│   └── addons/              # optional feature packs
├── scripts/smoke.sh
├── AGENTS.md
└── VERSION
```

---

## 🛠️ Contributors

```bash
pnpm install
pnpm typecheck
pnpm smoke          # uses rg if available, else grep
```

Local CLI without publishing:

```bash
pnpm --filter create-next-style-guide build
node cli/dist/index.js my-app --yes --no-install
# or
pnpm --filter create-next-style-guide dev
```

See [`AGENTS.md`](AGENTS.md).

---

## 🚢 Release (npm via GitHub Actions)

Latest on npm: [`create-next-style-guide`](https://www.npmjs.com/package/create-next-style-guide) — version tracked in [`VERSION`](VERSION).

Pushing a version tag publishes the package.

1. **Secret once:** GitHub repo → Settings → Secrets and variables → Actions → `NPM_TOKEN`  
   Create a [granular npm token](https://www.npmjs.com/settings/~/tokens) with **Read and write** + **Bypass 2FA** for publish.
2. Commit your changes on `main`.
3. Tag and push (semver after current `VERSION`):

```bash
# example: VERSION is 0.1.4 → next tag
git tag v0.1.5
git push origin v0.1.5
```

Workflow [`.github/workflows/publish.yml`](.github/workflows/publish.yml) runs typecheck + smoke, publishes, then commits `VERSION` + root/`cli` `package.json` back to `main`. On pack/publish, root `README.md` + `LICENSE` are copied into `cli/` so the [npm package page](https://www.npmjs.com/package/create-next-style-guide) shows the same docs.

Tag format: `v` + semver (`v0.1.5`, `v1.0.0-beta.1`, …).

---

## 🤝 Contributing

Issues and PRs → [github.com/alidanial7/next-style-guide](https://github.com/alidanial7/next-style-guide)

## 📄 License

MIT
