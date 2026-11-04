# HTTP client

Base helper: `src/lib/http.ts` → `apiFetch`.

- Builds URLs from `NEXT_PUBLIC_API_URL`
- Expects JSON
- Throws on non-OK responses

When **endpoints** / axios helpers are enabled, prefer generated clients and `unwrapApiResult` for `{ result, status, success, messages }` responses so route UI never parses envelopes by hand.
