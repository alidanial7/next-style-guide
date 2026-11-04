# Husky + lint-staged

Pre-commit runs `pnpm lint-staged` (Prettier → ESLint).

| Path | Role |
|------|------|
| `.husky/pre-commit` | Hook entry |
| `.prettierrc` | Prettier config |
| `package.json` → `lint-staged` | Globs |

`prepare`: `husky` — runs after `pnpm install`.
