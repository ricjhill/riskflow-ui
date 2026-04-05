import { useRef, useState } from 'react'
import './FileUpload.css'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  disabled?: boolean
  error?: string | null
}

function FileUpload({ onFileSelect, accept, disabled, error }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const displayError = error ?? validationError

  function isAccepted(file: File): boolean {
    if (!accept) return true
    const extensions = accept.split(',').map((e) => e.trim().toLowerCase())
    const name = file.name.toLowerCase()
    return extensions.some((ext) => name.endsWith(ext))
  }

  function handleFile(file: File) {
    setValidationError(null)
    if (!isAccepted(file)) {
      setValidationError(`File type not accepted. Expected: ${accept}`)
      return
    }
    onFileSelect(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div
      className={`file-upload ${dragOver ? 'file-upload--drag-over' : ''} ${disabled ? 'file-upload--disabled' : ''}`}
      onDragOver={
        disabled
          ? undefined
          : (e) => {
              e.preventDefault()
              setDragOver(true)
            }
      }
      onDragLeave={disabled ? undefined : () => setDragOver(false)}
      onDrop={disabled ? undefined : handleDrop}
    >
      <p>Drop a file here or click to browse</p>
      {accept && <p className="file-upload-accept">{accept}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleChange}
        hidden
        data-testid="file-input"
      />
      <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()}>
        Choose file
      </button>
      {displayError && (
        <p className="file-upload-error" role="alert">
          {displayError}
        </p>
      )}
    </div>
  )
}

export default FileUpload
