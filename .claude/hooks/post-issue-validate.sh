#!/bin/bash
# Hook: post-issue-validate
# Runs on: PostToolUse (Bash) — only triggers after gh issue create
# Purpose: Check that newly created issues have required structure.
# Outputs JSON with additionalContext if the issue body is missing ## Problem.
source "$(dirname "$0")/../../tools/hook-utils.sh"

INPUT=$(cat)
COMMAND=$(/usr/bin/python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null <<< "$INPUT" || true)

if [[ ! "$COMMAND" =~ gh\ issue\ create ]]; then
  exit 0
fi

# Extract issue number from the command output (gh issue create prints the URL)
OUTPUT=$(/usr/bin/python3 -c "
import json, sys
data = json.load(sys.stdin)
out = data.get('tool_output', '')
if isinstance(out, dict):
    out = str(out.get('stdout', ''))
print(out)
" 2>/dev/null <<< "$INPUT" || true)

ISSUE_NUM=$(echo "$OUTPUT" | grep -oP '/issues/\K\d+' | tail -1 || true)
if [ -z "$ISSUE_NUM" ]; then
  exit 0
fi

# Check if the issue body contains ## Problem
BODY=$(gh issue view "$ISSUE_NUM" --json body -q '.body' 2>/dev/null || true)
if [ -z "$BODY" ]; then
  exit 0
fi

if echo "$BODY" | grep -q "## Problem"; then
  exit 0
fi

WARNING="ISSUE STRUCTURE: Issue #$ISSUE_NUM is missing the required '## Problem' section. Consider posting a comment asking the author to add it, or update the issue body. See .github/ISSUE_TEMPLATE/ for templates."

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
