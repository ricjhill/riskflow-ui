---
paths:
  - ".claude/plans/**"
---

# TDD Loop Planning

## When creating a plan, structure each PR as numbered TDD loops

Every PR in a plan must list its work as a sequence of small, numbered loops. Each loop has exactly one RED step (write the failing test) and one GREEN step (implement just enough to pass). One commit per green.

## Loop format

```
### Loop 1: <what this loop proves>
- **RED:** Write `Foo.test.ts` — test that X produces Y. Fails because Foo doesn't exist.
- **GREEN:** Create `Foo.ts` — implement X. Test passes.
- **Commit:** "RED/GREEN: Foo produces Y"

### Loop 2: <what this loop proves>
- **RED:** Add test — X rejects invalid input. Fails because no validation.
- **GREEN:** Add validation to Foo. Test passes.
- **Commit:** "RED/GREEN: Foo rejects invalid input"
```

## Rules

- Each loop is one test + one implementation change. No multi-test loops.
- Name the test file and the assertion in the RED step. Be specific enough to write the test from the plan.
- Name the source file and the change in the GREEN step.
- The commit message references the RED/GREEN cycle.
- Loops within a PR are ordered by dependency — later loops build on earlier ones.
- Infrastructure loops (install deps, config changes) come first and don't need a RED step.

## Why

Plans with prose descriptions ("TDD cycles for component X") produce vague PRs. Plans with numbered loops produce PRs where every commit is traceable to a planned test, and the /create-pr skill's `## TDD cycles` section maps directly from the plan.
