import { useState } from 'react'
import {
  createSession,
  updateMappings as apiUpdateMappings,
  finaliseSession,
  deleteSession,
} from '@/api/client'
import type { Session, ColumnMapping } from '@/types/api'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function create(file: File, schema?: string, sheetName?: string) {
    setError(null)
    try {
      const s = await createSession(file, schema, sheetName)
      setSession(s)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function updateMappings(mappings: ColumnMapping[], unmappedHeaders: string[]) {
    if (!session) return
    setError(null)
    try {
      const s = await apiUpdateMappings(session.id, mappings, unmappedHeaders)
      setSession(s)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function finalise() {
    if (!session) return
    setError(null)
    try {
      const s = await finaliseSession(session.id)
      setSession(s)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function destroy() {
    if (!session) return
    setError(null)
    try {
      await deleteSession(session.id)
      setSession(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return { session, error, create, updateMappings, finalise, destroy }
}
