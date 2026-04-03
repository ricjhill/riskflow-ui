# Operating Principles

## Humans design constraints, agents generate code
- Humans steer via CLAUDE.md, rules, hooks, tests, and prompts.
- When an agent produces wrong code, fix the harness (add a test, tighten a rule, improve a prompt) — not the code directly.

## Feature-based architecture
- Features are self-contained in `src/features/<name>/`.
- Shared components live in `src/components/`.
- API client functions live in `src/api/`.
- Types shared across features live in `src/types/`.
- No circular dependencies between features.

## Mechanical validation before merge
Every change must pass automated checks before human review:
- Pre-commit hook: vitest, tsc, eslint, prettier
- PR review: all checks green before merge
