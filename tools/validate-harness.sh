#!/usr/bin/env bash
# Validates harness configuration integrity:
# 1. Hook paths in settings.json reference existing scripts
# 2. Agent .md files have required frontmatter (name, description)
# 3. Skill SKILL.md files have required frontmatter (name, description)
set -euo pipefail
source "$(dirname "$0")/hook-utils.sh"

FAILED=0

# --- 1. Hook path validation ---
_info "validating hook paths in .claude/settings.json..."

HOOK_PATHS=$(python3 -c "
import json, sys
settings = json.load(open('.claude/settings.json'))
for event in settings.get('hooks', {}).values():
    for group in event:
        for hook in group.get('hooks', []):
            print(hook.get('command', ''))
")

while IFS= read -r path; do
  [ -z "$path" ] && continue
  if [ ! -f "$path" ]; then
    _error "hook path not found: $path"
    FAILED=1
  elif [ ! -x "$path" ]; then
    _error "hook not executable: $path"
    FAILED=1
  fi
done <<< "$HOOK_PATHS"

# --- 2. Agent definition validation ---
_info "validating agent definitions..."

for agent in .claude/agents/*.md; do
  [ -f "$agent" ] || continue
  for field in name description; do
    if ! grep -q "^${field}:" "$agent"; then
      _error "$agent missing required frontmatter: $field"
      FAILED=1
    fi
  done
done

# --- 3. Skill definition validation ---
_info "validating skill definitions..."

for skill in .claude/skills/*/SKILL.md; do
  [ -f "$skill" ] || continue
  for field in name description; do
    if ! grep -q "^${field}:" "$skill"; then
      _error "$skill missing required frontmatter: $field"
      FAILED=1
    fi
  done
done

if [ "$FAILED" -eq 1 ]; then
  _error "harness validation failed"
  exit 1
fi

_info "harness validation passed"
