#!/usr/bin/env bash
# Shared security pattern scanner.
# Source this file and call scan_security_patterns <src-dir> [block|warn]
#
# block (default): exit 1 if patterns found
# warn: print findings but exit 0

SECURITY_PATTERNS=(
  'dangerouslySetInnerHTML'
  'eval('
  'innerHTML'
  'document\.write'
)

scan_security_patterns() {
  local src_dir="${1:-.}"
  local mode="${2:-block}"
  local found=0

  for pattern in "${SECURITY_PATTERNS[@]}"; do
    hits=$(grep -rn "$pattern" "$src_dir" --include='*.ts' --include='*.tsx' | grep -v '.test.' || true)
    if [ -n "$hits" ]; then
      echo "SECURITY: Found '$pattern':" >&2
      echo "$hits" >&2
      found=1
    fi
  done

  if [ "$found" -eq 1 ]; then
    if [ "$mode" = "block" ]; then
      echo "Review the above patterns for XSS vulnerabilities" >&2
      return 1
    else
      echo "Review the above patterns — run /cleanup to address" >&2
    fi
  fi

  return 0
}
