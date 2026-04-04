import { useState, useEffect } from 'react'
import { listSchemas } from '@/api/client'

export function useSchemas() {
  const [schemas, setSchemas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listSchemas()
      .then(setSchemas)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { schemas, loading, error }
}
