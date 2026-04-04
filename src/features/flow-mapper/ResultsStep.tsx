import { useSessionContext } from './SessionContext'

interface ResultsStepProps {
  onBack: () => void
  onReset: () => void
}

function ResultsStep({ onBack, onReset }: ResultsStepProps) {
  const { session } = useSessionContext()

  if (!session) return <p>No session loaded.</p>

  const mappedCount = session.mappings.length
  const unmappedCount = session.unmapped_headers.length

  return (
    <div className="results-step">
      <h2>Results</h2>
      <p>
        {mappedCount} mapped, {unmappedCount} unmapped
      </p>
    </div>
  )
}

export default ResultsStep
