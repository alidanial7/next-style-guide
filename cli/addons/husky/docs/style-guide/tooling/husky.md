# Husky + lint-staged

Pre-commit runs `pnpm lint-staged` (Prettier and/or ESLint — whatever was enabled at scaffold).

| Path | Role |
|------|------|
| `.husky/pre-commit` | Hook entry |
| `package.json` → `lint-staged` | Globs |

`prepare`: `husky` — runs after `pnpm install`.
