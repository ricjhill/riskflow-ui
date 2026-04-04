import { useState } from 'react'
import { createSession } from '@/api/client'
import type { Session } from '@/types/api'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)

  async function create(file: File, schema?: string, sheetName?: string) {
    const s = await createSession(file, schema, sheetName)
    setSession(s)
  }

  return { session, create }
}
