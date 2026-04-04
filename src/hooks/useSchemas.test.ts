import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { mockFetch } from '@/test/mocks'
import { useSchemas } from '@/hooks/useSchemas'

describe('useSchemas', () => {
  it('returns schema list on success', async () => {
    mockFetch({ schemas: ['default', 'custom'] })

    const { result } = renderHook(() => useSchemas())

    await waitFor(() => {
      expect(result.current.schemas).toEqual(['default', 'custom'])
    })
  })
})
