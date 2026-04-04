---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "tools/**/*.test.ts"
---

# Testing Rules

## Default coverage (applies unless layer rules below say otherwise)
- **Happy path** — valid input produces expected output
- **Boundary values** — zero, empty string, exactly at limits (0, 1), one past limits (-1, 2)
- **Invalid input** — wrong types, out-of-range, malformed strings
- **Edge cases** — empty arrays, null values, whitespace strings, duplicates

## Match error types and messages
Use `expect().toThrow(ApiResponseError)` not just `expect().toThrow()`. This proves the right error class was thrown, not an unrelated one. When the error message matters, assert on it: `expect(err.message).toContain('not found')`.

## Test domain invariants explicitly
If a component or hook has a business rule (e.g., "disable submit when no mappings selected", "show error when confidence below threshold"), write a dedicated test for it. Don't rely on it being caught indirectly by another test.

## Test organization
- Test files live next to source: `Foo.tsx` → `Foo.test.tsx`
- Use `describe` blocks for grouping related tests
- Test behavior, not implementation — simulate user actions, assert visible output
- Mock at the fetch level using `mockFetch` from `@/test/mocks`, not at the component level

## Test depth by layer
- **API client** — every endpoint wrapper, error handling (status codes + error messages), response parsing, network failures
- **Components** — rendering, user interaction, prop variations, loading/error/success states
- **Features** — integration of components + API client, user workflows, state transitions
- **Hooks** — input/output behavior, edge cases, cleanup on unmount
- **Types/harness** — boundary linter rules, hook gate conditions, exit codes

## What NOT to test
- Third-party library internals (React, React Router)
- CSS styling (unless it affects behavior)
- Implementation details (state variable names, internal function calls)
