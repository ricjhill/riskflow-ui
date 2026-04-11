#!/bin/bash
# Block edits to protected files
source "$(dirname "$0")/../../tools/hook-utils.sh"

INPUT=$(cat)
FILE=$(/usr/bin/python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null <<< "$INPUT")

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
    # Allow edits that only change the "version" line
    IS_VERSION_ONLY=$(/usr/bin/python3 -c "
import json, sys, difflib
data = json.load(sys.stdin)
ti = data.get('tool_input', {})
old = ti.get('old_string', '')
new = ti.get('new_string', '')
old_lines = old.splitlines(keepends=True)
new_lines = new.splitlines(keepends=True)
diff = list(difflib.unified_diff(old_lines, new_lines, n=0))
changed = [l for l in diff if l.startswith(('+', '-')) and not l.startswith(('+++', '---'))]
if changed and all('\"version\"' in l for l in changed):
    print('yes')
else:
    print('no')
" 2>/dev/null <<< "$INPUT")
    if [ "$IS_VERSION_ONLY" = "yes" ]; then
      _info "allowing version-only edit to package.json"
      exit 0
    fi
    _error "do not edit package.json directly — use npm install/uninstall for deps, or edit only the version field"
    exit 2
    ;;
esac

exit 0
