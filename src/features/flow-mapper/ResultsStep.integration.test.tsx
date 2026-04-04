import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
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

const mockFinalise = vi.fn()
const mockDestroy = vi.fn()

vi.mock('./SessionContext', () => ({
  useSessionContext: () => ({
    session: BASE_SESSION,
    error: null,
    loading: false,
    create: vi.fn(),
    updateMappings: vi.fn(),
    finalise: mockFinalise,
    destroy: mockDestroy,
  }),
}))

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
})
