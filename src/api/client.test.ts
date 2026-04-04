import { describe, it, expect } from 'vitest'
import { mockFetch, mockFetchError } from '@/test/mocks'
import {
  health,
  listSchemas,
  getSchema,
  createSchema,
  createSession,
  getSession,
  updateMappings,
  addTargetFields,
  finaliseSession,
  deleteSession,
  listSheets,
  ApiResponseError,
} from './client'

// ─── ApiResponseError ───────────────────────────────────────────────────────

describe('ApiResponseError', () => {
  it('exposes status and string detail', () => {
    const err = new ApiResponseError(404, 'Not found')
    expect(err.status).toBe(404)
    expect(err.detail).toBe('Not found')
    expect(err.message).toBe('Not found')
    expect(err.name).toBe('ApiResponseError')
  })

  it('exposes status and structured detail', () => {
    const detail = { error_code: 'NOT_FOUND', message: 'Session not found', suggestion: 'Check ID' }
    const err = new ApiResponseError(404, detail)
    expect(err.status).toBe(404)
    expect(err.detail).toEqual(detail)
    expect(err.message).toBe('Session not found')
  })
})

// ─── health ─────────────────────────────────────────────────────────────────

describe('health', () => {
  it('returns health status', async () => {
    mockFetch({ status: 'ok' })
    const result = await health()
    expect(result).toEqual({ status: 'ok' })
  })

  it('throws ApiResponseError on server error', async () => {
    mockFetch({ detail: 'Internal error' }, { status: 500 })
    await expect(health()).rejects.toThrow(ApiResponseError)
  })

  it('propagates network errors', async () => {
    mockFetchError('Network error')
    await expect(health()).rejects.toThrow('Network error')
  })
})

// ─── listSchemas ────────────────────────────────────────────────────────────

describe('listSchemas', () => {
  it('returns array of schema names', async () => {
    mockFetch({ schemas: ['default', 'custom'] })
    const result = await listSchemas()
    expect(result).toEqual(['default', 'custom'])
  })

  it('returns empty array when no schemas', async () => {
    mockFetch({ schemas: [] })
    const result = await listSchemas()
    expect(result).toEqual([])
  })

  it('throws on error', async () => {
    mockFetch({ detail: 'Server error' }, { status: 500 })
    await expect(listSchemas()).rejects.toThrow(ApiResponseError)
  })
})

// ─── getSchema ──────────────────────────────────────────────────────────────

describe('getSchema', () => {
  it('returns schema object', async () => {
    const schema = { name: 'default', fields: { insured_name: { type: 'string' } } }
    mockFetch(schema)
    const result = await getSchema('default')
    expect(result).toEqual(schema)
  })

  it('throws on 404', async () => {
    mockFetch({ detail: 'Schema not found' }, { status: 404 })
    await expect(getSchema('nonexistent')).rejects.toThrow(ApiResponseError)
  })
})

// ─── createSchema ───────────────────────────────────────────────────────────

describe('createSchema', () => {
  it('returns name and fingerprint', async () => {
    mockFetch({ name: 'custom', fingerprint: 'abc123' })
    const result = await createSchema({ name: 'custom', fields: {} })
    expect(result).toEqual({ name: 'custom', fingerprint: 'abc123' })
  })

  it('throws on conflict', async () => {
    mockFetch({ detail: 'Schema already exists' }, { status: 409 })
    await expect(createSchema({ name: 'default', fields: {} })).rejects.toThrow(ApiResponseError)
  })
})

// ─── createSession ──────────────────────────────────────────────────────────

