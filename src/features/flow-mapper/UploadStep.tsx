import { useState } from 'react'
import { useSchemas } from '@/hooks/useSchemas'
import { listSheets } from '@/api/client'
import FileUpload from '@/components/FileUpload'
import { useSessionContext } from './SessionContext'

interface UploadStepProps {
  onNext: () => void
}

function isExcel(file: File): boolean {
  return file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
}

function UploadStep({ onNext }: UploadStepProps) {
  const { schemas, loading } = useSchemas()
  const sessionCtx = useSessionContext()
  const [file, setFile] = useState<File | null>(null)
  const [schema, setSchema] = useState('')
  const [sheets, setSheets] = useState<string[]>([])
  const [sheetName, setSheetName] = useState('')
  const [uploading, setUploading] = useState(false)

  function handleFileSelect(f: File) {
    setFile(f)
    setSheets([])
    setSheetName('')
    if (isExcel(f)) {
      listSheets(f).then(setSheets)
    }
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    const ok = await sessionCtx.create(file, schema || undefined, sheetName || undefined)
    setUploading(false)
    if (ok) {
      onNext()
    }
  }

  if (sessionCtx.session) {
    const s = sessionCtx.session
    const fileName = s.file_path.split('/').pop() ?? s.file_path
    return (
      <div className="upload-step">
        <div className="upload-step-summary">
          <h3>Uploaded File</h3>
          <dl>
            <dt>Schema</dt>
            <dd>{s.schema_name}</dd>
            <dt>File</dt>
            <dd>{fileName}</dd>
            {s.sheet_name && (
              <>
                <dt>Sheet</dt>
                <dd>{s.sheet_name}</dd>
              </>
            )}
          </dl>
          <div className="upload-step-summary-actions">
            <button type="button" onClick={sessionCtx.destroy}>
              Re-upload
            </button>
            <button type="button" onClick={onNext}>
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="upload-step">
      <label htmlFor="schema-select">Schema</label>
      <select
        id="schema-select"
        disabled={loading}
        value={schema}
        onChange={(e) => setSchema(e.target.value)}
      >
        <option value="">Select a schema…</option>
        {schemas.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      <FileUpload onFileSelect={handleFileSelect} accept=".csv,.xlsx,.xls" fileName={file?.name} />

      {sheets.length > 0 && (
        <>
          <label htmlFor="sheet-select">Sheet</label>
          <select
            id="sheet-select"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
          >
            <option value="">Select a sheet…</option>
            {sheets.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </>
      )}

      <button type="button" disabled={!file || uploading} onClick={handleUpload}>
        {uploading ? (
          <>
            <span className="upload-spinner" role="status" aria-label="Uploading"></span>
            Uploading…
          </>
        ) : (
          'Upload'
        )}
      </button>

      {sessionCtx.error && (
        <p className="upload-step-error" role="alert">
          {sessionCtx.error}
        </p>
      )}
    </div>
  )
}

export default UploadStep
