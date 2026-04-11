#!/usr/bin/env bash
# Reads screenshot-assertions.json and runs uvx rodney assertions against each route.
# Usage: tools/visual-smoke.sh <base-url>
# Example: tools/visual-smoke.sh http://localhost:3000

set -euo pipefail

BASE_URL="${1:?Usage: tools/visual-smoke.sh <base-url>}"
MANIFEST="$(dirname "$0")/../screenshot-assertions.json"

if [ ! -f "$MANIFEST" ]; then
  echo "FAIL: $MANIFEST not found" >&2
  exit 1
fi

ROUTES=$(jq -c '.routes[]' "$MANIFEST")
FAILURES=0

while IFS= read -r route; do
  path=$(echo "$route" | jq -r '.path')
  name=$(echo "$route" | jq -r '.name')
  selectors=$(echo "$route" | jq -r '.assertions[]')

  echo "--- $name ($path) ---"
  uvx rodney open "${BASE_URL}${path}"
  uvx rodney waitload
  uvx rodney waitstable

  while IFS= read -r selector; do
    if uvx rodney exists "$selector"; then
      echo "  OK: $selector"
    else
      echo "  FAIL: $selector"
      FAILURES=$((FAILURES + 1))
    fi
  done <<< "$selectors"
done <<< "$ROUTES"

echo ""
if [ "$FAILURES" -gt 0 ]; then
  echo "FAIL: $FAILURES assertion(s) failed"
  exit 1
else
  echo "All assertions passed"
fi
