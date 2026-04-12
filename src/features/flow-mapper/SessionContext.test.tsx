import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { SessionProvider, useSessionContext } from './SessionContext'

describe('SessionContext', () => {
  it('throws when useSessionContext is used outside SessionProvider', () => {
    expect(() => {
      renderHook(() => useSessionContext())
    }).toThrow('useSessionContext must be used within SessionProvider')
  })

  it('provides session context within SessionProvider', () => {
    const { result } = renderHook(() => useSessionContext(), {
      wrapper: SessionProvider,
    })
    expect(result.current).toHaveProperty('session')
    expect(result.current).toHaveProperty('create')
    expect(result.current).toHaveProperty('updateMappings')
    expect(result.current).toHaveProperty('finalise')
    expect(result.current).toHaveProperty('destroy')
  })
})
