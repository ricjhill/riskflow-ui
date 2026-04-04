#!/bin/bash
# Hook: post-edit-format
# Runs on: PostToolUse (Edit|Write) — only triggers on .ts/.tsx/.css files
# Purpose: Auto-format files after editing.

INPUT=$(cat)
FILE=$(/usr/bin/python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null <<< "$INPUT" || true)

if [[ ! "$FILE" =~ \.(ts|tsx|css|json)$ ]]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 0

npx prettier --write "$FILE" || echo "WARNING: prettier failed on $FILE" >&2
