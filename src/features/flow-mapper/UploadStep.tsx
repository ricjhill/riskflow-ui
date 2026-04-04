import { useState } from 'react'
import { useSchemas } from '@/hooks/useSchemas'
import FileUpload from '@/components/FileUpload'

interface UploadStepProps {
  onNext: () => void
}

function UploadStep({ onNext }: UploadStepProps) {
  const { schemas, loading } = useSchemas()
  const [file, setFile] = useState<File | null>(null)

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

      <FileUpload onFileSelect={setFile} accept=".csv,.xlsx,.xls" />
    </div>
  )
}

export default UploadStep
