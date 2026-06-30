import { useEffect, useRef } from 'react'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastRecord {
  id: number
  variant: ToastVariant
  message: string
}

// Auto-dismiss timing per variant. Error persists until manually dismissed.
const AUTO_DISMISS_MS: Record<ToastVariant, number | null> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: null,
}

const VARIANT_STYLE: Record<ToastVariant, { border: string; icon: string; iconColor: string }> = {
  // Icons via unicode escapes (ASCII-safe source rule).
  success: { border: 'var(--k-success-text)', icon: '✓', iconColor: 'var(--k-success-text)' },
  error:   { border: 'var(--k-danger-text)',  icon: '✕', iconColor: 'var(--k-danger-text)' },
  warning: { border: 'var(--k-warning-text)', icon: '⚠', iconColor: 'var(--k-warning-text)' },
  info:    { border: 'var(--k-brand-primary)', icon: 'ℹ', iconColor: 'var(--k-brand-primary)' },
}

const MAX_VISIBLE = 4

function ToastItem({ toast, onDismiss }: { toast: ToastRecord; onDismiss: (id: number) => void }) {
  const duration = AUTO_DISMISS_MS[toast.variant]
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const remainingRef = useRef<number>(duration ?? 0)
  const startedRef = useRef<number>(Date.now())

  function clearTimer() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }

  function startTimer(ms: number) {
    if (ms <= 0) return
    startedRef.current = Date.now()
    timerRef.current = setTimeout(() => onDismiss(toast.id), ms)
  }

  useEffect(() => {
    if (duration == null) return // error: no auto-dismiss
    startTimer(duration)
    return clearTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pause-on-hover: stop the timer and bank the remaining time; resume on leave.
  function handleMouseEnter() {
    if (duration == null) return
    clearTimer()
    remainingRef.current = remainingRef.current - (Date.now() - startedRef.current)
  }
  function handleMouseLeave() {
    if (duration == null) return
    startTimer(Math.max(500, remainingRef.current))
  }

  const v = VARIANT_STYLE[toast.variant]
  // Errors and warnings interrupt (assertive); success/info are polite.
  const role = toast.variant === 'error' || toast.variant === 'warning' ? 'alert' : 'status'

  return (
    <div
      role={role}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        background: 'var(--k-bg-surface)',
        borderLeft: `4px solid ${v.border}`,
        borderRadius: 'var(--k-radius-md)',
        boxShadow: 'var(--k-shadow-lg)',
        padding: '12px 14px',
        minWidth: '280px', maxWidth: '380px',
        fontSize: '13px', color: 'var(--k-text-primary)',
        pointerEvents: 'auto',
      }}
    >
      <span aria-hidden="true" style={{ color: v.iconColor, fontWeight: 700, fontSize: '15px', lineHeight: 1.3, flexShrink: 0 }}>{v.icon}</span>
      <div style={{ flex: 1, lineHeight: 1.5, wordBreak: 'break-word' }}>{toast.message}</div>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--k-text-muted)', fontSize: '14px', fontWeight: 700, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
      >
        {'✕'}
      </button>
    </div>
  )
}

export function ToastViewport({ toasts, onDismiss }: { toasts: ToastRecord[]; onDismiss: (id: number) => void }) {
  // Newest on top; cap visible count.
  const visible = [...toasts].slice(-MAX_VISIBLE).reverse()
  return (
    <div
      // aria-live region wrapper so SR announces toasts even though items also carry role.
      aria-live="polite"
      style={{
        position: 'fixed', bottom: '20px', right: '20px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        zIndex: 2000, pointerEvents: 'none',
      }}
    >
      {visible.map(t => <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  )
}
