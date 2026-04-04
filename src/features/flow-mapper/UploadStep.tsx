import { useSchemas } from '@/hooks/useSchemas'

interface UploadStepProps {
  onNext: () => void
}

function UploadStep({ onNext }: UploadStepProps) {
  const { schemas, loading } = useSchemas()

  return (
    <div className="upload-step">
      <label htmlFor="schema-select">Schema</label>
      <select id="schema-select" disabled={loading}>
        <option value="">Select a schema…</option>
        {schemas.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default UploadStep
