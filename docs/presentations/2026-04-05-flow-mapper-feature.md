# Building the Flow Mapper Feature

**RiskFlow UI Engineering Session — 5 April 2026**

---

## Agenda

| # | Section | Time |
|---|---------|------|
| 1 | What We Built | 3 min |
| 2 | The Plan: 7 PRs in Dependency Order | 5 min |
| 3 | The Upload Step: Hooks + Context + Components | 5 min |
| 4 | The Mapping Canvas: ReactFlow + Pure Functions | 7 min |
| 5 | The Barycenter Heuristic | 5 min |
| 6 | The Results Step: Finalisation + Validation Display | 3 min |
| 7 | CSS Styling: One File Per Owner | 5 min |
| 8 | Agent-to-Agent Code Review | 5 min |
| 9 | Browser Testing with Rodney | 3 min |
| 10 | By the Numbers | 2 min |
| 11 | Lessons Learned | 3 min |
| 12 | What's Next | 2 min |

---

## 1. What We Built (3 min)

A **3-step interactive workflow** for mapping reinsurance bordereaux columns to target schema fields:

| Step | What the user does | What the code does |
|------|-------------------|-------------------|
| Upload | Select schema, upload CSV/Excel | `useSchemas` fetches schemas, `useSession.create` calls API |
| Review | See AI mappings, edit with two-click | ReactFlow canvas, `buildNodes`/`buildEdges`, `applySnap` |
| Results | Finalise, review errors | `finalise()` API call, `ProcessingResult` display |

Starting point: hooks, API client, and shared components existed but no feature code.

Ending point: 8 PRs merged, 172 tests, full styled workflow with edge crossing optimisation.

---

## 2. The Plan: 7 PRs in Dependency Order (5 min)

We wrote the entire plan before writing any code. Each PR was structured as numbered TDD loops.

```
PR 1b (useSchemas + useSession hooks)
  └─► PR 2 (page shell + upload step)
       ├─► PR 3a (boundary linter @/ alias fix)
       └─► PR 3b (ReactFlow mapping canvas)
            └─► PR 4 (results + finalisation)
                 ├─► PR 5 (CSS styling)
                 └─► PR 6 (barycenter layout)
```

### Why this order matters

- PR 1b had to land first — every feature component depends on `useSession`
- PR 3a had to land before PR 3b — the boundary linter would have been blind to `@/` imports
- PR 5 and PR 6 were independent — could have been parallel

**Design decision:** Each PR is a self-contained vertical slice. No PR leaves the app in a broken state. Every PR passes all existing tests plus its own new ones.

---

## 3. The Upload Step: Hooks + Context + Components (5 min)

### The hooks layer (PR 1b)

Two hooks wrapping the API client in React state:

```typescript
// useSchemas — fetch-on-mount with loading/error
export function useSchemas() {
  const [schemas, setSchemas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    listSchemas().then(setSchemas).catch(...).finally(...)
  }, [])
  return { schemas, loading, error }
}

// useSession — full lifecycle
export function useSession() {
  // create, updateMappings, finalise, destroy
  // each with try/catch setting error state
  return { session, error, loading, create, updateMappings, finalise, destroy }
}
```

**Design decision:** `create` returns `Promise<boolean>` instead of `void`. This avoids the stale closure bug where checking `sessionCtx.error` after `await sessionCtx.create()` reads the pre-call value (React state updates are async).

### The SessionContext pattern (PR 2)

```typescript
type SessionContextValue = ReturnType<typeof useSession>
const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }) {
  const session = useSession()
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}
```

One `useSession` instance shared by all feature components. No prop drilling. The provider wraps the entire FlowMapper route.

### The UploadStep (PR 2)

Six TDD loops:
1. Schema picker from `useSchemas`
2. FileUpload with `.csv,.xlsx,.xls` accept
3. Excel sheet detection via `listSheets` API
4. Session creation and step advance
5. Error display from session context

**Design decision:** `listSheets` is called directly (not a hook) because it's a one-shot call on file select, not ongoing state.

---

## 4. The Mapping Canvas: ReactFlow + Pure Functions (7 min)

### The key insight: separate graph logic from React

All graph operations are pure functions in `graph-utils.ts` — no ReactFlow dependency needed for testing:

| Function | Input | Output |
|----------|-------|--------|
| `buildNodes` | headers, fields, mappings | `Node[]` with positions |
| `buildEdges` | mappings | `Edge[]` with confidence data |
| `confidenceColor` | score (0-1) | `'high'` \| `'medium'` \| `'low'` \| `'none'` |
| `applySnap` | edges, source, target | new `Edge[]` (1:1 constraint) |
| `edgesToMappings` | edges | `ColumnMapping[]` |
| `barycenterSort` | sources, targets, mappings | reordered targets |

