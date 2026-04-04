import { useEffect, useState } from 'react'
import { listSchemas, ApiResponseError } from '@/api/client'

function SchemaList() {
  const [schemas, setSchemas] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listSchemas()
      .then(setSchemas)
      .catch((err: unknown) => {
        if (err instanceof ApiResponseError) {
          setError(err.message)
        } else {
          setError('Failed to load schemas')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading schemas...</p>
  if (error) return <p role="alert">{error}</p>

  return (
    <ul aria-label="Schemas">
      {schemas.map((name) => (
        <li key={name}>{name}</li>
      ))}
    </ul>
  )
}

export default SchemaList
