#!/bin/bash
# Hook: pre-commit
# Runs on: PreToolUse (Bash) — only triggers on git commit
# Purpose: Block commit unless vitest, tsc, eslint, and prettier pass.

COMMAND=$(/usr/bin/python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null || true)

if [[ ! "$COMMAND" =~ ^git\ commit ]]; then
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

echo "vitest..." >&2
npm test 2>&1 | tail -5 >&2
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "vitest failed" >&2
  exit 2
fi

echo "tsc..." >&2
npx tsc -b 2>&1 | tail -5 >&2
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "tsc failed" >&2
  exit 2
fi

echo "eslint..." >&2
npm run lint 2>&1 | tail -5 >&2
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "eslint failed" >&2
  exit 2
fi

echo "prettier..." >&2
npm run format:check 2>&1 | tail -5 >&2
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "prettier format check failed" >&2
  exit 2
fi

echo "npm audit..." >&2
npm audit --audit-level=high 2>&1 | tail -10 >&2
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "npm audit found high-severity vulnerabilities" >&2
  exit 2
fi
