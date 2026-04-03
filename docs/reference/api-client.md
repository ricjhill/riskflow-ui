# API Client Reference

Typed fetch wrappers for the RiskFlow REST API. All functions are exported from `src/api/client.ts`.

Every function throws `ApiResponseError` on non-2xx responses.

---

## Health

### `health()`

```typescript
health(): Promise<{ status: string }>
```

Calls `GET /health`. Returns `{ status: "ok" }` when the API is running.

---

## Schemas

### `listSchemas()`

```typescript
listSchemas(): Promise<string[]>
```

Calls `GET /schemas`. Returns an array of schema names (e.g., `["standard_reinsurance", "marine_cargo"]`).

### `getSchema(name)`

```typescript
getSchema(name: string): Promise<Schema>
```

Calls `GET /schemas/{name}`. Returns the full schema definition including fields, cross-field rules, and SLM hints.

### `createSchema(body)`

```typescript
createSchema(body: Omit<Schema, 'fingerprint'>): Promise<{ name: string; fingerprint: string }>
```

Calls `POST /schemas` with a JSON body. Creates a runtime schema. Returns the name and fingerprint of the created schema.

---

## Sessions

### `createSession(file, schema?, sheetName?)`

```typescript
createSession(file: File, schema?: string, sheetName?: string): Promise<Session>
```

Calls `POST /sessions` with a multipart form upload. Optional query parameters `schema` and `sheet_name` are appended if provided. Returns a `Session` with status `created`, AI-suggested mappings, and preview rows.

### `getSession(sessionId)`

```typescript
getSession(sessionId: string): Promise<Session>
```

Calls `GET /sessions/{id}`. Returns the current session state.

### `updateMappings(sessionId, mappings, unmappedHeaders)`

```typescript
updateMappings(
  sessionId: string,
  mappings: { source_header: string; target_field: string; confidence: number }[],
  unmappedHeaders: string[],
): Promise<Session>
```

Calls `PUT /sessions/{id}/mappings` with a JSON body. Replaces the session's mappings with the provided set. Returns the updated session.

### `addTargetFields(sessionId, fields)`

```typescript
addTargetFields(sessionId: string, fields: string[]): Promise<Session>
```

Calls `PATCH /sessions/{id}/target-fields` with a JSON body. Adds custom target fields to the session's schema. Returns the updated session with the new fields available for mapping.

### `finaliseSession(sessionId)`

```typescript
finaliseSession(sessionId: string): Promise<Session>
```

Calls `POST /sessions/{id}/finalise`. Validates all rows against the schema using the current mappings. Returns the session with status `finalised` and a `result` containing valid records, invalid records, and errors.

### `deleteSession(sessionId)`

```typescript
deleteSession(sessionId: string): Promise<void>
```

Calls `DELETE /sessions/{id}`. Cleans up the session and its temporary file on the server. Returns nothing (HTTP 204).

---

## Sheets

### `listSheets(file)`

```typescript
listSheets(file: File): Promise<string[]>
```

Calls `POST /sheets` with a multipart form upload. Returns an array of sheet names found in the file. For CSV files, returns an empty array.

---

## Error class

### `ApiResponseError`

```typescript
class ApiResponseError extends Error {
  status: number
  detail: ApiError | string
}
```

Thrown by all client functions on non-2xx responses. The `detail` is either a structured `ApiError` (with `error_code`, `message`, `suggestion`) or a plain string if the response body isn't JSON.
