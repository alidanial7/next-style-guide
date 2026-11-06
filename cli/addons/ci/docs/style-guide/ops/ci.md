# CI

Scaffold chooses a provider:

- **GitHub Actions** → `.github/workflows/ci.yml`
- **GitLab CI** → `.gitlab-ci.yml`

Typical steps: install → `typecheck` → `lint` / Prettier check (when enabled) → `test` → `build`.

Triggers: push/`main`/`master` and pull requests (GitHub) or merge requests (GitLab).
