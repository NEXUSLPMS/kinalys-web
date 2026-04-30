import { useState, useEffect } from 'react'
import { getCopcScorecard, getCopcTeam, getReviewCycles } from '../api/client'

const TIER_CONFIG = {
  excellent:     { label: 'Excellent',     color: '#0F6E56', bg: '#D6F0E4', icon: '⭐' },
  satisfactory:  { label: 'Satisfactory',  color: '#B45309', bg: '#FEF3C7', icon: '✓' },
  unsatisfactory:{ label: 'Unsatisfactory',color: '#B91C1C', bg: '#FEE2E2', icon: '⚠' },
  not_measured:  { label: 'Not Measured',  color: '#6B7280', bg: '#F3F4F6', icon: '—' },
}

export default function COPCScorecard() {
  const [view, setView] = useState<'my' | 'team'>('my')
  const [scorecard, setScorecard] = useState<any>(null)
  const [team, setTeam] = useState<any[]>([])
  const [cycles, setCycles] = useState<any[]>([])
  const [selectedCycle, setSelectedCycle] = useState('')
  const [loading, setLoading] = useState(true)
  const [teamLoading, setTeamLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isManager, setIsManager] = useState(false)

  useEffect(() => { loadInitial() }, []) // eslint-disable-line
  useEffect(() => { if (selectedCycle) loadScorecard() }, [selectedCycle]) // eslint-disable-line

  async function loadInitial() {
    setLoading(true)
    try {
      const [scData, cycleData] = await Promise.allSettled([getCopcScorecard(), getReviewCycles()])
      if (scData.status === 'fulfilled') {
        setScorecard(scData.value)
        setSelectedCycle(scData.value.cycle_id || '')
      }
      if (cycleData.status === 'fulfilled') setCycles(cycleData.value.cycles || [])
      try {
        const teamData = await getCopcTeam()
        setTeam(teamData.team || [])
        setIsManager(true)
      } catch { setIsManager(false) }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadScorecard() {
    try {
      const data = await getCopcScorecard(selectedCycle)
      setScorecard(data)
    } catch (err: any) { setError(err.message) }
  }

  async function loadTeam() {
    setTeamLoading(true)
    try {
      const data = await getCopcTeam(selectedCycle)
      setTeam(data.team || [])
    } catch (err: any) { setError(err.message) }
    finally { setTeamLoading(false) }
  }

  function getIndexColor(index: number) {
    if (index >= 90) return '#0F6E56'
    if (index >= 70) return '#B45309'
    return '#B91C1C'
  }

  if (loading) return <div className="k-page"><div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading COPC Scorecard...</div></div>

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="k-page">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div className="k-page-title">🏢 COPC Scorecard</div>
            <div className="k-page-sub">Customer Operations Performance Centre · Three-tier scoring</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select value={selectedCycle} onChange={e => setSelectedCycle(e.target.value)} style={{ fontSize: '13px', padding: '6px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
              {cycles.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className={`k-btn ${view === 'my' ? 'k-btn-primary' : 'k-btn-secondary'}`} onClick={() => setView('my')} style={{ fontSize: '12px' }}>My COPC</button>
            {isManager && <button className={`k-btn ${view === 'team' ? 'k-btn-primary' : 'k-btn-secondary'}`} onClick={() => { setView('team'); loadTeam() }} style={{ fontSize: '12px' }}>Team COPC</button>}
          </div>
        </div>

        {error && (
          <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-danger-text)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--k-danger-text)', fontWeight: 700 }}>X</button>
          </div>
        )}

        {/* MY COPC VIEW */}
        {view === 'my' && scorecard && (
          <>
            {/* COPC Index */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '24px' }}>
              <div style={{ gridColumn: '1', background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-lg)', border: '2px solid', borderColor: getIndexColor(scorecard.copc_index), padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>COPC Index</div>
                <div style={{ fontSize: '42px', fontWeight: 800, color: getIndexColor(scorecard.copc_index), lineHeight: 1 }}>{scorecard.copc_index}%</div>
                <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', marginTop: '8px' }}>
                  {scorecard.copc_index >= 90 ? 'Excellent performance' : scorecard.copc_index >= 70 ? 'Satisfactory performance' : 'Needs improvement'}
                </div>
              </div>
              <div style={{ background: '#D6F0E4', borderRadius: 'var(--k-radius-lg)', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F6E56', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>⭐ Excellent</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#0F6E56' }}>{scorecard.tier_summary.excellent}</div>
                <div style={{ fontSize: '11px', color: '#0F6E56', marginTop: '4px' }}>At or above target</div>
              </div>
              <div style={{ background: '#FEF3C7', borderRadius: 'var(--k-radius-lg)', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>✓ Satisfactory</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#B45309' }}>{scorecard.tier_summary.satisfactory}</div>
                <div style={{ fontSize: '11px', color: '#B45309', marginTop: '4px' }}>80–99% of target</div>
              </div>
              <div style={{ background: '#FEE2E2', borderRadius: 'var(--k-radius-lg)', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>⚠ Unsatisfactory</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#B91C1C' }}>{scorecard.tier_summary.unsatisfactory}</div>
                <div style={{ fontSize: '11px', color: '#B91C1C', marginTop: '4px' }}>Below 80% of target</div>
              </div>
            </div>

            {/* COPC methodology explainer */}
            <div style={{ background: 'var(--k-brand-faint)', border: '1px solid var(--k-brand-primary)', borderRadius: 'var(--k-radius-md)', padding: '12px 18px', marginBottom: '20px', fontSize: '12px', color: 'var(--k-text-secondary)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--k-brand-primary)' }}>COPC Scoring:</strong> Excellent = at or above target · Satisfactory = 80–99% of target · Unsatisfactory = below 80% of target · COPC Index = weighted average of all measured KPIs
            </div>

            {/* KPI detail table */}
            {scorecard.kpis?.length > 0 ? (
              <div className="k-card">
                <div className="k-card-header">
                  <div className="k-card-title">KPI Performance — COPC Tiers</div>
                  <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{scorecard.kpis.length} metrics</span>
                </div>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['KPI', 'Target', 'Actual', 'COPC Score', 'Tier', 'Weight'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scorecard.kpis.map((kpi: any) => {
                      const tier = TIER_CONFIG[kpi.copc_tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.not_measured
                      return (
                        <tr key={kpi.id} style={{ borderBottom: '1px solid var(--k-border-default)', background: kpi.copc_tier === 'unsatisfactory' ? 'rgba(185,28,28,0.03)' : 'transparent' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--k-text-primary)' }}>{kpi.name}</div>
                            {kpi.is_lower_better && <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginTop: '2px' }}>Lower is better</div>}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--k-text-secondary)' }}>{kpi.target_value ?? '—'}</td>
                          <td style={{ padding: '12px', fontWeight: 700, color: kpi.actual_value !== null ? 'var(--k-text-primary)' : 'var(--k-text-muted)' }}>{kpi.actual_value ?? '—'}</td>
                          <td style={{ padding: '12px', fontWeight: 700, color: getIndexColor(kpi.copc_score) }}>{kpi.actual_value !== null ? `${Number(kpi.copc_score).toFixed(1)}%` : '—'}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: tier.color, background: tier.bg, padding: '3px 10px', borderRadius: '10px' }}>
                              {tier.icon} {tier.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700, color: 'var(--k-brand-primary)' }}>{kpi.weight_pct}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--k-text-muted)', fontSize: '14px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
                No live KPIs for this cycle. Ask your HR Admin to apply COPC templates.
              </div>
            )}
          </>
        )}

        {/* TEAM COPC VIEW */}
        {view === 'team' && (
          <>
            <div style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 600, color: 'var(--k-text-primary)' }}>
              Team COPC Overview — {team.length} members
            </div>
            {teamLoading ? (
              <div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading team...</div>
            ) : (
              <div className="k-card">
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Employee', 'Excellent', 'Satisfactory', 'Unsatisfactory', 'Not Measured', 'KPIs'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {team.map((member: any) => (
                      <tr key={member.id} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--k-text-primary)' }}>{member.full_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>{member.designation_name || '—'}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontWeight: 700, color: '#0F6E56', background: '#D6F0E4', padding: '2px 8px', borderRadius: '8px', fontSize: '12px' }}>⭐ {member.excellent_kpis}</span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontWeight: 700, color: '#B45309', background: '#FEF3C7', padding: '2px 8px', borderRadius: '8px', fontSize: '12px' }}>✓ {member.satisfactory_kpis}</span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontWeight: 700, color: '#B91C1C', background: '#FEE2E2', padding: '2px 8px', borderRadius: '8px', fontSize: '12px' }}>⚠ {member.unsatisfactory_kpis}</span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--k-text-muted)', fontSize: '12px' }}>{Number(member.total_kpis) - Number(member.measured_kpis)}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{member.total_kpis}</td>
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