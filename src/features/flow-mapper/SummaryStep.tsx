import type { Session, ProcessingResult } from '@/types/api'

interface SummaryStepProps {
  session: Session
  onReset: () => void
}

function SummaryStep({ session, onReset }: SummaryStepProps) {
  const result = session.result as ProcessingResult | null

  return (
    <div className="summary-step">
      <h2>Finalisation Complete</h2>

      <dl className="summary-step-meta">
        <dt>Schema</dt>
        <dd>{session.schema_name}</dd>
        <dt>Records</dt>
        <dd>
          {result
            ? `${result.valid_records.length} valid, ${result.invalid_records.length} invalid`
            : '—'}
        </dd>
        <dt>Confidence</dt>
        <dd>
          {result
            ? `Min ${Math.round(result.confidence_report.min_confidence * 100)}% · Avg ${Math.round(result.confidence_report.avg_confidence * 100)}%`
            : '—'}
        </dd>
      </dl>

      <h3>Column Mappings</h3>
      <table className="summary-step-mappings">
        <thead>
          <tr>
            <th>Source</th>
            <th>Target</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {session.mappings.map((m) => (
            <tr key={`${m.source_header}-${m.target_field}`}>
              <td>{m.source_header}</td>
              <td>{m.target_field}</td>
              <td>{Math.round(m.confidence * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      {session.unmapped_headers.length > 0 && (
        <>
          <h3>Unmapped Headers</h3>
          <ul className="summary-step-unmapped">
            {session.unmapped_headers.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </>
      )}

      {result && result.errors.length > 0 && (
        <>
          <h3>Validation Errors</h3>
          <table className="summary-step-errors">
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
        </>
      )}

      <div className="summary-step-actions">
        <button type="button" onClick={onReset}>
          Start New
        </button>
      </div>
    </div>
  )
}

export default SummaryStep
