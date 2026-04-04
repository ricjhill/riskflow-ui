#!/bin/bash
# Hook: security-scan
# Runs on: PreToolUse (Bash) — only triggers on git commit
# Purpose: Run security scanners before commit.
# npm audit: dependency vulnerability scanning
# semgrep: pattern-based security scanning (XSS, OWASP rules)

COMMAND=$(/usr/bin/python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null || true)

if [[ ! "$COMMAND" =~ ^git\ commit ]]; then
  exit 0
fi

# Detect repo root — handle multi-repo working directories
REPO_ROOT=$(git -C "${CLAUDE_WORKING_DIR:-$CLAUDE_PROJECT_DIR}" rev-parse --show-toplevel 2>/dev/null)
UI_ROOT=$(cd "$(dirname "$0")/../.." && pwd)

if [[ "$REPO_ROOT" != "$UI_ROOT" ]]; then
  exit 0
fi

cd "$UI_ROOT" || exit 0

ERRORS=""

# 1. npm audit — dependency vulnerabilities
echo "npm audit..." >&2
OUTPUT=$(npm audit --audit-level=high 2>&1)
if [ $? -ne 0 ]; then
  ERRORS+="SECURITY: npm audit found high-severity vulnerabilities:\n$(echo "$OUTPUT" | tail -10)\n"
  ERRORS+="FIX: Run 'npm audit fix' or update the vulnerable package.\n\n"
fi

# 2. semgrep — pattern-based scanning (non-blocking if not installed)
# Note: npm audit also runs in CI (.github/workflows/ci.yml security job).
# This local check catches issues before commit; CI catches issues from
# dependency updates that bypass local hooks (e.g., Dependabot PRs).
if command -v semgrep &> /dev/null; then
  echo "semgrep..." >&2
  OUTPUT=$(semgrep scan --config auto --quiet src/ 2>&1)
  if [ $? -ne 0 ] && echo "$OUTPUT" | grep -q "Findings:"; then
    ERRORS+="SECURITY: semgrep found potential issues:\n$OUTPUT\n"
    ERRORS+="FIX: Review each finding — false positives can be ignored with nosemgrep comment.\n\n"
  fi
else
  echo "WARNING: semgrep not installed — skipping pattern-based security scan." >&2
  echo "Install: pip install semgrep (or brew install semgrep)" >&2
fi

if [ -n "$ERRORS" ]; then
  echo -e "Security scan failures:\n" >&2
  echo -e "$ERRORS" >&2
  exit 2
fi

exit 0
