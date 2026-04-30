import { useState, useEffect } from 'react'
import { getOneOnOneSessions, createOneOnOneSession, getSessionEntries, saveSessionEntry, signOffSession, getOneOnOneTeam, getReviewCycles } from '../api/client'

const SECTIONS = [
  { name: 'Performance & Deliverables', order: 1, icon: '📊', desc: 'KPI progress, targets, blockers', requiresComments: false, hasRating: true, managerOnly: false },
  { name: 'Teamwork & Collaboration', order: 2, icon: '🤝', desc: 'Peer relationships, team contribution', requiresComments: false, hasRating: true, managerOnly: false },
  { name: 'Efficiency & Productivity', order: 3, icon: '⚡', desc: 'Output quality, time management', requiresComments: false, hasRating: true, managerOnly: false },
  { name: 'Learning & Development', order: 4, icon: '📚', desc: 'Courses, certifications, skill building', requiresComments: false, hasRating: true, managerOnly: false },
  { name: 'Wellbeing & Engagement', order: 5, icon: '💚', desc: 'Workload, motivation, job satisfaction', requiresComments: false, hasRating: true, managerOnly: false },
  { name: 'Goals for Next Period', order: 6, icon: '🎯', desc: 'Commitments for next session — comments mandatory, no rating', requiresComments: true, hasRating: false, managerOnly: false },
  { name: 'Manager Notes', order: 7, icon: '🔒', desc: 'Private manager notes — mandatory, not visible to employee', requiresComments: true, hasRating: false, managerOnly: true },
]

const RATINGS = [
  { value: 'needs_attention', label: 'Needs Attention', color: 'var(--k-danger-text)', bg: 'var(--k-danger-bg)' },
  { value: 'on_track', label: 'On Track', color: 'var(--k-warning-text)', bg: 'var(--k-warning-bg)' },
  { value: 'exceeding', label: 'Exceeding', color: 'var(--k-success-text)', bg: 'var(--k-success-bg)' },
]

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  scheduled:   { color: 'var(--k-brand-primary)', bg: 'var(--k-brand-faint)' },
  in_progress: { color: 'var(--k-warning-text)', bg: 'var(--k-warning-bg)' },
  completed:   { color: 'var(--k-success-text)', bg: 'var(--k-success-bg)' },
  cancelled:   { color: 'var(--k-text-muted)', bg: 'var(--k-bg-page)' },
}

