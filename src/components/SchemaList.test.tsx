import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { mockFetch, mockFetchError } from '@/test/mocks'
import SchemaList from './SchemaList'

describe('SchemaList', () => {
  it('shows loading state initially', () => {
    mockFetch({ schemas: ['default'] })
    render(<SchemaList />)
    expect(screen.getByText('Loading schemas...')).toBeInTheDocument()
  })

  it('renders schema names after loading', async () => {
    mockFetch({ schemas: ['default', 'marine', 'property'] })
    render(<SchemaList />)

    await waitFor(() => {
      expect(screen.getByRole('list', { name: 'Schemas' })).toBeInTheDocument()
    })

    expect(screen.getByText('default')).toBeInTheDocument()
    expect(screen.getByText('marine')).toBeInTheDocument()
    expect(screen.getByText('property')).toBeInTheDocument()
  })

  it('renders empty list when no schemas', async () => {
    mockFetch({ schemas: [] })
    render(<SchemaList />)

    await waitFor(() => {
      expect(screen.getByRole('list', { name: 'Schemas' })).toBeInTheDocument()
    })

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('shows error message on API failure', async () => {
    mockFetch({ detail: 'Server error' }, { status: 500 })
    render(<SchemaList />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    expect(screen.getByRole('alert')).toHaveTextContent('Server error')
  })

  it('shows generic error on network failure', async () => {
    mockFetchError('Network error')
    render(<SchemaList />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load schemas')
  })
})
