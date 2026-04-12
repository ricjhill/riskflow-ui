# Harness Hardening Phase 2

**RiskFlow UI Engineering Session — 12 April 2026**

---

## Agenda

| # | Section | Time |
|---|---------|------|
| 1 | What We Accomplished | 3 min |
| 2 | Visual Smoke Testing Pipeline | 5 min |
| 3 | Shared Tooling Layer | 5 min |
| 4 | Hook Standardisation & Security | 5 min |
| 5 | CI Validation Scripts | 4 min |
| 6 | Issue Lifecycle Improvements | 4 min |
| 7 | The PR Workflow We Followed | 5 min |
| 8 | By the Numbers | 2 min |
| 9 | What Remains | 2 min |

---

## 1. What We Accomplished (3 min)

14 issues closed across 9 PRs in one session. Four themes:

| Theme | Issues | PRs |
|-------|--------|-----|
| Visual smoke testing | #54, #71 | #85, #86 |
| Hook quality & shared tooling | #67, #64, #69 | #87, #89 |
| CI validation | #65, #66 | #88 |
| Hook trio + lifecycle agents | #68, #48, #43, #47, #44 | #90, #91, #92 |
| Test coverage | #93 | #94 |

Starting point: 227 tests, 23 files, hardcoded CI assertions, inconsistent hook output, no harness validation.

Ending point: 249 tests, 26 files, manifest-driven assertions, standardised hooks, CI validates its own integrity.

---

## 2. Visual Smoke Testing Pipeline (5 min)

### Problem
The `/screenshot` skill ran manually. CI only checked HTTP status codes via curl — a broken React component that throws on mount would pass.

### Solution: Two PRs

**PR #85 — Visual smoke CI job:**
- Builds Docker container, starts headless Chrome via `uvx rodney`
- Asserts DOM elements exist per route (`/`, `/flow-mapper`, `/api-status`)
- Retry-loop waits for container readiness with hard failure on timeout

**PR #86 — Manifest-driven assertions:**
- `screenshot-assertions.json` — single source of truth for route selectors
- `tools/visual-smoke.sh` — reads manifest, iterates routes, runs assertions
- Both CI and the `/screenshot` skill read from the same file
- Adding a new route = one JSON entry, not two YAML/skill edits

### Key decision
Element existence checks only (no screenshot diffing). Fast, deterministic, no baseline images to maintain.

---

## 3. Shared Tooling Layer (5 min)

### Problem
Each hook formatted errors differently (`echo "Blocked:"`, `echo -e "..."`, `echo "WARNING:"`). Security patterns were grep-scanned identically in 2 CI workflows but with no local enforcement.

### Solution: PR #87

**`tools/hook-utils.sh`** — 3 one-liner helpers:
```bash
_error() { echo "ERROR: $*" >&2; }
_warn()  { echo "WARN: $*" >&2; }
_info()  { echo "INFO: $*" >&2; }
```

All 6 blocking/warning hooks now source this. Uniform prefixed output.

**`tools/security-patterns.sh`** — shared scanner:
```bash
scan_security_patterns <src-dir> [block|warn]
```

Used by: `ci.yml` (block mode), `harness-health.yml` (warn mode), `security-scan.sh` (block mode). Adding a new XSS pattern = one array edit.

Also closed the gap where the local pre-commit hook never checked for `dangerouslySetInnerHTML` / `eval` / `innerHTML` / `document.write`.

---

## 4. Hook Standardisation & Security (5 min)

### PR #89 — Narrowing package.json protection

The `protect-files.sh` hook blocked ALL edits to `package.json`, including version bumps. Now it diffs `old_string` vs `new_string` using Python's `difflib`:

- Anchored regex: `^\s*[+-]\s*"version"\s*:` 
- If every changed line is a version field → allow
- Empty diff (Write tool, no old/new) → block
- Mixed changes (version + deps) → block

### PR #90 — Three new hooks

| Hook | Trigger | Behaviour |
|------|---------|-----------|
| `pre-commit.sh` addition | Staged `openapi.json` or `src/types/` | Runs `npm run generate:types`, fails if output differs |
| `enforce-create-pr.sh` addition | `gh pr create` | Requires `Closes/Fixes/Resolves #N` in PR body |
| `post-merge-verify.sh` (new) | `gh pr merge` | Checks referenced issues are closed, warns via `additionalContext` |

