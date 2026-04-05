# Session: Versioning, UI Polish, and Provisioning

**Date:** 5–6 April 2026
**Repos:** ricjhill/riskflow, ricjhill/riskflow-ui

---

## What we did

### 1. Semantic Versioning (PRs #55, #58, #59)

Completed the 3-PR versioning plan:

- **PR #55** (`feature/version-tools`) — Custom TypeScript tools for semver bumping and Conventional Commit change detection. `bumpMajor/Minor/Patch`, `computeNextVersion`, `parseConventionalCommit`, `classifyCommits`, `generateChangelog`. 23 tests.
- **PR #58** — Recorded `package.json` version in PR bodies, issue comments, and evidence. Updated `create-pr` skill, `code-reviewer` agent, and `issue-lifecycle` agent.
- **PR #59** (`feature/release-workflow`) — GitHub Actions release workflow triggered after CI on main. Classifies commits, bumps version, generates CHANGELOG, creates GitHub release. Added `VERSION` file as source of truth (keeps `package.json` protected by hook). Docker images now tagged with semver alongside `latest` and SHA. Code reviewer caught 3 shell injection vectors during review — all fixed before merge.

After merge, the release workflow ran automatically and created v0.1.0, v0.1.1, v0.1.2.

### 2. Cleanup Scan (PR #60)

Ran `/cleanup` skill. Found 1 issue: CLAUDE.md endpoint list was missing `GET /health` and `POST /sheets`. Fixed.

### 3. Documentation Overhaul (PR #61)

Filled major gaps in the Diataxis docs tree:

| Doc | Type | Content |
|-----|------|---------|
| `explanation/architecture.md` | Explanation | Fixed — was stale (described empty directories). Updated with feature table, styling approach, routing, state management. |
| `explanation/flow-mapper.md` | Explanation | New — 3-step workflow, graph construction, barycenter layout, two-click snap, design decisions. |
| `tutorials/mapping-workflow.md` | Tutorial | New — end-to-end file mapping walkthrough. |
| `reference/hooks.md` | Reference | New — useSession, useSchemas with return value tables. |
| `reference/components.md` | Reference | New — Stepper, FileUpload, SchemaList, ApiStatus with props. |
| `reference/tooling.md` | Reference | New — boundary linter, version bump, change detection, release workflow. |

### 4. Navigation Header and 404 Page (PR #62)

Closes #37 and #38. 8 TDD loops:

- **Header** — shared component with `NavLink` for `aria-current="page"` active indicator. Rendered outside `<Routes>` in App.tsx for persistence on all pages including 404.
- **NotFound** — catch-all `<Route path="*">` with heading, message, and home link.
- Removed inline `<nav>` from Home page (redundant with Header).
- 8 new tests (202 total).

### 5. Filename Display and Upload Spinner (PR #63)

Closes #35 and #40. 5 TDD loops:

- **FileUpload** — new `fileName?: string` prop, renders filename below drop zone.
- **UploadStep** — passes `file?.name` to FileUpload. Upload button shows CSS spinner (`role="status"`) during upload.
- 5 new tests (207 total).

### 6. Confidence Detail and Stepper Completed (PR #72)

Closes #39 and #41. 5 TDD loops + 1 reviewer fix:

- **ResultsStep** — renders `low_confidence_fields` as table and `missing_fields` as list (both were in the API response but not displayed).
- **Stepper completed state** — `onFinalised` callback from ResultsStep to FlowMapper calls `setCurrentStep(3)`, triggering existing completed CSS on all 3 steps.
- **Reviewer caught:** `onFinalised` fired unconditionally even on failure. Fixed by making `finalise()` return `Promise<boolean>` (same pattern as `create()`).
- 5 new tests (212 total).

### 7. Upload Back State (PR #73)

Closes #36. 3 TDD loops + 1 reviewer fix:

- When session exists, UploadStep shows read-only summary (schema, filename, sheet) instead of the upload form.
- **Re-upload** button calls `destroy()` and shows the form again.
- **Reviewer caught:** destroy errors were invisible (summary view didn't render `sessionCtx.error`). Fixed. Also fixed Windows path handling in filename extraction.
- 3 new tests (215 total).

### 8. Harness Audit and Issues

Audited the full harness (8 hooks, 3 agents, 3 skills, 3 rules, 4 CI workflows). Filed 8 improvement issues (#64–#71) with `harness` label:

| # | Issue |
|---|---|
| 64 | Consolidate duplicate security pattern checks |
| 65 | Add harness integrity validation to CI |
| 66 | Assert stack versions in CI match CLAUDE.md |
| 67 | Standardise hook error message format |
| 68 | Pre-commit check for stale generated types |
| 69 | Narrow package.json protection for version edits |
| 70 | Run doc-gardener on PRs touching docs/harness |
| 71 | Auto-derive screenshot assertions from source |

### 9. Structured Validation Errors (riskflow #121)

Closes riskflow #114. Added `FieldError` model (`field`, `message`, `value`) and `RowError.field_errors` to the backend. Pydantic `ValidationError.errors()` is now extracted into structured per-field errors instead of `str(e)`. OpenAPI spec regenerated.

Synced to frontend via riskflow-ui PR #74 (`npm run sync:openapi`).

### 10. Docker Network Provisioning (riskflow #122, riskflow-ui #75)

Closes riskflow #120. Both repos now use a shared `riskflow` Docker network:

- **riskflow** — creates the named network, attaches `api`, `redis`, `gui`.
- **riskflow-ui** — stripped to just the `ui` service with `network: riskflow (external: true)`. No more duplicate `api`/`redis` containers or port conflicts.

Added full-stack Docker tutorial (`docs/tutorials/run-the-full-stack.md`) covering end-to-end setup from clone to running.

### 11. Plan Cleanup

Reviewed all 11 plan files. 8 complete, 3 in-progress (all harness-related, now tracked as GitHub issues). Filed 3 observability issues on riskflow (#116–#118) for the remaining Phase 3 work.

---

## PRs merged this session

### riskflow-ui
| PR | Title |
|----|-------|
| #55 | Add semver bump and Conventional Commit detection tools |
| #56 | Add screenshot skill for headless Chrome route testing |
| #57 | Add Flow Mapper engineering presentation |
| #58 | Record package.json version in PRs and issues |
| #59 | Add release workflow, VERSION file, and semver Docker tags |
| #60 | Add missing /health and /sheets endpoints to CLAUDE.md |
| #61 | Update Diataxis docs with features, tutorials, and references |
| #62 | Add navigation header and 404 page |
| #63 | Add filename display and upload spinner |
| #72 | Add confidence detail and stepper completed state |
| #73 | Show upload summary when navigating Back |
| #74 | Sync OpenAPI types: add FieldError model |
| #75 | Use external riskflow Docker network, remove duplicate services |

### riskflow
| PR | Title |
|----|-------|
| #121 | Return structured per-field validation errors in RowError |
| #122 | Add named riskflow Docker network |

---

## Issues closed this session

| Repo | # | Title |
|------|---|-------|
| riskflow-ui | #35 | FileUpload: show selected filename |
| riskflow-ui | #36 | Upload form loses state when navigating Back |
| riskflow-ui | #37 | No 404 page for unknown routes |
| riskflow-ui | #38 | No navigation header on Flow Mapper and API Status pages |
| riskflow-ui | #39 | Confidence report on Results page lacks detail |
| riskflow-ui | #40 | No loading spinner during file upload |
| riskflow-ui | #41 | Stepper does not show completed state after finalisation |
| riskflow | #114 | Return structured per-field validation errors in RowError |
| riskflow | #120 | Fix Docker port conflict between riskflow and riskflow-ui |

---

## Issues filed this session

| Repo | # | Title | Label |
|------|---|-------|-------|
| riskflow-ui | #64 | Consolidate duplicate security pattern checks | harness |
| riskflow-ui | #65 | Add harness integrity validation to CI | harness |
| riskflow-ui | #66 | Assert stack versions in CI match CLAUDE.md | harness |
| riskflow-ui | #67 | Standardise hook error message format | harness |
| riskflow-ui | #68 | Pre-commit check for stale generated types | harness |
| riskflow-ui | #69 | Narrow package.json protection for version edits | harness |
| riskflow-ui | #70 | Run doc-gardener on PRs touching docs/harness | harness |
| riskflow-ui | #71 | Auto-derive screenshot assertions from source | harness |
| riskflow | #116 | Add SLM call duration logging in mapper | |
| riskflow | #117 | Add duration to cache lookup log events | |
| riskflow | #118 | Inject request_id via structlog contextvars | |

---

## By the numbers

| Metric | Value |
|--------|-------|
| PRs merged | 15 (13 riskflow-ui, 2 riskflow) |
| Issues closed | 9 |
| Issues filed | 11 |
| Tests added | 43 (172 → 215 in riskflow-ui, 298 → 302 in riskflow) |
| New doc pages | 7 |
| Agent review rounds | 11 (3 had revisions before approval) |
| Blocking findings caught by reviewer | 6 |