**12 unit tests** cover these without rendering a single React component.

### Custom node and edge components

```
SourceHeaderNode — right-side Handle, .source-node--unmapped pulse animation
TargetFieldNode  — left-side Handle, .target-node--connected green border
RiskFlowEdge     — dual-path (glow + flow), stroke width 2-18px by confidence
```

**The Bezier bug:** The first implementation omitted `sourcePosition`/`targetPosition` in the `getBezierPath` call. Without these, the Bezier degenerates to a straight line regardless of curvature setting. The code reviewer caught this — it was the key finding that justified the agent review gate.

### Two-Click Snap interaction

1. User clicks a source node → `activeSource` set
2. User clicks a target node → `applySnap(edges, source, target)` called
3. `applySnap` removes any existing edge to that target (1:1 constraint), adds new edge at confidence 1.0
4. Local edge state updated — no API call yet
5. User clicks "Save Mappings" → `edgesToMappings(edges)` → `updateMappings()` API call

**Design decision:** Local edge state for optimistic editing. Users can make multiple changes before saving. This is the right UX for a mapping review — you don't want an API round-trip for every click.

---

## 5. The Barycenter Heuristic (5 min)

### The problem

The AI maps `Ref #` → `Arrival_Date`, `Vessel / Ship` → `Port_Of_Loading`, etc. The original column order rarely matches the target field order. Result: a tangle of crossing edges.

### The algorithm

For each target node, compute the **barycenter** — the average Y-index of its connected source nodes. Sort targets by this value. Unconnected targets go to the end.

```typescript
export function barycenterSort(sources, targets, mappings) {
  const sourceIndex = new Map(sources.map((s, i) => [s, i]))
  // For each target: average index of connected sources
  // Sort by barycenter, append unconnected
}
```

### Before vs after

**Before:** Sources [A,B,C,D] → Targets [T1,T2,T3,T4] with A→T4, B→T3, C→T2, D→T1. Every edge crosses every other — 6 crossings.

**After:** Targets reordered to [T4,T3,T2,T1]. Zero crossings.

Single-pass, O(n*m) complexity. Integrated into `buildNodes` — the caller sees clean layouts without knowing reordering happened.

---

## 6. The Results Step: Finalisation + Validation Display (3 min)

### What it shows

| Before finalise | After finalise |
|----------------|---------------|
| "4 mapped, 2 unmapped" | "10 valid, 3 invalid" |
| Finalise button | Error table (row + message) |
| | Confidence report (min/avg) |
| Back / Start New | Back / Start New |

### The `loading` state addition

`useSession` didn't have `loading` — we added it for the Finalise button. Wraps the `finalise()` call with `setLoading(true)` / `finally { setLoading(false) }`.

**Code reviewer caught two gaps:**
1. No test asserting Finalise button is hidden when session is already finalised (business invariant)
2. No hook-level test for the `loading` lifecycle (true during call, false after success/failure)

Both fixed before merge.

### The `ProcessingResult` cast

`session.result` is typed as `{ [key: string]: unknown } | null` in the generated types (the API returns a generic object). At runtime it's a `ProcessingResult` when finalised. We cast with `as ProcessingResult | null` — no runtime validation. Acknowledged as a known limitation.

---

## 7. CSS Styling: One File Per Owner (5 min)

### The rule

Each component owns its own styles. Feature CSS only styles feature-owned elements.

```
src/components/Stepper.css      → styles .stepper-*
src/components/FileUpload.css   → styles .file-upload-*
src/components/ApiStatus.css    → styles .api-status-*
src/features/flow-mapper/flow-mapper.css
                                → styles .upload-step-*, .mapping-step-*,
                                  .source-node-*, .target-node-*, .results-step-*
```

**The code reviewer caught the violation:** The first draft put Stepper and FileUpload styles in `flow-mapper.css`. This inverts the dependency direction — if Stepper is used in another feature, it would be unstyled. Fixed by extracting to component-owned CSS files.

### Dark mode via CSS variables

All colours reference `--accent`, `--confidence-high`, `--confidence-medium`, `--confidence-low`, `--text`, `--bg`, `--border` — defined in `index.css` with dark mode overrides.

**The reviewer also caught:** `rgba(239, 68, 68, 0.1)` in `.results-step-error` hardcoded the light-mode red. Fixed with `color-mix(in srgb, var(--confidence-low) 10%, transparent)`.

---

## 8. Agent-to-Agent Code Review (5 min)

Every PR goes through the `code-reviewer` agent before creation. The reviewer checks:

