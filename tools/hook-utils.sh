#!/usr/bin/env bash
# Shared helpers for Claude Code hook scripts.
# Source this file: source "$(dirname "$0")/../tools/hook-utils.sh"

_error() { echo "ERROR: $*" >&2; }
_warn()  { echo "WARN: $*" >&2; }
_info()  { echo "INFO: $*" >&2; }
