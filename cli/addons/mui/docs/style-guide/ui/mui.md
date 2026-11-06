# MUI

Theme is split under `src/theme/` (palette · typography · breakpoints · components) and composed in `theme.ts`.

- Provider: `src/providers/mui-provider.tsx` → `AppRouterCacheProvider` + `ThemeProvider` + `CssBaseline`
- Wired through `AppProviders`
- Prefer MUI primitives (`Button`, `TextField`, `Stack`, …) over ad-hoc CSS
- Extend `theme-components.ts` for design-system overrides; keep product pages free of one-off `sx` sprawl
