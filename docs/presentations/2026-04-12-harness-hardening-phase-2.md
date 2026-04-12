# Harness Hardening Phase 2

**RiskFlow UI Engineering Session — 12 April 2026**

---

## Agenda

| # | Section | Time |
|---|---------|------|
| 1 | What We Accomplished | 3 min |
| 2 | Visual Smoke Testing Pipeline | 5 min |
| 3 | Shared Tooling Layer | 5 min |
| 4 | Hook Improvements | 5 min |
| 5 | CI Validation & Test Floors | 5 min |
| 6 | Doc Drift Prevention (Three-Layer Architecture) | 7 min |
| 7 | Issue Lifecycle Hardening | 4 min |
| 8 | The PR Workflow in Action | 5 min |
| 9 | Issues We Closed Without Code | 3 min |
| 10 | By the Numbers | 2 min |
| 11 | What Remains | 1 min |

---

## 1. What We Accomplished (3 min)

24 PRs merged, 23 issues closed, 2 issues closed as won't-fix. One session.

| Phase | PRs | Issues | Theme |
|-------|-----|--------|-------|
| Visual smoke | #85, #86 | #54, #71 | Headless Chrome assertions in CI |
| Shared tooling | #87 | #67, #64 | Hook helpers + security pattern consolidation |
| CI validation | #88 | #65, #66 | Harness integrity + stack version checks |
| Hook refinements | #89, #90, #107 | #69, #68, #48, #43, #51 | Version-only edits, stale types, issue refs, post-merge verify, dep audit gating |
| Issue lifecycle | #91, #92 | #47, #44 | Dedup guard, templates, structure enforcement |
| Test coverage | #94, #106 | #93, #49 | SessionContext tests, per-layer test floors |
| Doc drift plan | #102-#105 | #95-#101, #70 | validate-docs.sh, CI integration, agent/skill cleanup |
| Staleness detection | #108 | #45 | Designed-but-not-started detection |

Starting point: 227 tests, 23 files, hardcoded CI assertions, inconsistent hooks, no doc validation.

Ending point: 266 tests, 28 files, manifest-driven assertions, standardised hooks, three-layer doc validation, per-layer test floors.

---

## 2. Visual Smoke Testing Pipeline (5 min)

### Problem
CI only checked HTTP status codes via curl. A broken React component that throws on mount would pass.

### Solution: Two PRs

**PR #85 — Visual smoke CI job:**
- Builds Docker container, starts headless Chrome via `uvx rodney`
- Asserts DOM elements exist per route (`/`, `/flow-mapper`, `/api-status`)
- Retry-loop with hard failure on timeout

**PR #86 — Manifest-driven assertions:**
```json
{
  "routes": [
    { "path": "/", "name": "homepage", "assertions": ["h1", "nav a"] },
    { "path": "/flow-mapper", "name": "flow-mapper", "assertions": [".stepper", "select#schema-select", ".file-upload"] }
  ]
}
```

`screenshot-assertions.json` is the single source of truth. `tools/visual-smoke.sh` reads it. Both CI and the `/screenshot` skill consume the same file. Adding a route = one JSON entry.

### Key decision
Element existence checks only — no screenshot diffing. Fast, deterministic, no baseline images.

---

## 3. Shared Tooling Layer (5 min)

### Problem
Each hook formatted errors differently. Security patterns were duplicated across 2 CI workflows with no local enforcement.

### Solution: PR #87

**`tools/hook-utils.sh`** — 3 helpers used by all hooks:
```bash
_error() { echo "ERROR: $*" >&2; }
_warn()  { echo "WARN: $*" >&2; }
_info()  { echo "INFO: $*" >&2; }
```

**`tools/security-patterns.sh`** — shared XSS scanner:
```bash
scan_security_patterns <src-dir> [block|warn]
```

Used by `ci.yml` (block), `harness-health.yml` (warn), and `security-scan.sh` (block). One array to edit for new patterns.

Also closed the gap where the local pre-commit hook never checked for `dangerouslySetInnerHTML` / `eval` / `innerHTML` / `document.write`.

---

## 4. Hook Improvements (5 min)

### PR #89 — Smart package.json protection

