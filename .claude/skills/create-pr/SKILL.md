---
name: create-pr
description: Run agent-to-agent code review, then create a pull request with the full PR template including test inventory, TDD cycles, and loop context
user_invocable: true
---

Create a PR for the current branch. The code-reviewer agent must approve before the PR is created.

## Steps

### Phase 1: Gather data

1. Run `git log --oneline main..HEAD` to get commits on this branch
2. Run `git diff main..HEAD --stat` to get changed files
3. Run `npm test -- --reporter=verbose 2>&1` for test results
4. Run `npx tsc -b 2>&1 | tail -3` for TypeScript status
5. Run `npm run lint 2>&1 | tail -3` for ESLint status
6. Run `npm run format:check 2>&1 | tail -3` for Prettier status
7. Run `npm run lint:boundaries 2>&1 | tail -3` for architecture boundary status

### Phase 2: Draft PR body

Write the full PR body using the template in Phase 4. Do not create the PR yet.

Include:
- **TDD cycles**: list each RED/GREEN step — what test was written, how it failed, what was implemented to make it pass
- **Test inventory**: list every test file and its test count from the verbose output
- **Loop context**: structured loop metadata (number, name, dependencies, what it unblocks)

### Phase 3: Agent review (blocking)

1. Launch the `code-reviewer` agent, providing both the branch diff and the draft PR body text
2. If the reviewer returns **BLOCK** or **REVISE**: fix the issues, then re-run
3. If the reviewer returns **APPROVE**: proceed to Phase 4

### Phase 4: Create PR

```
gh pr create --base main --title "<short title>" --body "$(cat <<'EOF'
## Summary

<what changed, why, key decisions>

## Agent Review

<reviewer output>

## Loop context

- **Loop:** <number> — <name>
- **Depends on:** Loop <N> (<what it provided>)
- **Unblocks:** Loop <N> (<what it enables>)

## TDD cycles

1. **RED:** <what test was written and how it failed>
2. **GREEN:** <what was implemented to make it pass>
3. <repeat for each cycle>

## Test inventory

<paste full output of npm test -- --reporter=verbose>

## Checks

| Check | Result |
|-------|--------|
| vitest | <result> |
| tsc | <result> |
| eslint | <result> |
| prettier | <result> |
| boundaries | <result> |

## Known limitations

- <honest gaps>

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## Rules

- **Never create a PR without an APPROVE from the code-reviewer agent**
- **The reviewer must see the draft PR body** — pass it as part of the review prompt so it can verify accuracy
- If the reviewer blocks on code issues, fix the code and re-run
- If the reviewer blocks on PR text accuracy, fix the description and re-run
- Always run the data-gathering commands fresh — do not rely on earlier output
- The summary must explain WHY, not just WHAT
- Test inventory must be the complete verbose output, not a subset
- Known limitations must be honest — do not hide gaps
- Verify every claim in the PR body against actual code before pushing
