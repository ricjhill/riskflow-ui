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

  it('accepts any file when accept prop is omitted', () => {
    const onFileSelect = vi.fn()
    render(<FileUpload onFileSelect={onFileSelect} />)

    const file = new File(['data'], 'anything.xyz')
    const input = screen.getByTestId('file-input')
    fireEvent.change(input, { target: { files: [file] } })

    expect(onFileSelect).toHaveBeenCalledWith(file)
  })

  it('displays external error prop', () => {
    render(<FileUpload onFileSelect={vi.fn()} error="Upload failed" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Upload failed')
  })

  it('displays the selected filename when fileName prop is provided', () => {
    render(<FileUpload onFileSelect={vi.fn()} fileName="data.csv" />)
    expect(screen.getByText('data.csv')).toBeInTheDocument()
  })

  it('does not render filename when fileName prop is omitted', () => {
    const { container } = render(<FileUpload onFileSelect={vi.fn()} />)
    expect(container.querySelector('.file-upload-filename')).not.toBeInTheDocument()
  })

  it('disables input and button when disabled', () => {
    render(<FileUpload onFileSelect={vi.fn()} disabled />)

    const input = screen.getByTestId('file-input') as HTMLInputElement
    expect(input.disabled).toBe(true)
    expect(screen.getByRole('button', { name: /choose file/i })).toBeDisabled()
  })
})