describe('createSession', () => {
  const mockSession = {
    id: 'sess-1',
    status: 'created',
    schema_name: 'default',
    file_path: '/tmp/file.csv',
    sheet_name: null,
    source_headers: ['col1', 'col2'],
    target_fields: ['insured_name'],
    mappings: [],
    unmapped_headers: [],
    preview_rows: [],
    result: null,
  }

  it('returns session from file upload', async () => {
    mockFetch(mockSession)
    const file = new File(['data'], 'test.csv', { type: 'text/csv' })
    const result = await createSession(file)
    expect(result.id).toBe('sess-1')
    expect(result.status).toBe('created')
  })

  it('passes schema and sheet_name as query params', async () => {
    const mock = mockFetch(mockSession)
    const file = new File(['data'], 'test.xlsx', { type: 'application/octet-stream' })
    await createSession(file, 'custom', 'Sheet2')
    const calledUrl = mock.mock.calls[0][0] as string
    expect(calledUrl).toContain('schema=custom')
    expect(calledUrl).toContain('sheet_name=Sheet2')
  })

  it('throws on validation error', async () => {
    mockFetch({ detail: 'Invalid file' }, { status: 422 })
    const file = new File([''], 'empty.csv')
    await expect(createSession(file)).rejects.toThrow(ApiResponseError)
  })
})

// ─── getSession ─────────────────────────────────────────────────────────────

describe('getSession', () => {
  it('returns session by id', async () => {
    mockFetch({ id: 'sess-1', status: 'created' })
    const result = await getSession('sess-1')
    expect(result.id).toBe('sess-1')
  })

  it('throws on 404', async () => {
    mockFetch({ detail: 'Not found' }, { status: 404 })
    await expect(getSession('bad-id')).rejects.toThrow(ApiResponseError)
  })
})

// ─── updateMappings ─────────────────────────────────────────────────────────

describe('updateMappings', () => {
  it('returns updated session', async () => {
    mockFetch({
      id: 'sess-1',
      mappings: [{ source_header: 'a', target_field: 'b', confidence: 1 }],
    })
    const result = await updateMappings(
      'sess-1',
      [{ source_header: 'a', target_field: 'b', confidence: 1 }],
      [],
    )
    expect(result.mappings).toHaveLength(1)
  })

  it('throws on bad request', async () => {
    mockFetch({ detail: 'Invalid mappings' }, { status: 400 })
    await expect(updateMappings('sess-1', [], [])).rejects.toThrow(ApiResponseError)
  })
})

// ─── addTargetFields ────────────────────────────────────────────────────────

describe('addTargetFields', () => {
  it('returns updated session with new fields', async () => {
    mockFetch({ id: 'sess-1', target_fields: ['insured_name', 'custom_field'] })
    const result = await addTargetFields('sess-1', ['custom_field'])
    expect(result.target_fields).toContain('custom_field')
  })

  it('throws on bad request', async () => {
    mockFetch({ detail: 'Invalid fields' }, { status: 400 })
    await expect(addTargetFields('sess-1', [])).rejects.toThrow(ApiResponseError)
  })
})

// ─── finaliseSession ────────────────────────────────────────────────────────

describe('finaliseSession', () => {
  it('returns finalised session', async () => {
    mockFetch({ id: 'sess-1', status: 'finalised', result: { mapping: {}, valid_records: [] } })
    const result = await finaliseSession('sess-1')
    expect(result.status).toBe('finalised')
  })

  it('throws on conflict (already finalised)', async () => {
    mockFetch({ detail: 'Already finalised' }, { status: 409 })
    await expect(finaliseSession('sess-1')).rejects.toThrow(ApiResponseError)
  })
})

// ─── deleteSession ──────────────────────────────────────────────────────────

describe('deleteSession', () => {
  it('resolves on successful delete (204)', async () => {
    mockFetch(null, { status: 204 })
    await expect(deleteSession('sess-1')).resolves.toBeUndefined()
  })

  it('throws on 404', async () => {
    mockFetch({ detail: 'Not found' }, { status: 404 })
    await expect(deleteSession('bad-id')).rejects.toThrow(ApiResponseError)
  })
})

// ─── listSheets ─────────────────────────────────────────────────────────────

describe('listSheets', () => {
  it('returns array of sheet names', async () => {
    mockFetch({ sheets: ['Sheet1', 'Sheet2'] })
    const file = new File(['data'], 'test.xlsx')
    const result = await listSheets(file)
    expect(result).toEqual(['Sheet1', 'Sheet2'])
  })

  it('throws on validation error', async () => {
    mockFetch({ detail: 'Invalid file' }, { status: 422 })
    const file = new File([''], 'bad.txt')
    await expect(listSheets(file)).rejects.toThrow(ApiResponseError)
  })
})
