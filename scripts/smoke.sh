#!/usr/bin/env bash
# Generate apps and assert agent-surface / tokens / optional installers.
# Ends with a real install + next build for the minimal preset.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${SMOKE_OUT:-$ROOT/_gen_smoke}"
NAME="SmokeApp"
NAME_OPTS="SmokeOpts"
NAME_MUI="SmokeMui"
NAME_AUTH="SmokeAuth"
NAME_AUTHJS="SmokeAuthjs"
NAME_I18N="SmokeI18n"
NAME_STORE="SmokeStore"
NAME_MIN="SmokeMin"
NAME_BUILD="SmokeBuild"

rm -rf "$OUT"
mkdir -p "$OUT"
cd "$OUT"

pass=0
fail=0

# Prefer ripgrep; fall back to grep -F so smoke works without rg installed.
file_contains() {
  local pattern="$1"
  local path="$2"
  if command -v rg >/dev/null 2>&1; then
    rg -F -q "$pattern" "$path"
  else
    grep -F -q "$pattern" "$path"
  fi
}

assert_file() {
  local path="$1"
  if [[ -e "$path" ]]; then
    echo "  OK  exists $path"
    pass=$((pass + 1))
  else
    echo "  FAIL missing $path"
    fail=$((fail + 1))
  fi
}

assert_missing() {
  local path="$1"
  if [[ -e "$path" ]]; then
    echo "  FAIL should not exist $path"
    fail=$((fail + 1))
  else
    echo "  OK  missing $path"
    pass=$((pass + 1))
  fi
}

assert_grep() {
  local pattern="$1"
  local path="$2"
  if file_contains "$pattern" "$path"; then
    echo "  OK  '$pattern' in $path"
    pass=$((pass + 1))
  else
    echo "  FAIL '$pattern' missing in $path"
    fail=$((fail + 1))
  fi
}

assert_not_grep() {
  local pattern="$1"
  local path="$2"
  if file_contains "$pattern" "$path"; then
    echo "  FAIL '$pattern' should not appear in $path"
    fail=$((fail + 1))
  else
    echo "  OK  no '$pattern' in $path"
    pass=$((pass + 1))
  fi
}

echo "==> Building CLI"
cd "$ROOT"
pnpm --filter create-next-style-guide build

echo "==> Scaffold $NAME (defaults — neutral base)"
cd "$OUT"
node "$ROOT/cli/dist/index.js" "$NAME" --yes --no-install

APP="$OUT/$NAME"

assert_file "$APP/package.json"
assert_file "$APP/.gitignore"
assert_missing "$APP/gitignore"
assert_grep '"next": "16.4.5"' "$APP/package.json"
assert_grep "zod" "$APP/package.json"
assert_grep '"packageManager": "pnpm@9.15.0"' "$APP/package.json"
assert_file "$APP/.cursor/rules/validation.mdc"
assert_file "$APP/vitest.config.mts"
assert_missing "$APP/.cursor/rules/api-envelope.mdc"
assert_missing "$APP/src/stores"
assert_not_grep "unwrapEnvelope" "$APP/src/lib/http.ts"
assert_missing "$APP/src/utils/token-storage.ts"
assert_missing "$APP/src/app/sitemap.ts"
assert_grep "Package manager: pnpm" "$APP/src/app/_components/welcome-card/index.tsx"
assert_grep "Auth: none" "$APP/src/app/_components/welcome-card/index.tsx"
assert_grep "No client store" "$APP/src/app/_components/welcome-card/index.tsx"
assert_grep "No SEO helpers" "$APP/src/app/_components/welcome-card/index.tsx"
assert_grep "Vitest" "$APP/src/app/_components/welcome-card/index.tsx"
assert_grep "pnpm" "$APP/AGENTS.md"

echo "==> Scaffold $NAME_OPTS (tailwind + shadcn + yup + npm)"
cd "$OUT"
node "$ROOT/cli/dist/index.js" "$NAME_OPTS" --yes --no-install \
  --pm npm --styling tailwind --shadcn --validation yup --icons lucide \
  --no-endpoints --no-api-envelope --no-testing \
  --no-eslint --no-prettier --no-husky --no-ci

OPTS="$OUT/$NAME_OPTS"

assert_file "$OPTS/components.json"
assert_file "$OPTS/src/components/ui/button.tsx"
assert_grep "yup" "$OPTS/package.json"
assert_not_grep '"zod"' "$OPTS/package.json"
assert_not_grep '"packageManager"' "$OPTS/package.json"
assert_grep "Package manager: npm" "$OPTS/src/app/_components/welcome-card/index.tsx"
assert_missing "$OPTS/vitest.config.mts"
assert_missing "$OPTS/.cursor/rules/api-envelope.mdc"

echo "==> Scaffold $NAME_MUI (mui forces no shadcn)"
cd "$OUT"
node "$ROOT/cli/dist/index.js" "$NAME_MUI" --yes --no-install \
  --styling mui --shadcn --validation zod \
  --no-endpoints --no-api-envelope --no-testing \
  --no-eslint --no-prettier --no-husky --no-ci

MUI="$OUT/$NAME_MUI"

assert_file "$MUI/src/providers/mui-provider.tsx"
assert_missing "$MUI/components.json"

echo "==> Scaffold $NAME_AUTH (jwt + seo + endpoints)"
cd "$OUT"
node "$ROOT/cli/dist/index.js" "$NAME_AUTH" --yes --no-install \
  --auth jwt --seo --endpoints --api-envelope \
  --no-testing --no-eslint --no-prettier --no-husky --no-ci

