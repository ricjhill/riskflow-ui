#!/bin/bash
# Hook: post-rename-check
# Runs on: PostToolUse (Bash) — only triggers on mv or git mv
# Purpose: After a file rename, grep the repo for stale references
#          to the old filename and warn if any are found.
#
# Does NOT block — outputs JSON with additionalContext so the agent
# sees the stale references and can fix them proactively.

COMMAND=$(/usr/bin/python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null || true)

# Only trigger on mv or git mv commands
if [[ ! "$COMMAND" =~ ^(mv|git\ mv)\ .+ ]]; then
  exit 0
fi

# Detect repo root — handle multi-repo working directories
REPO_ROOT=$(git -C "${CLAUDE_WORKING_DIR:-$CLAUDE_PROJECT_DIR}" rev-parse --show-toplevel 2>/dev/null)
UI_ROOT=$(cd "$(dirname "$0")/../.." && pwd)

if [[ "$REPO_ROOT" != "$UI_ROOT" ]]; then
  exit 0
fi

cd "$UI_ROOT" || exit 0

# Extract the old path (first non-flag argument after mv/git mv)
OLD_PATH=$(/usr/bin/python3 -c "
import sys, shlex
args = shlex.split(sys.argv[1])
# Skip 'mv' or 'git mv', skip flags starting with '-'
paths = [a for a in args[1:] if not a.startswith('-')]
# For 'git mv', skip the 'mv' part
if args[0] == 'git' and len(args) > 1 and args[1] == 'mv':
    paths = [a for a in args[2:] if not a.startswith('-')]
if paths:
    print(paths[0])
" "$COMMAND" 2>/dev/null)

if [ -z "$OLD_PATH" ]; then
  exit 0
fi

# Extract just the filename (without directory)
OLD_NAME=$(basename "$OLD_PATH")

# Skip if the old name is too short or generic to grep meaningfully
if [ ${#OLD_NAME} -lt 3 ]; then
  exit 0
fi

# Grep for references to the old filename across the repo
REFS=$(grep -r --include='*.ts' --include='*.tsx' --include='*.json' --include='*.md' \
  --include='*.css' --include='*.html' --include='*.yml' --include='*.yaml' \
  --include='*.sh' --include='*.toml' \
  -l "$OLD_NAME" . 2>/dev/null | grep -v '\.git/' | grep -v 'node_modules/' || true)

if [ -z "$REFS" ]; then
  exit 0
fi

REF_COUNT=$(echo "$REFS" | wc -l)

WARNING="STALE REFERENCES DETECTED after rename of '$OLD_NAME':
Found $REF_COUNT file(s) still referencing '$OLD_NAME':
$REFS

ACTION REQUIRED: Update these references to use the new filename. Use grep to find exact lines:
  grep -rn '$OLD_NAME' $(echo $REFS | tr '\n' ' ')"

# Output JSON so the context is injected back to the model
/usr/bin/python3 -c "
import json, sys
msg = sys.argv[1]
print(json.dumps({
    'hookSpecificOutput': {
        'hookEventName': 'PostToolUse',
        'additionalContext': msg
    }
}))
" "$WARNING"
