#!/bin/bash
# Hook: enforce-create-pr
# Runs on: PreToolUse (Bash) — only triggers on gh pr create
# Purpose: Force use of /create-pr skill instead of direct gh pr create.

COMMAND=$(/usr/bin/python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null || true)

if [[ ! "$COMMAND" =~ ^gh\ pr\ create ]]; then
  exit 0
fi

# Allow if the PR body contains the skill's footer
if [[ "$COMMAND" =~ "Generated with [Claude Code]" ]]; then
  exit 0
fi

echo "Use /create-pr instead of gh pr create directly." >&2
echo "The skill runs code review and generates the full PR template." >&2
exit 2
