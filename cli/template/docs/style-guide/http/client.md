# HTTP client

Base helper: `src/lib/http.ts` → `apiFetch`.

- Builds URLs from `NEXT_PUBLIC_API_URL`
- Expects JSON
- Throws on non-OK responses

When the **django envelope** option is enabled (installer TBD), responses shaped like `{ result, errors, … }` will be unwrapped in `src/utils/` (axios / envelope helpers) so route UI never parses envelopes by hand.
