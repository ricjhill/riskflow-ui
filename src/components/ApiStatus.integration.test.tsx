import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { mockFetch, mockFetchError } from '@/test/mocks'
import ApiStatus from './ApiStatus'

describe('ApiStatus', () => {
  it('shows pending state initially', () => {
    mockFetch({ status: 'ok' })
    render(<ApiStatus />)
    expect(screen.getAllByText('...').length).toBeGreaterThan(0)
  })

  it('shows health OK and schema list on success', async () => {
    const responses = [
      { status: 'ok' },
      { schemas: ['default'] },
      {
        name: 'default',
        fields: { Policy_ID: { type: 'string', required: true } },
        cross_field_rules: [],
        slm_hints: [],
      },
    ]
    let callIndex = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      const body = JSON.stringify(responses[callIndex++] ?? responses[0])
      return Promise.resolve(
        new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }),
      )
    })

    render(<ApiStatus />)

    await waitFor(() => {
      expect(screen.getAllByText('OK').length).toBe(2)
    })

    expect(screen.getByText(/1 schema\(s\)/)).toBeInTheDocument()
    expect(screen.getByText('default — 1 fields')).toBeInTheDocument()
  })

  it('shows FAIL when API is unreachable', async () => {
    mockFetchError('Network error')
    render(<ApiStatus />)

    await waitFor(() => {
      expect(screen.getAllByText('FAIL').length).toBe(2)
    })

    expect(screen.getAllByText('Connection failed').length).toBe(2)
  })

  it('shows FAIL with API error message', async () => {
    mockFetch({ detail: 'Server error' }, { status: 500 })
    render(<ApiStatus />)

    await waitFor(() => {
      expect(screen.getAllByText('FAIL').length).toBeGreaterThan(0)
    })

    expect(screen.getAllByText('Server error').length).toBeGreaterThan(0)
  })
})
