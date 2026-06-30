import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react'
import { ToastViewport, ToastRecord, ToastVariant } from '../components/Toast'

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback((variant: ToastVariant, message: string) => {
    const id = nextId.current++
    setToasts(prev => [...prev, { id, variant, message }])
  }, [])

  const api = useRef<ToastApi>({
    success: (m: string) => push('success', m),
    error:   (m: string) => push('error', m),
    warning: (m: string) => push('warning', m),
    info:    (m: string) => push('info', m),
  }).current

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
