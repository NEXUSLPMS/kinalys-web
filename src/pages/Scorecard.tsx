import { useState, useEffect } from 'react'
import { getMyScorecard, updateKpiActual, getTeamScorecards, getUserScorecard, getReviewCycles, proposeKpi } from '../api/client'

interface KpiAssignment {
  id: string
  name: string
  description: string | null
  source: string
  weight_pct: number
  metric_type: string
  target_value: number | null
  actual_value: number | null
  score: number | null
  rag_status: string | null
  status: string
  proposed_by_name: string | null
  manager_reviewer_name: string | null
  rejection_reason: string | null
  notes: string | null
}

interface TeamMember {
  id: string
  full_name: string
  email: string
  department_name: string | null
  designation_name: string | null
  employment_status: string
  total_kpis: number
  live_kpis: number
  green_kpis: number
  amber_kpis: number
  red_kpis: number
  pending_manager: number
  pending_hr: number
  calculated_score: number | null
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  template:          { label: 'Standard',  color: 'var(--k-brand-primary)' },
  manager_proposed:  { label: 'Manager',   color: '#6B21A8' },
  employee_proposed: { label: 'Self',      color: '#0F6E56' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  live:             { label: 'Live',             color: 'var(--k-success-text)', bg: 'var(--k-success-bg)' },
  pending_manager:  { label: 'Pending Manager',  color: 'var(--k-warning-text)', bg: 'var(--k-warning-bg)' },
  pending_hr:       { label: 'Pending HR',       color: '#6B21A8', bg: '#F3E8FF' },
  approved:         { label: 'Approved',         color: 'var(--k-success-text)', bg: 'var(--k-success-bg)' },
  rejected:         { label: 'Rejected',         color: 'var(--k-danger-text)', bg: 'var(--k-danger-bg)' },
  draft:            { label: 'Draft',            color: 'var(--k-text-muted)', bg: 'var(--k-bg-page)' },
}

const RAG_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  green: { color: 'var(--k-success-text)', bg: 'var(--k-success-bg)', label: '🟢' },
  amber: { color: 'var(--k-warning-text)', bg: 'var(--k-warning-bg)', label: '🟡' },
  red:   { color: 'var(--k-danger-text)',  bg: 'var(--k-danger-bg)',  label: '🔴' },
}

