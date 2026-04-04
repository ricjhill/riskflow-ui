import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { mockFetch } from '@/test/mocks'
import FlowMapper from './FlowMapper'

function renderFlowMapper() {
  return render(
    <MemoryRouter>
      <FlowMapper />
    </MemoryRouter>,
  )
}

describe('FlowMapper', () => {
  it('renders stepper with Upload as active step', () => {
    mockFetch({ schemas: [] })
    renderFlowMapper()

    const steps = screen.getAllByRole('listitem')
    expect(steps).toHaveLength(3)

    expect(steps[0]).toHaveTextContent('Upload')
    expect(steps[0]).toHaveAttribute('aria-current', 'step')

    expect(steps[1]).toHaveTextContent('Review')
    expect(steps[1]).not.toHaveAttribute('aria-current')

    expect(steps[2]).toHaveTextContent('Results')
    expect(steps[2]).not.toHaveAttribute('aria-current')
  })
})
