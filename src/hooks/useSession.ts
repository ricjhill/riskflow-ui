import { useState } from 'react'
import { createSession, updateMappings as apiUpdateMappings, finaliseSession } from '@/api/client'
import type { Session, ColumnMapping } from '@/types/api'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)

  async function create(file: File, schema?: string, sheetName?: string) {
    const s = await createSession(file, schema, sheetName)
    setSession(s)
  }

  async function updateMappings(mappings: ColumnMapping[], unmappedHeaders: string[]) {
    if (!session) return
    const s = await apiUpdateMappings(session.id, mappings, unmappedHeaders)
    setSession(s)
  }

  async function finalise() {
    if (!session) return
    const s = await finaliseSession(session.id)
    setSession(s)
  }

  return { session, create, updateMappings, finalise }
}
