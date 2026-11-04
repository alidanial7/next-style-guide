#!/usr/bin/env bash
# Generate apps and assert agent-surface / tokens / optional installers.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${SMOKE_OUT:-$ROOT/_gen_smoke}"
NAME="SmokeApp"
NAME_OPTS="SmokeOpts"
NAME_MUI="SmokeMui"

rm -rf "$OUT"
mkdir -p "$OUT"
cd "$OUT"

pass=0
fail=0

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
  if rg -F -q "$pattern" "$path"; then
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
  if rg -F -q "$pattern" "$path"; then
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

echo "==> Scaffold $NAME (defaults: plain CSS + zod)"
cd "$OUT"
node "$ROOT/cli/dist/index.js" "$NAME" --yes --no-install

APP="$OUT/$NAME"

assert_file "$APP/package.json"
assert_grep '"next": "16.4.5"' "$APP/package.json"
assert_grep "zod" "$APP/package.json"
assert_file "$APP/.cursor/rules/validation.mdc"
assert_grep "Zod" "$APP/.cursor/rules/validation.mdc"
assert_file "$APP/src/lib/validations/.gitkeep"
assert_missing "$APP/postcss.config.mjs"
assert_missing "$APP/components.json"
assert_missing "$APP/src/providers/mui-provider.tsx"
assert_grep "Plain CSS" "$APP/src/app/_components/welcome-card/index.tsx"
assert_grep "Validation: zod" "$APP/src/app/_components/welcome-card/index.tsx"

echo "==> Scaffold $NAME_OPTS (tailwind + shadcn + yup)"
cd "$OUT"
node "$ROOT/cli/dist/index.js" "$NAME_OPTS" --yes --no-install \
  --styling tailwind --shadcn --validation yup --icons lucide \
  --no-endpoints --no-eslint --no-prettier --no-husky --no-ci

OPTS="$OUT/$NAME_OPTS"

assert_file "$OPTS/postcss.config.mjs"
assert_file "$OPTS/components.json"
assert_file "$OPTS/.cursor/rules/tailwind.mdc"
assert_file "$OPTS/.cursor/rules/shadcn.mdc"
assert_file "$OPTS/.cursor/rules/validation.mdc"
assert_grep "yup" "$OPTS/package.json"
assert_not_grep '"zod"' "$OPTS/package.json"
assert_grep "from \"yup\"" "$OPTS/src/lib/env.ts"
assert_grep "Yup" "$OPTS/.cursor/rules/forms.mdc"
assert_grep "Tailwind + shadcn" "$OPTS/src/app/_components/welcome-card/index.tsx"

echo "==> Scaffold $NAME_MUI (mui forces no shadcn)"
cd "$OUT"
node "$ROOT/cli/dist/index.js" "$NAME_MUI" --yes --no-install \
  --styling mui --shadcn --validation zod \
  --no-endpoints --no-eslint --no-prettier --no-husky --no-ci

MUI="$OUT/$NAME_MUI"

assert_file "$MUI/src/providers/mui-provider.tsx"
assert_file "$MUI/.cursor/rules/mui.mdc"
assert_grep "MuiProvider" "$MUI/src/app/layout.tsx"
assert_missing "$MUI/components.json"
assert_missing "$MUI/.cursor/rules/shadcn.mdc"
assert_grep "MUI" "$MUI/src/app/_components/welcome-card/index.tsx"

echo
echo "Smoke results: $pass passed, $fail failed"
if [[ "$fail" -gt 0 ]]; then
  exit 1
fi
echo "All smoke asserts passed. Output under $OUT"
