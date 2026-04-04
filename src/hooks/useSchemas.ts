import { useState, useEffect } from 'react'
import { listSchemas } from '@/api/client'

export function useSchemas() {
  const [schemas, setSchemas] = useState<string[]>([])

  useEffect(() => {
    listSchemas().then(setSchemas)
  }, [])

  return { schemas }
}
