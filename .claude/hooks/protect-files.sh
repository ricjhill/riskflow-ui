#!/bin/bash
# Block edits to protected files
source "$(dirname "$0")/../../tools/hook-utils.sh"

FILE=$(/usr/bin/python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

if [ -z "$FILE" ]; then
  exit 0
fi

# Protected file patterns
case "$FILE" in
  */package-lock.json)
    _error "do not edit package-lock.json manually — use npm install/uninstall"
    exit 2
    ;;
  */.env|*/.env.*)
    _error "do not edit .env files via Claude — manage secrets manually"
    exit 2
    ;;
  */.claude/settings.json)
    _error "do not edit .claude/settings.json directly — use /update-config"
    exit 2
    ;;
  */package.json)
    _error "do not edit package.json directly — use npm install/uninstall for deps"
    exit 2
    ;;
esac

exit 0
