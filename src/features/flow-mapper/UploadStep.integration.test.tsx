import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { mockFetch } from '@/test/mocks'
import UploadStep from './UploadStep'

describe('UploadStep', () => {
  it('renders schema picker with schema names from API', async () => {
    mockFetch({ schemas: ['default', 'marine'] })

    render(<UploadStep onNext={() => {}} />)

    const select = await screen.findByRole('combobox', { name: /schema/i })
    expect(select).toBeInTheDocument()

    const options = await screen.findAllByRole('option')
    // First option is the placeholder
    expect(options).toHaveLength(3)
    expect(options[1]).toHaveTextContent('default')
    expect(options[2]).toHaveTextContent('marine')
  })
})
