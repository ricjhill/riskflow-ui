import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { mockFetch, mockFetchError } from '@/test/mocks'
import { useSchemas } from '@/hooks/useSchemas'

describe('useSchemas', () => {
  it('returns schema list on success', async () => {
    mockFetch({ schemas: ['default', 'custom'] })

    const { result } = renderHook(() => useSchemas())

    await waitFor(() => {
      expect(result.current.schemas).toEqual(['default', 'custom'])
    })
  })

  it('starts in loading state and resolves to not loading', async () => {
    mockFetch({ schemas: ['default'] })

    const { result } = renderHook(() => useSchemas())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('sets error on fetch failure', async () => {
    mockFetchError('Network error')

    const { result } = renderHook(() => useSchemas())

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
    })
    expect(result.current.schemas).toEqual([])
    expect(result.current.loading).toBe(false)
  })
})
