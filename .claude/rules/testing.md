# Testing Rules

## Test quality requirements
Every test must cover:
- Happy path (expected input produces expected output)
- Boundary values (zero, exactly at limits, one past limits)
- Edge cases (empty arrays, null values, whitespace strings)
- Error cases (invalid input, network failures, missing data)

## Test organization
- Test files live next to source: `Foo.tsx` → `Foo.test.tsx`
- Use `describe` blocks for grouping related tests
- Test behavior, not implementation — simulate user actions, assert visible output
- Mock at the fetch level for API tests, not at the component level

## Coverage by layer
- **API client**: every endpoint wrapper, error handling, response parsing
- **Components**: rendering, user interaction, prop variations
- **Features**: integration of components + API client, user workflows
- **Hooks**: input/output behavior, edge cases

## What NOT to test
- Third-party library internals (React, React Router)
- CSS styling (unless it affects behavior)
- Implementation details (state variable names, internal function calls)
