import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FileUpload from './FileUpload'

describe('FileUpload', () => {
  it('renders drop zone with accepted file types', () => {
    render(<FileUpload onFileSelect={vi.fn()} accept=".csv,.xlsx" />)
    expect(screen.getByText(/drop/i)).toBeInTheDocument()
    expect(screen.getByText('.csv,.xlsx')).toBeInTheDocument()
  })

  it('fires onFileSelect when a valid file is chosen', () => {
    const onFileSelect = vi.fn()
    render(<FileUpload onFileSelect={onFileSelect} accept=".csv" />)

    const file = new File(['data'], 'test.csv', { type: 'text/csv' })
    const input = screen.getByTestId('file-input')
    fireEvent.change(input, { target: { files: [file] } })

    expect(onFileSelect).toHaveBeenCalledWith(file)
  })

  it('rejects files with invalid extensions', () => {
    const onFileSelect = vi.fn()
    render(<FileUpload onFileSelect={onFileSelect} accept=".csv,.xlsx" />)

    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' })
    const input = screen.getByTestId('file-input')
    fireEvent.change(input, { target: { files: [file] } })

    expect(onFileSelect).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('File type not accepted')
  })

  it('disables input and button when disabled', () => {
    render(<FileUpload onFileSelect={vi.fn()} disabled />)

    const input = screen.getByTestId('file-input') as HTMLInputElement
    expect(input.disabled).toBe(true)
    expect(screen.getByRole('button', { name: /choose file/i })).toBeDisabled()
  })
})
