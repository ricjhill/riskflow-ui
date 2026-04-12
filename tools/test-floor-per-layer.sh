#!/usr/bin/env bash
# Asserts minimum test counts per architectural layer.
# Reads reports/unit.xml (JUnit format from vitest) and buckets
# test counts by directory prefix.
set -euo pipefail
source "$(dirname "$0")/hook-utils.sh"

REPORT="reports/unit.xml"

if [ ! -f "$REPORT" ]; then
  _error "$REPORT not found — run npm test first"
  exit 1
fi

# Layer floors — update these as the codebase grows
declare -A FLOORS=(
  ["src/api"]=20
  ["src/hooks"]=10
  ["src/features"]=50
  ["src/components"]=20
  ["tools"]=100
)

# Count tests per layer from JUnit XML
declare -A COUNTS
while IFS= read -r line; do
  name=$(echo "$line" | grep -oP '(?<=<testsuite name=")[^"]+' || true)
  tests=$(echo "$line" | grep -oP '(?<=\stests=")\d+' || true)
  [ -z "$name" ] || [ -z "$tests" ] && continue

  layer=""
  if [[ "$name" == src/api/* ]]; then layer="src/api"
  elif [[ "$name" == src/hooks/* ]]; then layer="src/hooks"
  elif [[ "$name" == src/features/* ]]; then layer="src/features"
  elif [[ "$name" == src/components/* ]]; then layer="src/components"
  elif [[ "$name" == tools/* ]]; then layer="tools"
  fi

  [ -z "$layer" ] && continue
  COUNTS[$layer]=$(( ${COUNTS[$layer]:-0} + tests ))
done < <(grep '<testsuite ' "$REPORT")

# Check each layer against its floor
FAILED=0
for layer in "${!FLOORS[@]}"; do
  floor=${FLOORS[$layer]}
  actual=${COUNTS[$layer]:-0}

  if [ "$actual" -lt "$floor" ]; then
    _error "$layer has $actual tests, below floor of $floor"
    FAILED=1
  else
    _info "$layer: $actual tests (floor: $floor)"
  fi
done

if [ "$FAILED" -eq 1 ]; then
  _error "layer test floors not met"
  exit 1
fi

_info "all layer floors met"
