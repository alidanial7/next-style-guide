# CI / CD

GitHub Actions: `.github/workflows/ci.yml`.

Typical steps: checkout → pnpm → install → `typecheck` → `lint` / Prettier check (when enabled) → `build`.

Push to `main`/`master` and pull requests trigger the workflow.