export default function Scorecard() {
  const [view, setView] = useState<'my' | 'team' | 'member'>('my')
  const [myScorecard, setMyScorecard] = useState<any>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [memberScorecard, setMemberScorecard] = useState<any>(null)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [cycles, setCycles] = useState<any[]>([])
  const [selectedCycle, setSelectedCycle] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [teamLoading, setTeamLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingActual, setEditingActual] = useState<string | null>(null)
  const [actualValue, setActualValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [showProposeModal, setShowProposeModal] = useState(false)
  const [proposing, setProposing] = useState(false)
  const [proposeForm, setProposeForm] = useState({
    name: '',
    description: '',
    weight_pct: 10,
    metric_type: 'percentage',
    target_value: '',
    notes: '',
  })
  const [isManager, setIsManager] = useState(false)

  useEffect(() => { loadInitial() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (selectedCycle) loadMyScorecard() }, [selectedCycle]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadInitial() {
    setLoading(true)
    try {
      const [scorecardData, cycleData] = await Promise.allSettled([
        getMyScorecard(),
        getReviewCycles(),
      ])
      if (scorecardData.status === 'fulfilled') {
        setMyScorecard(scorecardData.value)
        setSelectedCycle(scorecardData.value.cycle?.id || '')
      }
      if (cycleData.status === 'fulfilled') setCycles(cycleData.value.cycles || [])

      // Try loading team to see if manager
      try {
        const teamData = await getTeamScorecards()
        setTeamMembers(teamData.team || [])
        setIsManager(true)
      } catch {
        setIsManager(false)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadMyScorecard() {
    try {
      const data = await getMyScorecard(selectedCycle)
      setMyScorecard(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function loadTeam() {
    setTeamLoading(true)
    try {
      const data = await getTeamScorecards(selectedCycle)
      setTeamMembers(data.team || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setTeamLoading(false)
    }
  }

  async function openMemberScorecard(member: TeamMember) {
    setSelectedMember(member)
    setView('member')
    try {
      const data = await getUserScorecard(member.id, selectedCycle)
      setMemberScorecard(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function saveActual(kpiId: string) {
    if (!actualValue.trim()) return
    setSaving(true)
    try {
      const data = await updateKpiActual(kpiId, parseFloat(actualValue))
      setMyScorecard((prev: any) => ({
        ...prev,
        kpis: prev.kpis.map((k: any) => k.id === kpiId ? { ...k, ...data.kpi } : k)
      }))
      setEditingActual(null)
      setActualValue('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
async function submitProposal() {
    if (!proposeForm.name.trim()) { setError('KPI name is required'); return }
    if (!proposeForm.target_value) { setError('Target value is required'); return }
    if (!proposeForm.notes.trim()) { setError('Reason for proposal is mandatory'); return }
    if (proposeForm.weight_pct < 1 || proposeForm.weight_pct > 100) { setError('Weight must be between 1 and 100'); return }
    setProposing(true)
    try {
      await proposeKpi({
        ...proposeForm,
        review_cycle_id: myScorecard?.cycle?.id,
        target_value: parseFloat(proposeForm.target_value),
      })
      setShowProposeModal(false)
      setProposeForm({ name: '', description: '', weight_pct: 10, metric_type: 'percentage', target_value: '', notes: '' })
      await loadMyScorecard()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setProposing(false)
    }
  }
  function getScoreColor(score: number | null) {
    if (score === null) return 'var(--k-text-muted)'
    if (score >= 90) return 'var(--k-success-text)'
    if (score >= 80) return 'var(--k-warning-text)'
    return 'var(--k-danger-text)'
  }

  const liveKpis = myScorecard?.kpis?.filter((k: any) => k.status === 'live') || []
  const pendingKpis = myScorecard?.kpis?.filter((k: any) => ['pending_manager', 'pending_hr', 'draft'].includes(k.status)) || []
  const rejectedKpis = myScorecard?.kpis?.filter((k: any) => k.status === 'rejected') || []

  // Recalculate overall score from current KPI state
  const totalWeight = liveKpis.reduce((sum: number, k: any) => sum + Number(k.weight_pct), 0)
  const calculatedScore = totalWeight > 0 && liveKpis.some((k: any) => k.actual_value !== null)
    ? liveKpis.reduce((sum: number, k: any) => {
        if (k.actual_value !== null && k.target_value > 0) {
          return sum + (Math.min(100, (k.actual_value / k.target_value) * 100) * Number(k.weight_pct))
        }
        return sum
      }, 0) / totalWeight
    : myScorecard?.calculated_score || 0

  if (loading) return (
    <div className="k-page">
      <div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading Scorecard...</div>
    </div>
  )

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="k-page">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div className="k-page-title">📊 Scorecard</div>
            <div className="k-page-sub">
              {myScorecard?.cycle ? `${myScorecard.cycle.name} · ${myScorecard.cycle.status}` : 'No active cycle'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={selectedCycle}
              onChange={e => setSelectedCycle(e.target.value)}
              style={{ fontSize: '13px', padding: '6px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}
            >
              {cycles.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className={`k-btn ${view === 'my' ? 'k-btn-primary' : 'k-btn-secondary'}`} onClick={() => setView('my')} style={{ fontSize: '12px' }}>📊 My Scorecard</button>
            {isManager && (
              <button className={`k-btn ${view === 'team' ? 'k-btn-primary' : 'k-btn-secondary'}`} onClick={() => { setView('team'); loadTeam() }} style={{ fontSize: '12px' }}>👥 Team</button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-danger-text)', display: 'flex', justifyContent: 'space-between' }}>
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--k-danger-text)', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* ── MY SCORECARD VIEW ─────────────────────────── */}
        {view === 'my' && (
          <>
          {/* Proposal window banner */}
            {myScorecard?.proposal_window_open && (
              <div style={{ background: 'var(--k-brand-faint)', border: '1px solid var(--k-brand-primary)', borderRadius: 'var(--k-radius-md)', padding: '14px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-brand-primary)', marginBottom: '2px' }}>
                    KPI Proposal Window Open — Day {myScorecard.day_of_cycle} of cycle
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>
                    {myScorecard.days_until_cutoff} day{myScorecard.days_until_cutoff !== 1 ? 's' : ''} remaining to propose additional KPIs · Proposals go to your manager for review
                  </div>
                </div>
                <button
                  className="k-btn k-btn-primary"
                  onClick={() => setShowProposeModal(true)}
                  style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                >
                  + Propose KPI
                </button>
              </div>
            )}

            {/* Score summary */}
            <div className="k-stat-grid k-stat-grid-4" style={{ marginBottom: '24px' }}>
              <div className="k-stat-card accent">
                <div className="k-stat-label">Overall Score</div>
                <div className="k-stat-value" style={{ color: getScoreColor(myScorecard?.calculated_score) }}>
                  {myScorecard?.calculated_score ?? '—'}%
                </div>
                <div className="k-stat-trend">
                  {myScorecard?.calculated_score >= 90 ? '🟢 High Performance'
                    : myScorecard?.calculated_score >= 80 ? '🟡 Medium Performance'
                    : myScorecard?.calculated_score > 0 ? '🔴 Needs Improvement'
                    : 'No score yet'}
                </div>
              </div>
              <div className="k-stat-card green">
                <div className="k-stat-label">Live KPIs</div>
                <div className="k-stat-value">{myScorecard?.live_kpi_count || 0}</div>
                <div className="k-stat-trend">Active this cycle</div>
              </div>
              <div className="k-stat-card amber">
                <div className="k-stat-label">Pending Approval</div>
                <div className="k-stat-value">{pendingKpis.length}</div>
                <div className="k-stat-trend">Awaiting review</div>
              </div>
              <div className="k-stat-card purple">
                <div className="k-stat-label">Total KPIs</div>
                <div className="k-stat-value">{myScorecard?.total_kpi_count || 0}</div>
                <div className="k-stat-trend">This cycle</div>
              </div>
            </div>

            {/* No cycle warning */}
            {!myScorecard?.cycle && (
              <div style={{ background: 'var(--k-warning-bg)', border: '1px solid var(--k-warning-border)', borderRadius: 'var(--k-radius-md)', padding: '16px 20px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-warning-text)', lineHeight: 1.6 }}>
                ⚠ No active review cycle found. Contact your HR Admin to set up the current cycle and apply KPI templates.
              </div>
            )}

            {/* Live KPIs */}
            {liveKpis.length > 0 && (
              <div className="k-card" style={{ marginBottom: '16px' }}>
                <div className="k-card-header">
                  <div className="k-card-title">✅ Live KPIs</div>
                  <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{liveKpis.length} KPIs active</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {liveKpis.map((kpi: KpiAssignment) => {
                    const rag = kpi.rag_status ? RAG_CONFIG[kpi.rag_status] : null
                    const source = SOURCE_LABELS[kpi.source]
                    const progressPct = kpi.target_value && kpi.actual_value !== null
                      ? Math.min(100, (kpi.actual_value / kpi.target_value) * 100)
                      : 0
                    return (
                      <div key={kpi.id} style={{ padding: '16px', borderBottom: '1px solid var(--k-border-default)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-text-primary)' }}>{kpi.name}</span>
                              {rag && <span style={{ fontSize: '16px' }}>{rag.label}</span>}
                              <span style={{ fontSize: '10px', fontWeight: 700, color: source?.color, background: 'var(--k-bg-page)', padding: '1px 6px', borderRadius: '8px', border: `1px solid ${source?.color}` }}>{source?.label}</span>
                            </div>
                            {kpi.description && <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', marginBottom: '4px' }}>{kpi.description}</div>}
                            <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>
                              Weight: {kpi.weight_pct}% · Target: {kpi.target_value ?? '—'} · Score: {kpi.score !== null ? `${Number(kpi.score).toFixed(1)}%` : '—'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            {editingActual === kpi.id ? (
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <input
                                  type="number"
                                  value={actualValue}
                                  onChange={e => setActualValue(e.target.value)}
                                  placeholder="Actual"
                                  autoFocus
                                  style={{ width: '80px', fontSize: '13px', padding: '4px 8px', borderRadius: 'var(--k-radius-sm)', border: '1px solid var(--k-border-strong)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', textAlign: 'center' }}
                                  onKeyDown={e => { if (e.key === 'Enter') saveActual(kpi.id); if (e.key === 'Escape') { setEditingActual(null); setActualValue('') } }}
                                />
                                <button className="k-btn k-btn-primary" onClick={() => saveActual(kpi.id)} disabled={saving} style={{ fontSize: '11px', padding: '4px 10px' }}>{saving ? '...' : 'Save'}</button>
                                <button className="k-btn k-btn-secondary" onClick={() => { setEditingActual(null); setActualValue('') }} style={{ fontSize: '11px', padding: '4px 10px' }}>✕</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '18px', fontWeight: 800, color: rag ? rag.color : 'var(--k-text-muted)' }}>
                                    {kpi.actual_value ?? '—'}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--k-text-muted)' }}>of {kpi.target_value ?? '—'}</div>
                                </div>
                                <button
                                  onClick={() => { setEditingActual(kpi.id); setActualValue(kpi.actual_value?.toString() || '') }}
                                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', color: 'var(--k-text-secondary)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}
                                >
                                  Update
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: '6px', background: 'var(--k-border-default)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progressPct}%`, background: rag ? rag.color : 'var(--k-brand-primary)', borderRadius: '3px', transition: 'width 0.3s' }}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Pending KPIs */}
            {pendingKpis.length > 0 && (
              <div className="k-card" style={{ marginBottom: '16px' }}>
                <div className="k-card-header">
                  <div className="k-card-title" style={{ color: 'var(--k-warning-text)' }}>⏳ Pending Approval</div>
                  <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{pendingKpis.length} awaiting review</span>
                </div>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['KPI', 'Source', 'Weight', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingKpis.map((kpi: KpiAssignment) => {
                      const status = STATUS_CONFIG[kpi.status]
                      const source = SOURCE_LABELS[kpi.source]
                      return (
                        <tr key={kpi.id} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--k-text-primary)' }}>{kpi.name}</div>
                            {kpi.notes && <div style={{ fontSize: '11px', color: 'var(--k-warning-text)', marginTop: '2px' }}>💬 {kpi.notes}</div>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: source?.color }}>{source?.label}</span>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--k-brand-primary)' }}>{kpi.weight_pct}%</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: status?.color, background: status?.bg, padding: '2px 8px', borderRadius: '10px' }}>{status?.label}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Rejected KPIs */}
            {rejectedKpis.length > 0 && (
              <div className="k-card" style={{ marginBottom: '16px' }}>
                <div className="k-card-header">
                  <div className="k-card-title" style={{ color: 'var(--k-danger-text)' }}>❌ Rejected KPIs</div>
                </div>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['KPI', 'Reason'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedKpis.map((kpi: KpiAssignment) => (
                      <tr key={kpi.id} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--k-text-primary)' }}>{kpi.name}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-danger-text)' }}>{kpi.rejection_reason || 'No reason provided'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty state */}
            {myScorecard?.kpis?.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--k-text-muted)', fontSize: '14px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                No KPIs assigned for this cycle yet. Your HR Admin will apply templates at the start of the cycle.
              </div>
            )}
            {/* Propose KPI Modal */}
            {showProposeModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-lg)', padding: '28px', width: '520px', maxWidth: '90vw', boxShadow: 'var(--k-shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '6px' }}>Propose a KPI</div>
                  <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', marginBottom: '20px' }}>Your proposal will be sent to your manager for review, then to HR Admin for final approval.</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>KPI Name *</div>
                      <input value={proposeForm.name} onChange={e => setProposeForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Customer Retention Rate" autoFocus style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }} />
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Description</div>
                      <textarea value={proposeForm.description} onChange={e => setProposeForm(p => ({ ...p, description: e.target.value }))} placeholder="What does this KPI measure and why is it relevant to your role?" rows={2} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'vertical' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Metric Type *</div>
                        <select value={proposeForm.metric_type} onChange={e => setProposeForm(p => ({ ...p, metric_type: e.target.value }))} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
                          <option value="percentage">Percentage (%)</option>
                          <option value="numeric">Numeric</option>
                          <option value="boolean">Boolean (Yes/No)</option>
                          <option value="rating">Rating (1-5)</option>
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Target Value *</div>
                        <input type="number" value={proposeForm.target_value} onChange={e => setProposeForm(p => ({ ...p, target_value: e.target.value }))} placeholder="e.g. 90" style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Proposed Weight: {proposeForm.weight_pct}%</div>
                      <input type="range" min={5} max={30} step={5} value={proposeForm.weight_pct} onChange={e => setProposeForm(p => ({ ...p, weight_pct: parseInt(e.target.value) }))} style={{ width: '100%', accentColor: 'var(--k-brand-primary)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--k-text-muted)', marginTop: '4px' }}>
                        <span>5%</span><span>Your manager may adjust this</span><span>30%</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-danger-text)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Reason for Proposal * — mandatory</div>
                      <textarea value={proposeForm.notes} onChange={e => setProposeForm(p => ({ ...p, notes: e.target.value }))} placeholder="Why should this KPI be added to your scorecard this cycle?" rows={2} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'vertical' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                    <button className="k-btn k-btn-primary" onClick={submitProposal} disabled={proposing} style={{ flex: 1, justifyContent: 'center' }}>
                      {proposing ? 'Submitting...' : 'Submit Proposal'}
                    </button>
                    <button className="k-btn k-btn-secondary" onClick={() => { setShowProposeModal(false); setError(null) }} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── TEAM VIEW ─────────────────────────────────── */}
        {view === 'team' && (
          <>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--k-text-primary)' }}>Team Scorecard Overview</div>
              <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{teamMembers.length} members</span>
            </div>
            {teamLoading ? (
              <div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading team...</div>
            ) : teamMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--k-text-muted)', fontSize: '14px' }}>
                No team members found for this cycle.
              </div>
            ) : (
              <div className="k-card">
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Employee', 'Score', 'RAG', 'Live KPIs', 'Pending', 'Action'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map(member => {
                      const score = member.calculated_score
                      return (
                        <tr key={member.id} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--k-text-primary)' }}>{member.full_name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>{member.designation_name || '—'} · {member.department_name || '—'}</div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontWeight: 800, fontSize: '15px', color: getScoreColor(score) }}>
                              {score !== null ? `${score}%` : '—'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {member.green_kpis > 0 && <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-success-text)', background: 'var(--k-success-bg)', padding: '1px 6px', borderRadius: '8px' }}>🟢 {member.green_kpis}</span>}
                              {member.amber_kpis > 0 && <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-warning-text)', background: 'var(--k-warning-bg)', padding: '1px 6px', borderRadius: '8px' }}>🟡 {member.amber_kpis}</span>}
                              {member.red_kpis > 0 && <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-danger-text)', background: 'var(--k-danger-bg)', padding: '1px 6px', borderRadius: '8px' }}>🔴 {member.red_kpis}</span>}
                              {member.green_kpis === 0 && member.amber_kpis === 0 && member.red_kpis === 0 && <span style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>No data</span>}
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{member.live_kpis}</td>
                          <td style={{ padding: '10px 12px' }}>
                            {(member.pending_manager + member.pending_hr) > 0 ? (
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-warning-text)', background: 'var(--k-warning-bg)', padding: '2px 8px', borderRadius: '10px' }}>
                                ⏳ {member.pending_manager + member.pending_hr}
                              </span>
                            ) : <span style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <button onClick={() => openMemberScorecard(member)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', color: 'var(--k-text-secondary)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
          </>
        )}

        {/* ── MEMBER SCORECARD VIEW ─────────────────────── */}
        {view === 'member' && selectedMember && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button onClick={() => setView('team')} style={{ fontSize: '12px', padding: '4px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', color: 'var(--k-text-secondary)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
                ← Back to Team
              </button>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--k-text-primary)' }}>{selectedMember.full_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{selectedMember.designation_name} · {selectedMember.department_name}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '24px', fontWeight: 800, color: getScoreColor(selectedMember.calculated_score) }}>
                {selectedMember.calculated_score !== null ? `${selectedMember.calculated_score}%` : '—'}
              </div>
            </div>

            {memberScorecard ? (
              <div className="k-card">
                <div className="k-card-header">
                  <div className="k-card-title">KPI Details</div>
                  <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{memberScorecard.kpis?.length || 0} KPIs</span>
                </div>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['KPI', 'Status', 'Weight', 'Target', 'Actual', 'Score', 'RAG'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {memberScorecard.kpis?.map((kpi: any) => {
                      const status = STATUS_CONFIG[kpi.status]
                      const rag = kpi.rag_status ? RAG_CONFIG[kpi.rag_status] : null
                      return (
                        <tr key={kpi.id} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--k-text-primary)' }}>{kpi.name}</div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: status?.color, background: status?.bg, padding: '2px 8px', borderRadius: '10px' }}>{status?.label || kpi.status}</span>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--k-brand-primary)' }}>{kpi.weight_pct}%</td>
                          <td style={{ padding: '10px 12px' }}>{kpi.target_value ?? '—'}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{kpi.actual_value ?? '—'}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: getScoreColor(kpi.score) }}>{kpi.score !== null ? `${Number(kpi.score).toFixed(1)}%` : '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{rag ? <span style={{ fontSize: '16px' }}>{rag.label}</span> : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading...</div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