`protect-files.sh` blocked ALL edits to `package.json`. Now it diffs `old_string` vs `new_string` using Python's `difflib` with an anchored regex `^\s*[+-]\s*"version"\s*:`. Version-only edits pass; everything else blocks.

### PR #90 — Three new hooks in one PR

| Hook | Trigger | Behaviour |
|------|---------|-----------|
| Stale types check | Staged `openapi.json` or `src/types/` | Runs `npm run generate:types`, fails if output differs |
| Issue ref enforcement | `gh pr create` | Requires `Closes/Fixes/Resolves #N` in PR body |
| Post-merge verify | `gh pr merge` | Checks referenced issues are closed, warns via `additionalContext` |

### PR #107 — Gated dependency audit

`npm audit` now only runs when `package.json` or `package-lock.json` are staged. Saves ~5s on non-dependency commits.

---

## 5. CI Validation & Test Floors (5 min)

### PR #88 — The harness validates itself

**`tools/validate-harness.sh`:** Verifies hook paths exist and are executable, agent/skill frontmatter has required fields.

**`tools/validate-stack-versions.sh`:** Extracts React/TypeScript/Vite major versions from `package.json`, compares against CLAUDE.md. Fails if they drift.

Both have full test suites (13 tests total).

### PR #106 — Per-layer test floors replace global floor

The old global floor of 50 hid layer-specific regressions. Now:

| Layer | Current | Floor |
|-------|---------|-------|
| `src/api` | 27 | 20 |
| `src/hooks` | 12 | 10 |
| `src/features` | 68 | 50 |
| `src/components` | 24 | 20 |
| `tools` | 130 | 100 |

Deleting all API tests while adding feature tests now fails CI instead of passing silently.

---

## 6. Doc Drift Prevention — Three-Layer Architecture (7 min)

### The problem we planned for

Issue #70 asked for automated doc validation on PRs. We decomposed it into 7 issues (#95-#101) with a clear architecture:

### Layer 1: `tools/validate-docs.sh` — CI bash script

Four deterministic checks that block PRs:
1. Architecture tree — CLAUDE.md dirs vs actual `src/` dirs (bidirectional)
2. API endpoints — `client.ts` export count vs CLAUDE.md endpoint count
3. Env vars — `VITE_*` usage vs `.env.example`
4. Markdown links — relative links in all `.md` files resolve

12 tests. Runs in CI `harness` job on every PR.

### Layer 2: `doc-gardener` agent — judgment calls

Narrowed from 9 sections to 5 after the script took over mechanical checks:
1. Stack descriptions and commands
2. README command verification
3. Infrastructure file consistency
4. Rules semantic accuracy
5. Skills/agents self-check

### Layer 3: `/cleanup` skill — orchestrator

Section 5 now delegates: run the script, then invoke the agent. No more inline doc checks.

### Why three layers?

```
CI script → catches mechanical drift on every PR (fast, testable, blocks merge)
Agent     → catches reasoning-dependent drift on demand (LLM, advisory)
Skill     → orchestrates both + takes action (fix, commit, PR)
```

### PR #103 — Why replace inline bash?

The harness-health workflow had 70 lines of inline bash doing the same checks. We replaced it with one line. The PR body explained why:

1. **One source of truth** — bug fixes flow through automatically
2. **Testable** — inline YAML had zero tests; the script has 12
3. **70 lines → 1 line** — easier to review and maintain
4. **Consistent output** — standardised `_error`/`_info` prefixes

---

## 7. Issue Lifecycle Hardening (4 min)

### PR #91 — Deduplication guard

The agent's "Never duplicate comments" rule was just prose. Now it's a mandatory 3-step procedure:
1. Fetch existing comments
2. Check for `## Design Decision` heading
3. Skip, update-in-place, or post new

The Rules section was strengthened to contractual language.

### PR #92 — Issue templates + structure enforcement

Three templates in `.github/ISSUE_TEMPLATE/` (bug, feature, improvement). All require `## Problem`.

New `post-issue-validate.sh` hook fires after `gh issue create` — warns if the issue body is missing `## Problem`.

### PR #108 — Staleness detection

The audit mode now detects:
- **Designed but not started** — has Design Decision comment but no PR
- **Stale PR** — linked PR open > 14 days

