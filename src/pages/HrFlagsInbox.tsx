import { useState, useEffect } from 'react'
import { getPendingFlags, getFlagCounts, confirmFlagConversation, delegateFlag, getHrExecutives, confirmPipClosure } from '../api/client'

function isGenuineComment(text: string): boolean {
  const t = text.trim()
  if (t.length < 20) return false
  const words = t.split(/\s+/).filter(w => w.length > 0)
  if (words.length < 4) return false
  if (!words.some(w => w.length > 3)) return false
  const lowerText = t.toLowerCase()
  const blocked = ['this is a test', 'test comment', 'testing', 'just testing', 'test test',
    'hello world', 'lorem ipsum', 'blah blah', 'n/a', 'nothing', 'no comment',
    'asdf', 'qwerty', 'please approve', 'approve this', 'tbd', 'will add later']
  if (blocked.some(b => lowerText.includes(b))) return false
  const charCounts = lowerText.split('').reduce((acc: Record<string, number>, c: string) => { acc[c] = (acc[c] || 0) + 1; return acc }, {})
  const maxRepeat = Math.max(...(Object.values(charCounts) as number[]))
  if (maxRepeat / t.length > 0.6) return false
  const noSpaces = lowerText.replace(/\s/g, '')
  const runs = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890']
  if (runs.some(run => noSpaces.includes(run.slice(0, 6)))) return false
  return true
}

// Tile status groupings - single source per number (rule 30/31: one definition, no drift)
const PENDING_HR_STATUSES = ['pending_hr', 'pending_hr_closure']
const PENDING_EMP_STATUSES = ['pending_employee_ack']
const ACTIVE_PIP_STATUSES = ['pip_active']
const PROCESSED_STATUSES = ['hr_reviewing', 'extended']
const TOTAL_PENDING_STATUSES = [...PENDING_HR_STATUSES, ...PENDING_EMP_STATUSES]
const TERMINAL_STATUSES = ['completed_successful', 'completed_unsuccessful', 'closed', 'withdrawn', 'completed']

type TileKey = 'total_pending' | 'pending_hr' | 'pending_employee' | 'processed' | 'active_pip' | 'pip' | 'release'

function matchesTile(f: any, tile: TileKey | null): boolean {
  switch (tile) {
    case null: return true
    case 'total_pending': return TOTAL_PENDING_STATUSES.includes(f.status)
    case 'pending_hr': return PENDING_HR_STATUSES.includes(f.status)
    case 'pending_employee': return PENDING_EMP_STATUSES.includes(f.status)
    case 'processed': return PROCESSED_STATUSES.includes(f.status)
    case 'active_pip': return ACTIVE_PIP_STATUSES.includes(f.status)
    case 'pip': return f.flag_type === 'pip'
    case 'release': return f.flag_type === 'release' && f.status !== 'conversation_done'
    default: return true
  }
}

