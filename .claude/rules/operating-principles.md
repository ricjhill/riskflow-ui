# Operating Principles

## Humans design constraints, agents generate code
- Humans steer via CLAUDE.md, rules, hooks, tests, and prompts.
- When an agent produces wrong code, fix the harness (add a test, tighten a rule, improve a prompt) — not the code directly.

## Feature-based architecture
- Features are self-contained in `src/features/<name>/`.
- Shared components live in `src/components/`.
- API client functions live in `src/api/`.
- Types shared across features live in `src/types/`.
- No cross-feature imports — `src/features/<X>` must never import from `src/features/<Y>`.
- Layer dependency order: `types → api → hooks → components → features`. Each layer may only import from layers to its left.

## Mechanical validation before merge
Every change must pass automated checks before human review:
- Claude Code hooks (`.claude/hooks/`): vitest, tsc, eslint, prettier, lint:boundaries — triggered on `git commit`
- PR review: all checks green before merge
