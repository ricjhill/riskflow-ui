# TypeScript Types Reference

Shared interfaces for the RiskFlow API responses. All types are exported from `src/types/api.ts`.

---

## Session

The central object in the interactive mapping workflow.

```typescript
interface Session {
  id: string
  status: 'created' | 'finalised'
  schema_name: string
  file_path: string
  sheet_name: string | null
  source_headers: string[]
  target_fields: string[]
  mappings: ColumnMapping[]
  unmapped_headers: string[]
  preview_rows: Record<string, unknown>[]
  result: ProcessingResult | null   // populated after finalise
}
```

| Field | Description |
|-------|-------------|
| `id` | UUID identifying this session |
| `status` | `created` after upload, `finalised` after validation |
| `schema_name` | The target schema used (e.g., `standard_reinsurance`) |
| `source_headers` | Column headers found in the uploaded file |
| `target_fields` | Fields in the target schema (may include custom additions) |
| `mappings` | AI-suggested or user-edited column mappings |
| `unmapped_headers` | Source headers that aren't mapped to any target field |
| `preview_rows` | First few rows of the uploaded file for visual confirmation |
| `result` | Validation result — `null` until the session is finalised |

---

## ColumnMapping

A single source-to-target mapping with a confidence score.

```typescript
interface ColumnMapping {
  source_header: string
  target_field: string
  confidence: number        // 0.0 to 1.0
}
```

---

## MappingResult

The set of mappings and unmapped headers for a session.

```typescript
interface MappingResult {
  mappings: ColumnMapping[]
  unmapped_headers: string[]
}
```

---

## ConfidenceReport

Statistics about the mapping quality, included in `ProcessingResult`.

```typescript
interface ConfidenceReport {
  min_confidence: number
  avg_confidence: number
  low_confidence_fields: ColumnMapping[]
  missing_fields: string[]
}
```

| Field | Description |
|-------|-------------|
| `min_confidence` | Lowest confidence score across all mappings |
| `avg_confidence` | Average confidence score |
| `low_confidence_fields` | Mappings below the confidence threshold |
| `missing_fields` | Required target fields that have no mapping |

---

## ProcessingResult

The validation output after finalising a session.

```typescript
interface ProcessingResult {
  mapping: MappingResult
  confidence_report: ConfidenceReport
  valid_records: Record<string, unknown>[]
  invalid_records: Record<string, unknown>[]
  errors: RowError[]
}
```

---

## RowError

A validation error for a specific row.

```typescript
interface RowError {
  row: number
  error: string
}
```

---

## Schema

A target schema definition with fields, rules, and SLM hints.

```typescript
interface Schema {
  name: string
  fields: Record<string, SchemaField>
  cross_field_rules?: { earlier: string; later: string }[]
  slm_hints?: { source_alias: string; target: string }[]
  fingerprint?: string
}
```

---

## SchemaField

A single field in a target schema.

```typescript
interface SchemaField {
  type: 'string' | 'date' | 'float' | 'currency'
  required?: boolean
  not_empty?: boolean
  non_negative?: boolean
  allowed_values?: string[]
}
```

---

## ApiError

Structured error response from the API.

```typescript
interface ApiError {
  error_code: string
  message: string
  suggestion: string
}
```
