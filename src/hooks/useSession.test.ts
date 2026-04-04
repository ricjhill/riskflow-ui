import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { mockFetch } from '@/test/mocks'
import { useSession } from '@/hooks/useSession'
import type { Session } from '@/types/api'

const STUB_SESSION: Session = {
  id: 'sess-1',
  status: 'created',
  schema_name: 'default',
  file_path: '/tmp/test.csv',
  sheet_name: null,
  source_headers: ['col1', 'col2'],
  target_fields: ['field1', 'field2'],
  mappings: [{ source_header: 'col1', target_field: 'field1', confidence: 0.95 }],
  unmapped_headers: ['col2'],
  preview_rows: [{ col1: 'a', col2: 'b' }],
  result: null,
}

describe('useSession', () => {
  it('creates a session from file upload', async () => {
    mockFetch(STUB_SESSION)

    const { result } = renderHook(() => useSession())

    const file = new File(['data'], 'test.csv', { type: 'text/csv' })

    await act(async () => {
      await result.current.create(file, 'default')
    })

    expect(result.current.session).toEqual(STUB_SESSION)
    expect(result.current.session!.id).toBe('sess-1')
  })
})
