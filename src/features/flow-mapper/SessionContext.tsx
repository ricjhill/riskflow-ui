import { createContext, useContext } from 'react'
import { useSession } from '@/hooks/useSession'

type SessionContextValue = ReturnType<typeof useSession>

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const session = useSession()
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSessionContext(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSessionContext must be used within SessionProvider')
  return ctx
}
