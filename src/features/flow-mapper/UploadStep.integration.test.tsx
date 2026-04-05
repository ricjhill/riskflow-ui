import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { mockFetch, mockFetchSequence } from '@/test/mocks'
import { SessionProvider } from './SessionContext'
import UploadStep from './UploadStep'
import type { Session } from '@/types/api'

const STUB_SESSION: Session = {
  id: 'sess-1',
  status: 'created',
  schema_name: 'default',
  file_path: '/tmp/test.csv',
  sheet_name: null,
  source_headers: ['col1', 'col2'],
  target_fields: ['field1', 'field2'],
  mappings: [{ source_header: 'col1', target_field: 'field1', confidence: 0.95 }],
  unmapped_headers: ['col2'],
  preview_rows: [{ col1: 'a', col2: 'b' }],
  result: null,
}

function renderUploadStep(onNext = () => {}) {
  return render(
    <SessionProvider>
      <UploadStep onNext={onNext} />
    </SessionProvider>,
  )
}

describe('UploadStep', () => {
  it('renders schema picker with schema names from API', async () => {
    mockFetch({ schemas: ['default', 'marine'] })

    renderUploadStep()

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

    renderUploadStep()

    const fileInput = await screen.findByTestId('file-input')
    expect(fileInput).toHaveAttribute('accept', '.csv,.xlsx,.xls')
  })

  it('shows sheet picker when an Excel file is selected', async () => {
    // First call: listSchemas, second call: listSheets
    mockFetchSequence([
      { body: { schemas: ['default'] } },
      { body: { sheets: ['Sheet1', 'Sheet2'] } },
    ])

    renderUploadStep()

    const fileInput = await screen.findByTestId('file-input')
    const xlsxFile = new File(['data'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    fireEvent.change(fileInput, { target: { files: [xlsxFile] } })

    const sheetSelect = await screen.findByRole('combobox', { name: /sheet/i })
    expect(sheetSelect).toBeInTheDocument()

    await waitFor(() => {
      const options = sheetSelect.querySelectorAll('option')
      expect(options).toHaveLength(3) // placeholder + 2 sheets
      expect(options[1]).toHaveTextContent('Sheet1')
      expect(options[2]).toHaveTextContent('Sheet2')
    })
  })

  it('creates session and calls onNext on upload', async () => {
    const onNext = vi.fn()
    // First call: listSchemas, second call: createSession
    mockFetchSequence([{ body: { schemas: ['default'] } }, { body: STUB_SESSION, status: 201 }])

    renderUploadStep(onNext)

    // Wait for schemas to load
    await screen.findByRole('combobox', { name: /schema/i })

    // Select schema
    fireEvent.change(screen.getByRole('combobox', { name: /schema/i }), {
      target: { value: 'default' },
    })

    // Select file
    const fileInput = screen.getByTestId('file-input')
    const csvFile = new File(['data'], 'test.csv', { type: 'text/csv' })
    fireEvent.change(fileInput, { target: { files: [csvFile] } })

    // Click Upload
    const uploadButton = screen.getByRole('button', { name: /upload/i })
    fireEvent.click(uploadButton)

    await waitFor(() => {
      expect(onNext).toHaveBeenCalled()
    })
  })

  it('displays selected filename after choosing a file', async () => {
    mockFetch({ schemas: ['default'] })
    renderUploadStep()

    const fileInput = await screen.findByTestId('file-input')
    const csvFile = new File(['data'], 'report.csv', { type: 'text/csv' })
    fireEvent.change(fileInput, { target: { files: [csvFile] } })

    expect(screen.getByText('report.csv')).toBeInTheDocument()
  })

  it('shows a loading spinner while uploading', async () => {
    // Schema response resolves, session creation hangs
    const schemasResponse = new Response(JSON.stringify({ schemas: ['default'] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
    const pendingPromise = new Promise<Response>(() => {})
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(schemasResponse)
      .mockReturnValueOnce(pendingPromise)

    renderUploadStep()

    await screen.findByRole('combobox', { name: /schema/i })
    const fileInput = screen.getByTestId('file-input')
    fireEvent.change(fileInput, {
      target: { files: [new File(['data'], 'test.csv', { type: 'text/csv' })] },
    })

    fireEvent.click(screen.getByRole('button', { name: /upload/i }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  it('does not show a spinner when not uploading', async () => {
    mockFetch({ schemas: ['default'] })
    renderUploadStep()

    await screen.findByRole('combobox', { name: /schema/i })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows read-only summary when session exists', async () => {
    // Simulate: session already created, user navigated Back
    const onNext = vi.fn()
    mockFetchSequence([{ body: { schemas: ['default'] } }, { body: STUB_SESSION, status: 201 }])

    renderUploadStep(onNext)

    // Complete the upload flow to create a session
    await screen.findByRole('combobox', { name: /schema/i })
    const fileInput = screen.getByTestId('file-input')
    fireEvent.change(fileInput, {
      target: { files: [new File(['data'], 'test.csv', { type: 'text/csv' })] },
    })
    fireEvent.click(screen.getByRole('button', { name: /upload/i }))
    await waitFor(() => expect(onNext).toHaveBeenCalled())

    // Now the session exists — the summary should be visible
    expect(screen.getByText('default')).toBeInTheDocument()
    expect(screen.getByText('test.csv')).toBeInTheDocument()
    expect(screen.queryByTestId('file-input')).not.toBeInTheDocument()
  })

  it('re-upload button destroys session and shows upload form', async () => {
    const onNext = vi.fn()
    mockFetchSequence([
      { body: { schemas: ['default'] } },
      { body: STUB_SESSION, status: 201 },
      { body: null, status: 204 }, // deleteSession
      { body: { schemas: ['default'] } }, // re-fetch schemas after remount
    ])

    renderUploadStep(onNext)

    // Create session
    await screen.findByRole('combobox', { name: /schema/i })
    const fileInput = screen.getByTestId('file-input')
    fireEvent.change(fileInput, {
      target: { files: [new File(['data'], 'test.csv', { type: 'text/csv' })] },
    })
    fireEvent.click(screen.getByRole('button', { name: /upload/i }))
    await waitFor(() => expect(onNext).toHaveBeenCalled())

    // Now in summary view — click Re-upload
    fireEvent.click(screen.getByRole('button', { name: /re-upload/i }))

    // Should return to upload form
    await waitFor(() => {
      expect(screen.getByTestId('file-input')).toBeInTheDocument()
    })
  })

  it('shows error message on API failure', async () => {
    const onNext = vi.fn()
    mockFetchSequence([
      { body: { schemas: ['default'] } },
      {
        body: {
          detail: { error_code: 'VALIDATION', message: 'Invalid CSV format', suggestion: '' },
        },
        status: 422,
      },
    ])

    renderUploadStep(onNext)

    await screen.findByRole('combobox', { name: /schema/i })

    // Select file
    const fileInput = screen.getByTestId('file-input')
    const csvFile = new File(['data'], 'bad.csv', { type: 'text/csv' })
    fireEvent.change(fileInput, { target: { files: [csvFile] } })

    // Click Upload
    fireEvent.click(screen.getByRole('button', { name: /upload/i }))

    const errorMsg = await screen.findByRole('alert')
    expect(errorMsg).toHaveTextContent('Invalid CSV format')
    expect(onNext).not.toHaveBeenCalled()
  })
})