1. **Architecture** — layer violations, cross-feature imports, boundary linter result
2. **Types** — no `any`, correct imports from `@/types/api`
3. **Test coverage** — missing behaviors, boundary values, error paths
4. **Security** — XSS, injection, hardcoded secrets
5. **PR accuracy** — every claim verified against actual code

### What the reviewer caught (highlights)

| PR | Finding | Severity |
|----|---------|----------|
| #30 | `sourcePosition`/`targetPosition` not forwarded to `getBezierPath` — Bezier renders as straight line | Blocking |
| #30 | `edgesToMappings` private and untested | Blocking |
| #31 | No test for Finalise button hidden when finalised | Blocking |
| #31 | `loading` lifecycle untested at hook level | Blocking |
| #32 | Stepper/FileUpload styles in feature CSS — dependency inversion | Blocking |
| #32 | Hardcoded rgba() for dark mode | Blocking |

6 blocking findings across 3 PRs. All fixed before merge. None would have been caught by tsc, eslint, or vitest.

---

## 9. Browser Testing with Rodney (3 min)

### The `/screenshot` skill

Built a custom skill that automates headless Chrome via `uvx rodney`:

```bash
uvx rodney start                    # launch Chrome
uvx rodney open http://localhost:5173/flow-mapper
uvx rodney waitload
uvx rodney waitstable
uvx rodney screenshot /tmp/flow-mapper.png
uvx rodney exists "ol[role='list']" # assert stepper exists
uvx rodney exists "select#schema-select"
uvx rodney exists "[data-testid='file-input']"
```

Runs against all 3 routes, takes screenshots, runs 6 element assertions. Used after every CSS PR to verify visual output.

### Lessons for Rodney usage

- Keep Chrome alive across the session — only `rodney stop` at the end
- Use `rodney text`/`rodney exists` for quick checks, screenshots only when layout matters
- If the dev server restarts, Chrome connection drops — restart with `rodney start`

---

## 10. By the Numbers (2 min)

| Metric | Value |
|--------|-------|
| PRs merged | 8 |
| Tests added | 61 (111 → 172) |
| Test files | 18 |
| Lines of feature code | ~900 |
| Lines of feature CSS | ~600 |
| Lines of test code | ~700 |
| Custom React hooks | 2 (useSchemas, useSession) |
| Pure utility functions | 6 (graph-utils) |
| Custom ReactFlow components | 3 (2 nodes, 1 edge) |
| Feature components | 4 (UploadStep, MappingStep, ResultsStep, FlowMapper) |
| Agent review rounds | 11 (8 first-pass + 3 re-reviews after fixes) |
| Blocking findings caught by reviewer | 6 |
| Skills created | 1 (/screenshot) |

---

## 11. Lessons Learned (3 min)

### 1. Pure functions are the best testing strategy for visual components

`buildNodes`, `buildEdges`, `applySnap`, `barycenterSort` — all testable without React, ReactFlow, or jsdom. The MappingStep integration test only needed 3 tests because the hard logic was already covered by 12 unit tests.

### 2. Agent code review catches what automated checks miss

The Bezier position bug compiled, linted, and passed all tests. It only failed visually — the edges were straight lines instead of curves. The reviewer read the ReactFlow docs semantics and flagged it. Automated tools check syntax; agents check intent.

### 3. Stale closures are the #1 React hook bug

`useSession.create` originally returned `void`. The UploadStep checked `sessionCtx.error` after `await sessionCtx.create()` — but error was still `null` (stale closure). Fix: return `Promise<boolean>`. This pattern should be standard for any async hook method where the caller needs to act on the result.

### 4. CSS ownership follows component ownership

The first styling attempt put shared component styles in the feature CSS. The reviewer caught it: "if Stepper is used in another feature, it will be unstyled." Rule: the component that defines the class names owns the CSS file. Features only style their own elements.

### 5. Barycenter is the right default for bipartite graph layout

One function, 45 lines, single pass. Transforms an unreadable tangle into a clean parallel layout. Should be the default for any two-column mapping visualisation.

---

## 12. What's Next (2 min)

### The core workflow is complete

Upload → Review → Finalise works end-to-end. CSS is applied. Edge crossings are minimised. All 172 tests pass.

### Remaining items (deferred)

| Item | Why deferred |
|------|-------------|
| + New Field modal | Core workflow works without it |
| Error boundaries | Pre-existing app-wide gap |
| Focus-visible accessibility | Needs design input |
| SVG glow filters on edges | Requires component changes |
| Responsive breakpoints | Needs design input |
| E2E tests with Rodney | Manual verification sufficient for now |
