import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { startViewAs, endViewAs, setViewAsHeader, clearViewAsHeader } from '../api/client'

// A4c / D87: read-only view-as. State is held IN MEMORY only (never localStorage)
// so it cannot survive a reload or be tampered with; the server session is the
// source of truth. `nonce` bumps on enter/exit so data-loading effects refetch.

interface ViewAsState {
  isViewAs: boolean
  targetName: string | null
  nonce: number
  enter: (targetUserId: string, targetName: string) => Promise<void>
  exit: () => Promise<void>
}

const ViewAsContext = createContext<ViewAsState | undefined>(undefined)

export function ViewAsProvider({ children }: { children: ReactNode }) {
  const [isViewAs, setIsViewAs] = useState(false)
  const [targetName, setTargetName] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const enter = useCallback(async (targetUserId: string, name: string) => {
    const res = await startViewAs(targetUserId)
    setViewAsHeader(res.session_id)
    setTargetName(res.target?.full_name || name)
    setIsViewAs(true)
    setNonce(n => n + 1)
  }, [])

  const exit = useCallback(async () => {
    try {
      await endViewAs()
    } finally {
      clearViewAsHeader()
      setIsViewAs(false)
      setTargetName(null)
      setNonce(n => n + 1)
    }
  }, [])

  return (
    <ViewAsContext.Provider value={{ isViewAs, targetName, nonce, enter, exit }}>
      {children}
    </ViewAsContext.Provider>
  )
}

export function useViewAs(): ViewAsState {
  const ctx = useContext(ViewAsContext)
  if (!ctx) throw new Error('useViewAs must be used within a ViewAsProvider')
  return ctx
}
