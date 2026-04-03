/** Shared types for the RiskFlow REST API responses. */

export interface ColumnMapping {
  source_header: string
  target_field: string
  confidence: number
}

export interface MappingResult {
  mappings: ColumnMapping[]
  unmapped_headers: string[]
}

export interface ConfidenceReport {
  min_confidence: number
  avg_confidence: number
  low_confidence_fields: ColumnMapping[]
  missing_fields: string[]
}

export interface RowError {
  row: number
  error: string
}

export interface ProcessingResult {
  mapping: MappingResult
  confidence_report: ConfidenceReport
  valid_records: Record<string, unknown>[]
  invalid_records: Record<string, unknown>[]
  errors: RowError[]
}

export interface Session {
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
  result: ProcessingResult | null
}

export interface SchemaField {
  type: 'string' | 'date' | 'float' | 'currency'
  required?: boolean
  not_empty?: boolean
  non_negative?: boolean
  allowed_values?: string[]
}

export interface Schema {
  name: string
  fields: Record<string, SchemaField>
  cross_field_rules?: { earlier: string; later: string }[]
  slm_hints?: { source_alias: string; target: string }[]
  fingerprint?: string
}

export interface ApiError {
  error_code: string
  message: string
  suggestion: string
}
