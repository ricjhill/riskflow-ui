# Flow Mapper

The Flow Mapper is the primary feature of RiskFlow UI. It provides a 3-step interactive workflow where users upload bordereaux files, review AI-suggested column mappings on a visual canvas, and finalise to validate rows against a target schema.

## Workflow steps

### Step 1: Upload

The user selects a target schema, uploads a CSV or Excel file, and optionally picks a sheet (for multi-sheet Excel files).

**What happens:**
1. `useSchemas()` fetches available schemas on mount
2. User selects a file — if Excel, `listSheets()` is called to populate the sheet picker
3. User clicks Upload — `useSession.create()` sends the file to `POST /sessions`
4. The API returns a `Session` with AI-suggested `mappings`, `source_headers`, and `target_fields`
5. On success, the workflow advances to Step 2

### Step 2: Review (Mapping Canvas)

The user sees a two-column bipartite graph: source headers on the left, target fields on the right, connected by edges representing the AI's suggested mappings.

**Two-click snap interaction:**
1. Click a source node — it becomes the active source
2. Click a target node — `applySnap()` creates a new edge at confidence 1.0, removing any existing edge to that target (1:1 constraint)
3. Changes are local — no API call until the user clicks Save Mappings

**Graph construction (pure functions in `graph-utils.ts`):**

| Function | What it does |
|----------|-------------|
| `buildNodes()` | Converts headers/fields into positioned ReactFlow nodes |
| `buildEdges()` | Converts `ColumnMapping[]` into ReactFlow edges with confidence data |
| `barycenterSort()` | Reorders target nodes to minimise edge crossings |
| `applySnap()` | Adds/replaces an edge, enforcing the 1:1 target constraint |
| `edgesToMappings()` | Converts ReactFlow edges back to `ColumnMapping[]` for the API |
| `confidenceColor()` | Maps a confidence score (0–1) to `high`/`medium`/`low`/`none` |

**Barycenter layout:** For each target, compute the average Y-index of its connected sources. Sort targets by this value. Unconnected targets go to the end. This single-pass algorithm transforms crossing-heavy layouts into clean parallel layouts.

**When the user clicks Save Mappings:**
- `edgesToMappings()` converts local edges to `ColumnMapping[]`
- `updateMappings()` sends them to `PUT /sessions/{id}/mappings`
- Workflow advances to Step 3

### Step 3: Results

The user sees a mapping summary (N mapped, M unmapped) and can finalise to validate all rows.

**Finalisation:**
1. User clicks Finalise — `finaliseSession()` calls `POST /sessions/{id}/finalise`
2. The API validates every row against the target schema
3. Results display: valid/invalid record counts, an error table (row + message), and confidence report (min/avg)
4. User can go Back to edit or Start New to destroy the session and begin again

## Key design decisions

**Optimistic local editing:** The mapping canvas maintains local edge state. Users can make multiple changes before saving. This avoids an API round-trip for every click — the right UX for a review workflow.

**Pure function extraction:** All graph logic is in `graph-utils.ts` with no React or ReactFlow dependency. This makes the hard logic testable with simple unit tests (12 tests) without rendering any components.

**`useSession.create()` returns `Promise<boolean>`:** This avoids the stale closure bug where checking `sessionCtx.error` after `await sessionCtx.create()` reads the pre-call value (React state updates are async). Callers check the return value instead.

**SessionContext pattern:** One `useSession()` instance shared by all feature components via React Context. The context wrapper is in `SessionContext.tsx` — it exists so that UploadStep, MappingStep, and ResultsStep all operate on the same session without prop drilling.

## Custom ReactFlow components

| Component | Type | Purpose |
|-----------|------|---------|
| `SourceHeaderNode` | Node | Displays a source column header; pulses when unmapped |
| `TargetFieldNode` | Node | Displays a target schema field; green border when connected |
| `RiskFlowEdge` | Edge | Dual-path Bezier (glow + flow); stroke width scales with confidence (2–18px) |