AUTH="$OUT/$NAME_AUTH"

assert_file "$AUTH/src/utils/token-storage.ts"
assert_file "$AUTH/.cursor/rules/auth.mdc"
assert_grep "smokeauth.accessToken" "$AUTH/src/utils/token-storage.ts"
assert_grep "getAccessToken" "$AUTH/src/utils/axios-instance.ts"
assert_grep "/auth/refresh/" "$AUTH/src/utils/axios-instance.ts"
assert_file "$AUTH/src/lib/seo.ts"
assert_file "$AUTH/src/lib/public-routes.ts"
assert_file "$AUTH/src/app/sitemap.ts"
assert_file "$AUTH/src/app/robots.ts"
assert_file "$AUTH/.cursor/rules/seo.mdc"
assert_grep "Auth: jwt" "$AUTH/src/app/_components/welcome-card/index.tsx"
assert_grep "SEO helpers" "$AUTH/src/app/_components/welcome-card/index.tsx"

echo "==> Scaffold $NAME_AUTHJS (Auth.js)"
cd "$OUT"
node "$ROOT/cli/dist/index.js" "$NAME_AUTHJS" --yes --no-install \
  --auth authjs --no-endpoints --no-api-envelope --no-testing \
  --no-eslint --no-prettier --no-husky --no-ci

AUTHJS="$OUT/$NAME_AUTHJS"

assert_file "$AUTHJS/src/lib/auth.ts"
assert_file "$AUTHJS/src/app/api/auth/[...nextauth]/route.ts"
assert_grep "AUTH_SECRET" "$AUTHJS/.env.example"
assert_grep "Auth: authjs" "$AUTHJS/src/app/_components/welcome-card/index.tsx"

echo "==> Scaffold $NAME_I18N (i18n + testing + playwright)"
cd "$OUT"
node "$ROOT/cli/dist/index.js" "$NAME_I18N" --yes --no-install \
  --i18n --testing --playwright \
  --no-endpoints --no-api-envelope \
  --no-eslint --no-prettier --no-husky --no-ci

I18N="$OUT/$NAME_I18N"

assert_file "$I18N/src/i18n/request.ts"
assert_file "$I18N/messages/en.json"
assert_file "$I18N/.cursor/rules/i18n.mdc"
assert_grep "withNextIntl" "$I18N/next.config.ts"
assert_grep "NextIntlClientProvider" "$I18N/src/app/layout.tsx"
assert_file "$I18N/vitest.config.mts"
assert_file "$I18N/playwright.config.ts"
assert_file "$I18N/e2e/home.spec.ts"
assert_grep "Vitest + Playwright" "$I18N/src/app/_components/welcome-card/index.tsx"

echo "==> Scaffold $NAME_STORE (zustand + redux matrix)"
cd "$OUT"
node "$ROOT/cli/dist/index.js" "$NAME_STORE" --yes --no-install \
  --store zustand --no-endpoints --no-api-envelope --no-testing \
  --no-eslint --no-prettier --no-husky --no-ci

STORE="$OUT/$NAME_STORE"

assert_file "$STORE/src/stores/app-store.ts"
assert_file "$STORE/.cursor/rules/store.mdc"
assert_grep "zustand" "$STORE/package.json"
assert_grep "Client store: zustand" "$STORE/src/app/_components/welcome-card/index.tsx"
assert_missing "$STORE/src/providers/store-provider.tsx"

cd "$OUT"
node "$ROOT/cli/dist/index.js" "SmokeRedux" --yes --no-install \
  --store redux --no-endpoints --no-api-envelope --no-testing \
  --no-eslint --no-prettier --no-husky --no-ci

REDUX="$OUT/SmokeRedux"

assert_file "$REDUX/src/stores/store.ts"
assert_file "$REDUX/src/stores/hooks.ts"
assert_file "$REDUX/src/providers/store-provider.tsx"
assert_grep "StoreProvider" "$REDUX/src/app/layout.tsx"
assert_grep "@reduxjs/toolkit" "$REDUX/package.json"
assert_grep "Client store: redux" "$REDUX/src/app/_components/welcome-card/index.tsx"

echo "==> Scaffold $NAME_MIN (--preset minimal)"
cd "$OUT"
node "$ROOT/cli/dist/index.js" "$NAME_MIN" --yes --no-install --preset minimal

MIN="$OUT/$NAME_MIN"

assert_missing "$MIN/vitest.config.mts"
assert_missing "$MIN/.cursor/rules/api-envelope.mdc"
assert_missing "$MIN/.github/workflows/ci.yml"
assert_missing "$MIN/src/stores"
assert_not_grep "axios" "$MIN/package.json"
assert_grep "No tests" "$MIN/src/app/_components/welcome-card/index.tsx"
assert_grep "No client store" "$MIN/src/app/_components/welcome-card/index.tsx"

echo "==> Real install + build ($NAME_BUILD, preset minimal)"
cd "$OUT"
node "$ROOT/cli/dist/index.js" "$NAME_BUILD" --yes --preset minimal
BUILD="$OUT/$NAME_BUILD"
cd "$BUILD"
if NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  NEXT_PUBLIC_API_URL=http://localhost:8000 \
  pnpm build; then
  echo "  OK  pnpm build succeeded for $NAME_BUILD"
  pass=$((pass + 1))
else
  echo "  FAIL pnpm build failed for $NAME_BUILD"
  fail=$((fail + 1))
fi

echo
echo "Smoke results: $pass passed, $fail failed"
if [[ "$fail" -gt 0 ]]; then
  exit 1
fi
echo "All smoke asserts passed. Output under $OUT"
