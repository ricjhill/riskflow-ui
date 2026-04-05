import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Header from './Header'

describe('Header', () => {
  it('renders app name linking to home', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    )
    const brand = screen.getByRole('link', { name: /riskflow/i })
    expect(brand).toHaveAttribute('href', '/')
  })
})
