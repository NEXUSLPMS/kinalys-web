import { useEffect, useRef, useState } from 'react'

interface Props {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  /** When set, the user must type this exact string to enable the confirm
   *  button (for the highest-stakes actions). */
  requireTypedConfirmation?: string
  /** Disables the confirm button while an async action is in flight. */
  busy?: boolean
}

// Generalised from MarkAsDepartedModal: danger-styled confirm, ghost cancel,
// backdrop-click = cancel, Escape = cancel, focus trapped inside the modal.
export default function DestructiveConfirmModal({
  title, message, confirmLabel, onConfirm, onCancel, requireTypedConfirmation, busy,
}: Props) {
  const [typed, setTyped] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  const typedOk = !requireTypedConfirmation || typed === requireTypedConfirmation
  const confirmDisabled = busy || !typedOk

  useEffect(() => {
    // Move focus into the modal on open (Cancel is the safe default).
    cancelRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (!busy) onCancel()
        return
      }
      if (e.key !== 'Tab') return
      // Focus trap: keep Tab/Shift+Tab cycling inside the dialog.
      const root = dialogRef.current
      if (!root) return
      const focusable = root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [busy, onCancel])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500 }}
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel() }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="destructive-confirm-title"
        aria-describedby="destructive-confirm-message"
        style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-lg)', padding: '28px', width: '440px', maxWidth: '90vw', boxShadow: 'var(--k-shadow-lg)' }}
      >
        <div id="destructive-confirm-title" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '8px', fontFamily: 'var(--k-font-display, var(--k-font-sans))' }}>
          {title}
        </div>
        <div id="destructive-confirm-message" style={{ fontSize: '13px', color: 'var(--k-text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
          {message}
        </div>

        {requireTypedConfirmation && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--k-text-primary)', marginBottom: '6px' }}>
              Type <strong>{requireTypedConfirmation}</strong> to confirm
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={busy}
              aria-label={`Type ${requireTypedConfirmation} to confirm`}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-page)', color: 'var(--k-text-primary)', fontSize: '13px', fontFamily: 'var(--k-font-sans)' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button ref={cancelRef} className="k-btn k-btn-ghost" onClick={onCancel} disabled={busy} style={{ minWidth: '90px' }}>
            Cancel
          </button>
          <button
            className="k-btn k-btn-danger"
            onClick={onConfirm}
            disabled={confirmDisabled}
            style={{ minWidth: '120px', background: 'var(--k-danger-text)', color: 'white', border: 'none', cursor: confirmDisabled ? 'not-allowed' : 'pointer', opacity: confirmDisabled ? 0.6 : 1 }}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
