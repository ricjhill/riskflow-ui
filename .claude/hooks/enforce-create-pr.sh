#!/bin/bash
# Hook: enforce-create-pr
# Runs on: PreToolUse (Bash) — only triggers on gh pr create
# Purpose: Force use of /create-pr skill instead of direct gh pr create.

COMMAND=$(/usr/bin/python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null || true)

if [[ ! "$COMMAND" =~ ^gh\ pr\ create ]]; then
  exit 0
fi

# Allow if the PR body contains proof that the code-reviewer agent ran.
# The /create-pr skill inserts an "## Agent Review" section with the
# reviewer's structured verdict. The footer alone ("Generated with
# [Claude Code]") is not sufficient — it's trivially pasted without
# actually running the agent.
if [[ "$COMMAND" =~ "## Agent Review" ]]; then
  exit 0
fi

echo "Use /create-pr instead of gh pr create directly." >&2
echo "The skill runs the code-reviewer agent and includes its verdict in the PR body." >&2
echo "The PR body must contain '## Agent Review' to prove the agent ran." >&2
exit 2
