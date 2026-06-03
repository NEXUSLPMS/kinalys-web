
import { useState, useEffect } from 'react'
import { getPendingFlags, confirmFlagConversation, delegateFlag, getHrExecutives, confirmPipClosure } from '../api/client'

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


export default function HrFlagsInbox() {
  const [data, setData] = useState<any>(null)
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
  const [filterType, setFilterType] = useState<'ALL' | 'pip' | 'release'>('ALL')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setSuccessMsg('')
    try {
      const [flagsResult, execResult] = await Promise.allSettled([getPendingFlags(), getHrExecutives()])
      if (flagsResult.status === 'fulfilled') setData(flagsResult.value)
      if (execResult.status === 'fulfilled') setHrExecutives(execResult.value.executives || [])
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

  // Default due date — 3 business days from today
  function getDefaultDueDate() {
    const d = new Date()
    let added = 0
    while (added < 3) {
      d.setDate(d.getDate() + 1)
      if (d.getDay() !== 0 && d.getDay() !== 6) added++
    }
    return d.toISOString().split('T')[0]
  }

  const filtered = !data ? [] : data.flags.filter((f: any) =>
    filterType === 'ALL' || f.flag_type === filterType
  )

  const pipCount = data?.flags?.filter((f: any) => f.flag_type === 'pip').length || 0
  const releaseCount = data?.flags?.filter((f: any) => f.flag_type === 'release').length || 0
  const totalPending = data?.total || 0

  if (loading) return <div className="k-page"><div style={{ color: 'var(--k-text-muted)', fontSize: '14px', padding: '40px 0' }}>Loading flags inbox...</div></div>
  if (error) return <div className="k-page"><div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', fontSize: '13px', color: 'var(--k-danger-text)' }}>{error}</div></div>

  return (
    <div className="k-page">
      <div style={{ marginBottom: '24px' }}>
        <div className="k-page-title">HR Flags Inbox</div>
        <div className="k-page-sub">Employee flags submitted by managers for HR review · All notes are mandatory and audit logged</div>
      </div>

      {successMsg && (
        <div style={{ background: 'var(--k-success-bg)', border: '1px solid var(--k-success-border, #6ee7b7)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-success-text)', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="k-card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', marginBottom: '8px' }}>TOTAL PENDING</div>
          <div style={{ fontSize: '40px', fontWeight: 800, color: totalPending > 0 ? 'var(--k-brand-primary)' : 'var(--k-text-muted)', fontFamily: 'var(--k-font-display)' }}>{totalPending}</div>
        </div>
        <div className="k-card" style={{ padding: '20px', textAlign: 'center', background: pipCount > 0 ? 'var(--k-warning-bg)' : 'var(--k-bg-card)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-warning-text)', letterSpacing: '1px', marginBottom: '8px' }}>PIP FLAGS</div>
          <div style={{ fontSize: '40px', fontWeight: 800, color: 'var(--k-warning-text)', fontFamily: 'var(--k-font-display)' }}>{pipCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--k-warning-text)', marginTop: '4px' }}>Performance Improvement</div>
        </div>
        <div className="k-card" style={{ padding: '20px', textAlign: 'center', background: releaseCount > 0 ? 'var(--k-danger-bg)' : 'var(--k-bg-card)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-danger-text)', letterSpacing: '1px', marginBottom: '8px' }}>RELEASE FLAGS</div>
          <div style={{ fontSize: '40px', fontWeight: 800, color: 'var(--k-danger-text)', fontFamily: 'var(--k-font-display)' }}>{releaseCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--k-danger-text)', marginTop: '4px' }}>Sensitive — Confidential</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['ALL', 'pip', 'release'] as const).map(f => (
          <button key={f} onClick={() => setFilterType(f)}
            style={{ padding: '5px 14px', borderRadius: 'var(--k-radius-md)', border: '1px solid', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)',
              background: filterType === f ? 'var(--k-brand-primary)' : 'var(--k-bg-page)',
              color: filterType === f ? 'white' : 'var(--k-text-muted)',
              borderColor: filterType === f ? 'transparent' : 'var(--k-border-default)' }}>
            {f === 'ALL' ? 'All Flags' : f === 'pip' ? 'PIP Only' : 'Release Only'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Flags list */}
        <div style={{ flex: 1 }}>
          {filtered.length === 0 && (
            <div className="k-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--k-text-muted)', fontSize: '13px' }}>
              {totalPending === 0 ? 'No pending flags. All flags have been reviewed.' : 'No flags match this filter.'}
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
                    <div style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{flag.department_name} · Flagged by {flag.flagged_by_name}</div>
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
                      { label: 'Current Score', value: flag.performance_snapshot.current_score ? `${flag.performance_snapshot.current_score}%` : '—' },
                      { label: 'Q3 Projection', value: flag.performance_snapshot.predicted_score ? `${flag.performance_snapshot.predicted_score}%` : '—' },
                      { label: 'Trend', value: flag.performance_snapshot.trend_direction || '—' },
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
                {selectedFlag.flag_type === 'pip' ? 'PIP Flag' : 'Release Flag'} · by {selectedFlag.flagged_by_name}
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

              {/* PIP Form Data — show what manager submitted */}
              {selectedFlag.flag_type === 'pip' && selectedFlag.pip_form_data && (
                <div style={{ background: 'var(--k-bg-page)', border: '1px solid var(--k-border-default)', borderRadius: 'var(--k-radius-lg)', padding: '14px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', marginBottom: '10px' }}>PIP DETAILS — SUBMITTED BY MANAGER</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ background: 'var(--k-bg-card)', borderRadius: 'var(--k-radius-md)', padding: '8px 10px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginBottom: '2px' }}>Duration</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-text-primary)' }}>
                        {selectedFlag.pip_form_data.duration_days ? `${selectedFlag.pip_form_data.duration_days} days` : '-'}
                        {selectedFlag.pip_start_date ? ` · ${new Date(selectedFlag.pip_start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to ${new Date(selectedFlag.pip_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
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
                      : selectedFlag.status === 'pip_active' ? 'PIP active — improvement plan in progress'
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
                    HR NOTES — MANDATORY
                  </div>
                  <textarea value={hrComment} onChange={e => setHrComment(e.target.value)}
                    placeholder="Document the conversation outcome, agreed actions, improvement targets, and next review date..."
                    rows={5}
                    style={{ width: '100%', fontSize: '12px', padding: '8px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'vertical', boxSizing: 'border-box' }} />
                  <div style={{ fontSize: '10px', color: hrComment.trim().length < 20 ? 'var(--k-danger-text)' : 'var(--k-success-text)', marginTop: '2px', marginBottom: '10px' }}>
                    {isGenuineComment(hrComment) ? 'Notes look good' : `${hrComment.trim().split(/\s+/).filter((w: string) => w.length > 0).length} words — need at least 4 meaningful words`}{hrComment.trim().length}/20 minimum characters
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
                    {hrExecutives.map(e => <option key={e.id} value={e.id}>{e.full_name} — {e.role?.replace('_', ' ')}</option>)}
                  </select>

                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '4px' }}>DUE DATE (TAT)</div>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                    style={{ width: '100%', fontSize: '12px', padding: '8px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', marginBottom: '10px', boxSizing: 'border-box' }} />

                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '4px' }}>DELEGATION NOTES — MANDATORY</div>
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