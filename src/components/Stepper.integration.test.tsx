import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Stepper from './Stepper'

describe('Stepper', () => {
  it('renders all steps with the current step active', () => {
    render(<Stepper steps={['Upload', 'Review', 'Results']} currentStep={0} />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Upload')
    expect(items[1]).toHaveTextContent('Review')
    expect(items[2]).toHaveTextContent('Results')
    expect(items[0]).toHaveAttribute('aria-current', 'step')
    expect(items[1]).not.toHaveAttribute('aria-current')
    expect(items[2]).not.toHaveAttribute('aria-current')
  })
})