---

## 5. CI Validation Scripts (4 min)

### PR #88 — The harness validates itself

Two scripts added to the CI `harness` job:

**`tools/validate-harness.sh`:**
- Parses `.claude/settings.json`, verifies every hook path exists and is executable
- Checks agent `.md` files have `name:` and `description:` frontmatter
- Checks skill `SKILL.md` files have required frontmatter

**`tools/validate-stack-versions.sh`:**
- Extracts React/TypeScript/Vite major versions from `package.json`
- Compares against CLAUDE.md's stack line ("React 19, TypeScript 5.9, Vite 8")
- Fails CI if they drift

Both have full test suites (13 tests total) covering happy paths and failure modes.

---

## 6. Issue Lifecycle Improvements (4 min)

### PR #91 — Deduplication guard

The issue-lifecycle agent's "Never duplicate comments" rule was just prose. Now it's a mandatory 3-step procedure:

1. Fetch existing comments
2. Check for `## Design Decision` heading
3. Skip, update-in-place, or post new

The Rules section was strengthened from advisory to contractual.

### PR #92 — Issue templates + structure enforcement

Three templates in `.github/ISSUE_TEMPLATE/` (bug, feature, improvement). All require `## Problem` at minimum.

New `post-issue-validate.sh` hook fires after `gh issue create` — warns via `additionalContext` if the new issue body is missing `## Problem`.

The agent's audit mode now also checks open issues for structural completeness.

---

## 7. The PR Workflow We Followed (5 min)

Every PR went through this pipeline:

```
Code → Tests pass → Code-reviewer agent → Fix if blocked → Issue lifecycle comments → PR created → Merge
```

The code-reviewer agent caught real issues:
- `pip install rodney` instead of `uvx rodney` (PR #85)
- Bare `grep -oP` under `set -e` causing silent exits (PR #88)
- Overly broad `"version"` substring match (PR #89)
- Missing tests for edge cases (PR #88, #89)
- Incidental permission entries leaking into settings.json (PR #92)

The `enforce-create-pr.sh` hook we built mid-session immediately started enforcing on us — proving the value loop.

---

## 8. By the Numbers (2 min)

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Tests | 227 | 249 | +22 |
| Test files | 23 | 26 | +3 |
| Hook scripts | 8 | 10 | +2 |
| Shared tools | 2 | 7 | +5 |
| CI validation steps | 0 | 2 | +2 |
| Issue templates | 0 | 3 | +3 |
| Issues closed | — | 14 | — |
| PRs merged | — | 9 | — |
| Version | 0.5.0 | 0.11.0 | +6 minor |

New shared tools created:
- `tools/hook-utils.sh`
- `tools/security-patterns.sh`
- `tools/visual-smoke.sh`
- `tools/validate-harness.sh`
- `tools/validate-stack-versions.sh`
- `screenshot-assertions.json`

---

## 9. What Remains (2 min)

8 open issues, grouped by category:

| Category | Issues |
|----------|--------|
| CI | #70 (doc-gardener on PRs), #49 (test floor per layer) |
| Agent | #53 (review caching), #52 (plan linting), #45 (staleness detection) |
| Testing | #46 (visual regression with screenshot diffing) |
| Hook | #51 (dependency audit hook) |

Recommended next priorities:
1. **#51** — Dependency audit hook (small, same pattern)
2. **#49** — Test count floor per layer (builds on boundary linter)
3. **#70** — Doc-gardener CI trigger (standalone workflow)

---

## Key Takeaways

1. **Shared tooling compounds.** `hook-utils.sh` was created for #67 and immediately used by every subsequent hook. `security-patterns.sh` eliminated 3 sources of drift in one PR.

2. **The harness validates itself.** `validate-harness.sh` catches broken hook paths, `validate-stack-versions.sh` catches doc drift, the enforce-create-pr hook enforces issue traceability — all from this session.

3. **Agent-to-agent review works.** The code-reviewer caught 5+ real bugs that would have reached main. The 2-round review cycle (fix → re-review) adds confidence without manual effort.

4. **Build the feedback loop early.** The stale types check, issue ref enforcement, and post-merge verify all prevent problems we encountered during the session from recurring.
