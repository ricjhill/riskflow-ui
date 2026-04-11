#!/usr/bin/env bash
# Validates that major versions in package.json match CLAUDE.md claims.
# CLAUDE.md states: "React 19, TypeScript 5.9, Vite 8, ..."
set -euo pipefail
source "$(dirname "$0")/hook-utils.sh"

FAILED=0

check_version() {
  local pkg_name="$1"
  local display_name="$2"
  local expected_major="$3"

  actual=$(python3 -c "
import json
pkg = json.load(open('package.json'))
deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}
v = deps.get('$pkg_name', '')
# Strip range chars (^, ~, >=, etc.) then take major
import re
clean = re.sub(r'^[^0-9]*', '', v)
print(clean.split('.')[0] if clean else '')
")

  if [ -z "$actual" ]; then
    _error "$display_name not found in package.json"
    FAILED=1
  elif [ "$actual" != "$expected_major" ]; then
    _error "$display_name major version mismatch: CLAUDE.md says $expected_major, package.json has $actual"
    FAILED=1
  else
    _info "$display_name: $expected_major ✓"
  fi
}

# Extract version claims from CLAUDE.md stack line
# Format: "React 19, TypeScript 5.9, Vite 8, ..."
STACK_LINE=$(grep -oP 'React \d+.*Prettier' CLAUDE.md | head -1 || true)

if [ -z "$STACK_LINE" ]; then
  _error "could not find stack version line in CLAUDE.md"
  exit 1
fi

_info "CLAUDE.md stack: $STACK_LINE"

REACT_MAJOR=$(echo "$STACK_LINE" | grep -oP 'React \K\d+')
TS_MAJOR=$(echo "$STACK_LINE" | grep -oP 'TypeScript \K\d+')
VITE_MAJOR=$(echo "$STACK_LINE" | grep -oP 'Vite \K\d+')

check_version "react" "React" "$REACT_MAJOR"
check_version "typescript" "TypeScript" "$TS_MAJOR"
check_version "vite" "Vite" "$VITE_MAJOR"

if [ "$FAILED" -eq 1 ]; then
  _error "stack version validation failed — update CLAUDE.md or package.json"
  exit 1
fi

_info "stack versions match"
