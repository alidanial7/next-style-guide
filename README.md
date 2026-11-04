<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" width="72" alt="Next.js" />
</p>

<h1 align="center">Next Style Guide</h1>

<p align="center">
  <strong>Ship an opinionated Next.js app in minutes</strong><br/>
  App Router · route-colocated _components/ · Zod/Yup · Cursor rules · docs that match the code
</p>

<p align="center">
  <a href="VERSION"><img src="https://img.shields.io/badge/template-0.1.0-000000?style=for-the-badge" alt="Version" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node-%3E%3D20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node" /></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-2ea44f?style=for-the-badge" alt="License" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/pnpm-workspace-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/CLI-create--next--style--guide-111827?style=flat-square" alt="CLI" />
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

### From this repo (dev)

```bash
pnpm install
pnpm --filter create-next-style-guide build
node cli/dist/index.js my-app
```

Or without building:

```bash
pnpm install
pnpm --filter create-next-style-guide dev
```

### After publish (planned)

```bash
pnpm create next-style-guide
# or
npx create-next-style-guide@latest
```

### Non-interactive

```bash
node cli/dist/index.js SmokeApp --yes --no-install
node cli/dist/index.js ApiApp --yes --preset api-app --no-install
```

### Presets

| Preset | Focus |
|:---|:---|
| `minimal` | Base App Router only |
| `api-app` | Tailwind · shadcn · JWT · Query · endpoints · Vitest · CI |
| `marketing` | Tailwind · shadcn · SEO · i18n · Vitest · CI |
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
| 🎛️ | Preset: `minimal` / `api-app` / `marketing` / `custom` |
| 📦 | Package manager: `pnpm` / `npm` / `yarn` |
| 🎨 | Styling: `none` / `tailwind` / `mui` |
| 🧩 | shadcn (Tailwind only) |
| ✅ | Validation: `zod` / `yup` |
| 🔑 | Auth: `none` / `jwt` / `authjs` |
| 🗃️ | Client store: `none` / `zustand` / `redux` |
| ✨ | Icons: `none` / `lucide` / `tabler` |
| 📡 | TanStack Query |
| 🔌 | OpenAPI endpoints codegen |
| 📨 | API envelope unwrap |
| 🔎 | SEO (public-routes, sitemap, robots) |
| 🌐 | i18n (next-intl) |
| 🧪 | Vitest (+ optional Playwright) |
| 🧹 | ESLint / Prettier / Husky |
| 🐳 | Docker |
| 🤖 | GitHub Actions CI |

Flags: `--preset`, `--pm`, `--store`, `--styling`, `--shadcn`, `--validation`, `--auth`, `--seo`, `--i18n`, `--testing`, `--playwright`, `--api-envelope`, `--icons`, … (+ `--no-*`).

Default scaffold is a **neutral base** (no endpoints/envelope/store). Use `--preset api-app` or `--preset marketing` for common stacks.

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
pnpm smoke          # needs ripgrep (rg)
```

See [`AGENTS.md`](AGENTS.md).

---

## 🤝 Contributing

Issues and PRs → [github.com/alidanial7/next-style-guide](https://github.com/alidanial7/next-style-guide)

## 📄 License

MIT
