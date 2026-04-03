# RiskFlow UI: React Frontend for the RiskFlow API

## Project Context
A React + TypeScript frontend for the RiskFlow reinsurance data mapping API. Provides an interactive Flow Mapper where users upload bordereaux files, review AI-suggested column mappings, edit them, add custom target fields, and finalise to validate rows.

## Stack
React 19, TypeScript 5.9, Vite 8, Vitest, ESLint, Prettier

---

## Architecture: Feature-Based

```
src/
  api/               # API client — typed fetch wrappers for the RiskFlow REST API
  components/        # Shared UI components (buttons, tables, layouts)
  features/
    flow-mapper/     # Interactive mapping workflow (upload → review → finalise)
    schemas/         # Schema list, schema detail, create schema
  hooks/             # Custom React hooks
  types/             # Shared TypeScript types (API response shapes)
  test/              # Test setup and utilities
```

Dependencies point inward: features use components/hooks/api, never the reverse. Components are generic — no feature-specific logic.

---

## Permissions & Tools
- Use `fetch` for API calls (no axios). Wrap in typed client functions in `src/api/`.
- Use React Router for navigation.
- Use CSS Modules or Tailwind for styling (decide at first feature).
- Do not add state management libraries (Redux, Zustand) until complexity demands it. Start with React state + context.

---

## TypeScript Conventions
- Strict mode (`strict: true` in tsconfig).
- No `any` — use `unknown` and narrow, or define proper types.
- API response types live in `src/types/` and are shared between `src/api/` and features.
- Props interfaces are co-located with their components, not in a separate file.
- Use `interface` for object shapes, `type` for unions and intersections.

---

## TDD Workflow
- Baseline: `npm test`
- After green: `npx tsc -b` then `npm run lint`
- Commit after every green cycle.

## Definition of Done
- `npm test`
- `npx tsc -b`
- `npm run lint`
- `npm run format:check`

---

## Git
- Default branch: `main`. Always use `main` when initializing repos or referencing the default branch.
- Create a feature branch before writing code. Use the format: `feature/<short-description>`.
- Do not commit directly to `main`.

---

## API Backend
- RiskFlow API runs on `http://localhost:8000`
- API docs: see `../riskflow/docs/reference/api.md`
- Key endpoints:
  - `POST /sessions` — upload file, get SLM suggestions
  - `GET /sessions/{id}` — session state
  - `PUT /sessions/{id}/mappings` — edit mappings
  - `PATCH /sessions/{id}/target-fields` — add custom fields
  - `POST /sessions/{id}/finalise` — validate rows
  - `DELETE /sessions/{id}` — cleanup
  - `GET /schemas` — list schemas
  - `GET /schemas/{name}` — schema detail
  - `POST /schemas` — create runtime schema

---

## Testing
- Use Vitest + React Testing Library.
- Test behavior, not implementation: render components, simulate user actions, assert visible output.
- API calls are mocked at the fetch level (not with MSW initially — add if complexity warrants).
- Test files live next to their source: `Foo.tsx` → `Foo.test.tsx`.

---

## Infrastructure (Docker)
- **UI:** Runs on port `3000` (nginx serving Vite build).
- nginx proxies API routes (`/sessions`, `/schemas`, `/sheets`, etc.) to the `api` service on port `8000`.
- `VITE_API_URL` is set to empty string at build time so the client uses relative URLs; nginx handles proxying.
- The `ui` service is defined in the riskflow repo's `docker-compose.yml` alongside `api`, `gui`, and `redis`.
- Start everything from the riskflow repo: `docker compose up -d`

---

## Development
```bash
# Start dev server
npm run dev

# Run tests
npm test

# Type check
npx tsc -b

# Lint and format
npm run lint
npm run format:check
```
