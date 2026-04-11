#!/bin/bash
# Hook: check-boundaries
# Runs on: PreToolUse (Bash) — only triggers on git commit
# Purpose: Enforce feature-based architecture boundaries.
#   types/ <- api/ <- hooks/ <- components/ <- features/
# Uses the AST-based TypeScript linter for accurate detection
# (no false positives from comments/strings).
source "$(dirname "$0")/../../tools/hook-utils.sh"

COMMAND=$(/usr/bin/python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null || true)

if [[ ! "$COMMAND" =~ ^git\ commit(\ |$) ]]; then
  exit 0
fi

# Detect repo root — handle multi-repo working directories
REPO_ROOT=$(git -C "${CLAUDE_WORKING_DIR:-$CLAUDE_PROJECT_DIR}" rev-parse --show-toplevel 2>/dev/null)
UI_ROOT=$(cd "$(dirname "$0")/../.." && pwd)

if [[ "$REPO_ROOT" != "$UI_ROOT" ]]; then
  exit 0
fi

cd "$UI_ROOT" || exit 0

OUTPUT=$(npx tsx tools/import-boundary-linter.ts 2>&1)
if [ $? -ne 0 ]; then
  _error "architecture boundary violations found"
  echo "$OUTPUT" >&2
  _info "allowed dependency direction: types/ <- api/ <- hooks/ <- components/ <- features/"
  exit 2
fi

exit 0
