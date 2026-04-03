#!/bin/bash
# Hook: post-failure-context
# Runs on: PostToolUse (Bash) — only triggers on failed npm test/tsc/lint
# Purpose: Inject structured diagnostics when test/lint commands fail.

INPUT=$(cat)

/usr/bin/python3 -c "
import json, sys, re

raw = sys.argv[1]
try:
    data = json.loads(raw)
except (json.JSONDecodeError, TypeError):
    sys.exit(0)

command = data.get('tool_input', {}).get('command', '')
output = data.get('tool_output', '')

if isinstance(output, dict):
    output = str(output.get('stdout', '')) + '\n' + str(output.get('stderr', ''))

# Gate 1: target commands only
tool = None
if re.search(r'npm\s+test\b|vitest\s+run\b', command):
    tool = 'vitest'
elif re.search(r'tsc\b', command):
    tool = 'tsc'
elif re.search(r'npm\s+run\s+lint\b|eslint\b', command):
    tool = 'eslint'

if tool is None:
    sys.exit(0)

lines = output.splitlines()

# Gate 2: failure detection
if tool == 'vitest':
    if not any('FAIL' in l or 'Tests  ' in l and 'failed' in l for l in lines):
        sys.exit(0)
elif tool == 'tsc':
    if not any(': error TS' in l for l in lines):
        sys.exit(0)
elif tool == 'eslint':
    if not any('error' in l.lower() and ('problems' in l.lower() or re.match(r'.+:\d+:\d+', l)) for l in lines):
        sys.exit(0)

# Extract diagnostics
diagnostic_lines = []
if tool == 'vitest':
    diagnostic_lines = [l for l in lines if 'FAIL' in l or 'Error' in l or 'expected' in l.lower() or 'received' in l.lower()]
elif tool == 'tsc':
    diagnostic_lines = [l for l in lines if ': error TS' in l]
elif tool == 'eslint':
    diagnostic_lines = [l for l in lines if re.match(r'.+:\d+:\d+', l)]

diagnostic_lines = diagnostic_lines[-30:]

parts = [f'FAILURE DIAGNOSTIC: {tool} failed', f'Command: {command}', '']
parts.append(f'Error output ({len(diagnostic_lines)} lines):')
for dl in diagnostic_lines:
    parts.append(f'  {dl}')

if tool == 'vitest':
    parts.append('')
    parts.append('Action: Read the failing test(s) and the source they exercise.')
elif tool == 'tsc':
    parts.append('')
    parts.append('Action: Read each file:line above. Fix type errors.')
elif tool == 'eslint':
    parts.append('')
    parts.append('Action: Read each file:line above. Fix lint violations.')

context = '\n'.join(parts)
print(json.dumps({'hookSpecificOutput': {'hookEventName': 'PostToolUse', 'additionalContext': context}}))
" "$INPUT" || true