// Backfill-planning helpers (decision 62: Ending Soon = past midpoint, proportional to PIP duration)
function daysRemaining(endDate: string): number {
  const end = new Date(endDate)
  const today = new Date()
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
function pipDurationDays(f: any): number | null {
  if (!f.pip_start_date || !f.pip_end_date) return null
  const start = new Date(f.pip_start_date).getTime()
  const end = new Date(f.pip_end_date).getTime()
  const d = (end - start) / (1000 * 60 * 60 * 24)
  return d > 0 ? d : null
}
function isOverduePip(f: any): boolean {
  return !!f.pip_end_date && daysRemaining(f.pip_end_date) < 0
}
function isEndingSoonPip(f: any): boolean {
  if (!f.pip_end_date) return false
  const rem = daysRemaining(f.pip_end_date)
  if (rem < 0) return false
  const dur = pipDurationDays(f)
  if (dur === null) return false
  return rem <= dur * 0.5
}

export default function HrFlagsInbox({ onNavigate }: { onNavigate?: (nav: string) => void }) {
  const [data, setData] = useState<any>(null)
  const [counts, setCounts] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedFlag, setSelectedFlag] = useState<any>(null)
  const [action, setAction] = useState<'confirm' | 'delegate' | null>(null)
  const [hrComment, setHrComment] = useState('')
  const [delegateTo, setDelegateTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [delegationNotes, setDelegationNotes] = useState('')
  const [hrExecutives, setHrExecutives] = useState<any[]>([])
  const [processing, setProcessing] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [actionError, setActionError] = useState('')
  const [closureNotes, setClosureNotes] = useState('')
  const [activeTile, setActiveTile] = useState<TileKey | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setSuccessMsg('')
    try {
      const [flagsResult, execResult, countsResult] = await Promise.allSettled([getPendingFlags(), getHrExecutives(), getFlagCounts()])
      if (flagsResult.status === 'fulfilled') setData(flagsResult.value)
      if (execResult.status === 'fulfilled') setHrExecutives(execResult.value.executives || [])
      if (countsResult.status === 'fulfilled') setCounts(countsResult.value)
    } catch (err: any) {
      setError('Failed to load flags inbox.')
    } finally {
      setLoading(false)
    }
  }

  function resetPanel() {
    setSelectedFlag(null)
    setAction(null)
    setHrComment('')
    setDelegateTo('')
    setDueDate('')
    setDelegationNotes('')
    setActionError('')
    setClosureNotes('')
  }

  async function handleConfirm() {
    if (!selectedFlag) return
    if (!hrComment || hrComment.trim().length < 20) {
      setActionError('HR notes are mandatory. Please provide at least 20 characters.')
      return
    }
    setProcessing(true)
    setActionError('')
    try {
      await confirmFlagConversation(selectedFlag.id, hrComment.trim())
      setSuccessMsg(`Conversation confirmed for ${selectedFlag.employee_name}. ${selectedFlag.flag_type === 'pip' ? 'PIP flag is now visible to the employee. Manager and employee have been notified.' : 'Release flag remains confidential. Manager has been notified.'}`)
      resetPanel()
      await load()
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to confirm.')
    } finally {
      setProcessing(false)
    }
  }

  async function handleDelegate() {
    if (!selectedFlag) return
    if (!delegateTo) { setActionError('Please select an HR Executive to delegate to.'); return }
    if (!dueDate) { setActionError('Please set a due date for completing this action.'); return }
    if (!delegationNotes || delegationNotes.trim().length < 20) {
      setActionError('Delegation notes are mandatory. Please provide at least 20 characters.')
      return
    }
    setProcessing(true)
    setActionError('')
    try {
      await delegateFlag(selectedFlag.id, { delegate_to: delegateTo, due_date: dueDate, delegation_notes: delegationNotes.trim() })
      const exec = hrExecutives.find(e => e.id === delegateTo)
      setSuccessMsg(`Flag delegated to ${exec?.full_name || 'HR Executive'}. Due by ${dueDate}. They have been notified.`)
      resetPanel()
      await load()
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to delegate.')
    } finally {
      setProcessing(false)
    }
  }

  // Default due date - 3 business days from today
  function getDefaultDueDate() {
    const d = new Date()
    let added = 0
    while (added < 3) {
      d.setDate(d.getDate() + 1)
      if (d.getDay() !== 0 && d.getDay() !== 6) added++
    }
    return d.toISOString().split('T')[0]
  }

  const allFlags: any[] = data?.flags || []
  const filtered = allFlags.filter((f: any) => matchesTile(f, activeTile))

  // Active-tile counts - off the loaded list (== filtered length when clicked, can't drift)
  const cTotalPending = allFlags.filter((f: any) => TOTAL_PENDING_STATUSES.includes(f.status)).length
  const cPendingHr = allFlags.filter((f: any) => PENDING_HR_STATUSES.includes(f.status)).length
  const cPendingEmp = allFlags.filter((f: any) => PENDING_EMP_STATUSES.includes(f.status)).length
  const cProcessed = allFlags.filter((f: any) => PROCESSED_STATUSES.includes(f.status)).length
  const cActivePip = allFlags.filter((f: any) => ACTIVE_PIP_STATUSES.includes(f.status)).length
  const cPip = allFlags.filter((f: any) => f.flag_type === 'pip').length
  const cRelease = allFlags.filter((f: any) => f.flag_type === 'release' && f.status !== 'conversation_done').length

  // Backfill planning (tenant-wide, over active PIPs only)
  const activePips = allFlags.filter((f: any) => ACTIVE_PIP_STATUSES.includes(f.status))
  const cPipOverdue = activePips.filter(isOverduePip).length
  const cPipEndingSoon = activePips.filter(isEndingSoonPip).length
  const atRiskEndDates = activePips
    .filter((f: any) => isOverduePip(f) || isEndingSoonPip(f))
    .map((f: any) => f.pip_end_date)
    .filter(Boolean)
    .sort()
  const fallbackEndDates = activePips.map((f: any) => f.pip_end_date).filter(Boolean).sort()
  const nextAtRisk = atRiskEndDates[0] || fallbackEndDates[0] || null

  // Closed counts - from /flags/counts breakdown (terminal statuses the inbox feed omits)
  const breakdown: any[] = counts?.breakdown || []
  const cPipClosed = breakdown.filter(b => b.flag_type === 'pip' && TERMINAL_STATUSES.includes(b.status)).reduce((s, b) => s + b.count, 0)
  const cReleaseClosed = breakdown.filter(b => b.flag_type === 'release' && (TERMINAL_STATUSES.includes(b.status) || b.status === 'conversation_done')).reduce((s, b) => s + b.count, 0)

  function toggleTile(t: TileKey) {
    setActiveTile(prev => prev === t ? null : t)
  }

  if (loading) return <div className="k-page"><div style={{ color: 'var(--k-text-muted)', fontSize: '14px', padding: '40px 0' }}>Loading flags inbox...</div></div>
  if (error) return <div className="k-page"><div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', fontSize: '13px', color: 'var(--k-danger-text)' }}>{error}</div></div>

  const activeTiles: { key: TileKey; label: string; sub?: string; count: number; accent: string; accentBg: string }[] = [
    { key: 'total_pending', label: 'TOTAL PENDING', sub: 'At HR or Employee', count: cTotalPending, accent: 'var(--k-brand-primary)', accentBg: 'var(--k-bg-card)' },
    { key: 'pending_hr', label: 'PENDING (HR)', sub: 'Awaiting HR action', count: cPendingHr, accent: 'var(--k-brand-primary)', accentBg: 'var(--k-bg-card)' },
    { key: 'pending_employee', label: 'PENDING (EMPLOYEE)', sub: 'Awaiting acknowledgement', count: cPendingEmp, accent: 'var(--k-brand-primary)', accentBg: 'var(--k-bg-card)' },
    { key: 'active_pip', label: 'ACTIVE PIPs', sub: 'Improvement plans live', count: cActivePip, accent: 'var(--k-warning-text)', accentBg: 'var(--k-warning-bg)' },
    { key: 'processed', label: 'PROCESSED', sub: 'Reviewing / extended', count: cProcessed, accent: 'var(--k-text-secondary)', accentBg: 'var(--k-bg-card)' },
    { key: 'pip', label: 'PIP FLAGS', sub: 'All PIP, any status', count: cPip, accent: 'var(--k-warning-text)', accentBg: 'var(--k-warning-bg)' },
    { key: 'release', label: 'RELEASE FLAGS', sub: 'All release, any status', count: cRelease, accent: 'var(--k-danger-text)', accentBg: 'var(--k-danger-bg)' },
  ]

  return (
    <div className="k-page">
      <div style={{ marginBottom: '24px' }}>
        <div className="k-page-title">HR Flags Inbox</div>
        <div className="k-page-sub">Employee flags submitted by managers for HR review &middot; All notes are mandatory and audit logged</div>
      </div>

      {successMsg && (
        <div style={{ background: 'var(--k-success-bg)', border: '1px solid var(--k-success-border, #6ee7b7)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-success-text)', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {/* Summary tiles &mdash; 7 active (click to filter) + 2 closed (read-only counts) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
        {activeTiles.map(t => {
          const isActive = activeTile === t.key
          return (
            <div key={t.key} onClick={() => toggleTile(t.key)}
              className="k-card"
              style={{ padding: '16px', textAlign: 'center', cursor: 'pointer',
                background: isActive ? t.accent : t.accentBg,
                border: isActive ? '1px solid transparent' : '1px solid var(--k-border-default)',
                transition: 'background 0.12s' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', marginBottom: '6px',
                color: isActive ? 'white' : t.accent }}>{t.label}</div>
              <div style={{ fontSize: '34px', fontWeight: 800, fontFamily: 'var(--k-font-display)',
                color: isActive ? 'white' : t.accent }}>{t.count}</div>
              {t.sub && <div style={{ fontSize: '11px', marginTop: '2px', color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--k-text-muted)' }}>{t.sub}</div>}
            </div>
          )
        })}
      </div>

      {/* PIP backfill planning band &mdash; tenant-wide. Ending Soon = past PIP midpoint (decision 62). */}
      <div className="k-card" style={{ padding: '14px 18px', marginBottom: '12px', borderLeft: '4px solid var(--k-warning-text)', borderRadius: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: 'var(--k-text-muted)' }}>
            PIP BACKFILL PLANNING<span style={{ color: 'var(--k-text-muted)', fontWeight: 600 }}> &middot; TENANT-WIDE</span>
          </div>
          <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--k-text-muted)' }}>Active</div>
              <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--k-font-display)', color: 'var(--k-text-primary)' }}>{cActivePip}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--k-text-muted)' }}>Ending soon</div>
              <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--k-font-display)', color: 'var(--k-warning-text)' }}>{cPipEndingSoon}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--k-text-muted)' }}>Overdue</div>
              <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--k-font-display)', color: 'var(--k-danger-text)' }}>{cPipOverdue}</div>
            </div>
            <div style={{ textAlign: 'right', minWidth: '120px' }}>
              <div style={{ fontSize: '10px', color: 'var(--k-text-muted)' }}>Next seat at risk</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--k-text-primary)' }}>
                {nextAtRisk ? new Date(nextAtRisk).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '\u2014'}
              </div>
            </div>
          </div>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginTop: '8px' }}>
          Ending soon = past the PIP midpoint. Plan backfills early in case a plan does not complete successfully.
        </div>
      </div>

      {/* Closed counts &mdash; read-only (history drill-in is a separate surface) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div className="k-card" onClick={() => onNavigate?.('flaghistory')} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.85, cursor: 'pointer' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: 'var(--k-text-muted)' }}>PIP CLOSED</div>
            <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginTop: '2px' }}>Completed / withdrawn</div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--k-font-display)', color: 'var(--k-text-secondary)' }}>{cPipClosed}</div>
        </div>
        <div className="k-card" onClick={() => onNavigate?.('flaghistory')} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.85, cursor: 'pointer' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: 'var(--k-text-muted)' }}>RELEASE CLOSED</div>
            <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginTop: '2px' }}>Completed / withdrawn</div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--k-font-display)', color: 'var(--k-text-secondary)' }}>{cReleaseClosed}</div>
        </div>
      </div>

      {activeTile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>Filtered: {filtered.length} flag{filtered.length === 1 ? '' : 's'}</span>
          <button onClick={() => setActiveTile(null)}
            style={{ padding: '4px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)' }}>
            Clear filter
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Flags list */}
        <div style={{ flex: 1 }}>
          {filtered.length === 0 && (
            <div className="k-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--k-text-muted)', fontSize: '13px' }}>
              {allFlags.length === 0 ? 'No active flags. All flags have been reviewed.' : 'No flags match this filter.'}
            </div>
          )}
          {filtered.map((flag: any) => {
            const isPip = flag.flag_type === 'pip'
            const isSelected = selectedFlag?.id === flag.id
            return (
              <div key={flag.id}
                onClick={() => { if (isSelected) { resetPanel() } else { setSelectedFlag(flag); setAction(null); setActionError(''); setDueDate(getDefaultDueDate()) } }}
                className="k-card"
                style={{ marginBottom: '12px', padding: '16px', cursor: 'pointer',
                  borderLeft: `4px solid ${isPip ? 'var(--k-warning-text)' : 'var(--k-danger-text)'}`,
                  background: isSelected ? (isPip ? 'var(--k-warning-bg)' : 'var(--k-danger-bg)') : 'var(--k-bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-text-primary)' }}>{flag.employee_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{flag.department_name} &middot; Flagged by {flag.flagged_by_name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                      color: isPip ? 'var(--k-warning-text)' : 'var(--k-danger-text)',
                      background: isPip ? 'var(--k-warning-bg)' : 'var(--k-danger-bg)' }}>
                      {isPip ? 'PIP' : 'RELEASE'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>
                      {new Date(flag.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--k-text-secondary)', lineHeight: 1.5, padding: '8px', background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--k-text-muted)', fontSize: '11px' }}>Manager comment: </span>
                  {flag.manager_comment}
                </div>
                {flag.performance_snapshot && Object.keys(flag.performance_snapshot).length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    {[
                      { label: 'Current Score', value: flag.performance_snapshot.current_score ? `${flag.performance_snapshot.current_score}%` : '\u2014' },
                      { label: 'Q3 Projection', value: flag.performance_snapshot.predicted_score ? `${flag.performance_snapshot.predicted_score}%` : '\u2014' },
                      { label: 'Trend', value: flag.performance_snapshot.trend_direction || '\u2014' },
                    ].map(stat => (
                      <div key={stat.label} style={{ textAlign: 'center', flex: 1, padding: '6px', background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--k-text-muted)' }}>{stat.label}</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-text-primary)', textTransform: 'capitalize' }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Action panel */}
        {selectedFlag && (
          <div style={{ width: '480px', flexShrink: 0 }}>
            <div className="k-card" style={{ padding: '20px', borderTop: `4px solid ${selectedFlag.flag_type === 'pip' ? 'var(--k-warning-text)' : 'var(--k-danger-text)'}` }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '2px' }}>{selectedFlag.employee_name}</div>
              <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', marginBottom: '16px' }}>
                {selectedFlag.flag_type === 'pip' ? 'PIP Flag' : 'Release Flag'} &middot; by {selectedFlag.flagged_by_name}
              </div>

              {selectedFlag.flag_type === 'release' && (
                <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '10px', marginBottom: '12px', fontSize: '11px', color: 'var(--k-danger-text)', lineHeight: 1.5 }}>
                  SENSITIVE: Employee will never be shown this flag. Confirm only after review with relevant stakeholders.
                </div>
              )}

              {selectedFlag.flag_type === 'pip' && (
                <div style={{ background: 'var(--k-warning-bg)', border: '1px solid var(--k-warning-border, #fcd34d)', borderRadius: 'var(--k-radius-md)', padding: '10px', marginBottom: '12px', fontSize: '11px', color: 'var(--k-warning-text)', lineHeight: 1.5 }}>
                  After confirmation, PIP flag becomes visible to the employee. Manager and employee will be notified.
                </div>
              )}

              {/* PIP Form Data - show what manager submitted */}
              {selectedFlag.flag_type === 'pip' && selectedFlag.pip_form_data && (
                <div style={{ background: 'var(--k-bg-page)', border: '1px solid var(--k-border-default)', borderRadius: 'var(--k-radius-lg)', padding: '14px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', marginBottom: '10px' }}>PIP DETAILS &mdash; SUBMITTED BY MANAGER</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ background: 'var(--k-bg-card)', borderRadius: 'var(--k-radius-md)', padding: '8px 10px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginBottom: '2px' }}>Duration</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-text-primary)' }}>
                        {selectedFlag.pip_form_data.duration_days ? `${selectedFlag.pip_form_data.duration_days} days` : '-'}
                        {selectedFlag.pip_start_date ? ` \u00b7 ${new Date(selectedFlag.pip_start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to ${new Date(selectedFlag.pip_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                      </div>
                    </div>
                    <div style={{ background: 'var(--k-bg-card)', borderRadius: 'var(--k-radius-md)', padding: '8px 10px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginBottom: '2px' }}>Review Frequency</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-text-primary)', textTransform: 'capitalize' }}>
                        {selectedFlag.pip_form_data.review_frequency || 'Weekly'}
                      </div>
                    </div>
                  </div>

                  {selectedFlag.pip_form_data.kpi_targets && Object.keys(selectedFlag.pip_form_data.kpi_targets).length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginBottom: '6px', fontWeight: 700 }}>KPI TARGETS</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {Object.entries(selectedFlag.pip_form_data.kpi_targets).map(([kpi, target]: [string, any]) => (
                          <div key={kpi} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: 'var(--k-bg-card)', borderRadius: 'var(--k-radius-sm)', fontSize: '12px' }}>
                            <span style={{ color: 'var(--k-text-secondary)' }}>{kpi}</span>
                            <span style={{ fontWeight: 700, color: 'var(--k-brand-primary)' }}>{target}% target</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedFlag.pip_form_data.support_plan && (
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginBottom: '4px', fontWeight: 700 }}>SUPPORT PLAN</div>
                      <div style={{ fontSize: '12px', color: 'var(--k-text-primary)', lineHeight: 1.6, padding: '8px', background: 'var(--k-bg-card)', borderRadius: 'var(--k-radius-md)' }}>
                        {selectedFlag.pip_form_data.support_plan}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginBottom: '4px', fontWeight: 700 }}>MANAGER NOTES</div>
                    <div style={{ fontSize: '12px', color: 'var(--k-text-primary)', lineHeight: 1.6, padding: '8px', background: 'var(--k-bg-card)', borderRadius: 'var(--k-radius-md)' }}>
                      {selectedFlag.manager_comment || selectedFlag.manager_notes || selectedFlag.reason}
                    </div>
                  </div>
                </div>
              )}

              {/* Action selector */}
              {!action && selectedFlag.status === 'pending_hr_closure' && (
                <div>
                  <div style={{ background: 'var(--k-warning-bg)', border: '1px solid var(--k-warning-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 14px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-warning-text)', marginBottom: '6px' }}>MANAGER CLOSURE RECOMMENDATION</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-text-primary)', textTransform: 'capitalize', marginBottom: '4px' }}>
                      Outcome: {selectedFlag.final_outcome || 'Not specified'}
                    </div>
                    {selectedFlag.final_outcome_notes && (
                      <div style={{ fontSize: '12px', color: 'var(--k-text-primary)', lineHeight: 1.5, marginTop: '6px' }}>
                        {selectedFlag.final_outcome_notes}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '4px' }}>HR CLOSURE NOTES</div>
                  <textarea value={closureNotes} onChange={e => setClosureNotes(e.target.value)}
                    placeholder="Document your review of this closure recommendation..."
                    rows={3}
                    style={{ width: '100%', fontSize: '12px', padding: '8px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px' }} />
                  {actionError && <div style={{ fontSize: '12px', color: 'var(--k-danger-text)', marginBottom: '8px' }}>{actionError}</div>}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={async () => {
                      if (closureNotes.trim().length < 10) { setActionError('Please add closure notes of at least 10 characters.'); return }
                      setProcessing(true)
                      try {
                        await confirmPipClosure(selectedFlag.id, { approved: false, hr_notes: closureNotes })
                        setSuccessMsg('Closure rejected. PIP returned to active.')
                        resetPanel()
                        await load()
                      } catch (err: any) {
                        setActionError(err.response?.data?.message || 'Failed.')
                      } finally { setProcessing(false) }
                    }} disabled={processing}
                      style={{ flex: 1, padding: '9px', background: 'var(--k-bg-page)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)', color: 'var(--k-danger-text)' }}>
                      Reject
                    </button>
                    <button onClick={async () => {
                      if (closureNotes.trim().length < 10) { setActionError('Please add closure notes of at least 10 characters.'); return }
                      setProcessing(true)
                      try {
                        await confirmPipClosure(selectedFlag.id, { approved: true, hr_notes: closureNotes })
                        setSuccessMsg(`PIP closure approved as ${selectedFlag.final_outcome}.`)
                        resetPanel()
                        await load()
                      } catch (err: any) {
                        setActionError(err.response?.data?.message || 'Failed.')
                      } finally { setProcessing(false) }
                    }} disabled={processing}
                      style={{ flex: 1, padding: '9px', background: selectedFlag.final_outcome === 'successful' ? 'var(--k-success-text)' : selectedFlag.final_outcome === 'unsuccessful' ? 'var(--k-danger-text)' : 'var(--k-warning-text)', border: 'none', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)', color: 'white' }}>
                      Approve Closure
                    </button>
                  </div>
                </div>
              )}

              {!action && selectedFlag.status === 'pending_hr' && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <button onClick={() => setAction('confirm')}
                    style={{ flex: 1, padding: '10px', background: 'var(--k-brand-primary)', border: 'none', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)', color: 'white' }}>
                    I will process this
                  </button>
                  <button onClick={() => setAction('delegate')}
                    style={{ flex: 1, padding: '10px', background: 'var(--k-bg-page)', border: '1px solid var(--k-border-default)', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)', color: 'var(--k-text-primary)' }}>
                    Delegate to HR Exec
                  </button>
                </div>
              )}

              {!action && ['hr_reviewing', 'conversation_done', 'pending_employee_ack', 'pip_active', 'extended'].includes(selectedFlag.status) && (
                <div style={{ background: 'var(--k-bg-page)', border: '1px solid var(--k-border-default)', borderRadius: 'var(--k-radius-md)', padding: '12px 14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '6px' }}>LIFECYCLE STATUS</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '4px' }}>
                    {selectedFlag.status === 'pending_employee_ack' ? 'Awaiting employee acknowledgement'
                      : selectedFlag.status === 'pip_active' ? 'PIP active \u2014 improvement plan in progress'
                      : selectedFlag.status === 'conversation_done' ? 'Conversation confirmed'
                      : selectedFlag.status === 'extended' ? 'PIP extended'
                      : 'Under HR review'}
                  </div>
                  {selectedFlag.hr_confirmed_at && (
                    <div style={{ fontSize: '12px', color: 'var(--k-text-secondary)', marginTop: '4px' }}>
                      HR conversation confirmed. No further action required at this stage.
                    </div>
                  )}
                </div>
              )}

              {/* Confirm form */}
              {action === 'confirm' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-text-primary)' }}>Confirm Conversation</div>
                    <button onClick={() => setAction(null)} style={{ background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: 'var(--k-text-muted)' }}>Back</button>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '4px' }}>
                    HR NOTES &mdash; MANDATORY
                  </div>
                  <textarea value={hrComment} onChange={e => setHrComment(e.target.value)}
                    placeholder="Document the conversation outcome, agreed actions, improvement targets, and next review date..."
                    rows={5}
                    style={{ width: '100%', fontSize: '12px', padding: '8px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'vertical', boxSizing: 'border-box' }} />
                  <div style={{ fontSize: '10px', color: hrComment.trim().length < 20 ? 'var(--k-danger-text)' : 'var(--k-success-text)', marginTop: '2px', marginBottom: '10px' }}>
                    {isGenuineComment(hrComment) ? 'Notes look good' : `${hrComment.trim().split(/\s+/).filter((w: string) => w.length > 0).length} words &mdash; need at least 4 meaningful words`}{hrComment.trim().length}/20 minimum characters
                  </div>
                  {actionError && <div style={{ fontSize: '12px', color: 'var(--k-danger-text)', marginBottom: '8px' }}>{actionError}</div>}
                  <div style={{ display: 'flex', gap: '8px' }}>
                 <button onClick={handleConfirm} disabled={processing || !isGenuineComment(hrComment)}
                      style={{ flex: 2, padding: '9px', background: selectedFlag.flag_type === 'pip' ? 'var(--k-warning-text)' : 'var(--k-danger-text)', border: 'none', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 700, cursor: processing || !isGenuineComment(hrComment) ? 'not-allowed' : 'pointer', fontFamily: 'var(--k-font-sans)', color: 'white', opacity: processing || !isGenuineComment(hrComment) ? 0.6 : 1 }}>
                      {processing ? 'Confirming...' : 'Confirm Conversation Done'}
                    </button>

                  </div>
                </div>
              )}

              {/* Delegate form */}
              {action === 'delegate' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-text-primary)' }}>Delegate to HR Executive</div>
                    <button onClick={() => setAction(null)} style={{ background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: 'var(--k-text-muted)' }}>Back</button>
                  </div>

                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '4px' }}>ASSIGN TO</div>
                  <select value={delegateTo} onChange={e => setDelegateTo(e.target.value)}
                    style={{ width: '100%', fontSize: '12px', padding: '8px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', marginBottom: '10px', cursor: 'pointer' }}>
                    <option value="">Select HR Executive...</option>
                    {hrExecutives.map(e => <option key={e.id} value={e.id}>{e.full_name} &mdash; {e.role?.replace('_', ' ')}</option>)}
                  </select>

                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '4px' }}>DUE DATE (TAT)</div>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                    style={{ width: '100%', fontSize: '12px', padding: '8px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', marginBottom: '10px', boxSizing: 'border-box' }} />

                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '4px' }}>DELEGATION NOTES &mdash; MANDATORY</div>
                  <textarea value={delegationNotes} onChange={e => setDelegationNotes(e.target.value)}
                    placeholder="Why are you delegating this? What specific actions should the HR Executive take? What outcome are you expecting?"
                    rows={4}
                    style={{ width: '100%', fontSize: '12px', padding: '8px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'vertical', boxSizing: 'border-box' }} />
                  <div style={{ fontSize: '10px', color: delegationNotes.trim().length < 20 ? 'var(--k-danger-text)' : 'var(--k-success-text)', marginTop: '2px', marginBottom: '10px' }}>
                    {delegationNotes.trim().length}/20 minimum characters
                  </div>

                  {actionError && <div style={{ fontSize: '12px', color: 'var(--k-danger-text)', marginBottom: '8px' }}>{actionError}</div>}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={resetPanel} style={{ flex: 1, padding: '9px', background: 'var(--k-bg-page)', border: '1px solid var(--k-border-default)', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--k-font-sans)', color: 'var(--k-text-secondary)' }}>Cancel</button>
                    <button onClick={handleDelegate} disabled={processing || !delegateTo || !dueDate || delegationNotes.trim().length < 20}
                      style={{ flex: 2, padding: '9px', background: 'var(--k-brand-primary)', border: 'none', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 700,
                        cursor: processing || !delegateTo || !dueDate || delegationNotes.trim().length < 20 ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--k-font-sans)', color: 'white',
                        opacity: processing || !delegateTo || !dueDate || delegationNotes.trim().length < 20 ? 0.6 : 1 }}>
                      {processing ? 'Delegating...' : 'Delegate'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
