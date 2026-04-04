# API Integration

The UI communicates with the RiskFlow backend through a typed API client. This page explains how that integration works.

## The API client

All API calls go through `src/api/client.ts`. Every endpoint has a typed wrapper function that returns a `Promise` of the expected response type. Functions throw `ApiResponseError` on non-2xx responses — callers handle errors via try/catch or React error boundaries.

```typescript
import { createSession, finaliseSession } from '../api/client'

// Upload a file and get AI-suggested mappings
const session = await createSession(file, 'standard_reinsurance')

// Later, after the user reviews and edits mappings
const result = await finaliseSession(session.id)
```

## Base URL resolution

The client reads `VITE_API_URL` from the environment at build time:

```typescript
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
```

| Environment | `VITE_API_URL` | Result |
|-------------|----------------|--------|
| Local dev | `http://localhost:8000` (from `.env`) | Calls API directly |
| Docker | `""` (empty, set in Dockerfile) | Relative URLs — nginx proxies to API |
| Custom | Any URL | Calls that URL |

## Error handling

All client functions throw `ApiResponseError` on failure. This class provides:

- `status` — the HTTP status code (e.g., 400, 404, 503)
- `detail` — either a structured `ApiError` object (with `error_code`, `message`, `suggestion`) or a plain string

```typescript
import { ApiResponseError } from '../api/client'

try {
  await finaliseSession(sessionId)
} catch (err) {
  if (err instanceof ApiResponseError) {
    console.error(`HTTP ${err.status}: ${err.message}`)
  }
}
```

## The Session workflow

The RiskFlow API uses an interactive session model. The UI drives this workflow:

```
createSession(file)     →  Session { status: 'created', mappings, unmapped_headers }
    ↓
updateMappings(id, ...)  →  Session (updated mappings)
addTargetFields(id, ...) →  Session (updated target_fields)
    ↓
finaliseSession(id)     →  Session { status: 'finalised', result: ProcessingResult }
    ↓
deleteSession(id)       →  void (cleanup)
```

1. **createSession** — uploads the file and returns AI-suggested mappings with confidence scores
2. **updateMappings** — the user edits mappings (change target fields, adjust confidence, mark unmapped)
3. **addTargetFields** — the user adds custom fields not in the original schema
4. **finaliseSession** — validates all rows against the schema, returns valid/invalid records and errors
5. **deleteSession** — cleans up the session and temporary file on the server

## Other endpoints

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `health()` | `GET /health` | API health check |
| `listSchemas()` | `GET /schemas` | List available target schemas |
| `getSchema(name)` | `GET /schemas/{name}` | Get a schema's fields and rules |
| `createSchema(body)` | `POST /schemas` | Create a runtime schema |
| `listSheets(file)` | `POST /sheets` | List sheet names in an Excel file |
