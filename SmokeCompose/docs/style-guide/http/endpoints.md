# OpenAPI endpoints

Generate typed clients from your Django (or any) OpenAPI schema:

```bash
pnpm endpoints:generate
# optional override:
pnpm endpoints:generate --url=http://localhost:8000/api/docs/schema/?format=json
```

Config: `scripts/endpoints.codegen.json`

| Path | Role |
|------|------|
| `src/endpoints/` | Generated modules (+ hand-written `Types.ts`) |
| `src/utils/axios-instance.ts` | Shared `api` client |
| `src/utils/api-result.ts` | Envelope unwrap |
| `src/utils/api-error.ts` | Error helpers |
| `src/utils/search-params.ts` / `form-data.ts` | Codegen helpers |

Do not call `api` from UI — import generated endpoint functions (and wire them through TanStack Query when enabled).
