import { useState, useEffect } from 'react'
import { getActivePips, getPipCheckins, logPipCheckin, closePip } from '../api/client'

const CHECKIN_STATUSES = [
  { value: 'exceeding_target', label: 'Exceeding Target', color: 'var(--k-success-text)', bg: 'var(--k-success-bg)' },
  { value: 'on_track', label: 'On Track', color: 'var(--k-brand-primary)', bg: 'var(--k-brand-faint)' },
  { value: 'needs_attention', label: 'Needs Attention', color: 'var(--k-warning-text)', bg: 'var(--k-warning-bg)' },
  { value: 'not_improving', label: 'Not Improving', color: 'var(--k-danger-text)', bg: 'var(--k-danger-bg)' },
  { value: 'regressed', label: 'Regressed', color: '#7C3AED', bg: '#F3E8FF' },
]

export default function PipCheckins() {
  const [pips, setPips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPip, setSelectedPip] = useState<any>(null)
  const [checkins, setCheckins] = useState<any[]>([])
  const [checkinsLoading, setCheckinsLoading] = useState(false)
  const [showCheckinForm, setShowCheckinForm] = useState(false)
  const [showCloseForm, setShowCloseForm] = useState(false)
  const [checkinStatus, setCheckinStatus] = useState('on_track')
  const [checkinNotes, setCheckinNotes] = useState('')
  const [closeOutcome, setCloseOutcome] = useState('successful')
  const [closeNotes, setCloseNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const result = await getActivePips()
      setPips(result.pips || [])
    } finally {
      setLoading(false)
    }
  }

  async function selectPip(pip: any) {
    setSelectedPip(pip)
    setShowCheckinForm(false)
    setShowCloseForm(false)
    setSuccessMsg('')
    setError('')
    setCheckinsLoading(true)
    try {
      const result = await getPipCheckins(pip.id)
      setCheckins(result.checkins || [])
    } finally {
      setCheckinsLoading(false)
    }
  }

  async function handleCheckin() {
    if (!checkinNotes.trim() || checkinNotes.trim().length < 10) { setError('Please add notes of at least 10 characters.'); return }
    setSubmitting(true)
    setError('')
    try {
      await logPipCheckin({ flag_id: selectedPip.id, status: checkinStatus, notes: checkinNotes })
      setSuccessMsg('Check-in logged successfully.')
      setShowCheckinForm(false)
      setCheckinNotes('')
      setCheckinStatus('on_track')
      const result = await getPipCheckins(selectedPip.id)
      setCheckins(result.checkins || [])
      await load()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to log check-in.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleClose() {
    if (!closeNotes.trim() || closeNotes.trim().length < 20) { setError('Please add closure notes of at least 20 characters.'); return }
    setSubmitting(true)
    setError('')
    try {
      await closePip(selectedPip.id, { outcome: closeOutcome, outcome_notes: closeNotes })
      setSuccessMsg(`PIP closed as ${closeOutcome}.`)
      setShowCloseForm(false)
      setSelectedPip(null)
      await load()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to close PIP.')
    } finally {
      setSubmitting(false)
    }
  }

  function daysRemaining(endDate: string) {
    const end = new Date(endDate)
    const today = new Date()
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  // Backfill planning (decision 62: Ending Soon = past PIP midpoint, proportional to duration)
  function pipDurationDays(p: any): number | null {
    if (!p.pip_start_date || !p.pip_end_date) return null
    const d = (new Date(p.pip_end_date).getTime() - new Date(p.pip_start_date).getTime()) / (1000 * 60 * 60 * 24)
    return d > 0 ? d : null
  }
  function isOverduePip(p: any): boolean {
    return !!p.pip_end_date && daysRemaining(p.pip_end_date) < 0
  }
  function isEndingSoonPip(p: any): boolean {
    if (!p.pip_end_date) return false
    const rem = daysRemaining(p.pip_end_date)
    if (rem < 0) return false
    const dur = pipDurationDays(p)
    if (dur === null) return false
    return rem <= dur * 0.5
  }

  function statusBadge(status: string) {
    const s = CHECKIN_STATUSES.find(x => x.value === status)
    return s || { label: status, color: 'var(--k-text-muted)', bg: 'var(--k-bg-page)' }
  }

  if (loading) return <div className="k-page"><div style={{ color: 'var(--k-text-muted)', fontSize: '14px', padding: '40px 0' }}>Loading active PIPs...</div></div>

  // Planning aggregates over this manager's own active PIPs
  const pOverdue = pips.filter(isOverduePip).length
  const pEndingSoon = pips.filter(isEndingSoonPip).length
  const pAtRiskEndDates = pips.filter(p => isOverduePip(p) || isEndingSoonPip(p)).map(p => p.pip_end_date).filter(Boolean).sort()
  const pFallbackEndDates = pips.map(p => p.pip_end_date).filter(Boolean).sort()
  const pNextAtRisk = pAtRiskEndDates[0] || pFallbackEndDates[0] || null

  return (
    <div className="k-page" style={{ display: 'flex', gap: '0', position: 'relative' }}>

      <div style={{ flex: 1, minWidth: 0, paddingRight: selectedPip ? '16px' : '0' }}>
        <div style={{ marginBottom: '20px' }}>
          <div className="k-page-title">PIP Check-ins</div>
          <div className="k-page-sub">Active Performance Improvement Plans &middot; {pips.length} active PIP{pips.length !== 1 ? 's' : ''}</div>
        </div>

        {pips.length > 0 && (
          <div className="k-card" style={{ padding: '14px 18px', marginBottom: '16px', borderLeft: '4px solid var(--k-warning-text)', borderRadius: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: 'var(--k-text-muted)' }}>
                BACKFILL PLANNING<span style={{ fontWeight: 600 }}> &middot; YOUR TEAM</span>
              </div>
              <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--k-text-muted)' }}>Active</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--k-font-display)', color: 'var(--k-text-primary)' }}>{pips.length}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--k-text-muted)' }}>Ending soon</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--k-font-display)', color: 'var(--k-warning-text)' }}>{pEndingSoon}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--k-text-muted)' }}>Overdue</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--k-font-display)', color: 'var(--k-danger-text)' }}>{pOverdue}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '120px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--k-text-muted)' }}>Next seat at risk</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--k-text-primary)' }}>
                    {pNextAtRisk ? new Date(pNextAtRisk).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '\u2014'}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginTop: '8px' }}>
              Ending soon = past the PIP midpoint. Start backfill planning early in case a plan does not complete successfully.
            </div>
          </div>
        )}

        {pips.length === 0 && (
          <div className="k-card" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{'\u2705'}</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '6px' }}>No active PIPs</div>
            <div style={{ fontSize: '13px', color: 'var(--k-text-muted)' }}>All your team members are performing well.</div>
          </div>
        )}

        {pips.map((pip: any) => {
          const days = daysRemaining(pip.pip_end_date)
          const isSelected = selectedPip?.id === pip.id
          const lastStatus = pip.last_checkin_status ? statusBadge(pip.last_checkin_status) : null
          const isUrgent = days <= 7 && days >= 0
          const isOverdue = days < 0
          return (
            <div key={pip.id} onClick={() => selectPip(pip)}
              className="k-card"
              style={{ marginBottom: '12px', cursor: 'pointer', borderLeft: `4px solid ${isOverdue ? 'var(--k-danger-text)' : isUrgent ? 'var(--k-warning-text)' : 'var(--k-brand-primary)'}`, background: isSelected ? 'var(--k-brand-faint)' : 'var(--k-bg-card)' }}>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-text-primary)' }}>{pip.employee_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{pip.department_name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {lastStatus && (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: lastStatus.color, background: lastStatus.bg, padding: '3px 8px', borderRadius: '10px' }}>
                        {lastStatus.label}
                      </span>
                    )}
                    <span style={{ fontSize: '10px', fontWeight: 700, color: isOverdue ? 'var(--k-danger-text)' : isUrgent ? 'var(--k-warning-text)' : 'var(--k-text-muted)', background: isOverdue ? 'var(--k-danger-bg)' : isUrgent ? 'var(--k-warning-bg)' : 'var(--k-bg-page)', padding: '3px 8px', borderRadius: '10px' }}>
                      {isOverdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--k-text-muted)' }}>
                  <span>Started: {new Date(pip.pip_start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <span>Ends: {new Date(pip.pip_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <span>{pip.checkin_count} check-in{pip.checkin_count !== 1 ? 's' : ''} logged</span>
                  {pip.last_checkin_date && <span>Last: {new Date(pip.last_checkin_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedPip && (
        <div style={{ width: '420px', flexShrink: 0, borderLeft: '1px solid var(--k-border-default)', paddingLeft: '20px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', position: 'sticky', top: '20px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--k-text-primary)' }}>{selectedPip.employee_name}</div>
              <div style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{selectedPip.department_name} &middot; {daysRemaining(selectedPip.pip_end_date)} days remaining</div>
            </div>
            <button onClick={() => setSelectedPip(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--k-text-muted)' }}>x</button>
          </div>

          {successMsg && (
            <div style={{ background: 'var(--k-success-bg)', border: '1px solid var(--k-success-border)', borderRadius: 'var(--k-radius-md)', padding: '10px 14px', marginBottom: '12px', fontSize: '12px', color: 'var(--k-success-text)' }}>
              {successMsg}
            </div>
          )}

          {error && (
            <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '10px 14px', marginBottom: '12px', fontSize: '12px', color: 'var(--k-danger-text)' }}>
              {error}
            </div>
          )}

          {!showCheckinForm && !showCloseForm && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => { setShowCheckinForm(true); setShowCloseForm(false); setError('') }}
                style={{ flex: 1, padding: '10px', background: 'var(--k-brand-primary)', border: 'none', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)', color: 'white' }}>
                Log Check-in
              </button>
              <button onClick={() => { setShowCloseForm(true); setShowCheckinForm(false); setError('') }}
                style={{ flex: 1, padding: '10px', background: 'var(--k-bg-page)', border: '1px solid var(--k-border-default)', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)', color: 'var(--k-text-primary)' }}>
                Recommend Closure
              </button>
            </div>
          )}

          {showCheckinForm && (
            <div className="k-card" style={{ padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-text-primary)' }}>Log Check-in</div>
                <button onClick={() => setShowCheckinForm(false)} style={{ background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: 'var(--k-text-muted)' }}>Cancel</button>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '8px' }}>STATUS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {CHECKIN_STATUSES.map(s => (
                  <button key={s.value} onClick={() => setCheckinStatus(s.value)}
                    style={{ padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: `1px solid ${checkinStatus === s.value ? s.color : 'var(--k-border-default)'}`, background: checkinStatus === s.value ? s.bg : 'var(--k-bg-input)', color: checkinStatus === s.value ? s.color : 'var(--k-text-secondary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)', textAlign: 'left' }}>
                    {s.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '4px' }}>NOTES</div>
              <textarea value={checkinNotes} onChange={e => setCheckinNotes(e.target.value)}
                placeholder="Describe progress, KPI updates, observations, and next actions..."
                rows={4}
                style={{ width: '100%', fontSize: '12px', padding: '8px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px' }} />
              <button onClick={handleCheckin} disabled={submitting}
                style={{ width: '100%', padding: '10px', background: 'var(--k-brand-primary)', border: 'none', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--k-font-sans)', color: 'white', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Save Check-in'}
              </button>
            </div>
          )}

          {showCloseForm && (
            <div className="k-card" style={{ padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-text-primary)' }}>Recommend PIP Closure</div>
                <button onClick={() => setShowCloseForm(false)} style={{ background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: 'var(--k-text-muted)' }}>Cancel</button>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '8px' }}>OUTCOME</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {[
                  { value: 'successful', label: 'Successful', sub: 'Employee has met improvement targets', color: 'var(--k-success-text)', bg: 'var(--k-success-bg)' },
                  { value: 'extended', label: 'Extended', sub: 'More time needed \u2014 extend the PIP period', color: 'var(--k-warning-text)', bg: 'var(--k-warning-bg)' },
                  { value: 'unsuccessful', label: 'Unsuccessful', sub: 'Targets not met \u2014 escalate to HR for release decision', color: 'var(--k-danger-text)', bg: 'var(--k-danger-bg)' },
                ].map(o => (
                  <button key={o.value} onClick={() => setCloseOutcome(o.value)}
                    style={{ padding: '10px 12px', borderRadius: 'var(--k-radius-md)', border: `1px solid ${closeOutcome === o.value ? o.color : 'var(--k-border-default)'}`, background: closeOutcome === o.value ? o.bg : 'var(--k-bg-input)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)', textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: closeOutcome === o.value ? o.color : 'var(--k-text-primary)' }}>{o.label}</div>
                    <div style={{ fontSize: '10px', color: closeOutcome === o.value ? o.color : 'var(--k-text-muted)', marginTop: '2px' }}>{o.sub}</div>
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '4px' }}>CLOSURE NOTES</div>
              <textarea value={closeNotes} onChange={e => setCloseNotes(e.target.value)}
                placeholder="Document the final outcome, performance summary, and rationale for this decision..."
                rows={4}
                style={{ width: '100%', fontSize: '12px', padding: '8px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px' }} />
              <div style={{ fontSize: '10px', color: closeNotes.trim().length < 20 ? 'var(--k-danger-text)' : 'var(--k-success-text)', marginBottom: '10px' }}>
                {closeNotes.trim().length}/20 minimum characters
              </div>
              <button onClick={handleClose} disabled={submitting || closeNotes.trim().length < 20}
                style={{ width: '100%', padding: '10px', background: closeOutcome === 'successful' ? 'var(--k-success-text)' : closeOutcome === 'extended' ? 'var(--k-warning-text)' : 'var(--k-danger-text)', border: 'none', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 700, cursor: submitting || closeNotes.trim().length < 20 ? 'not-allowed' : 'pointer', fontFamily: 'var(--k-font-sans)', color: 'white', opacity: submitting || closeNotes.trim().length < 20 ? 0.6 : 1 }}>
                {submitting ? 'Submitting...' : `Recommend ${closeOutcome.charAt(0).toUpperCase() + closeOutcome.slice(1)} to HR`}
              </button>
            </div>
          )}

          <div className="k-card" style={{ padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', marginBottom: '12px' }}>CHECK-IN HISTORY</div>
            {checkinsLoading && <div style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>Loading...</div>}
            {!checkinsLoading && checkins.length === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', textAlign: 'center', padding: '20px 0' }}>No check-ins logged yet.</div>
            )}
            {checkins.map((c: any) => {
              const s = statusBadge(c.status)
              return (
                <div key={c.id} style={{ borderBottom: '1px solid var(--k-border-default)', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: s.color, background: s.bg, padding: '2px 8px', borderRadius: '10px' }}>{s.label}</span>
                    <span style={{ fontSize: '10px', color: 'var(--k-text-muted)' }}>
                      {new Date(c.check_in_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} &middot; {c.checked_in_by_name}
                    </span>
                  </div>
                  {c.notes && <div style={{ fontSize: '12px', color: 'var(--k-text-primary)', lineHeight: 1.5 }}>{c.notes}</div>}
                </div>
              )
            })}
          </div>

          {selectedPip.pip_form_data?.kpi_targets && Object.keys(selectedPip.pip_form_data.kpi_targets).length > 0 && (
            <div className="k-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', marginBottom: '10px' }}>KPI TARGETS</div>
              {Object.entries(selectedPip.pip_form_data.kpi_targets).map(([kpi, target]: [string, any]) => (
                <div key={kpi} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', marginBottom: '6px', borderLeft: '3px solid var(--k-warning-text)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--k-text-primary)' }}>{kpi}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-warning-text)' }}>{target}% target</span>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