export default function OneOnOne() {
  const [sessions, setSessions] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [cycles, setCycles] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [signingOff, setSigningOff] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isManager, setIsManager] = useState(false)

  const [newForm, setNewForm] = useState({
    employee_id: '',
    scheduled_date: '',
    session_type: 'scheduled',
    agenda_notes: '',
    review_cycle_id: '',
  })

  useEffect(() => { loadInitial() }, []) // eslint-disable-line

  async function loadInitial() {
    setLoading(true)
    try {
      const [sessData, teamData, cycleData] = await Promise.allSettled([
        getOneOnOneSessions(),
        getOneOnOneTeam(),
        getReviewCycles(),
      ])
      if (sessData.status === 'fulfilled') setSessions(sessData.value.sessions || [])
      if (teamData.status === 'fulfilled') {
        setTeam(teamData.value.team || [])
        setIsManager((teamData.value.team || []).length > 0)
      }
      if (cycleData.status === 'fulfilled') setCycles(cycleData.value.cycles || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function openSession(session: any) {
    setSelectedSession(session)
    try {
      const data = await getSessionEntries(session.id)
      setEntries(data.entries || [])
      setSelectedSession(data.session)
    } catch (err: any) {
      setError(err.message)
    }
  }

  function getEntry(sectionName: string) {
    return entries.find(e => e.section_name === sectionName)
  }

  async function saveEntry(sectionName: string, managerRating: string | null, managerNotes: string, employeeComments: string) {
    if (!selectedSession) return
    setSaving(sectionName)
    try {
      const data = await saveSessionEntry(selectedSession.id, {
        section_name: sectionName,
        manager_rating: managerRating,
        manager_notes: managerNotes,
        employee_comments: employeeComments,
      })
      setEntries(prev => {
        const exists = prev.find(e => e.section_name === sectionName)
        if (exists) return prev.map(e => e.section_name === sectionName ? data.entry : e)
        return [...prev, data.entry]
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(null)
    }
  }

  async function handleSignOff() {
    if (!selectedSession) return

    // Validate mandatory sections before sign-off
    const mandatorySections = SECTIONS.filter(s => s.requiresComments)
    for (const section of mandatorySections) {
      const entry = getEntry(section.name)
      const hasNotes = entry?.manager_notes?.trim() || entry?.employee_comments?.trim()
      if (!hasNotes) {
        setError(`"${section.name}" is mandatory and must have comments before signing off.`)
        return
      }
    }

    // Validate needs_attention sections have comments
    for (const section of SECTIONS.filter(s => s.hasRating)) {
      const entry = getEntry(section.name)
      if (entry?.manager_rating === 'needs_attention' && !entry?.manager_notes?.trim()) {
        setError(`"${section.name}" is rated Needs Attention — a comment explaining the issue is mandatory.`)
        return
      }
    }

    setSigningOff(true)
    try {
      const data = await signOffSession(selectedSession.id)
      setSelectedSession(data.session)
      setSessions(prev => prev.map(s => s.id === data.session.id ? { ...s, ...data.session } : s))
      setSuccess('Signed off successfully')
      setTimeout(() => setSuccess(null), 4000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSigningOff(false)
    }
  }

  async function createSession() {
    if (!newForm.employee_id || !newForm.scheduled_date || !newForm.agenda_notes.trim()) {
      setError('Employee, date and agenda notes are all required')
      return
    }
    try {
      await createOneOnOneSession(newForm)
      await loadInitial()
      setShowNewForm(false)
      setNewForm({ employee_id: '', scheduled_date: '', session_type: 'scheduled', agenda_notes: '', review_cycle_id: '' })
      setSuccess('Session scheduled successfully')
      setTimeout(() => setSuccess(null), 4000)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    }
  }

  if (loading) return <div className="k-page"><div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading sessions...</div></div>

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="k-page-title" style={{ marginBottom: '2px' }}>1-on-1 Reviews</div>
            <div className="k-page-sub">Structured performance conversations · 7 sections · Digital sign-off</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {selectedSession && (
              <button onClick={() => { setSelectedSession(null); setEntries([]) }} style={{ fontSize: '12px', padding: '6px 14px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', color: 'var(--k-text-muted)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
                Back to Sessions
              </button>
            )}
            {isManager && !selectedSession && (
              <button className="k-btn k-btn-primary" onClick={() => setShowNewForm(true)} style={{ fontSize: '13px' }}>
                + Schedule Session
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', padding: '12px 20px', fontSize: '13px', color: 'var(--k-danger-text)', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--k-danger-text)', fontWeight: 700 }}>X</button>
        </div>
      )}

      {success && (
        <div style={{ background: 'var(--k-success-bg)', border: '1px solid var(--k-success-border)', padding: '12px 20px', fontSize: '13px', color: 'var(--k-success-text)', fontWeight: 600, flexShrink: 0 }}>
          {success}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'hidden' }}>

        {!selectedSession && (
          <div style={{ height: '100%', overflowY: 'auto', padding: '24px 28px' }}>

            {showNewForm && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-lg)', padding: '28px', width: '500px', maxWidth: '90vw', boxShadow: 'var(--k-shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '20px' }}>Schedule 1-on-1 Session</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Employee *</div>
                      <select value={newForm.employee_id} onChange={e => setNewForm(p => ({ ...p, employee_id: e.target.value }))} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
                        <option value="">Select employee...</option>
                        {team.map(m => <option key={m.id} value={m.id}>{m.full_name} — {m.designation_name || 'No designation'}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Review Cycle</div>
                      <select value={newForm.review_cycle_id} onChange={e => setNewForm(p => ({ ...p, review_cycle_id: e.target.value }))} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
                        <option value="">Select cycle...</option>
                        {cycles.map((c: any) => <option key={c.id} value={c.id}>{c.name} — {c.status}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Date *</div>
                      <input type="date" value={newForm.scheduled_date} onChange={e => setNewForm(p => ({ ...p, scheduled_date: e.target.value }))} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', colorScheme: 'dark' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Session Type</div>
                      <select value={newForm.session_type} onChange={e => setNewForm(p => ({ ...p, session_type: e.target.value }))} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
                        <option value="scheduled">Regular — Scheduled</option>
                        <option value="ad_hoc">Ad-hoc — Unscheduled</option>
                        <option value="pip">PIP Review</option>
                        <option value="probation">Probation Review</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-danger-text)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Agenda Notes * — mandatory</div>
                      <textarea value={newForm.agenda_notes} onChange={e => setNewForm(p => ({ ...p, agenda_notes: e.target.value }))} placeholder="What should we cover? Be specific — this sets the direction of the conversation." rows={3} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: `1px solid ${newForm.agenda_notes.trim() ? 'var(--k-success-border)' : 'var(--k-danger-border)'}`, background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'vertical' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button className="k-btn k-btn-primary" onClick={createSession} style={{ flex: 1, justifyContent: 'center' }}>Schedule Session</button>
                    <button className="k-btn k-btn-secondary" onClick={() => { setShowNewForm(false); setError(null) }} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px', color: 'var(--k-text-muted)', fontSize: '14px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                No 1-on-1 sessions yet. {isManager ? 'Click "+ Schedule Session" to create one.' : 'Your manager will schedule sessions with you.'}
              </div>
            ) : (
              <div className="k-card">
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Employee', 'Manager', 'Date', 'Cycle', 'Type', 'Status', 'Sign-off', ''].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(session => {
                      const statusStyle = STATUS_CONFIG[session.status] || STATUS_CONFIG.scheduled
                      return (
                        <tr key={session.id} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--k-text-primary)' }}>{session.employee_name}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--k-text-secondary)', fontSize: '12px' }}>{session.manager_name}</td>
                          <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-text-muted)' }}>
                            {new Date(session.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--k-text-muted)' }}>{session.cycle_name || '—'}</td>
                          <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-text-muted)', textTransform: 'capitalize' }}>{session.session_type?.replace('_', ' ')}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: statusStyle.color, background: statusStyle.bg, padding: '2px 8px', borderRadius: '10px' }}>{session.status}</span>
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '11px' }}>
                            <div style={{ color: session.manager_signed_off ? 'var(--k-success-text)' : 'var(--k-text-muted)' }}>{session.manager_signed_off ? 'Done' : 'Pending'} Manager</div>
                            <div style={{ color: session.employee_signed_off ? 'var(--k-success-text)' : 'var(--k-text-muted)' }}>{session.employee_signed_off ? 'Done' : 'Pending'} Employee</div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <button onClick={() => openSession(session)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', color: 'var(--k-text-secondary)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>Open</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {selectedSession && (
          <div style={{ height: '100%', overflowY: 'auto', padding: '24px 28px' }}>
            <div style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-lg)', border: '1px solid var(--k-border-default)', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '4px' }}>
                    {selectedSession.employee_name} with {selectedSession.manager_name}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--k-text-muted)', marginBottom: '4px' }}>
                    {new Date(selectedSession.scheduled_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {selectedSession.session_type?.replace('_', ' ')}
                  </div>
                  {selectedSession.cycle_name && <div style={{ fontSize: '12px', color: 'var(--k-brand-primary)', fontWeight: 600 }}>Cycle: {selectedSession.cycle_name}</div>}
                  {selectedSession.ad_hoc_reason && <div style={{ marginTop: '6px', fontSize: '13px', color: 'var(--k-text-secondary)', fontStyle: 'italic' }}>Agenda: {selectedSession.ad_hoc_reason}</div>}
                  <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--k-text-muted)', lineHeight: 1.7 }}>
                    Mandatory before sign-off: Goals for Next Period (comments) · Manager Notes (comments) · Needs Attention ratings (reason required)
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', textAlign: 'right' }}>
                    <div style={{ color: selectedSession.manager_signed_off ? 'var(--k-success-text)' : 'var(--k-text-muted)', marginBottom: '2px' }}>{selectedSession.manager_signed_off ? 'Done' : 'Pending'} Manager</div>
                    <div style={{ color: selectedSession.employee_signed_off ? 'var(--k-success-text)' : 'var(--k-text-muted)' }}>{selectedSession.employee_signed_off ? 'Done' : 'Pending'} Employee</div>
                  </div>
                  {selectedSession.status !== 'completed' && (
                    <button className="k-btn k-btn-primary" onClick={handleSignOff} disabled={signingOff} style={{ fontSize: '12px', padding: '8px 16px' }}>
                      {signingOff ? 'Signing...' : 'Sign Off'}
                    </button>
                  )}
                  {selectedSession.status === 'completed' && (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-success-text)', background: 'var(--k-success-bg)', padding: '6px 14px', borderRadius: '10px' }}>Completed</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {SECTIONS.map(section => (
                <SectionCard
                  key={section.name}
                  section={section}
                  entry={getEntry(section.name)}
                  saving={saving === section.name}
                  onSave={(rating: string | null, notes: string, empComments: string) => saveEntry(section.name, rating, notes, empComments)}
                  readOnly={selectedSession.status === 'completed'}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SectionCard({ section, entry, saving, onSave, readOnly }: any) {
  const [rating, setRating] = useState(entry?.manager_rating || '')
  const [notes, setNotes] = useState(entry?.manager_notes || '')
  const [empComments, setEmpComments] = useState(entry?.employee_comments || '')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setRating(entry?.manager_rating || '')
    setNotes(entry?.manager_notes || '')
    setEmpComments(entry?.employee_comments || '')
  }, [entry])

  const hasContent = rating || notes || empComments
  const needsAttention = rating === 'needs_attention'
  const notesRequired = section.requiresComments || needsAttention
  const canSave = !notesRequired || notes.trim().length > 0

  return (
    <div style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-lg)', border: `1px solid ${hasContent ? 'var(--k-border-strong)' : 'var(--k-border-default)'}`, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '20px' }}>{section.icon}</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {section.name}
              {section.managerOnly && <span style={{ fontSize: '10px', color: 'var(--k-text-muted)', background: 'var(--k-bg-page)', padding: '1px 6px', borderRadius: '6px', fontWeight: 400 }}>Private</span>}
              {section.requiresComments && <span style={{ fontSize: '10px', color: 'var(--k-danger-text)', fontWeight: 700 }}>Required</span>}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{section.desc}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {rating && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: RATINGS.find(r => r.value === rating)?.color, background: RATINGS.find(r => r.value === rating)?.bg, padding: '2px 8px', borderRadius: '10px' }}>
              {RATINGS.find(r => r.value === rating)?.label}
            </span>
          )}
          {hasContent && !editing && <span style={{ fontSize: '11px', color: 'var(--k-success-text)', fontWeight: 600 }}>Saved</span>}
          {!readOnly && (
            <button onClick={() => setEditing(!editing)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-page)', color: 'var(--k-text-secondary)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
              {editing ? 'Collapse' : hasContent ? 'Edit' : 'Add'}
            </button>
          )}
          {readOnly && hasContent && (
            <button onClick={() => setEditing(!editing)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-page)', color: 'var(--k-text-secondary)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
              {editing ? 'Collapse' : 'View'}
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--k-border-default)' }}>
          {section.hasRating && (
            <div style={{ display: 'flex', gap: '8px', margin: '14px 0 12px' }}>
              {RATINGS.map(r => (
                <button
                  key={r.value}
                  onClick={() => !readOnly && setRating(rating === r.value ? '' : r.value)}
                  style={{ flex: 1, padding: '7px', borderRadius: 'var(--k-radius-md)', border: `1px solid ${rating === r.value ? r.color : 'var(--k-border-default)'}`, background: rating === r.value ? r.bg : 'var(--k-bg-page)', color: rating === r.value ? r.color : 'var(--k-text-muted)', cursor: readOnly ? 'default' : 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--k-font-sans)', transition: 'all var(--k-transition)' }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {needsAttention && (
            <div style={{ fontSize: '12px', color: 'var(--k-danger-text)', fontWeight: 600, marginBottom: '6px' }}>
              Needs Attention selected — a comment explaining the issue is mandatory before sign-off.
            </div>
          )}

          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: notesRequired ? 'var(--k-danger-text)' : 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>
              {section.managerOnly ? 'Private Notes' : 'Manager Notes'}{notesRequired ? ' * — required' : ''}
            </div>
            <textarea
              value={notes}
              onChange={e => !readOnly && setNotes(e.target.value)}
              placeholder={section.managerOnly ? 'Private notes — only visible to you as manager...' : needsAttention ? 'Explain what needs attention and what the action plan is...' : 'Manager observations, context, and notes...'}
              rows={3}
              readOnly={readOnly}
              style={{ width: '100%', fontSize: '13px', padding: '10px 12px', borderRadius: 'var(--k-radius-md)', border: `1px solid ${notesRequired && !notes.trim() ? 'var(--k-danger-border)' : notes.trim() ? 'var(--k-success-border)' : 'var(--k-border-input)'}`, background: readOnly ? 'var(--k-bg-page)' : 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>

          {!section.managerOnly && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Employee Comments</div>
              <textarea
                value={empComments}
                onChange={e => !readOnly && setEmpComments(e.target.value)}
                placeholder="Employee's perspective, questions, or comments on this section..."
                rows={2}
                readOnly={readOnly}
                style={{ width: '100%', fontSize: '13px', padding: '10px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: readOnly ? 'var(--k-bg-page)' : 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>
          )}

          {!readOnly && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
              <button
                className="k-btn k-btn-primary"
                onClick={() => { if (!canSave) { return } onSave(rating || null, notes, empComments); setEditing(false) }}
                disabled={saving || !canSave}
                style={{ fontSize: '12px', padding: '6px 16px', opacity: canSave ? 1 : 0.5 }}
              >
                {saving ? 'Saving...' : 'Save Section'}
              </button>
              <button onClick={() => setEditing(false)} style={{ fontSize: '12px', padding: '6px 14px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'transparent', color: 'var(--k-text-muted)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
                Cancel
              </button>
              {!canSave && <span style={{ fontSize: '11px', color: 'var(--k-danger-text)' }}>Comments required before saving</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}