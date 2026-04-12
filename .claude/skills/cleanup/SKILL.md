---
name: cleanup
description: Scan the codebase for pattern drift, dead code, stale docs, and architectural decay. Opens a fix-up PR if issues are found.
---

Scan the RiskFlow UI codebase for entropy and open a cleanup PR if needed. This is the garbage collection process — run it periodically to prevent drift from compounding.

## Checks to run (in order)

### 1. Dead code detection
- Run `npx tsc -b --noEmit` and look for unused variable/import warnings
- Check for empty files that were scaffolded but never populated
- Check for unused exports: search for `export` declarations and verify they are imported somewhere

### 2. Architectural drift
- Run `npm run lint:boundaries` to invoke the import boundary linter
- Check that all files in `src/api/` have zero imports from `src/components/` or `src/features/`
- Check that no feature imports from another feature (`src/features/<X>` importing `src/features/<Y>`)
- Verify shared components in `src/components/` have no feature-specific logic

### 3. Test drift
- Run `npm test -- --reporter=verbose` and compare against source files
- For every `.ts`/`.tsx` file in `src/` that contains exported functions or components, check that a corresponding `.test.ts`/`.test.tsx` file exists nearby
- Flag any source file with no test coverage

### 4. Dependency hygiene
- Run `npm audit --audit-level=high` for new CVEs
- Check for outdated packages: `npm outdated`
- Verify no `any` types have crept into `src/` (grep for `: any` and `as any`)

### 5. Documentation freshness
1. Run `tools/validate-docs.sh` — if it fails, include the output in the report (covers architecture tree, endpoint count, env vars, markdown links)
2. Invoke the `doc-gardener` agent for deep checks — include any STALE findings in the report (covers stack descriptions, README commands, infrastructure consistency, rules semantics, skills/agents self-check)

### 6. Stale patterns
- Check for `// TODO`, `// FIXME`, `// HACK` comments that were never resolved
- Check for commented-out code blocks
- Check for `console.log` statements left in production code (not test files)
- Check for `@ts-ignore` or `@ts-expect-error` without explanatory comments

## Output

Report findings as a categorized list:

```
## Cleanup Report

### Dead Code
- <finding or "Clean">

### Architectural Drift
- <finding or "Clean">

### Test Drift
- <finding or "Clean">

### Dependency Hygiene
- <finding or "Clean">

### Documentation Freshness
- <finding or "Clean">

### Stale Patterns
- <finding or "Clean">

### Summary
<total findings> issues found. <N> need fixing, <N> are advisory.
```

## Action

If issues are found:
1. Create a `feature/cleanup` branch
2. Fix all non-advisory issues
3. Run `npm test` to verify nothing broke
4. Use `/create-pr` to open the cleanup PR (which triggers the code-reviewer agent)

If everything is clean, report "No drift detected" and do nothing.
