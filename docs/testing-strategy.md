# RiskFlow UI Testing Strategy

## Overview

RiskFlow UI uses two application test tiers plus a separate harness tier, aligned with the feature-based architecture. Each tier serves a distinct purpose, runs at a different speed, and catches a different class of defect.

| Tier | Convention | What it tests | Speed | When it runs |
|------|-----------|---------------|-------|-------------|
| Unit | `*.test.ts` | Isolated functions, API client wrappers | <1s | TDD loop (`npm run test:unit`) |
| Integration | `*.integration.test.tsx` | Components rendered with mocked API, user workflows | ~1s | Every commit, every PR |
| Harness | `tools/**/*.test.ts` | Boundary linter, hook scripts, gate conditions | ~2s | Separate CI job (`npx vitest run tools/`) |

Run `npm test` for the full suite (all tiers). Run `npm run test:unit` for the fast TDD inner loop.

---

## Tier 1: Unit Tests

**Convention:** `*.test.ts` (not `*.integration.test.*`)
**Run with:** `npm run test:unit`

### Purpose

Verify individual functions and classes in isolation. All external dependencies (fetch, APIs) are mocked. A unit test failure means the logic inside a single function is wrong.

### Coverage by layer

| Layer | Test file | What it covers |
|-------|-----------|---------------|
| API client | `src/api/client.test.ts` | All 11 endpoint wrappers, ApiResponseError, error handling (status codes + messages), response parsing, network failures, 204 No Content |
| Smoke | `src/test/smoke.test.ts` | Vitest runs and environment is configured |

### Test quality rules

Defined in `.claude/rules/testing.md`:

- **Happy path** — valid input produces expected output
- **Boundary values** — zero, empty string, exactly at limits
- **Invalid input** — wrong types, out-of-range, malformed strings
- **Edge cases** — empty arrays, null values, whitespace strings, duplicates
- **Match error types** — `expect().toThrow(ApiResponseError)` not just `.toThrow()`
- **Domain invariants** — dedicated tests for business rules

---

## Tier 2: Integration Tests

**Convention:** `*.integration.test.tsx`
**Run with:** `npm run test:integration`

### Purpose

Verify that components connect correctly with the API client and render the expected UI. Uses React Testing Library to render components and `mockFetch` to simulate API responses. An integration test failure means the component-to-API wiring is broken.

### What it catches that unit tests miss

- Component rendering errors (JSX, hooks, state management)
- Loading/error/success state transitions
- User interaction flows (click, type, submit)
- API response → UI mapping (does the component display what the API returns?)

### Coverage

| Component | Test file | What it covers |
|-----------|-----------|---------------|
| SchemaList | `src/components/SchemaList.integration.test.tsx` | Loading state, schema list rendering, empty list, API error, network error |

### How to write an integration test

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { mockFetch } from '@/test/mocks'
import SchemaList from './SchemaList'

it('renders schema names after loading', async () => {
  mockFetch({ schemas: ['default', 'marine'] })
  render(<SchemaList />)
  await waitFor(() => {
    expect(screen.getByRole('list', { name: 'Schemas' })).toBeInTheDocument()
  })
  expect(screen.getByText('default')).toBeInTheDocument()
})
```

Key patterns:
- Use `mockFetch` from `@/test/mocks` — never mock at the component level
- Use `screen.getByRole` over `getByTestId` — test what the user sees
- Use `waitFor` for async state updates — don't rely on timing
- Test all three states: loading, success, error

---

## Harness Tests

**Location:** `tools/__tests__/hooks.test.ts`, `tools/import-boundary-linter.test.ts`
**Run with:** `npx vitest run tools/`
**CI job:** Separate `harness` job (parallel with `quality`)

### Purpose

Verify the development harness itself — hook scripts, boundary linter, gate conditions. These are not application tests; they protect the quality gates.

### Coverage

| Tool | Test file | What it covers |
|------|-----------|---------------|
| Boundary linter | `tools/import-boundary-linter.test.ts` | Layer detection, import resolution, violation detection, AST accuracy, cross-feature blocking |
| Hook scripts | `tools/__tests__/hooks.test.ts` | All 8 hooks: gate conditions, exit codes, error messages, repo root detection |

Run `npx vitest run tools/ --reporter=verbose` for current counts.

---

## CI Pipeline

```
PR opened/updated
  ↓
quality job
  ├── npm test (unit + integration + harness)
  ├── Assert test count floor (≥ 50 — bump in ci.yml when suite grows)
  ├── tsc type check
  ├── eslint
  ├── prettier format check
  ├── Architecture boundary check (npm run lint:boundaries)
  ├── Verify generated API types match openapi.json
  ├── Upload JUnit XML artifacts (reports/unit.xml)
  └── Publish test report (dorny/test-reporter)
  ↓
harness job (parallel)
  ├── vitest run tools/ (linter + hook tests)
  └── bash -n validation of all hook scripts
  ↓
boot-test job (PRs only, if app files changed)
  ├── Docker build + run
  ├── Smoke test: index page, static assets, SPA fallback, nginx proxy
  └── Teardown
  ↓
security job
  ├── npm audit --audit-level=high
  └── Code pattern scan (XSS patterns)
```

---

## Running Tests Locally

```bash
# TDD loop — fast, unit tests only (<1s)
npm run test:unit

# TDD loop with watch mode (re-runs on file change)
npm run test:unit:watch

# Integration tests only
npm run test:integration

# All tests (unit + integration + harness — same as CI)
npm test

# All tests in watch mode
npm run test:watch

# Harness tests only
npx vitest run tools/

# Specific test file
npx vitest run src/api/client.test.ts
```

---

## Adding New Tests

### Choosing the right tier

| Question | If yes → |
|----------|----------|
| Does it test a pure function, hook, or class with no rendering? | Unit test: `Foo.test.ts` |
| Does it call `render()` from RTL with mocked fetch? | Integration test: `Foo.integration.test.tsx` |
| Does it test a hook, linter, or CI tool? | Harness test in `tools/` |

**The line between unit and integration:** If the test imports `render` from `@testing-library/react` and uses `mockFetch`, it's integration. If it tests a pure function or a hook via `renderHook` with no API calls, it's unit.

### Test coverage validation process

Before writing tests for a new feature:

1. List planned tests (happy path, boundaries, invalid input, edge cases per the rules)
2. Check against layer-specific depth requirements in `.claude/rules/testing.md`
3. Write the failing test first (RED), then implement (GREEN)
4. Commit after every green cycle
