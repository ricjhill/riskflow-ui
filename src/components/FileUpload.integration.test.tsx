import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FileUpload from './FileUpload'

describe('FileUpload', () => {
  it('renders drop zone with accepted file types', () => {
    render(<FileUpload onFileSelect={vi.fn()} accept=".csv,.xlsx" />)
    expect(screen.getByText(/drop/i)).toBeInTheDocument()
    expect(screen.getByText('.csv,.xlsx')).toBeInTheDocument()
  })
})
