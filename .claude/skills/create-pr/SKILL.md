---
name: create-pr
description: Run code review, then create a pull request with the full PR template
user_invocable: true
---

Create a PR for the current branch. The code-reviewer agent must approve before the PR is created.

## Steps

### Phase 1: Gather data

1. Run `git log --oneline main..HEAD` to get commits on this branch
2. Run `git diff main..HEAD --stat` to get changed files
3. Run `npm test 2>&1 | tail -10` for test results
4. Run `npx tsc -b 2>&1 | tail -3` for TypeScript status
5. Run `npm run lint 2>&1 | tail -3` for ESLint status
6. Run `npm run format:check 2>&1 | tail -3` for Prettier status

### Phase 2: Draft PR body

Write the full PR body using the template in Phase 4. Do not create the PR yet.

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

## Checks

| Check | Result |
|-------|--------|
| vitest | <result> |
| tsc | <result> |
| eslint | <result> |
| prettier | <result> |

## Known limitations

- <honest gaps>

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## Rules

- **Never create a PR without an APPROVE from the code-reviewer agent**
- The summary must explain WHY, not just WHAT
- Known limitations must be honest
