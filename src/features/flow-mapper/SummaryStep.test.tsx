import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SummaryStep from './SummaryStep'
import type { Session, ProcessingResult } from '@/types/api'

const baseMappings = [
  { source_header: 'GWP', target_field: 'Gross_Premium', confidence: 0.95 },
  { source_header: 'Insured', target_field: 'Insured_Name', confidence: 0.82 },
]

const baseResult: ProcessingResult = {
  mapping: { mappings: baseMappings, unmapped_headers: [] },
  confidence_report: {
    min_confidence: 0.82,
    avg_confidence: 0.885,
    low_confidence_fields: [],
    missing_fields: [],
  },
  valid_records: [{}, {}, {}],
  invalid_records: [{}],
  errors: [],
}

const baseSession: Session = {
  id: 'test-session',
  status: 'finalised',
  schema_name: 'reinsurance_v1',
  file_path: '/uploads/test.csv',
  sheet_name: null,
  source_headers: ['GWP', 'Insured', 'Unused'],
  target_fields: ['Gross_Premium', 'Insured_Name'],
  mappings: baseMappings,
  unmapped_headers: ['Unused'],
  preview_rows: [],
  result: baseResult,
}

describe('SummaryStep', () => {
  it('shows success status and record counts', () => {
    render(<SummaryStep session={baseSession} onReset={() => {}} />)

    expect(screen.getByText(/finalisation complete/i)).toBeInTheDocument()
    expect(screen.getByText(/3 valid/i)).toBeInTheDocument()
    expect(screen.getByText(/1 invalid/i)).toBeInTheDocument()
  })

  it('shows mapping table with source, target, and confidence', () => {
    render(<SummaryStep session={baseSession} onReset={() => {}} />)

    expect(screen.getByText('GWP')).toBeInTheDocument()
    expect(screen.getByText('Gross_Premium')).toBeInTheDocument()
    expect(screen.getByText('95%')).toBeInTheDocument()
    expect(screen.getByText('Insured')).toBeInTheDocument()
    expect(screen.getByText('Insured_Name')).toBeInTheDocument()
  })

  it('shows unmapped headers', () => {
    render(<SummaryStep session={baseSession} onReset={() => {}} />)

    expect(screen.getByText('Unused')).toBeInTheDocument()
  })

  it('shows schema name', () => {
    render(<SummaryStep session={baseSession} onReset={() => {}} />)

    expect(screen.getByText(/reinsurance_v1/)).toBeInTheDocument()
  })

  it('shows confidence summary', () => {
    render(<SummaryStep session={baseSession} onReset={() => {}} />)

    expect(screen.getByText(/min.*82%/i)).toBeInTheDocument()
    expect(screen.getByText(/avg.*89%/i)).toBeInTheDocument()
  })

  it('shows validation errors when present', () => {
    const sessionWithErrors = {
      ...baseSession,
      result: {
        ...baseResult,
        errors: [
          {
            row: 3,
            error: 'Invalid date',
            field_errors: [{ field: 'Inception_Date', message: 'not a valid date', value: 'abc' }],
          },
        ],
      },
    }

    render(<SummaryStep session={sessionWithErrors} onReset={() => {}} />)

    expect(screen.getByText('Inception_Date')).toBeInTheDocument()
    expect(screen.getByText('not a valid date')).toBeInTheDocument()
  })

  it('calls onReset when Start New is clicked', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    render(<SummaryStep session={baseSession} onReset={onReset} />)

    await user.click(screen.getByRole('button', { name: /start new/i }))
    expect(onReset).toHaveBeenCalled()
  })

  it('shows placeholder when result is null', () => {
    const sessionNoResult = { ...baseSession, result: null }
    render(<SummaryStep session={sessionNoResult} onReset={() => {}} />)

    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('renders empty mapping table when no mappings exist', () => {
    const sessionNoMappings = { ...baseSession, mappings: [] }
    render(<SummaryStep session={sessionNoMappings} onReset={() => {}} />)

    expect(screen.getByText('Source')).toBeInTheDocument()
    expect(screen.getByText('Target')).toBeInTheDocument()
    expect(screen.queryByText('GWP')).not.toBeInTheDocument()
  })
})
