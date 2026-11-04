#!/usr/bin/env bash
# Generate apps and assert agent-surface / tokens / optional installers.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${SMOKE_OUT:-$ROOT/_gen_smoke}"
NAME="SmokeApp"
NAME_OPTS="SmokeOpts"

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

echo "==> Scaffold $NAME (defaults: endpoints+husky, no install)"
cd "$OUT"
node "$ROOT/cli/dist/index.js" "$NAME" --yes --no-install

APP="$OUT/$NAME"

assert_file "$APP/package.json"
assert_file "$APP/src/app/page.tsx"
assert_file "$APP/src/app/_components/welcome-card/index.tsx"
assert_file "$APP/src/lib/http.ts"
assert_file "$APP/AGENTS.md"
assert_file "$APP/.cursor/rules/core.mdc"
assert_file "$APP/docs/style-guide/README.md"

assert_grep '"name": "smokeapp"' "$APP/package.json"
assert_grep "SmokeApp" "$APP/src/app/page.tsx"
assert_not_grep "__PROJECT_NAME__" "$APP/src/app/page.tsx"
assert_not_grep "__PROJECT_SLUG__" "$APP/package.json"
assert_not_grep "src/features/" "$APP/AGENTS.md"

# defaults: endpoints + husky on; query/icons off
assert_file "$APP/scripts/generate-endpoints.ts"
assert_file "$APP/src/endpoints/Types.ts"
assert_file "$APP/src/utils/axios-instance.ts"
assert_file "$APP/.cursor/rules/endpoints.mdc"
assert_file "$APP/docs/style-guide/http/endpoints.md"
assert_grep "endpoints:generate" "$APP/package.json"
assert_grep "axios" "$APP/package.json"

assert_file "$APP/.husky/pre-commit"
assert_file "$APP/.prettierrc"
assert_file "$APP/docs/style-guide/tooling/husky.md"
assert_grep '"prepare": "husky"' "$APP/package.json"

assert_missing "$APP/src/providers/query-provider.tsx"
assert_missing "$APP/.cursor/rules/icons.mdc"
assert_missing "$APP/.cursor/rules/tanstack-query.mdc"
assert_not_grep "@tanstack/react-query" "$APP/package.json"
assert_grep "OpenAPI endpoints codegen" "$APP/src/app/_components/welcome-card/index.tsx"
assert_grep "Husky + lint-staged" "$APP/src/app/_components/welcome-card/index.tsx"
assert_grep "OpenAPI endpoints" "$APP/docs/style-guide/README.md"

echo "==> Scaffold $NAME_OPTS (tabler + query; lean hooks off)"
cd "$OUT"
node "$ROOT/cli/dist/index.js" "$NAME_OPTS" --yes --no-install \
  --icons tabler --tanstack-query --no-endpoints --no-husky

OPTS="$OUT/$NAME_OPTS"

assert_file "$OPTS/src/providers/query-provider.tsx"
assert_file "$OPTS/.cursor/rules/icons.mdc"
assert_file "$OPTS/.cursor/rules/tanstack-query.mdc"
assert_file "$OPTS/docs/style-guide/data/tanstack-query.md"
assert_file "$OPTS/docs/style-guide/ui/icons.md"
assert_grep "@tanstack/react-query" "$OPTS/package.json"
assert_grep "@tabler/icons-react" "$OPTS/package.json"
assert_grep "QueryProvider" "$OPTS/src/app/layout.tsx"
assert_grep "TanStack Query" "$OPTS/docs/style-guide/README.md"
assert_grep "Icons" "$OPTS/docs/style-guide/README.md"
assert_missing "$OPTS/scripts/generate-endpoints.ts"
assert_missing "$OPTS/.husky/pre-commit"
assert_not_grep "OpenAPI endpoints" "$OPTS/docs/style-guide/README.md"

echo
echo "Smoke results: $pass passed, $fail failed"
if [[ "$fail" -gt 0 ]]; then
  exit 1
fi
echo "All smoke asserts passed. Output under $OUT"
