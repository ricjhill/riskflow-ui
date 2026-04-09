import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ReactFlowProvider } from '@xyflow/react'
import MappingStep from './MappingStep'
import type { Session } from '@/types/api'

const STUB_SESSION: Session = {
  id: 'sess-1',
  status: 'created',
  schema_name: 'default',
  file_path: '/tmp/test.csv',
  sheet_name: null,
  source_headers: ['col1', 'col2', 'col3'],
  target_fields: ['field1', 'field2'],
  mappings: [
    { source_header: 'col1', target_field: 'field1', confidence: 0.95 },
    { source_header: 'col2', target_field: 'field2', confidence: 0.6 },
  ],
  unmapped_headers: ['col3'],
  preview_rows: [],
  result: null,
}

const mockUpdateMappings = vi.fn()

vi.mock('./SessionContext', () => ({
  useSessionContext: () => ({
    session: STUB_SESSION,
    error: null,
    create: vi.fn(),
    updateMappings: mockUpdateMappings,
    finalise: vi.fn(),
    destroy: vi.fn(),
  }),
}))

function renderMappingStep() {
  return render(
    <ReactFlowProvider>
      <MappingStep onNext={() => {}} onBack={() => {}} />
    </ReactFlowProvider>,
  )
}

describe('MappingStep', () => {
  it('renders source and target nodes from session data', () => {
    renderMappingStep()

    // Source headers rendered as nodes
    expect(screen.getByText('col1')).toBeInTheDocument()
    expect(screen.getByText('col2')).toBeInTheDocument()
    expect(screen.getByText('col3')).toBeInTheDocument()

    // Target fields rendered as nodes
    expect(screen.getByText('field1')).toBeInTheDocument()
    expect(screen.getByText('field2')).toBeInTheDocument()
  })

  it('renders Save Mappings button', () => {
    renderMappingStep()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('calls updateMappings when Save is clicked', () => {
    renderMappingStep()
    mockUpdateMappings.mockClear()

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(mockUpdateMappings).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ source_header: 'col1', target_field: 'field1' }),
        expect.objectContaining({ source_header: 'col2', target_field: 'field2' }),
      ]),
      expect.any(Array),
    )
  })

  it('renders canvas background pattern', () => {
    const { container } = renderMappingStep()
    expect(container.querySelector('.react-flow__background')).toBeInTheDocument()
  })

  it('renders column header labels', () => {
    renderMappingStep()
    expect(screen.getByText('Source Columns')).toBeInTheDocument()
    expect(screen.getByText('Target Fields')).toBeInTheDocument()
  })
})
