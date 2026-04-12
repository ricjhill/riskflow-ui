#!/usr/bin/env bash
# Validates documentation freshness with deterministic, grep-able checks.
# Runs in CI on PRs touching docs/config. Same pattern as validate-harness.sh.
#
# Checks:
# 1. CLAUDE.md architecture tree vs actual src/ directories
# 2. CLAUDE.md API endpoint count vs src/api/client.ts export count
# 3. VITE_* env var usage vs .env.example
# 4. Internal markdown link validity
set -euo pipefail
source "$(dirname "$0")/hook-utils.sh"

FAILED=0

# --- 1. Architecture tree ---
_info "checking architecture tree..."

# Extract top-level dir names from CLAUDE.md code block (lines like "  api/")
DOCUMENTED_DIRS=$(sed -n '/^```/,/^```/p' CLAUDE.md | grep -oP '^\s{2}\w[\w-]*/' | sed 's/^ *//' | sort || true)
ACTUAL_DIRS=$(find src/ -mindepth 1 -maxdepth 1 -type d -printf '%f/\n' 2>/dev/null | sort || true)

if [ -z "$DOCUMENTED_DIRS" ] && [ -z "$ACTUAL_DIRS" ]; then
  _info "architecture tree: OK (no dirs)"
else
  MISSING_FROM_FS=$(comm -23 <(echo "$DOCUMENTED_DIRS") <(echo "$ACTUAL_DIRS"))
  MISSING_FROM_DOCS=$(comm -13 <(echo "$DOCUMENTED_DIRS") <(echo "$ACTUAL_DIRS"))

  if [ -n "$MISSING_FROM_FS" ]; then
    while IFS= read -r d; do
      [ -z "$d" ] && continue
      _error "CLAUDE.md lists src/$d but it does not exist"
    done <<< "$MISSING_FROM_FS"
    FAILED=1
  fi

  if [ -n "$MISSING_FROM_DOCS" ]; then
    while IFS= read -r d; do
      [ -z "$d" ] && continue
      _error "src/$d exists but is not documented in CLAUDE.md"
    done <<< "$MISSING_FROM_DOCS"
    FAILED=1
  fi

  if [ "$FAILED" -eq 0 ]; then
    _info "architecture tree: OK"
  fi
fi

# --- 2. API endpoint count vs client exports ---
_info "checking API endpoints..."

EXPORT_COUNT=$(grep -cP '^export (async )?function ' src/api/client.ts 2>/dev/null || echo "0")
ENDPOINT_COUNT=$(grep -cP '^\s+- `(GET|POST|PUT|PATCH|DELETE) ' CLAUDE.md 2>/dev/null || echo "0")

if [ "$EXPORT_COUNT" != "$ENDPOINT_COUNT" ]; then
  _error "client.ts has $EXPORT_COUNT exports but CLAUDE.md lists $ENDPOINT_COUNT endpoints"
  FAILED=1
else
  _info "API endpoints: OK ($EXPORT_COUNT)"
fi

# --- 3. Environment variables ---
_info "checking env vars..."

USED_VARS=$(grep -rhoP 'import\.meta\.env\.\KVITE_\w+' src/ 2>/dev/null | sort -u || true)

if [ -n "$USED_VARS" ]; then
  ENV_MISSING=0
  while IFS= read -r var; do
    [ -z "$var" ] && continue
    if ! grep -q "^$var=" .env.example 2>/dev/null; then
      _error "env var $var used in code but not in .env.example"
      FAILED=1
      ENV_MISSING=1
    fi
  done <<< "$USED_VARS"

  if [ "$ENV_MISSING" -eq 0 ]; then
    _info "env vars: OK"
  fi
else
  _info "env vars: OK (none used)"
fi

# --- 4. Internal markdown links ---
_info "checking markdown links..."

LINK_ERRORS=0
while IFS= read -r mdfile; do
  [ -z "$mdfile" ] && continue
  mddir=$(dirname "$mdfile")

  # Extract relative links: [text](path) — skip URLs, anchors, absolute paths
  links=$(grep -oP '\[.*?\]\(\K[^)]+' "$mdfile" 2>/dev/null | grep -v '^http' | grep -v '^#' | grep -v '^/' | sed 's/#.*//' || true)

  while IFS= read -r link; do
    [ -z "$link" ] && continue
    target="$mddir/$link"
    if [ ! -e "$target" ]; then
      _error "broken link in $mdfile: $link"
      FAILED=1
      LINK_ERRORS=$((LINK_ERRORS + 1))
    fi
  done <<< "$links"
done < <(find . -name '*.md' -not -path './node_modules/*' -not -path './.git/*' 2>/dev/null)

if [ "$LINK_ERRORS" -eq 0 ]; then
  _info "markdown links: OK"
fi

# --- Result ---
if [ "$FAILED" -eq 1 ]; then
  _error "documentation validation failed"
  exit 1
fi

_info "all documentation checks passed"
