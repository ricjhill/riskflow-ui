import { useState } from 'react'
import { useSchemas } from '@/hooks/useSchemas'
import { listSheets } from '@/api/client'
import FileUpload from '@/components/FileUpload'

interface UploadStepProps {
  onNext: () => void
}

function isExcel(file: File): boolean {
  return file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
}

function UploadStep({ onNext }: UploadStepProps) {
  const { schemas, loading } = useSchemas()
  const [file, setFile] = useState<File | null>(null)
  const [sheets, setSheets] = useState<string[]>([])

  function handleFileSelect(f: File) {
    setFile(f)
    setSheets([])
    if (isExcel(f)) {
      listSheets(f).then(setSheets)
    }
  }

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

      <FileUpload onFileSelect={handleFileSelect} accept=".csv,.xlsx,.xls" />

      {sheets.length > 0 && (
        <>
          <label htmlFor="sheet-select">Sheet</label>
          <select id="sheet-select">
            <option value="">Select a sheet…</option>
            {sheets.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  )
}

export default UploadStep