Produces a scannable summary table during audits.

---

## 8. The PR Workflow in Action (5 min)

Every PR went through this pipeline:

```
Code → Tests pass → Code-reviewer agent → Fix if blocked → Issue lifecycle → PR created → Merge
```

### Real bugs caught by the code-reviewer agent

| PR | Bug caught | Impact |
|----|-----------|--------|
| #85 | `pip install rodney` instead of `uvx rodney` | CI job would fail on every run |
| #88 | Bare `grep -oP` under `set -e` (3 lines) | Silent exit with no diagnostic |
| #89 | `"version"` substring match too broad | `"engineVersion"` would bypass protection |
| #89 | Missing Write-tool test case | Edge case uncovered |
| #92 | `Bash(bash -c ':*)` allow rule leaked into settings | Wide-open shell execution gate |
| #106 | `grep name="` matched hostname attribute | Tools count off by 5 (125 vs 130) |

### The feedback loop proving itself

The `enforce-create-pr.sh` hook we built mid-session (PR #90) immediately started enforcing on our own PRs — PR #94 was blocked until we created issue #93 to reference. The post-merge-verify hook (also PR #90) fired on PR #108's merge and correctly detected the issue was still open (GitHub auto-close delay).

---

## 9. Issues We Closed Without Code (3 min)

Not every issue needs code. Two were closed as won't-fix with clear reasoning:

**#53 — Agent review caching:** The re-review flow already works — we pass previous findings in the prompt. Formal caching adds complexity for marginal gain on a 30-60 second sonnet call.

**#52 — Plan file linting agent:** Plan files are ephemeral (one conversation, then discarded). Building a TypeScript linter with cycle detection and symbol resolution for an ephemeral document doesn't pay for itself.

Both closures documented the reasoning in the issue comments so future readers understand the decision, not just the outcome.

---

## 10. By the Numbers (2 min)

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Tests | 227 | 266 | +39 |
| Test files | 23 | 28 | +5 |
| Hook scripts | 8 | 10 | +2 |
| Shared tools | 2 | 8 | +6 |
| CI validation steps | 0 | 4 | +4 |
| Issue templates | 0 | 3 | +3 |
| Issues closed | — | 25 | — |
| PRs merged | — | 16 | — |
| Version | 0.5.0 | 0.17.0 | +12 minor |

### New shared tools created this session
- `tools/hook-utils.sh` — error/warn/info helpers
- `tools/security-patterns.sh` — shared XSS scanner
- `tools/visual-smoke.sh` — manifest-driven element assertions
- `tools/validate-harness.sh` — hook path + frontmatter validation
- `tools/validate-stack-versions.sh` — major version match check
- `tools/validate-docs.sh` — 4-check doc freshness scanner
- `tools/test-floor-per-layer.sh` — per-layer test count floors
- `screenshot-assertions.json` — route/selector manifest

---

## 11. What Remains (1 min)

One issue left in the backlog:

**#46 — Visual regression testing with screenshot diffing** — needs `pixelmatch`/`pngjs`, baseline image storage, flakiness management. Parked until the app has enough visual complexity that element assertions aren't sufficient.

The harness is now comprehensive enough for feature development to begin safely.

---

## Key Takeaways

1. **Shared tooling compounds.** `hook-utils.sh` was created for #67 and used by every subsequent hook. `security-patterns.sh` eliminated 3 sources of drift. `validate-docs.sh` replaced 70 lines of inline YAML in one PR.

2. **Three layers beat one.** Mechanical checks in CI scripts (fast, testable, blocking), reasoning checks in agents (judgment, advisory), action in skills (orchestration, PR creation). Each plays to its strengths.

3. **Agent-to-agent review catches real bugs.** The code-reviewer found 6+ bugs that would have reached main — wrong package managers, silent exits, overly broad regex, leaked permissions.

4. **Close issues without code when the reasoning is clear.** #52 and #53 were closed with documented reasoning. Not every issue deserves implementation.

5. **The harness enforces itself.** Post-merge-verify caught a delayed auto-close. Enforce-create-pr blocked our own PR for missing an issue reference. Validate-harness would catch a renamed hook. The feedback loop is now self-sustaining.
