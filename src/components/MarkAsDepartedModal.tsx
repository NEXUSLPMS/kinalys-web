import { useState } from 'react'
import { softDeleteUser } from '../api/client'

// ──────────────────────────────────────────────────────────────────────
// MarkAsDepartedModal v2 (V8 — 27 May 2026)
//
// Destructive-action modal. Calls DELETE /users/:id which:
//   - sets deleted_at on the user
//   - forces employment_status = 'departed' (if not already)
//   - fires Org Memory trigger #4 (createDepartureEvent)
//
// V8 change: notes are MANDATORY. Pre-flight validated locally,
// server enforces via isGenuineNote() helper as the source of truth.
// ──────────────────────────────────────────────────────────────────────

interface MarkAsDepartedUser {
  id: string
  full_name: string
  email: string
  role: string
  department_name: string | null
  employment_status: string
}

interface Props {
  user: MarkAsDepartedUser
  onClose: () => void
  onSuccess: (result: {
    target_id: string
    was_already_departed: boolean
    departure_event: any
  }) => void
}

const EXIT_REASONS: Array<{ value: string; label: string; description: string }> = [
  { value: 'resigned',       label: 'Resigned',       description: 'Voluntary resignation' },
  { value: 'retired',        label: 'Retired',        description: 'End-of-career exit' },
  { value: 'terminated',     label: 'Terminated',     description: 'For cause (compliance, behaviour, POSH, performance failure)' },
  { value: 'laid_off',       label: 'Laid Off',       description: 'Position eliminated, severance paid' },
  { value: 'contract_ended', label: 'Contract Ended', description: 'Fixed-term contract expired' },
  { value: 'deceased',       label: 'Deceased',       description: '' },
  { value: 'absconded',      label: 'Absconded',      description: 'Left without notice' },
]

// Mirrors apps/api/src/services/validation.ts — keep in sync with backend rules.
// Returns null if note passes, else the user-facing error message.
const BLOCKED_NOTE_PHRASES = [
  'this is a test', 'test comment', 'testing', 'just testing', 'test test',
  'hello world', 'foo bar', 'lorem ipsum', 'blah blah', 'n/a', 'nothing',
  'no comment', 'asdf', 'qwerty', 'please approve', 'approve this',
  'submit this', 'tbd', 'will add later',
]

const MEANINGFUL_NOTE_TERMS = [
  'performance', 'kpi', 'coaching', 'improvement', 'target', 'score',
  'declining', 'missed', 'below', 'training', 'support', 'feedback', 'review',
  'behaviour', 'behavior', 'attendance', 'quality', 'output', 'result', 'metric',
  'resign', 'resigned', 'retire', 'retired', 'terminate', 'terminated',
  'absconded', 'laid off', 'redundancy', 'redundant', 'contract', 'expired',
  'departed', 'departure', 'notice', 'last day', 'exit',
  'customer', 'call', 'complaint', 'issue', 'concern', 'recommend', 'release',
  'business', 'justification', 'reason', 'history', 'pattern', 'consistent',
  'quarter', 'cycle', 'month', 'week', 'discussion', 'meeting', 'warned',
  'fortnightly', 'weekly', 'monthly', 'session', 'plan', 'attend', 'complete',
  'handover', 'transition', 'replacement', 'role', 'team', 'project', 'client',
  'compliance', 'posh', 'misconduct', 'policy', 'investigation',
  'relocate', 'relocating', 'personal', 'family', 'health', 'medical',
]

const KEYBOARD_RUNS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890', '0987654321']

