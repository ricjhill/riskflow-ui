/**
 * Typed API client for the RiskFlow REST API.
 *
 * All functions throw on non-2xx responses. The caller is responsible
 * for error handling (try/catch or error boundaries).
 */

import type { Session, Schema, ApiError } from '../types/api'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

class ApiResponseError extends Error {
  status: number
  detail: ApiError | string

  constructor(status: number, detail: ApiError | string) {
    const msg = typeof detail === 'string' ? detail : detail.message
    super(msg)
    this.name = 'ApiResponseError'
    this.status = status
    this.detail = detail
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, init)
  if (!res.ok) {
    let detail: ApiError | string
    try {
      const body = await res.json()
      detail = body.detail ?? body
    } catch {
      detail = res.statusText
    }
    throw new ApiResponseError(res.status, detail)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// --- Health ---

export function health(): Promise<{ status: string }> {
  return request('/health')
}

// --- Schemas ---

export function listSchemas(): Promise<string[]> {
  return request<{ schemas: string[] }>('/schemas').then((r) => r.schemas)
}

export function getSchema(name: string): Promise<Schema> {
  return request(`/schemas/${name}`)
}

export function createSchema(
  body: Omit<Schema, 'fingerprint'>,
): Promise<{ name: string; fingerprint: string }> {
  return request('/schemas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// --- Sessions ---

export function createSession(file: File, schema?: string, sheetName?: string): Promise<Session> {
  const params = new URLSearchParams()
  if (schema) params.set('schema', schema)
  if (sheetName) params.set('sheet_name', sheetName)
  const qs = params.toString() ? `?${params}` : ''

  const formData = new FormData()
  formData.append('file', file)

  return request(`/sessions${qs}`, { method: 'POST', body: formData })
}

export function getSession(sessionId: string): Promise<Session> {
  return request(`/sessions/${sessionId}`)
}

export function updateMappings(
  sessionId: string,
  mappings: { source_header: string; target_field: string; confidence: number }[],
  unmappedHeaders: string[],
): Promise<Session> {
  return request(`/sessions/${sessionId}/mappings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mappings, unmapped_headers: unmappedHeaders }),
  })
}

export function addTargetFields(sessionId: string, fields: string[]): Promise<Session> {
  return request(`/sessions/${sessionId}/target-fields`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
}

export function finaliseSession(sessionId: string): Promise<Session> {
  return request(`/sessions/${sessionId}/finalise`, { method: 'POST' })
}

export function deleteSession(sessionId: string): Promise<void> {
  return request(`/sessions/${sessionId}`, { method: 'DELETE' })
}

// --- Sheets ---

export function listSheets(file: File): Promise<string[]> {
  const formData = new FormData()
  formData.append('file', file)
  return request<{ sheets: string[] }>('/sheets', { method: 'POST', body: formData }).then(
    (r) => r.sheets,
  )
}

export { ApiResponseError }
