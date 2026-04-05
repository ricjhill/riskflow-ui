# Tooling Reference

Build and release tools in `tools/`.

## Import Boundary Linter

`tools/import-boundary-linter.ts` — AST-based architecture enforcement. Parses every TypeScript file in `src/` and checks that imports respect the dependency direction rules.

```bash
npm run lint:boundaries
```

### Layer rules

| Layer | Can import from |
|-------|----------------|
| `types/` | `types/` only |
| `api/` | `types/` |
| `hooks/` | `api/`, `types/` |
| `components/` | `hooks/`, `api/`, `types/` |
| `features/` | `components/`, `hooks/`, `api/`, `types/` (not other features) |
| `test/` | everything |

Cross-feature imports (`features/X` importing `features/Y`) are always violations.

### When it runs

- Pre-commit hook (on every `git commit`)
- CI pipeline (`npm run lint:boundaries` step)
- `/cleanup` skill scan

---

## Version Bump

`tools/bump-version.ts` — Semver increment functions used by the release workflow.

### Exports

| Function | Signature | Example |
|----------|-----------|---------|
| `bumpMajor` | `(version: string) => string` | `"1.2.3"` → `"2.0.0"` |
| `bumpMinor` | `(version: string) => string` | `"1.2.3"` → `"1.3.0"` |
| `bumpPatch` | `(version: string) => string` | `"1.2.3"` → `"1.2.4"` |
| `computeNextVersion` | `(current: string, kind: ChangeKind) => string` | Dispatches to the correct bump |

`ChangeKind` is `'MAJOR' | 'MINOR' | 'PATCH' | 'NONE'`.

All functions validate the input is a valid 3-part semver string and throw on invalid input.

---

## Change Detection

`tools/detect-changes.ts` — Conventional Commit parser and changelog generator used by the release workflow.

### Exports

| Function | Purpose |
|----------|---------|
| `parseConventionalCommit(message)` | Extracts `{type, breaking, description}` from a commit message, or `null` if non-conventional |
| `classifyCommits(messages)` | Returns the highest severity `ChangeKind` from a list of commit messages |
| `generateChangelog(oldVersion, newVersion, messages)` | Produces grouped markdown changelog (Features, Bug Fixes, Other Changes) |

### Classification rules

| Commit pattern | Change kind |
|---------------|-------------|
| `feat!:` or `BREAKING CHANGE:` footer | MAJOR |
| `feat:` | MINOR |
| `fix:`, `refactor:`, `chore:`, etc. | PATCH |
| Non-conventional (e.g. `RED/GREEN:`) | PATCH (fallback) |
| Empty list | NONE |

---

## Release Workflow

`.github/workflows/release.yml` — Automated release pipeline triggered after CI passes on main.

### Flow

1. Skip if last commit starts with `Release v` (prevents infinite loop)
2. Find the last release tag (`git tag --sort=-v:refname`)
3. Classify commits since tag via `classifyCommits()`
4. Compute next version via `computeNextVersion()`
5. Generate changelog via `generateChangelog()`
6. Update `VERSION` file, `package.json`, and `CHANGELOG.md`
7. Commit and push the version bump
8. Create a GitHub release with the changelog as notes

### Version source of truth

The `VERSION` file at the repo root is the single source of truth. `package.json` is kept in sync by the release workflow via `npm version --no-git-tag-version`.
