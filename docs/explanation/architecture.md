# Architecture

RiskFlow UI uses a **feature-based architecture**. Code is organized by what it does, not by what type of file it is.

## Directory structure

```
src/
  api/               # Typed fetch wrappers for the RiskFlow REST API
  components/        # Shared UI components (Stepper, FileUpload, SchemaList, ApiStatus)
  features/
    flow-mapper/     # Interactive mapping workflow (upload → review → finalise)
  hooks/             # Custom React hooks (useSession, useSchemas)
  types/             # Shared TypeScript types (API response shapes)
  test/              # Test setup and utilities
```

## Dependency direction

Dependencies only point inward. This rule is enforced at build time by the [import boundary linter](../reference/tooling.md).

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

These rules are checked on every commit via a pre-commit hook and on every PR via CI (`npm run lint:boundaries`).

## Feature structure

Each feature is self-contained in `src/features/<name>/`. A feature owns its own components, hooks, styles, and context providers when they aren't shared. Anything reusable across features moves to the top-level `components/` or `hooks/` directories.

The Flow Mapper feature (`src/features/flow-mapper/`) contains:

| File | Purpose |
|------|---------|
| `FlowMapper.tsx` | 3-step workflow shell (Upload → Review → Results) |
| `UploadStep.tsx` | Schema selection, file upload, sheet detection |
| `MappingStep.tsx` | ReactFlow canvas with two-click snap interaction |
| `ResultsStep.tsx` | Finalisation, validation results display |
| `SessionContext.tsx` | React Context wrapping `useSession` for the feature |
| `graph-utils.ts` | Pure functions: node/edge building, barycenter layout, snap logic |
| `nodes/` | Custom ReactFlow node components (SourceHeaderNode, TargetFieldNode) |
| `edges/` | Custom ReactFlow edge component (RiskFlowEdge) |
| `flow-mapper.css` | Feature-scoped styles |

## API integration

The UI communicates with the RiskFlow backend exclusively through typed client functions in `src/api/client.ts`. Features never call `fetch` directly — they use the client functions which handle base URL resolution, JSON parsing, and error wrapping.

See [API Integration](api-integration.md) for details on how the client works.

## State management

React state and context only. No external state libraries (Redux, Zustand).

The primary pattern is a **hook + context** combination:

1. `useSession()` hook manages all session state (create, updateMappings, finalise, destroy)
2. `SessionProvider` wraps the feature, providing a single `useSession` instance via React Context
3. Feature components consume session state via `useSessionContext()`

This avoids prop drilling while keeping the hook testable in isolation (hooks have their own unit tests, independent of the context wrapper).

## Styling

Plain CSS with CSS custom properties (variables). Each component owns its own CSS file — feature CSS only styles feature-owned elements.

- Dark mode supported via `prefers-color-scheme` media query
- Confidence-level colours: `--confidence-high`, `--confidence-medium`, `--confidence-low`, `--confidence-none`
- Layout variables: `--accent`, `--text`, `--bg`, `--border`

See the [presentation on CSS styling](../presentations/2026-04-05-flow-mapper-feature.md#7-css-styling-one-file-per-owner-5-min) for the ownership rule and how it was established.

## Routing

React Router with lazy loading. Routes are defined in `src/App.tsx`:

| Route | Component | Loading |
|-------|-----------|---------|
| `/` | `Home` (inline) | Immediate |
| `/flow-mapper` | `FlowMapper` | Lazy (`React.lazy` + `Suspense`) |
| `/api-status` | `ApiStatus` | Immediate |
