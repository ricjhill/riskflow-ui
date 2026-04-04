#!/bin/bash
# Block edits to protected files
FILE=$(/usr/bin/python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

if [ -z "$FILE" ]; then
  exit 0
fi

# Protected file patterns
case "$FILE" in
  */package-lock.json)
    echo "Blocked: do not edit package-lock.json manually — use npm install/uninstall" >&2
    exit 2
    ;;
  */.env|*/.env.*)
    echo "Blocked: do not edit .env files via Claude — manage secrets manually" >&2
    exit 2
    ;;
  */.claude/settings.json)
    echo "Blocked: do not edit .claude/settings.json directly — use /update-config" >&2
    exit 2
    ;;
  */package.json)
    echo "Blocked: do not edit package.json directly — use npm install/uninstall for deps" >&2
    exit 2
    ;;
esac

exit 0
