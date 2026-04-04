# Architecture

RiskFlow UI uses a **feature-based architecture**. Code is organized by what it does, not by what type of file it is.

## Directory structure

```
src/
  api/               # Typed fetch wrappers for the RiskFlow REST API
  components/        # Shared UI components (empty — populated as features are built)
  features/
    flow-mapper/     # Interactive mapping workflow (empty — first feature to build)
  hooks/             # Custom React hooks (empty — populated as features are built)
  types/             # Shared TypeScript types (API response shapes)
  test/              # Test setup and utilities
```

## Dependency direction

Dependencies only point inward. This rule prevents circular imports and keeps features independent.

```
features/  →  components/  →  (no project imports)
    ↓             ↓
  hooks/        hooks/
    ↓             ↓
   api/          api/
    ↓             ↓
  types/        types/
```

**Rules:**
- Features import from `components/`, `hooks/`, `api/`, and `types/`
- Components import from `hooks/`, `api/`, and `types/` — never from `features/`
- No circular dependencies between features
- Components are generic — no feature-specific logic

## Feature structure

Each feature is self-contained in `src/features/<name>/`. A feature owns its own components, hooks, and styles when they aren't shared. Anything reusable across features moves to the top-level `components/` or `hooks/` directories.

## API integration

The UI communicates with the RiskFlow backend exclusively through typed client functions in `src/api/client.ts`. Features never call `fetch` directly — they use the client functions which handle base URL resolution, JSON parsing, and error wrapping.

See [API Integration](api-integration.md) for details on how the client works.

## Styling

Plain CSS with CSS custom properties (variables). Dark mode is supported via `prefers-color-scheme` media query. No CSS framework (Tailwind, CSS modules) has been adopted yet — this decision is deferred until the first feature implementation establishes the pattern.

## State management

React state and context only. No external state libraries (Redux, Zustand) until complexity demands it. The API client functions return promises — features manage loading/error/success states locally.
