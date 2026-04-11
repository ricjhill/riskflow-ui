#!/bin/bash
# Hook: pre-commit
# Runs on: PreToolUse (Bash) — only triggers on git commit
# Purpose: Block commit unless vitest, tsc, eslint, and prettier pass.
source "$(dirname "$0")/../../tools/hook-utils.sh"

COMMAND=$(/usr/bin/python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null || true)

if [[ ! "$COMMAND" =~ ^git\ commit(\ |$) ]]; then
  exit 0
fi

# Detect repo root from the command's working directory.
# CLAUDE_PROJECT_DIR may point to a different repo when multiple
# working directories are configured, so resolve the actual repo.
REPO_ROOT=$(git -C "${CLAUDE_WORKING_DIR:-$CLAUDE_PROJECT_DIR}" rev-parse --show-toplevel 2>/dev/null)
UI_ROOT=$(cd "$(dirname "$0")/../.." && pwd)

if [[ "$REPO_ROOT" != "$UI_ROOT" ]]; then
  exit 0
fi

cd "$UI_ROOT" || exit 0

_info "vitest..."
npm test 2>&1 | tail -5 >&2
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  _error "vitest failed"
  exit 2
fi

_info "tsc..."
npx tsc -b 2>&1 | tail -5 >&2
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  _error "tsc failed"
  exit 2
fi

_info "eslint..."
npm run lint 2>&1 | tail -5 >&2
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  _error "eslint failed"
  exit 2
fi

_info "prettier..."
npm run format:check 2>&1 | tail -5 >&2
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  _error "prettier format check failed"
  exit 2
fi

# npm audit moved to security-scan.sh (separate hook, separation of concerns)
