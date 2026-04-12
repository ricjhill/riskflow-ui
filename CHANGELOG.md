# Changelog

## 0.19.0

### Features

- add finalisation summary step with schema and mapping details (#110)


## 0.18.1

### Documentation

- update session presentation with complete results


## 0.18.0

### Features

- add staleness detection to issue-lifecycle audit (#108)


## 0.17.0

### Features

- gate npm audit to only run when dep files are staged (#107)


## 0.16.0

### Features

- add per-layer test count floors, replace global floor (#106)


## 0.15.0

### Features

- delegate cleanup skill doc checks to script + agent (#105)


## 0.14.0

### Features

- narrow doc-gardener agent to judgment-only checks (#104)


## 0.13.0

### Features

- add doc-freshness to CI, replace inline bash in harness-health (#103)


## 0.12.0

### Features

- add tools/validate-docs.sh with 4 doc freshness checks (#102)


## 0.11.2

### Documentation

- add presentation for 12 April harness hardening session


## 0.11.1

### Tests

- add SessionContext tests for provider and throw behavior (#94)


## 0.11.0

### Features

- add issue templates and structure enforcement (#92)


## 0.10.0

### Features

- add concrete deduplication guard to issue-lifecycle agent (#91)


## 0.9.0

### Features

- allow version-only edits to package.json (#89)


## 0.8.0

### Features

- stale types check, issue ref enforcement, post-merge verify (#90)


## 0.7.0

### Features

- add harness integrity and stack version validation to CI (#88)


## 0.6.0

### Features

- standardise hook messages, consolidate security patterns (#87)


## 0.5.0

### Features

- auto-derive screenshot assertions from manifest (#86)


## 0.4.0

### Features

- add visual-smoke CI job with rodney element assertions (#85)


## 0.3.0

### Bug Fixes

- address code review — dark mode glow, CSS collision, test gaps

### Features

- add awaiting-selection state to target nodes
- add confidence color legend to mapping canvas
- add confidence percentage labels to mapping edges
- replace hint text with always-visible instruction banner
- highlight active source node with accent ring glow
- add column header labels to mapping canvas
- add dot grid background and responsive canvas height
- wrap flow-mapper content in card container with shadow

### Styling

- add shadows, hover states, and transitions to mapping nodes
- fine-tune dark mode card and background contrast
- add subtle shadows to primary buttons for SaaS depth
- add responsive breakpoints for card layout on mobile
- redesign stepper as visual progress bar
- center results step within card layout
- swap purple accent to blue SaaS palette with slate greys

### Other Changes

- Merge pull request #84 from ricjhill/feature/ui-redesign-saas-card


## 0.2.0

### Bug Fixes

- upgrade vite 8.0.4 → 8.0.7 to resolve high-severity CVEs

### Features

- auto-invoke issue-lifecycle agent from /create-pr skill

### Other Changes

- Merge pull request #80 from ricjhill/feature/auto-invoke-issue-lifecycle
- Regenerate package-lock.json after rebase


## 0.1.13

### Other Changes

- Merge pull request #81 from ricjhill/feature/vitest-coverage
- Fix vite security audit and add sticky coverage PR comment
- Add vitest code coverage with V8 provider (#50)


## 0.1.12

### Documentation

- clarify hooks are Claude Code hooks, not git pre-commit
- sync architecture tree and operating principles with codebase

### Other Changes

- Merge pull request #79 from ricjhill/chore/cleanup-docs


## 0.1.11

### Chores

- sync settings allow-list and lockfile version

### Other Changes

- Merge pull request #78 from ricjhill/chore/housekeeping-settings-lockfile


## 0.1.10

### Other Changes

- add test for legacy error fallback when field_errors is empty

### Other Changes

- Merge pull request #77 from ricjhill/feature/per-field-errors
- Fix test name and add row number assertions (reviewer feedback)
- RED→GREEN: display per-field errors in ResultsStep


## 0.1.9

### Other Changes

- Merge pull request #76 from ricjhill/docs/session-log
- Add session log: versioning, UI polish, and provisioning


## 0.1.8

### Other Changes

- Merge pull request #75 from ricjhill/feature/docker-external-network
- Add full-stack Docker tutorial and update getting-started docs
- Use external riskflow network, remove duplicate api/redis services


## 0.1.7

### Other Changes

- Merge pull request #74 from ricjhill/feature/sync-field-error-types
- Sync OpenAPI types: add FieldError and RowError.field_errors


## 0.1.6

### Other Changes

- Merge pull request #73 from ricjhill/feature/upload-back-state
- Fix destroy error visibility and Windows path handling
- Add upload summary styling (#36)
- RED/GREEN: Re-upload button destroys session and shows form (#36)
- RED/GREEN: UploadStep shows summary when session exists (#36)


## 0.1.5

### Other Changes

- Merge pull request #72 from ricjhill/feature/results-step-polish
- Fix onFinalised firing on failure; add negative test
- Fix TypeScript spread error in missing fields test
- Add confidence detail styling (#39)
- RED/GREEN: Stepper shows completed state after finalisation (#41)
- RED/GREEN: ResultsStep calls onFinalised after finalisation (#41)
- RED/GREEN: ResultsStep shows missing target fields (#39)
- RED/GREEN: ResultsStep shows low confidence fields (#39)


## 0.1.4

### Other Changes

- Merge pull request #63 from ricjhill/feature/upload-filename-spinner
- Add spinner CSS animation for upload button (#40)
- RED/GREEN: Upload button shows spinner during upload (#40)
- Add filename display styling to FileUpload (#35)
- RED/GREEN: UploadStep shows selected filename (#35)
- RED/GREEN: FileUpload displays selected filename (#35)


## 0.1.3

### Other Changes

- Merge pull request #62 from ricjhill/feature/nav-header-and-404
- RED/GREEN: App shows NotFound with Header for unknown routes
- RED/GREEN: App renders Header on all routes
- RED/GREEN: NotFound renders heading and home link (closes #37)
- Add Header CSS with responsive layout and active indicator
- RED/GREEN: Header highlights active page via aria-current
- RED/GREEN: Header renders nav links to Flow Mapper and API Status
- RED/GREEN: Header renders app name linking to home (closes #38)


## 0.1.2

### Other Changes

- Merge pull request #61 from ricjhill/feature/docs-update
- Update Diataxis docs with features, tutorials, and reference guides


## 0.1.1

### Other Changes

- Merge pull request #60 from ricjhill/feature/cleanup
- Add missing /health and /sheets endpoints to CLAUDE.md

