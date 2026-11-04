<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" width="72" alt="Next.js" />
</p>

<h1 align="center">Next Style Guide</h1>

<p align="center">
  <strong>Ship an opinionated Next.js app in minutes</strong><br/>
  App Router · route-colocated _components/ · Zod env · Cursor rules · docs that match the code
</p>

<p align="center">
  <a href="VERSION"><img src="https://img.shields.io/badge/template-0.1.0-000000?style=for-the-badge" alt="Version" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node-%3E%3D20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node" /></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-2ea44f?style=for-the-badge" alt="License" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/CLI-T3--style-7C3AED?style=flat-square" alt="T3-style CLI" />
  <img src="https://img.shields.io/badge/pnpm-workspace-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm" />
  <a href="https://github.com/alidanial7/django-style-guide"><img src="https://img.shields.io/badge/companion-django--style--guide-092E20?style=flat-square&logo=django&logoColor=white" alt="django-style-guide" /></a>
</p>

---

Frontend twin of [django-style-guide](https://github.com/alidanial7/django-style-guide): a **create-t3-app–style CLI** that scaffolds a lean Next.js app with conventions, agent rules, and docs baked in.

> 🚧 **In progress** — icons · TanStack Query · OpenAPI endpoints · Husky prompts work today. Auth / shadcn / i18n next.

---

## ✨ Why this template

| | | |
|:---:|:---|:---|
| 🏗️ | **App-colocated layout** | Thin routes · `_components/` per route · shared `components/` + `lib/` |
| 🎛️ | **T3-style installers** | Flip options later; unused files get pruned |
| 🤖 | **Agent-ready** | Slim `AGENTS.md` + glob-scoped `.cursor/rules/` |
| 📚 | **Docs that match the code** | Generated `docs/style-guide/` |
| 🔗 | **Django-friendly** | Optional envelope client (wired next) for the companion API template |

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
# → prompts, then scaffold into cwd
```

### After publish (planned)

```bash
pnpm create next-style-guide
# or
npx create-next-style-guide@latest
```

### Non-interactive (CI / smoke)

```bash
node cli/dist/index.js SmokeApp --yes --no-install
```

---

## 📦 What you get

```text
my-app/
├── src/
│   ├── app/                 # App Router (thin) + _components/
│   ├── components/          # shared UI (≥2 routes)
│   ├── lib/                 # env (Zod) + http + cn
│   ├── utils/ · providers/ · hooks/ · types/ · constants/
├── docs/style-guide/
├── AGENTS.md
├── .cursor/rules/
└── …
```

### 🎛️ Options

| | Flag | Status |
|:---:|:---|:---|
| ✨ | Icons (`none` / `lucide` / `tabler`) | prompted + installer |
| 📡 | TanStack Query | prompted + installer |
| 🔌 | OpenAPI endpoints codegen | prompted + installer (default on) |
| 🐶 | Husky + lint-staged + Prettier | prompted + installer (default on) |
| 🔑 | Auth (`none` / `django-jwt` / `authjs`) | stubbed in types |
| 🎨 | UI (`none` / `shadcn`) | stubbed |
| 🌍 | i18n | stubbed |
| 🔗 | Django envelope client | default on (installer TBD) |
| 🧪 | Vitest + Playwright | stubbed |
| 🤖 | GitHub Actions CI | stubbed |

Choice-aware output: homepage + `docs/style-guide/` index/pages match the selected options.

CLI flags: `--icons …`, `--tanstack-query` / `--no-tanstack-query`, `--endpoints` / `--no-endpoints`, `--husky` / `--no-husky`.

---

## 🗂️ Repo layout

```text
next-style-guide/
├── cli/                     # publishable create-next-style-guide
│   ├── src/                 # prompts, scaffold, installers
│   └── template/            # Next.js base copied into new apps
├── scripts/smoke.sh
├── AGENTS.md                # contributors to THIS repo
└── VERSION
```

---

## 🛠️ Contributors

```bash
pnpm install
pnpm typecheck
pnpm smoke          # needs ripgrep (rg)
```

See [`AGENTS.md`](AGENTS.md) for installer / prune conventions.

---

## 🤝 Contributing

Issues and PRs → [github.com/alidanial7/next-style-guide](https://github.com/alidanial7/next-style-guide)

## 📄 License

MIT
