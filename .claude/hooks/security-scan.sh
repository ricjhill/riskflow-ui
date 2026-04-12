#!/bin/bash
# Hook: security-scan
# Runs on: PreToolUse (Bash) — only triggers on git commit
# Purpose: Run security scanners before commit.
# npm audit: dependency vulnerability scanning
# semgrep: pattern-based security scanning (XSS, OWASP rules)
# security-patterns.sh: grep-based XSS pattern check (shared with CI)
source "$(dirname "$0")/../../tools/hook-utils.sh"
source "$(dirname "$0")/../../tools/security-patterns.sh"

COMMAND=$(/usr/bin/python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null || true)

if [[ ! "$COMMAND" =~ ^git\ commit(\ |$) ]]; then
  exit 0
fi

# Detect repo root — handle multi-repo working directories
REPO_ROOT=$(git -C "${CLAUDE_WORKING_DIR:-$CLAUDE_PROJECT_DIR}" rev-parse --show-toplevel 2>/dev/null)
UI_ROOT=$(cd "$(dirname "$0")/../.." && pwd)

if [[ "$REPO_ROOT" != "$UI_ROOT" ]]; then
  exit 0
fi

cd "$UI_ROOT" || exit 0

FAILED=0

# 1. npm audit — dependency vulnerabilities (only when dep files are staged)
STAGED=$(git diff --cached --name-only 2>/dev/null || true)
if echo "$STAGED" | grep -qE '(package\.json|package-lock\.json)'; then
  _info "npm audit..."
  OUTPUT=$(npm audit --audit-level=high 2>&1)
  if [ $? -ne 0 ]; then
    _error "npm audit found high-severity vulnerabilities"
    echo "$OUTPUT" | tail -10 >&2
    _info "fix: run 'npm audit fix' or update the vulnerable package"
    FAILED=1
  fi
else
  _info "npm audit: skipped (no dependency files staged)"
fi

# 2. semgrep — pattern-based scanning (non-blocking if not installed)
# Note: npm audit also runs in CI (.github/workflows/ci.yml security job).
# This local check catches issues before commit; CI catches issues from
# dependency updates that bypass local hooks (e.g., Dependabot PRs).
if command -v semgrep &> /dev/null; then
  _info "semgrep..."
  OUTPUT=$(semgrep scan --config auto --quiet src/ 2>&1)
  if [ $? -ne 0 ] && echo "$OUTPUT" | grep -q "Findings:"; then
    _error "semgrep found potential issues"
    echo "$OUTPUT" >&2
    _info "fix: review each finding — false positives can be ignored with nosemgrep comment"
    FAILED=1
  fi
else
  _warn "semgrep not installed — skipping pattern-based security scan"
  _info "install: pip install semgrep (or brew install semgrep)"
fi

# 3. Shared security pattern scan (same patterns as CI)
_info "security patterns..."
if ! scan_security_patterns src/; then
  FAILED=1
fi

if [ "$FAILED" -eq 1 ]; then
  exit 2
fi

exit 0
