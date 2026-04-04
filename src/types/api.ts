/**
 * Re-export generated types with the names used across the codebase.
 * When the backend API changes, regenerate with: npm run generate:types
 */
export type { components } from './api.generated'

type Schemas = import('./api.generated').components['schemas']

// Domain types — names match what src/api/client.ts imports
export type Session = Schemas['MappingSession']
export type Schema = Schemas['TargetSchema']
export type ApiError = Schemas['ErrorDetail']
export type ColumnMapping = Schemas['ColumnMapping']
export type MappingResult = Schemas['MappingResult']
export type ConfidenceReport = Schemas['ConfidenceReport']
export type RowError = Schemas['RowError']
export type ProcessingResult = Schemas['ProcessingResult']
export type SchemaField = Schemas['FieldDefinition']

// Additional types from the backend
export type SessionStatus = Schemas['SessionStatus']
export type DateOrderingRule = Schemas['DateOrderingRule']
export type SLMHint = Schemas['SLMHint']
