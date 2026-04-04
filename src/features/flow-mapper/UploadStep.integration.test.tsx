import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { mockFetch, mockFetchSequence } from '@/test/mocks'
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

  it('renders FileUpload with csv/xlsx/xls accept', async () => {
    mockFetch({ schemas: ['default'] })

    render(<UploadStep onNext={() => {}} />)

    const fileInput = await screen.findByTestId('file-input')
    expect(fileInput).toHaveAttribute('accept', '.csv,.xlsx,.xls')
  })

  it('shows sheet picker when an Excel file is selected', async () => {
    // First call: listSchemas, second call: listSheets
    mockFetchSequence([
      { body: { schemas: ['default'] } },
      { body: { sheets: ['Sheet1', 'Sheet2'] } },
    ])

    render(<UploadStep onNext={() => {}} />)

    const fileInput = await screen.findByTestId('file-input')
    const xlsxFile = new File(['data'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    fireEvent.change(fileInput, { target: { files: [xlsxFile] } })

    const sheetSelect = await screen.findByRole('combobox', { name: /sheet/i })
    expect(sheetSelect).toBeInTheDocument()

    const sheetOptions = await screen.findAllByRole('option')
    // schema placeholder + default + sheet placeholder + Sheet1 + Sheet2
    // We need to scope to the sheet select
    await waitFor(() => {
      const options = sheetSelect.querySelectorAll('option')
      expect(options).toHaveLength(3) // placeholder + 2 sheets
      expect(options[1]).toHaveTextContent('Sheet1')
      expect(options[2]).toHaveTextContent('Sheet2')
    })
  })
})
