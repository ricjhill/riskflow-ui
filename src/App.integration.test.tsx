import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { mockFetch } from '@/test/mocks'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    mockFetch({ status: 'ok' })
  })

  it('renders Header on the home page', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /riskflow/i })).toBeInTheDocument()
  })

  it('renders Header on the API Status page', () => {
    render(
      <MemoryRouter initialEntries={['/api-status']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /riskflow/i })).toBeInTheDocument()
  })

  it('renders Header on the Flow Mapper page', () => {
    render(
      <MemoryRouter initialEntries={['/flow-mapper']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /riskflow/i })).toBeInTheDocument()
  })
})
