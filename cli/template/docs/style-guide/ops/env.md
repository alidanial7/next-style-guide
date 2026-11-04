# Environment

Validated public env lives in `src/lib/env.ts` (`NEXT_PUBLIC_*` only).

## Templates

| File | Use |
|------|-----|
| `.env.example` | Local development → copy to `.env` |
| `.env.staging.example` | Staging values / CI staging |
| `.env.production.example` | Production checklist (set on the host) |

```bash
cp .env.example .env
```

`.env`, `.env.local`, `.env.*.local` are gitignored. `*.example` files are safe to commit.

## Rules

1. Browser-visible values must use the `NEXT_PUBLIC_` prefix.
2. Secrets (e.g. `AUTH_SECRET`) never go in `NEXT_PUBLIC_*` or client bundles.
3. Staging/production: prefer the host secret store over committed `.env` files.
