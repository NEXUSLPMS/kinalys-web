import { useState, useEffect } from 'react'
import { getTeamScorecards, getReviewCycles, getUserScorecard } from '../api/client'

export default function ExecDashboard() {
  const [team, setTeam] = useState<any[]>([])
  const [cycles, setCycles] = useState<any[]>([])
  const [selectedCycle, setSelectedCycle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('all')
  const [filterManager, setFilterManager] = useState('all')
  const [filterDesignation, setFilterDesignation] = useState('all')
  const [filterBand, setFilterBand] = useState('all')
  const [filterRag, setFilterRag] = useState('all')
  const [filterPending, setFilterPending] = useState(false)

  // Drill-down
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [memberKpis, setMemberKpis] = useState<any[]>([])
  const [memberLoading, setMemberLoading] = useState(false)

  useEffect(() => { loadData() }, []) // eslint-disable-line
  useEffect(() => { if (selectedCycle) loadTeam() }, [selectedCycle]) // eslint-disable-line

  async function loadData() {
    setLoading(true)
    try {
      const [teamData, cycleData] = await Promise.allSettled([
        getTeamScorecards(),
        getReviewCycles(),
      ])
      if (teamData.status === 'fulfilled') {
        setTeam(teamData.value.team || [])
        setSelectedCycle(teamData.value.cycle_id || '')
      }
      if (cycleData.status === 'fulfilled') setCycles(cycleData.value.cycles || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadTeam() {
    try {
      const data = await getTeamScorecards(selectedCycle)
      setTeam(data.team || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function openMember(member: any) {
    setSelectedMember(member)
    setMemberLoading(true)
    try {
      const data = await getUserScorecard(member.id, selectedCycle)
      setMemberKpis(data.kpis || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setMemberLoading(false)
    }
  }

  function getScoreColor(score: number | null) {
    if (score === null) return 'var(--k-text-muted)'
    if (score >= 90) return 'var(--k-success-text)'
    if (score >= 80) return 'var(--k-warning-text)'
    return 'var(--k-danger-text)'
  }

  function getScoreBand(score: number | null) {
    if (score === null) return 'Not Scored'
    if (score >= 90) return 'High Performance'
    if (score >= 80) return 'Medium Performance'
    return 'Needs Improvement'
  }

  function getBandKey(score: number | null) {
    if (score === null) return 'not_scored'
    if (score >= 90) return 'high'
    if (score >= 80) return 'medium'
    return 'needs_improvement'
  }

  // Build filter option lists from actual data
  const departments = ['all', ...Array.from(new Set(team.map(m => m.department_name).filter(Boolean))).sort()]
  const designations = ['all', ...Array.from(new Set(team.map(m => m.designation_name).filter(Boolean))).sort()]

  // For manager filter — we need manager names. Since team data doesn't include manager_name per member,
  // we use employment_status as a proxy. For now show unique designations that suggest leadership.
  // In a future sprint we can add manager_id join to team query.
  const leadershipDesignations = designations.filter(d =>
    d === 'all' || ['manager','lead','avp','vp','director','head','chief','senior'].some(k => d.toLowerCase().includes(k))
  )

  // Active filter count
  const activeFilters = [
    search, filterDept !== 'all', filterDesignation !== 'all',
    filterBand !== 'all', filterRag !== 'all', filterPending
  ].filter(Boolean).length

  // Filtered team
  const filtered = team.filter(m => {
    if (search && !m.full_name.toLowerCase().includes(search.toLowerCase()) &&
        !m.designation_name?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterDept !== 'all' && m.department_name !== filterDept) return false
    if (filterDesignation !== 'all' && m.designation_name !== filterDesignation) return false
    if (filterBand !== 'all' && getBandKey(m.calculated_score) !== filterBand) return false
    if (filterRag === 'green' && Number(m.green_kpis) === 0) return false
    if (filterRag === 'amber' && Number(m.amber_kpis) === 0) return false
    if (filterRag === 'red' && Number(m.red_kpis) === 0) return false
    if (filterPending && (Number(m.pending_manager) + Number(m.pending_hr)) === 0) return false
    return true
  }).sort((a, b) => (b.calculated_score || 0) - (a.calculated_score || 0))

  function clearFilters() {
    setSearch('')
    setFilterDept('all')
    setFilterManager('all')
    setFilterDesignation('all')
    setFilterBand('all')
    setFilterRag('all')
    setFilterPending(false)
  }

  // Aggregate stats from full team (not filtered)
  const scoredMembers = team.filter(m => m.calculated_score !== null)
  const avgScore = scoredMembers.length > 0
    ? Math.round(scoredMembers.reduce((sum, m) => sum + Number(m.calculated_score), 0) / scoredMembers.length * 10) / 10
    : null
  const highPerf = team.filter(m => m.calculated_score !== null && m.calculated_score >= 90).length
  const medPerf = team.filter(m => m.calculated_score !== null && m.calculated_score >= 80 && m.calculated_score < 90).length
  const needsImprovement = team.filter(m => m.calculated_score !== null && m.calculated_score < 80).length
  const notScored = team.filter(m => m.calculated_score === null).length
  const totalGreen = team.reduce((sum, m) => sum + Number(m.green_kpis || 0), 0)
  const totalAmber = team.reduce((sum, m) => sum + Number(m.amber_kpis || 0), 0)
  const totalRed = team.reduce((sum, m) => sum + Number(m.red_kpis || 0), 0)
  const totalPending = team.reduce((sum, m) => sum + Number(m.pending_manager || 0) + Number(m.pending_hr || 0), 0)

  if (loading) return <div className="k-page"><div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading dashboard...</div></div>

  // ── DRILL-DOWN VIEW ───────────────────────────────────────────
  if (selectedMember) {
    const liveKpis = memberKpis.filter(k => k.status === 'live')
    return (
      <div style={{ height: '100%', overflowY: 'auto' }}>
        <div className="k-page">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <button onClick={() => { setSelectedMember(null); setMemberKpis([]) }} style={{ fontSize: '12px', padding: '6px 14px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', color: 'var(--k-text-muted)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
              Back to Dashboard
            </button>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--k-text-primary)' }}>{selectedMember.full_name}</div>
              <div style={{ fontSize: '13px', color: 'var(--k-text-muted)' }}>{selectedMember.designation_name} · {selectedMember.department_name}</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: getScoreColor(selectedMember.calculated_score) }}>
                {selectedMember.calculated_score !== null ? `${selectedMember.calculated_score}%` : '—'}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: getScoreColor(selectedMember.calculated_score) }}>
                {getScoreBand(selectedMember.calculated_score)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Green KPIs', count: selectedMember.green_kpis, color: 'var(--k-success-text)', bg: 'var(--k-success-bg)' },
              { label: 'Amber KPIs', count: selectedMember.amber_kpis, color: 'var(--k-warning-text)', bg: 'var(--k-warning-bg)' },
              { label: 'Red KPIs', count: selectedMember.red_kpis, color: 'var(--k-danger-text)', bg: 'var(--k-danger-bg)' },
              { label: 'Live KPIs', count: selectedMember.live_kpis, color: 'var(--k-brand-primary)', bg: 'var(--k-brand-faint)' },
              { label: 'Pending', count: Number(selectedMember.pending_manager) + Number(selectedMember.pending_hr), color: 'var(--k-warning-text)', bg: 'var(--k-warning-bg)' },
            ].map(stat => (
              <div key={stat.label} style={{ flex: 1, background: stat.bg, borderRadius: 'var(--k-radius-md)', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: stat.color }}>{stat.count}</div>
                <div style={{ fontSize: '11px', color: stat.color, fontWeight: 700, marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {memberLoading ? (
            <div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading KPIs...</div>
          ) : (
            <>
            <div className="k-card" style={{ marginBottom: '14px' }}>
              <div className="k-card-header">
                <div className="k-card-title">Live KPIs</div>
                <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{liveKpis.length} active</span>
              </div>
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['KPI', 'Target', 'Actual', 'Score', 'RAG', 'Weight'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {liveKpis.map((kpi: any) => (
                    <tr key={kpi.id} style={{ borderBottom: '1px solid var(--k-border-default)', background: kpi.rag_status === 'red' ? 'rgba(185,28,28,0.02)' : 'transparent' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--k-text-primary)' }}>{kpi.name}</div>
                        {kpi.description && <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginTop: '2px' }}>{kpi.description}</div>}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--k-text-muted)' }}>{kpi.target_value ?? '—'}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{kpi.actual_value ?? '—'}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: getScoreColor(kpi.score) }}>{kpi.score !== null ? `${Number(kpi.score).toFixed(1)}%` : '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {kpi.rag_status === 'green' && <span style={{ fontSize: '16px' }}>🟢</span>}
                        {kpi.rag_status === 'amber' && <span style={{ fontSize: '16px' }}>🟡</span>}
                        {kpi.rag_status === 'red' && <span style={{ fontSize: '16px' }}>🔴</span>}
                        {!kpi.rag_status && <span style={{ color: 'var(--k-text-muted)' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--k-brand-primary)' }}>{kpi.weight_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


            {/* Pending KPIs */}
            {memberKpis.filter(k => ['pending_manager','pending_hr','draft'].includes(k.status)).length > 0 && (
              <div className="k-card" style={{ marginBottom: '14px' }}>
                <div className="k-card-header">
                  <div className="k-card-title" style={{ color: 'var(--k-warning-text)' }}>Pending Approval</div>
                  <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{memberKpis.filter(k => ['pending_manager','pending_hr','draft'].includes(k.status)).length} awaiting review</span>
                </div>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['KPI', 'Source', 'Target', 'Weight', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {memberKpis.filter(k => ['pending_manager','pending_hr','draft'].includes(k.status)).map((kpi: any) => (
                      <tr key={kpi.id} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--k-text-primary)' }}>{kpi.name}</div>
                          {kpi.notes && <div style={{ fontSize: '11px', color: 'var(--k-warning-text)', marginTop: '2px' }}>Reason: {kpi.notes}</div>}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-text-muted)', textTransform: 'capitalize' }}>{kpi.source?.replace('_', ' ')}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--k-text-muted)' }}>{kpi.target_value ?? '—'}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--k-brand-primary)' }}>{kpi.weight_pct}%</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700,
                            color: kpi.status === 'pending_manager' ? 'var(--k-warning-text)' : '#6B21A8',
                            background: kpi.status === 'pending_manager' ? 'var(--k-warning-bg)' : '#F3E8FF',
                            padding: '2px 8px', borderRadius: '10px'
                          }}>
                            {kpi.status === 'pending_manager' ? 'Pending Manager' : kpi.status === 'pending_hr' ? 'Pending HR' : 'Draft'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Rejected KPIs */}
            {memberKpis.filter(k => k.status === 'rejected').length > 0 && (
              <div className="k-card">
                <div className="k-card-header">
                  <div className="k-card-title" style={{ color: 'var(--k-danger-text)' }}>Rejected KPIs</div>
                  <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{memberKpis.filter(k => k.status === 'rejected').length} rejected</span>
                </div>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['KPI', 'Rejection Reason'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {memberKpis.filter(k => k.status === 'rejected').map((kpi: any) => (
                      <tr key={kpi.id} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--k-text-primary)' }}>{kpi.name}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-danger-text)' }}>{kpi.rejection_reason || 'No reason provided'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </>
          )}
        </div>
      </div>
    )
  }

  // ── MAIN DASHBOARD VIEW ───────────────────────────────────────
  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="k-page">

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div className="k-page-title">Exec Dashboard</div>
            <div className="k-page-sub">Organisation-wide performance · {team.length} employees · {cycles.find(c => c.id === selectedCycle)?.name}</div>
          </div>
          <select value={selectedCycle} onChange={e => setSelectedCycle(e.target.value)} style={{ fontSize: '13px', padding: '6px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
            {cycles.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {error && (
          <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-danger-text)' }}>{error}</div>
        )}

        {/* Stat cards — clickable to filter */}
        <div className="k-stat-grid k-stat-grid-4" style={{ marginBottom: '24px' }}>
          <div className="k-stat-card accent" style={{ cursor: 'pointer' }} onClick={() => setFilterBand('all')}>
            <div className="k-stat-label">Org Average Score</div>
            <div className="k-stat-value" style={{ color: getScoreColor(avgScore) }}>{avgScore !== null ? `${avgScore}%` : '—'}</div>
            <div className="k-stat-trend">{scoredMembers.length} of {team.length} scored</div>
          </div>
          <div className="k-stat-card green" style={{ cursor: 'pointer', outline: filterBand === 'high' ? '2px solid var(--k-success-text)' : 'none' }} onClick={() => setFilterBand(filterBand === 'high' ? 'all' : 'high')}>
            <div className="k-stat-label">High Performance</div>
            <div className="k-stat-value">{highPerf}</div>
            <div className="k-stat-trend">Score ≥ 90% · Click to filter</div>
          </div>
          <div className="k-stat-card amber" style={{ cursor: 'pointer', outline: filterBand === 'medium' ? '2px solid var(--k-warning-text)' : 'none' }} onClick={() => setFilterBand(filterBand === 'medium' ? 'all' : 'medium')}>
            <div className="k-stat-label">Medium Performance</div>
            <div className="k-stat-value">{medPerf}</div>
            <div className="k-stat-trend">Score 80–89% · Click to filter</div>
          </div>
          <div className="k-stat-card purple" style={{ cursor: 'pointer', outline: filterBand === 'needs_improvement' ? '2px solid var(--k-danger-text)' : 'none' }} onClick={() => setFilterBand(filterBand === 'needs_improvement' ? 'all' : 'needs_improvement')}>
            <div className="k-stat-label">Needs Improvement</div>
            <div className="k-stat-value">{needsImprovement}</div>
            <div className="k-stat-trend">Score below 80% · Click to filter</div>
          </div>
        </div>

        {/* KPI Health + Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div className="k-card">
            <div className="k-card-header">
              <div className="k-card-title">Organisation KPI Health</div>
              <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{totalGreen + totalAmber + totalRed} KPIs measured</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              {[
                { label: 'Green', count: totalGreen, color: 'var(--k-success-text)', bg: 'var(--k-success-bg)', rag: 'green' },
                { label: 'Amber', count: totalAmber, color: 'var(--k-warning-text)', bg: 'var(--k-warning-bg)', rag: 'amber' },
                { label: 'Red', count: totalRed, color: 'var(--k-danger-text)', bg: 'var(--k-danger-bg)', rag: 'red' },
              ].map(item => (
                <div key={item.label} onClick={() => setFilterRag(filterRag === item.rag ? 'all' : item.rag)} style={{ flex: 1, background: item.bg, borderRadius: 'var(--k-radius-md)', padding: '14px', textAlign: 'center', cursor: 'pointer', outline: filterRag === item.rag ? `2px solid ${item.color}` : 'none' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: item.color }}>{item.count}</div>
                  <div style={{ fontSize: '11px', color: item.color, fontWeight: 700 }}>{item.label} · Click to filter</div>
                </div>
              ))}
            </div>
            <div style={{ height: '10px', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${(totalGreen / Math.max(1, totalGreen + totalAmber + totalRed)) * 100}%`, background: 'var(--k-success-text)' }}/>
              <div style={{ width: `${(totalAmber / Math.max(1, totalGreen + totalAmber + totalRed)) * 100}%`, background: 'var(--k-warning-text)' }}/>
              <div style={{ width: `${(totalRed / Math.max(1, totalGreen + totalAmber + totalRed)) * 100}%`, background: 'var(--k-danger-text)' }}/>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginTop: '6px' }}>
              {totalGreen > 0 ? Math.round(totalGreen / Math.max(1, totalGreen + totalAmber + totalRed) * 100) : 0}% green ·{' '}
              {totalPending > 0 ? `${totalPending} KPIs pending approval` : 'All KPIs approved'}
            </div>
          </div>

          <div className="k-card">
            <div className="k-card-header">
              <div className="k-card-title">Performance Distribution</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'High Performance (≥90%)', count: highPerf, color: 'var(--k-success-text)', band: 'high' },
                { label: 'Medium Performance (80–89%)', count: medPerf, color: 'var(--k-warning-text)', band: 'medium' },
                { label: 'Needs Improvement (<80%)', count: needsImprovement, color: 'var(--k-danger-text)', band: 'needs_improvement' },
                { label: 'Not Yet Scored', count: notScored, color: 'var(--k-text-muted)', band: 'not_scored' },
              ].map(band => (
                <div key={band.label} onClick={() => setFilterBand(filterBand === band.band ? 'all' : band.band)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <div style={{ width: '175px', fontSize: '12px', color: filterBand === band.band ? band.color : 'var(--k-text-muted)', flexShrink: 0, fontWeight: filterBand === band.band ? 700 : 400 }}>{band.label}</div>
                  <div style={{ flex: 1, height: '8px', background: 'var(--k-border-default)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${team.length > 0 ? (band.count / team.length) * 100 : 0}%`, background: band.color, borderRadius: '4px' }}/>
                  </div>
                  <div style={{ width: '24px', fontSize: '13px', fontWeight: 700, color: band.color, textAlign: 'right' }}>{band.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ background: 'var(--k-bg-surface)', border: '1px solid var(--k-border-default)', borderRadius: 'var(--k-radius-lg)', padding: '16px 20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Filters {activeFilters > 0 && <span style={{ background: 'var(--k-brand-primary)', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '10px', marginLeft: '6px' }}>{activeFilters} active</span>}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>Showing {filtered.length} of {team.length} employees</span>
              {activeFilters > 0 && (
                <button onClick={clearFilters} style={{ fontSize: '11px', padding: '4px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-danger-border)', background: 'var(--k-danger-bg)', color: 'var(--k-danger-text)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)', fontWeight: 600 }}>
                  Clear All
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or designation..."
              style={{ fontSize: '13px', padding: '7px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', width: '240px' }}
            />
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ fontSize: '13px', padding: '7px 12px', borderRadius: 'var(--k-radius-md)', border: `1px solid ${filterDept !== 'all' ? 'var(--k-brand-primary)' : 'var(--k-border-input)'}`, background: filterDept !== 'all' ? 'var(--k-brand-faint)' : 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
              <option value="all">All Departments</option>
              {departments.filter(d => d !== 'all').map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filterDesignation} onChange={e => setFilterDesignation(e.target.value)} style={{ fontSize: '13px', padding: '7px 12px', borderRadius: 'var(--k-radius-md)', border: `1px solid ${filterDesignation !== 'all' ? 'var(--k-brand-primary)' : 'var(--k-border-input)'}`, background: filterDesignation !== 'all' ? 'var(--k-brand-faint)' : 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
              <option value="all">All Designations</option>
              {designations.filter(d => d !== 'all').map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filterBand} onChange={e => setFilterBand(e.target.value)} style={{ fontSize: '13px', padding: '7px 12px', borderRadius: 'var(--k-radius-md)', border: `1px solid ${filterBand !== 'all' ? 'var(--k-brand-primary)' : 'var(--k-border-input)'}`, background: filterBand !== 'all' ? 'var(--k-brand-faint)' : 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
              <option value="all">All Performance Bands</option>
              <option value="high">High Performance (≥90%)</option>
              <option value="medium">Medium Performance (80–89%)</option>
              <option value="needs_improvement">Needs Improvement (&lt;80%)</option>
              <option value="not_scored">Not Yet Scored</option>
            </select>
            <select value={filterRag} onChange={e => setFilterRag(e.target.value)} style={{ fontSize: '13px', padding: '7px 12px', borderRadius: 'var(--k-radius-md)', border: `1px solid ${filterRag !== 'all' ? 'var(--k-brand-primary)' : 'var(--k-border-input)'}`, background: filterRag !== 'all' ? 'var(--k-brand-faint)' : 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
              <option value="all">All RAG Status</option>
              <option value="green">Has Green KPIs</option>
              <option value="amber">Has Amber KPIs</option>
              <option value="red">Has Red KPIs</option>
            </select>
            <button
              onClick={() => setFilterPending(!filterPending)}
              style={{ fontSize: '12px', padding: '7px 14px', borderRadius: 'var(--k-radius-md)', border: `1px solid ${filterPending ? 'var(--k-warning-text)' : 'var(--k-border-input)'}`, background: filterPending ? 'var(--k-warning-bg)' : 'var(--k-bg-input)', color: filterPending ? 'var(--k-warning-text)' : 'var(--k-text-muted)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)', fontWeight: filterPending ? 700 : 400 }}
            >
              {filterPending ? '⏳ Pending KPIs' : 'Has Pending KPIs'}
            </button>
          </div>
        </div>

        {/* Employee table */}
        <div className="k-card">
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Employee', 'Designation', 'Department', 'Score', 'Band', '🟢', '🟡', '🔴', 'Live', 'Pending', ''].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '32px', textAlign: 'center', color: 'var(--k-text-muted)', fontSize: '13px' }}>
                    No employees match the current filters. <button onClick={clearFilters} style={{ color: 'var(--k-brand-primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--k-font-sans)', fontSize: '13px', fontWeight: 600 }}>Clear filters</button>
                  </td>
                </tr>
              ) : filtered.map(member => {
                const pending = Number(member.pending_manager) + Number(member.pending_hr)
                return (
                  <tr key={member.id} style={{ borderBottom: '1px solid var(--k-border-default)', background: member.calculated_score !== null && member.calculated_score < 80 ? 'rgba(185,28,28,0.015)' : 'transparent' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--k-text-primary)' }}>{member.full_name}</div>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-text-muted)' }}>{member.designation_name || '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-text-muted)' }}>{member.department_name || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontWeight: 800, fontSize: '14px', color: getScoreColor(member.calculated_score) }}>
                        {member.calculated_score !== null ? `${member.calculated_score}%` : '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700,
                        color: member.calculated_score >= 90 ? 'var(--k-success-text)' : member.calculated_score >= 80 ? 'var(--k-warning-text)' : member.calculated_score !== null ? 'var(--k-danger-text)' : 'var(--k-text-muted)',
                        background: member.calculated_score >= 90 ? 'var(--k-success-bg)' : member.calculated_score >= 80 ? 'var(--k-warning-bg)' : member.calculated_score !== null ? 'var(--k-danger-bg)' : 'var(--k-bg-page)',
                        padding: '2px 8px', borderRadius: '10px'
                      }}>
                        {getScoreBand(member.calculated_score)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--k-success-text)' }}>{member.green_kpis}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--k-warning-text)' }}>{member.amber_kpis}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--k-danger-text)' }}>{member.red_kpis}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{member.live_kpis}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {pending > 0 ? (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-warning-text)', background: 'var(--k-warning-bg)', padding: '2px 8px', borderRadius: '10px' }}>⏳ {pending}</span>
                      ) : <span style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <button onClick={() => openMember(member)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', color: 'var(--k-text-secondary)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
                        Drill Down
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}