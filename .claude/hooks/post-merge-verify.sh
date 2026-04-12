#!/bin/bash
# Hook: post-merge-verify
# Runs on: PostToolUse (Bash) — only triggers after gh pr merge
# Purpose: Check that issues referenced in the merged PR are closed.
# Outputs JSON with additionalContext so the agent sees any open issues.
source "$(dirname "$0")/../../tools/hook-utils.sh"

INPUT=$(cat)
COMMAND=$(/usr/bin/python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null <<< "$INPUT" || true)

if [[ ! "$COMMAND" =~ gh\ pr\ merge ]]; then
  exit 0
fi

# Extract PR number from command (e.g. "gh pr merge 88 --squash")
PR_NUM=$(echo "$COMMAND" | grep -oP 'gh\s+pr\s+merge\s+\K\d+')
if [ -z "$PR_NUM" ]; then
  exit 0
fi

# Get PR body and extract issue references
PR_BODY=$(gh pr view "$PR_NUM" --json body -q '.body' 2>/dev/null || true)
if [ -z "$PR_BODY" ]; then
  exit 0
fi

ISSUE_NUMS=$(echo "$PR_BODY" | grep -oiP '(closes|fixes|resolves)\s+#\K\d+' || true)
if [ -z "$ISSUE_NUMS" ]; then
  exit 0
fi

OPEN_ISSUES=""
while IFS= read -r num; do
  [ -z "$num" ] && continue
  STATE=$(gh issue view "$num" --json state -q '.state' 2>/dev/null || true)
  if [ "$STATE" != "CLOSED" ]; then
    OPEN_ISSUES+="  #$num ($STATE)\n"
  fi
done <<< "$ISSUE_NUMS"

if [ -n "$OPEN_ISSUES" ]; then
  WARNING="POST-MERGE: PR #$PR_NUM merged but these referenced issues are still open:\n$OPEN_ISSUES\nACTION: Close them manually or check that the Closes/Fixes keyword was correct."

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
fi
