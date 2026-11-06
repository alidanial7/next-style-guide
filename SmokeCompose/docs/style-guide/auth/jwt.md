# JWT auth

- `src/utils/token-storage.ts` — access/refresh in localStorage
- When endpoints are enabled, `axios-instance` attaches Bearer and refreshes on 401 via `POST /auth/refresh/`
