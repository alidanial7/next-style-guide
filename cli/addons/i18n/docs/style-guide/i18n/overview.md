# i18n

next-intl **v4+** with locale-based routing (standard App Router setup):

| Piece | Path |
|-------|------|
| Routing | `src/i18n/routing.ts` (`en` · `fa`) |
| Request | `src/i18n/request.ts` (`timeZone: "UTC"`) |
| Navigation | `src/i18n/navigation.ts` |
| Proxy | `src/proxy.ts` |
| Messages | `messages/<locale>.json` |
| Routes | `src/app/[locale]/…` |
| Sample switcher | `src/app/_components/locale-switcher/` |

Plugin: `createNextIntlPlugin("./src/i18n/request.ts")` in `next.config.ts`.

## Agent conventions

- Prefer `@/i18n/navigation` (`Link`, `useRouter`, `usePathname`) over `next/link` / `next/navigation`.
- Prefer `getTranslations` (Server) / `useTranslations` (Client) for UI copy — avoid hardcoded strings when a key exists.
- Keep homepage samples in `src/app/_components/` (shared across locales); put **routes** under `[locale]/`.
- Leave `api/`, `globals.css`, `sitemap.ts`, `robots.ts` at `src/app/` (not under `[locale]`).
- Pass `locale` + `messages` + `timeZone` into client `AppProviders` (no server→client inheritance under a Client Component).
- With Auth.js: proxy is composed (intl + auth); login lives at `src/app/[locale]/login/`.

Requires Next.js 15.3+ / 16 — do not use next-intl v3 (breaks Turbopack config).
