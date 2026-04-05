# Tutorial: Map a Bordereaux File

Walk through the full mapping workflow: upload a file, review AI-suggested mappings, edit them, and finalise.

## Prerequisites

- Dev server running (`npm run dev`)
- RiskFlow API running on `http://localhost:8000` (see [Getting Started](getting-started.md))
- A CSV or Excel file with column headers (e.g., a bordereaux file)
- At least one target schema available in the API

## 1. Open the Flow Mapper

Navigate to http://localhost:5173/flow-mapper. You see the 3-step workflow with Upload as the active step.

## 2. Select a schema and upload

1. Pick a target schema from the dropdown (these come from `GET /schemas`)
2. Click the file input and select your CSV or Excel file
3. If you selected an Excel file with multiple sheets, a sheet picker appears — select the sheet to map
4. Click **Upload**

The UI sends `POST /sessions` with your file. The API returns AI-suggested column mappings.

## 3. Review mappings on the canvas

The Review step shows a two-column graph:
- **Left column:** your file's source headers
- **Right column:** the target schema's fields
- **Edges:** AI-suggested mappings, with stroke width indicating confidence

The target fields are automatically reordered to minimise edge crossings (barycenter heuristic).

### Edit a mapping

1. Click a **source header** on the left — it becomes the active source
2. Click a **target field** on the right — a new edge is created at confidence 1.0
3. Any previous edge to that target is removed (each target can only be mapped once)

Repeat for any mappings you want to change. Edits are local until you save.

### Save

Click **Save Mappings**. This sends `PUT /sessions/{id}/mappings` with your edited mappings and advances to the Results step.

## 4. Finalise and review results

The Results step shows how many columns are mapped vs unmapped.

1. Click **Finalise** — the API validates every row against the target schema
2. Results appear:
   - **Valid/invalid record counts**
   - **Error table** listing row numbers and error messages
   - **Confidence report** with min and avg confidence scores

### What next

- Click **Back** to return to the canvas and edit further
- Click **Start New** to destroy this session and begin again with a different file
