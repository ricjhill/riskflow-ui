import { useSessionContext } from './SessionContext'
import type { ProcessingResult } from '@/types/api'

interface ResultsStepProps {
  onBack: () => void
  onReset: () => void
  onFinalised?: () => void
}

function ResultsStep({ onBack, onReset, onFinalised }: ResultsStepProps) {
  const { session, error, loading, finalise, destroy } = useSessionContext()

  if (!session) return <p>No session loaded.</p>

  const mappedCount = session.mappings.length
  const unmappedCount = session.unmapped_headers.length
  const isFinalised = session.status === 'finalised'
  const result = session.result as ProcessingResult | null

  async function handleStartNew() {
    await destroy()
    onReset()
  }

  return (
    <div className="results-step">
      <h2>Results</h2>

      <p>
        {mappedCount} mapped, {unmappedCount} unmapped
      </p>

      {loading && <p>Finalising…</p>}

      {error && (
        <p className="results-step-error" role="alert">
          {error}
        </p>
      )}

      {!isFinalised && !loading && (
        <button
          type="button"
          onClick={async () => {
            const ok = await finalise()
            if (ok) onFinalised?.()
          }}
        >
          Finalise
        </button>
      )}

      {result && (
        <>
          <p>
            {result.valid_records.length} valid, {result.invalid_records.length} invalid
          </p>

          {result.errors.length > 0 && (
            <table className="results-step-errors">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Field</th>
                  <th>Message</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {result.errors.flatMap((e) =>
                  e.field_errors && e.field_errors.length > 0
                    ? e.field_errors.map((fe) => (
                        <tr key={`${e.row}-${fe.field}`}>
                          <td>{e.row}</td>
                          <td>{fe.field}</td>
                          <td>{fe.message}</td>
                          <td>{fe.value ?? ''}</td>
                        </tr>
                      ))
                    : [
                        <tr key={`${e.row}-${e.error}`}>
                          <td>{e.row}</td>
                          <td colSpan={3}>{e.error}</td>
                        </tr>,
                      ],
                )}
              </tbody>
            </table>
          )}

          <div className="results-step-confidence">
            <p>Min confidence: {result.confidence_report.min_confidence}</p>
            <p>Avg confidence: {result.confidence_report.avg_confidence}</p>

            {result.confidence_report.low_confidence_fields.length > 0 && (
              <>
                <h3>Low Confidence Mappings</h3>
                <table className="results-step-low-confidence">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Target</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.confidence_report.low_confidence_fields.map((m) => (
                      <tr key={`${m.source_header}-${m.target_field}`}>
                        <td>{m.source_header}</td>
                        <td>{m.target_field}</td>
                        <td>{m.confidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {result.confidence_report.missing_fields.length > 0 && (
              <>
                <h3>Missing Target Fields</h3>
                <ul className="results-step-missing-fields">
                  {result.confidence_report.missing_fields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}

      <div className="results-step-actions">
        <button type="button" onClick={onBack}>
          Back
        </button>
        <button type="button" onClick={handleStartNew}>
          Start New
        </button>
      </div>
    </div>
  )
}

export default ResultsStep
