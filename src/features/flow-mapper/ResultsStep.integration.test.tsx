import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ResultsStep from './ResultsStep'
import type { Session } from '@/types/api'

const BASE_SESSION: Session = {
  id: 'sess-1',
  status: 'created',
  schema_name: 'default',
  file_path: '/tmp/test.csv',
  sheet_name: null,
  source_headers: ['col1', 'col2', 'col3', 'col4', 'col5', 'col6'],
  target_fields: ['field1', 'field2', 'field3', 'field4'],
  mappings: [
    { source_header: 'col1', target_field: 'field1', confidence: 0.95 },
    { source_header: 'col2', target_field: 'field2', confidence: 0.8 },
    { source_header: 'col3', target_field: 'field3', confidence: 0.6 },
    { source_header: 'col4', target_field: 'field4', confidence: 0.9 },
  ],
  unmapped_headers: ['col5', 'col6'],
  preview_rows: [],
  result: null,
}

const FINALISED_SESSION: Session = {
  ...BASE_SESSION,
  status: 'finalised',
  result: {
    mapping: { mappings: BASE_SESSION.mappings, unmapped_headers: ['col5', 'col6'] },
    confidence_report: {
      min_confidence: 0.6,
      avg_confidence: 0.81,
      low_confidence_fields: [{ source_header: 'col3', target_field: 'field3', confidence: 0.6 }],
      missing_fields: [],
    },
    valid_records: Array.from({ length: 10 }, (_, i) => ({ id: i })),
    invalid_records: Array.from({ length: 3 }, (_, i) => ({ id: i })),
    errors: [
      { row: 3, error: 'bad date' },
      { row: 7, error: 'missing field' },
    ],
  },
}

const mockFinalise = vi.fn()
const mockDestroy = vi.fn()
let currentSession = BASE_SESSION
let currentError: string | null = null
let currentLoading = false

vi.mock('./SessionContext', () => ({
  useSessionContext: () => ({
    get session() {
      return currentSession
    },
    get error() {
      return currentError
    },
    get loading() {
      return currentLoading
    },
    create: vi.fn(),
    updateMappings: vi.fn(),
    finalise: mockFinalise,
    destroy: mockDestroy,
  }),
}))

beforeEach(() => {
  currentSession = BASE_SESSION
  currentError = null
  currentLoading = false
  mockFinalise.mockClear()
  mockDestroy.mockClear()
})

function renderResultsStep(props?: { onBack?: () => void; onReset?: () => void }) {
  return render(
    <ResultsStep onBack={props?.onBack ?? (() => {})} onReset={props?.onReset ?? (() => {})} />,
  )
}

describe('ResultsStep', () => {
  it('shows mapping summary with mapped and unmapped counts', () => {
    renderResultsStep()
    expect(screen.getByText(/4 mapped/i)).toBeInTheDocument()
    expect(screen.getByText(/2 unmapped/i)).toBeInTheDocument()
  })

  it('calls finalise when Finalise button is clicked', async () => {
    renderResultsStep()
    fireEvent.click(screen.getByRole('button', { name: /finalise/i }))
    await waitFor(() => {
      expect(mockFinalise).toHaveBeenCalled()
    })
  })

  it('shows loading indicator during finalisation', () => {
    currentLoading = true
    renderResultsStep()
    expect(screen.getByText(/finalising/i)).toBeInTheDocument()
  })

  it('displays valid and invalid record counts after finalisation', () => {
    currentSession = FINALISED_SESSION
    renderResultsStep()
    expect(screen.getByText(/10 valid/i)).toBeInTheDocument()
    expect(screen.getByText(/3 invalid/i)).toBeInTheDocument()
  })

  it('displays error table after finalisation', () => {
    currentSession = FINALISED_SESSION
    renderResultsStep()
    expect(screen.getByText('bad date')).toBeInTheDocument()
    expect(screen.getByText('missing field')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('displays confidence report after finalisation', () => {
    currentSession = FINALISED_SESSION
    renderResultsStep()
    expect(screen.getByText(/Min confidence: 0\.6/)).toBeInTheDocument()
    expect(screen.getByText(/Avg confidence: 0\.81/)).toBeInTheDocument()
  })

  it('calls destroy and onReset when Start New is clicked', async () => {
    const onReset = vi.fn()
    renderResultsStep({ onReset })
    fireEvent.click(screen.getByRole('button', { name: /start new/i }))
    await waitFor(() => {
      expect(mockDestroy).toHaveBeenCalled()
      expect(onReset).toHaveBeenCalled()
    })
  })

  it('calls onBack when Back is clicked', () => {
    const onBack = vi.fn()
    renderResultsStep({ onBack })
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(onBack).toHaveBeenCalled()
  })

  it('shows error message on finalisation failure', () => {
    currentError = 'Finalisation failed: invalid mappings'
    renderResultsStep()
    expect(screen.getByRole('alert')).toHaveTextContent('Finalisation failed: invalid mappings')
  })

  it('displays low confidence fields after finalisation', () => {
    currentSession = FINALISED_SESSION
    renderResultsStep()
    expect(screen.getByText('col3')).toBeInTheDocument()
    expect(screen.getByText('field3')).toBeInTheDocument()
    expect(screen.getByText('0.6')).toBeInTheDocument()
  })

  it('hides Finalise button when session is already finalised', () => {
    currentSession = FINALISED_SESSION
    renderResultsStep()
    expect(screen.queryByRole('button', { name: /finalise/i })).not.toBeInTheDocument()
  })
})