function validateNote(text: string): string | null {
  const t = (text || '').trim()
  if (t.length === 0) return 'Note is required.'
  if (t.length < 20) return 'Note must be at least 20 characters. Provide enough context to be useful in an audit.'

  const words = t.split(/\s+/).filter(w => w.length > 0)
  if (words.length < 4) return 'Note must contain at least 4 words.'
  if (!words.some(w => w.length > 3)) return 'Note must contain at least one substantive word longer than 3 characters.'

  const lower = t.toLowerCase()

  if (BLOCKED_NOTE_PHRASES.some(p => lower.includes(p))) {
    return 'Note appears generic or placeholder text. Write a substantive reason.'
  }

  const charCounts = lower.split('').reduce((acc: Record<string, number>, c: string) => {
    acc[c] = (acc[c] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const maxRepeat = Math.max(...(Object.values(charCounts) as number[]))
  if (maxRepeat / t.length > 0.6) return 'Note appears repetitive or filler.'

  const noSpaces = lower.replace(/\s/g, '')
  if (KEYBOARD_RUNS.some(run => noSpaces.includes(run.slice(0, 6)))) {
    return 'Note appears to contain keyboard-mash text.'
  }

  if (!MEANINGFUL_NOTE_TERMS.some(m => lower.includes(m))) {
    return 'Note must contain context about performance, departure, role, business, or related topics.'
  }

  return null
}

export function MarkAsDepartedModal({ user, onClose, onSuccess }: Props) {
  const wasAlreadyDeparted = user.employment_status === 'departed'

  const [exitReason, setExitReason] = useState<string>('')
  const [exitDate, setExitDate] = useState<string>(() => {
    const today = new Date()
    return today.toISOString().slice(0, 10) // YYYY-MM-DD for <input type="date">
  })
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validate(): string | null {
    if (!wasAlreadyDeparted && !exitReason) {
      return 'Select an exit reason.'
    }
    if (!exitDate) {
      return 'Exit date is required.'
    }
    const noteError = validateNote(notes)
    if (noteError) return noteError
    return null
  }

  async function handleConfirm() {
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const result = await softDeleteUser(user.id, {
        exit_reason: wasAlreadyDeparted ? 'resigned' /* ignored server-side */ : exitReason,
        exit_date: new Date(exitDate + 'T00:00:00').toISOString(),
        notes: notes.trim(),
      })
      onSuccess(result)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to mark as departed.')
      setSubmitting(false)
    }
  }

  const noteCount = notes.trim().length
  const noteValid = noteCount >= 20 && !validateNote(notes)

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose() }}
    >
      <div
        style={{
          background: 'var(--k-bg-surface)',
          borderRadius: 'var(--k-radius-lg)',
          padding: '28px',
          width: '560px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--k-shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '4px', fontFamily: 'var(--k-font-display, var(--k-font-sans))' }}>
            Remove {user.full_name}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--k-text-secondary)' }}>
            {user.role.replace(/_/g, ' ')}{user.department_name ? ` · ${user.department_name}` : ''} · {user.email}
          </div>
        </div>

        {/* Warning banner */}
        <div
          style={{
            background: 'var(--k-danger-bg)',
            color: 'var(--k-danger-text)',
            padding: '12px 14px',
            borderRadius: 'var(--k-radius-md)',
            fontSize: '12px',
            lineHeight: 1.5,
            marginBottom: '20px',
            border: '1px solid var(--k-danger-text)',
          }}
        >
          <strong>This will permanently remove the user from the active roster.</strong>
          {wasAlreadyDeparted
            ? ' The user is already marked as departed. This action will set their deleted_at timestamp.'
            : ' Their employment status will be set to departed, their exit reason recorded, and an Org Memory brief will be generated.'}
          {' '}This cannot be undone through the normal UI.
        </div>

        {/* Exit reason — hidden if already departed */}
        {!wasAlreadyDeparted && (
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--k-text-primary)',
                marginBottom: '6px',
              }}
            >
              Exit reason <span style={{ color: 'var(--k-danger-text)' }}>*</span>
            </label>
            <select
              value={exitReason}
              onChange={(e) => setExitReason(e.target.value)}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 'var(--k-radius-md)',
                border: '1px solid var(--k-border-default)',
                background: 'var(--k-bg-page)',
                color: 'var(--k-text-primary)',
                fontSize: '13px',
                fontFamily: 'var(--k-font-sans)',
              }}
            >
              <option value="">-- Select reason --</option>
              {EXIT_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {exitReason && (
              <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginTop: '6px' }}>
                {EXIT_REASONS.find(r => r.value === exitReason)?.description}
              </div>
            )}
          </div>
        )}

        {/* Exit date */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--k-text-primary)',
              marginBottom: '6px',
            }}
          >
            Exit date <span style={{ color: 'var(--k-danger-text)' }}>*</span>
          </label>
          <input
            type="date"
            value={exitDate}
            onChange={(e) => setExitDate(e.target.value)}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--k-radius-md)',
              border: '1px solid var(--k-border-default)',
              background: 'var(--k-bg-page)',
              color: 'var(--k-text-primary)',
              fontSize: '13px',
              fontFamily: 'var(--k-font-sans)',
            }}
          />
        </div>

        {/* Notes (mandatory — V8) */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--k-text-primary)',
              marginBottom: '6px',
            }}
          >
            Audit notes <span style={{ color: 'var(--k-danger-text)' }}>*</span>
            <span style={{ fontWeight: 400, color: 'var(--k-text-muted)', marginLeft: '6px' }}>
              (required, min 20 characters)
            </span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
            rows={4}
            placeholder="Required: explain context for the audit trail. Examples: 'Resigning to relocate to Bangalore, last working day 15 June. Handover plan signed.' OR 'Failed PIP outcome — see flag dated 12 May. POSH committee reviewed.'"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--k-radius-md)',
              border: `1px solid ${notes.length === 0 ? 'var(--k-border-default)' : (noteValid ? 'var(--k-success-text)' : 'var(--k-warning-text)')}`,
              background: 'var(--k-bg-page)',
              color: 'var(--k-text-primary)',
              fontSize: '13px',
              fontFamily: 'var(--k-font-sans)',
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>
              These notes flow to the audit log and the Org Memory brief.
            </span>
            <span style={{ fontSize: '11px', color: noteValid ? 'var(--k-success-text)' : 'var(--k-text-muted)' }}>
              {noteCount} chars
            </span>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--k-danger-bg)',
              color: 'var(--k-danger-text)',
              padding: '10px 12px',
              borderRadius: 'var(--k-radius-md)',
              fontSize: '12px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            className="k-btn k-btn-secondary"
            onClick={onClose}
            disabled={submitting}
            style={{ minWidth: '100px' }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || (!wasAlreadyDeparted && !exitReason) || !noteValid}
            style={{
              minWidth: '160px',
              padding: '8px 16px',
              borderRadius: 'var(--k-radius-md)',
              border: 'none',
              background: 'var(--k-danger-text)',
              color: 'white',
              fontWeight: 600,
              fontSize: '13px',
              fontFamily: 'var(--k-font-sans)',
              cursor: (submitting || !noteValid) ? 'not-allowed' : 'pointer',
              opacity: (submitting || !noteValid) ? 0.6 : 1,
            }}
          >
            {submitting ? 'Removing…' : 'Mark as Departed'}
          </button>
        </div>
      </div>
    </div>
  )
}
