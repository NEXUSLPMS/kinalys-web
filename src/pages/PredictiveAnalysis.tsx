import { useState, useEffect } from 'react'
import { getPredictiveTeam, getPredictiveMe, getMyProfile, submitEmployeeFlag, getUserScorecard } from '../api/client'
import StatRing from '../components/StatRing'

export default function PredictiveAnalysis({ onNavigate }: { onNavigate?: (target: string) => void }) {
  const [teamData, setTeamData] = useState<any>(null)
  const [meData, setMeData] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'DECLINING' | 'IMPROVING' | 'ALERT'>('ALL')
  const [deptFilter, setDeptFilter] = useState<string>('ALL')
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [flagType, setFlagType] = useState<'pip' | 'release' | null>(null)
  const [flagComment, setFlagComment] = useState('')
  const [pipStartDate, setPipStartDate] = useState('')
  const [pipEndDate, setPipEndDate] = useState('')
  const [pipDuration, setPipDuration] = useState<30 | 60 | 90 | null>(null)
  const [pipKpiTargets, setPipKpiTargets] = useState<Record<string, string>>({})
  const [pipSupportPlan, setPipSupportPlan] = useState('')
  const [pipReviewFreq, setPipReviewFreq] = useState<'weekly' | 'fortnightly' | 'monthly'>('weekly')
  const [pipKpis, setPipKpis] = useState<any[]>([])
  const [pipKpisLoading, setPipKpisLoading] = useState(false)
  const [flagLoading, setFlagLoading] = useState(false)
  const [flagSuccess, setFlagSuccess] = useState('')
  const [flagError, setFlagError] = useState('')

  const isLeader = ['super_admin','hr_admin','executive','leadership','manager','team_lead'].includes(profile?.role || '')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [profileData, meResult, teamResult] = await Promise.allSettled([
        getMyProfile(), getPredictiveMe(), getPredictiveTeam()
      ])
      if (profileData.status === 'fulfilled') setProfile(profileData.value.user)
      if (meResult.status === 'fulfilled') setMeData(meResult.value)
      if (teamResult.status === 'fulfilled') setTeamData(teamResult.value)
    } finally {
      setLoading(false)
    }
  }

  function applyDurationPreset(days: 30 | 60 | 90) {
    setPipDuration(days)
    const start = new Date()
    const end = new Date()
    end.setDate(end.getDate() + days)
    setPipStartDate(start.toISOString().split('T')[0])
    setPipEndDate(end.toISOString().split('T')[0])
  }

  function isGenuineComment(text: string): boolean {
    const t = text.trim()
    if (t.length < 20) return false
    const words = t.split(/\s+/).filter(w => w.length > 0)
    if (words.length < 4) return false
    if (!words.some(w => w.length > 3)) return false
    const lowerText = t.toLowerCase()
    const blocked = ['this is a test', 'test comment', 'testing', 'just testing', 'test test',
      'hello world', 'foo bar', 'lorem ipsum', 'blah blah', 'n/a', 'nothing', 'no comment',
      'asdf', 'qwerty', 'please approve', 'approve this', 'submit this', 'tbd', 'will add later']
    if (blocked.some(b => lowerText.includes(b))) return false
    const charCounts = lowerText.split('').reduce((acc: Record<string, number>, c: string) => { acc[c] = (acc[c] || 0) + 1; return acc }, {})
    const maxRepeat = Math.max(...(Object.values(charCounts) as number[]))
    if (maxRepeat / t.length > 0.6) return false
    const noSpaces = lowerText.replace(/\s/g, '')
    const runs = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890', '0987654321']
    if (runs.some(run => noSpaces.includes(run.slice(0, 6)))) return false
    const meaningful = ['performance', 'kpi', 'coaching', 'improvement', 'target', 'score',
      'declining', 'missed', 'below', 'training', 'support', 'feedback', 'review',
      'behaviour', 'behavior', 'attendance', 'quality', 'output', 'result', 'metric',
      'customer', 'call', 'complaint', 'issue', 'concern', 'recommend', 'release',
      'business', 'justification', 'reason', 'history', 'pattern', 'consistent',
      'quarter', 'cycle', 'month', 'week', 'discussion', 'meeting', 'warned',
      'fortnightly', 'weekly', 'monthly', 'session', 'plan', 'attend', 'complete']
    if (!meaningful.some(m => lowerText.includes(m))) return false
    return true
  }

  function trendArrow(dir: string) {
    if (dir === 'improving') return { arrow: '\u2191', color: 'var(--k-success-text)' }
    if (dir === 'declining') return { arrow: '\u2193', color: 'var(--k-danger-text)' }
    return { arrow: '\u2192', color: 'var(--k-warning-text)' }
  }

  function scoreColor(score: number) {
    if (score >= 90) return 'var(--k-success-text)'
    if (score >= 75) return 'var(--k-warning-text)'
    return 'var(--k-danger-text)'
  }

  function ragColor(rag: string) {
    if (rag === 'green') return 'var(--k-success-text)'
    if (rag === 'amber') return 'var(--k-warning-text)'
    return 'var(--k-danger-text)'
  }

  function ragBg(rag: string) {
    if (rag === 'green') return 'var(--k-success-bg)'
    if (rag === 'amber') return 'var(--k-warning-bg)'
    return 'var(--k-danger-bg)'
  }

  function resetFlag() {
    setFlagType(null)
    setFlagComment('')
    setPipStartDate('')
    setPipEndDate('')
    setPipDuration(null)
    setPipKpiTargets({})
    setPipSupportPlan('')
    setPipReviewFreq('weekly')
    setPipKpis([])
    setFlagError('')
  }

  const departments = teamData ? ['ALL', ...Array.from(new Set(teamData.predictions.map((p: any) => p.department_name).filter(Boolean)))] as string[] : ['ALL']

  const filtered = !teamData ? [] : teamData.predictions.filter((p: any) => {
    const matchesTrend = filter === 'ALL' || (filter === 'DECLINING' && p.trend_direction === 'declining') || (filter === 'IMPROVING' && p.trend_direction === 'improving') || (filter === 'ALERT' && p.slip_alert)
    const matchesDept = deptFilter === 'ALL' || p.department_name === deptFilter
    return matchesTrend && matchesDept
  })

  const filteredWithData = filtered.filter((p: any) => p.has_data)
  const filteredAvg = filteredWithData.length > 0 ? Math.round(filteredWithData.reduce((s: number, p: any) => s + p.predicted_score, 0) / filteredWithData.length * 10) / 10 : 0
  const filteredImproving = filteredWithData.filter((p: any) => p.trend_direction === 'improving').length
  const filteredDeclining = filteredWithData.filter((p: any) => p.trend_direction === 'declining').length
  const filteredAlerts = filteredWithData.filter((p: any) => p.slip_alert).length

  async function handleFlag() {
    if (!flagType || !selectedEmployee) return
    if (!isGenuineComment(flagComment)) { setFlagError('Please provide a genuine comment in the coaching notes (at least 4 meaningful words).'); return }
    if (flagType === 'pip' && !isGenuineComment(pipSupportPlan)) { setFlagError('Please provide a genuine support plan (at least 4 meaningful words).'); return }
    if (flagType === 'pip' && isGenuineComment(pipSupportPlan) && isGenuineComment(flagComment) && pipSupportPlan.trim().toLowerCase() === flagComment.trim().toLowerCase()) {
      setFlagError('Support plan and coaching notes cannot be identical. Support plan describes what will be provided — coaching notes describe what has already been attempted.')
      return
    }
    if (flagType === 'pip' && (!pipStartDate || !pipEndDate)) { setFlagError('PIP start and end dates are required.'); return }
    setFlagLoading(true)
    setFlagError('')
    try {
      await submitEmployeeFlag({
        employee_id: selectedEmployee.user_id,
        flag_type: flagType,
        manager_comment: flagComment.trim(),
        pip_start_date: flagType === 'pip' ? pipStartDate : undefined,
        pip_end_date: flagType === 'pip' ? pipEndDate : undefined,
        pip_form_data: flagType === 'pip' ? {
          duration_days: pipDuration,
          kpi_targets: pipKpiTargets,
          support_plan: pipSupportPlan,
          review_frequency: pipReviewFreq,
        } : undefined,
        performance_snapshot: {
          current_score: selectedEmployee.current_score,
          predicted_score: selectedEmployee.predicted_score,
          trend_direction: selectedEmployee.trend_direction,
          delta: selectedEmployee.delta,
          history: selectedEmployee.history,
          department: selectedEmployee.department_name,
        }
      })
      setFlagSuccess(`${flagType === 'pip' ? 'PIP' : 'Release'} flag submitted to HR. They will review and schedule a conversation.`)
      resetFlag()
    } catch (err: any) {
      setFlagError(err.response?.data?.message || 'Failed to submit flag.')
    } finally {
      setFlagLoading(false)
    }
  }

  if (loading) return <div className="k-page"><div style={{ color: 'var(--k-text-muted)', fontSize: '14px', padding: '40px 0' }}>Loading predictive analysis...</div></div>

  return (
    <div className="k-page" style={{ display: 'flex', gap: '0', position: 'relative' }}>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, paddingRight: selectedEmployee ? '16px' : '0' }}>

        <div style={{ marginBottom: '20px' }}>
          <div className="k-page-title">Predictive Performance Analysis</div>
          <div className="k-page-sub">Q3 2026 projections &middot; {teamData?.cycles_used?.join(' + ') || 'Historical data'} &middot; Click any employee to view full detail</div>
        </div>

        {meData?.has_data && (
          <div className="k-card" style={{ marginBottom: '20px', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', marginBottom: '12px' }}>YOUR Q3 2026 PROJECTION</div>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginBottom: '2px' }}>Q2 Score</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: scoreColor(meData.current_score), fontFamily: 'var(--k-font-display)' }}>{meData.current_score}%</div>
              </div>
              <div style={{ fontSize: '28px', color: trendArrow(meData.trend_direction).color, fontWeight: 800 }}>{trendArrow(meData.trend_direction).arrow}</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginBottom: '2px' }}>Q3 Projection</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: scoreColor(meData.predicted_score), fontFamily: 'var(--k-font-display)' }}>{meData.predicted_score}%</div>
                <div style={{ fontSize: '10px', color: 'var(--k-text-muted)' }}>{meData.pessimistic_score}% &ndash; {meData.optimistic_score}% range</div>
              </div>
              <div style={{ flex: 1, borderLeft: '1px solid var(--k-border-default)', paddingLeft: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: trendArrow(meData.trend_direction).color, marginBottom: '4px' }}>
                  {meData.trend_direction === 'improving' ? 'Trajectory: Improving' : meData.trend_direction === 'declining' ? 'Trajectory: Needs Attention' : 'Trajectory: Stable'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', lineHeight: 1.6 }}>
                  {meData.trend_direction === 'improving' ? 'You are on an upward trajectory. Keep the momentum.' : meData.trend_direction === 'declining' ? 'Your score has been declining. Speak with your manager about a coaching plan.' : 'Your performance is consistent. Small improvements in your weakest KPIs could push you higher.'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginTop: '6px' }}>Confidence: {Math.round(meData.confidence * 100)}% &middot; Based on {meData.cycles_used} cycle{meData.cycles_used !== 1 ? 's' : ''} of data</div>
              </div>
            </div>
          </div>
        )}

        {isLeader && teamData && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
              {[
                { label: 'AVG Q3 PROJECTION', value: `${filteredAvg}%`, ring: filteredAvg, color: scoreColor(filteredAvg), bg: 'var(--k-bg-card)' },
                { label: 'IMPROVING', value: filteredImproving, sub: 'employees', ring: filteredWithData.length > 0 ? Math.round((filteredImproving / filteredWithData.length) * 100) : 0, color: 'var(--k-success-text)', bg: 'var(--k-success-bg)' },
                { label: 'DECLINING', value: filteredDeclining, sub: 'employees', ring: filteredWithData.length > 0 ? Math.round((filteredDeclining / filteredWithData.length) * 100) : 0, color: 'var(--k-danger-text)', bg: 'var(--k-danger-bg)' },
                { label: 'SLIP ALERTS', value: filteredAlerts, sub: 'Green to Amber risk', ring: filteredWithData.length > 0 ? Math.round((filteredAlerts / filteredWithData.length) * 100) : 0, color: filteredAlerts > 0 ? 'var(--k-warning-text)' : 'var(--k-text-muted)', bg: filteredAlerts > 0 ? 'var(--k-warning-bg)' : 'var(--k-bg-card)' },
              ].map(c => (
                <div key={c.label} className="k-card" style={{ padding: '16px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: c.color, letterSpacing: '1px', marginBottom: '6px' }}>{c.label}</div>
                    <div style={{ fontSize: '30px', fontWeight: 800, color: c.color, fontFamily: 'var(--k-font-display)' }}>{c.value}</div>
                    {(c as any).sub && <div style={{ fontSize: '11px', color: c.color, marginTop: '2px' }}>{(c as any).sub}</div>}
                  </div>
                  <StatRing value={(c as any).ring} color={c.color} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', fontSize: '12px', fontFamily: 'var(--k-font-sans)', background: 'var(--k-bg-card)', color: 'var(--k-text-primary)', cursor: 'pointer' }}>
                {departments.map((d: string) => <option key={d} value={d}>{d === 'ALL' ? 'All Departments' : d}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '6px' }}>
                {([['ALL','All'],['IMPROVING','Improving'],['DECLINING','Declining'],['ALERT','Slip Alert']] as const).map(([f, label]) => (
                  <button key={f} onClick={() => setFilter(f as any)}
                    style={{ padding: '5px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)',
                      background: filter === f ? 'var(--k-brand-primary)' : 'var(--k-bg-page)',
                      color: filter === f ? 'white' : 'var(--k-text-muted)',
                      borderColor: filter === f ? 'transparent' : 'var(--k-border-default)' }}>
                    {label}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--k-text-muted)', marginLeft: 'auto' }}>{filtered.length} employees</span>
            </div>

            <div className="k-card">
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.2fr', padding: '10px 16px', background: 'var(--k-bg-page)', borderBottom: '1px solid var(--k-border-default)' }}>
                {['Employee', 'Department', 'Q2 Score', 'Q3 Projection', 'Trend', 'Status'].map((h, i) => (
                  <div key={h} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', textAlign: i >= 2 ? 'center' : 'left' }}>{h}</div>
                ))}
              </div>

              {filtered.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--k-text-muted)', fontSize: '13px' }}>No employees match this filter.</div>}

              {filtered.map((p: any) => {
                const trend = trendArrow(p.trend_direction)
                const isSelected = selectedEmployee?.user_id === p.user_id
                return (
                  <div key={p.user_id}
                    onClick={() => { setSelectedEmployee(isSelected ? null : p); resetFlag(); setFlagSuccess('') }}
                    style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.2fr', padding: '12px 16px', borderBottom: '1px solid var(--k-border-default)', cursor: 'pointer',
                      background: isSelected ? 'var(--k-brand-faint)' : p.slip_alert ? 'var(--k-warning-bg)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--k-brand-primary)' : '3px solid transparent' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {p.slip_alert && <span style={{ fontSize: '12px' }}>&#9888;</span>}
                      {p.full_name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--k-text-secondary)', display: 'flex', alignItems: 'center' }}>{p.department_name || '-'}</div>
                    <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.current_score !== null ? <span style={{ fontSize: '14px', fontWeight: 700, color: scoreColor(p.current_score), fontFamily: 'var(--k-font-display)' }}>{p.current_score}%</span> : <span style={{ color: 'var(--k-text-muted)' }}>-</span>}
                    </div>
                    <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.predicted_score !== null ? <span style={{ fontSize: '14px', fontWeight: 700, color: scoreColor(p.predicted_score), fontFamily: 'var(--k-font-display)' }}>{p.predicted_score}%</span> : <span style={{ color: 'var(--k-text-muted)' }}>-</span>}
                    </div>
                    <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 800, color: trend.color }}>{trend.arrow}</span>
                      {p.delta !== null && <span style={{ fontSize: '10px', color: trend.color }}>{p.delta >= 0 ? '+' : ''}{p.delta}%</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      {p.slip_alert && !p.predicted_rag && <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--k-warning-text)', background: 'var(--k-warning-bg)', padding: '2px 5px', borderRadius: '8px' }}>SLIP</span>}
                      {p.predicted_rag && <span style={{ fontSize: '9px', fontWeight: 700, color: ragColor(p.predicted_rag), background: ragBg(p.predicted_rag), padding: '2px 6px', borderRadius: '8px', textTransform: 'capitalize' }}>{p.predicted_rag}{p.slip_alert ? ' !' : ''}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Side panel */}
      {selectedEmployee && (
        <div style={{ width: '400px', flexShrink: 0, borderLeft: '1px solid var(--k-border-default)', paddingLeft: '20px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', position: 'sticky', top: '20px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--k-text-primary)' }}>{selectedEmployee.full_name}</div>
              <div style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{selectedEmployee.department_name} &middot; {selectedEmployee.role?.replace('_', ' ')}</div>
            </div>
            <button onClick={() => setSelectedEmployee(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--k-text-muted)', padding: '0 4px' }}>x</button>
          </div>

          <div className="k-card" style={{ padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', marginBottom: '12px' }}>PERFORMANCE STORY</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
              {selectedEmployee.history?.map((h: any, i: number) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginBottom: '2px' }}>{h.cycle_name}</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: scoreColor(h.score), fontFamily: 'var(--k-font-display)' }}>{h.score}%</div>
                </div>
              ))}
              {selectedEmployee.history?.length > 0 && (
                <>
                  <div style={{ fontSize: '20px', color: trendArrow(selectedEmployee.trend_direction).color, fontWeight: 800 }}>{trendArrow(selectedEmployee.trend_direction).arrow}</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginBottom: '2px' }}>Q3 Projected</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: scoreColor(selectedEmployee.predicted_score), fontFamily: 'var(--k-font-display)' }}>{selectedEmployee.predicted_score}%</div>
                  </div>
                </>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', lineHeight: 1.6, padding: '10px', background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)' }}>
              {selectedEmployee.trend_direction === 'declining'
                ? `${selectedEmployee.full_name.split(' ')[0]} has been on a declining trajectory. Their score dropped ${Math.abs(selectedEmployee.delta || 0)}% between cycles. Without intervention, Q3 is projected at ${selectedEmployee.predicted_score}%. Immediate coaching is recommended.`
                : selectedEmployee.trend_direction === 'improving'
                ? `${selectedEmployee.full_name.split(' ')[0]} is on an improving trajectory, up ${selectedEmployee.delta || 0}% between cycles. Q3 is projected at ${selectedEmployee.predicted_score}%. Continue to support this growth.`
                : `${selectedEmployee.full_name.split(' ')[0]}'s performance is stable at ${selectedEmployee.current_score}%. ${selectedEmployee.predicted_rag === 'amber' || selectedEmployee.predicted_rag === 'red' ? 'They remain in the ' + selectedEmployee.predicted_rag + ' zone. Targeted KPI coaching could help them reach green.' : 'Maintaining strong performance.'}`}
              {selectedEmployee.slip_alert && ' Currently Green but predicted to slip - early intervention recommended.'}
            </div>
          </div>

          <div className="k-card" style={{ padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', marginBottom: '10px' }}>SCORE BREAKDOWN</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { label: 'Current', value: selectedEmployee.current_score },
                { label: 'Projected', value: selectedEmployee.predicted_score, note: `${selectedEmployee.pessimistic_score}-${selectedEmployee.optimistic_score}%` },
                { label: 'Confidence', value: `${Math.round((selectedEmployee.confidence || 0) * 100)}%`, note: `${selectedEmployee.cycles_used} cycle${selectedEmployee.cycles_used !== 1 ? 's' : ''}` },
              ].map(item => (
                <div key={item.label} style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginBottom: '2px' }}>{item.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: typeof item.value === 'number' ? scoreColor(item.value) : 'var(--k-text-primary)', fontFamily: 'var(--k-font-display)' }}>{item.value}{typeof item.value === 'number' ? '%' : ''}</div>
                  {(item as any).note && <div style={{ fontSize: '9px', color: 'var(--k-text-muted)', marginTop: '1px' }}>{(item as any).note}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="k-card" style={{ padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', marginBottom: '12px' }}>DECISION SUPPORT</div>

            {flagSuccess && (
              <div style={{ background: 'var(--k-success-bg)', border: '1px solid var(--k-success-border)', borderRadius: 'var(--k-radius-md)', padding: '10px 14px', marginBottom: '12px', fontSize: '12px', color: 'var(--k-success-text)' }}>
                {flagSuccess}
              </div>
            )}

            {!flagType && !flagSuccess && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => onNavigate?.('oneonone')}
                  style={{ padding: '10px', background: 'var(--k-bg-page)', border: '1px solid var(--k-border-default)', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--k-font-sans)', color: 'var(--k-text-primary)', textAlign: 'left' }}>
                  Schedule 1-on-1 with {selectedEmployee.full_name.split(' ')[0]}
                </button>
                <button onClick={() => onNavigate?.('catalog')}
                  style={{ padding: '10px', background: 'var(--k-bg-page)', border: '1px solid var(--k-border-default)', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--k-font-sans)', color: 'var(--k-text-primary)', textAlign: 'left' }}>
                  Recommend a Course
                </button>
                <div style={{ borderTop: '1px solid var(--k-border-default)', paddingTop: '8px', marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '8px' }}>FLAG TO HR</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={async () => {
                      setFlagType('pip')
                      setFlagError('')
                      setPipKpisLoading(true)
                      try {
                        const result = await getUserScorecard(selectedEmployee.user_id)
                        const redAmber = (result?.kpis || []).filter((k: any) => k.rag_status === 'red' || k.rag_status === 'amber')
                        setPipKpis(redAmber)
                      } catch { setPipKpis([]) } finally { setPipKpisLoading(false) }
                    }}
                      style={{ flex: 1, padding: '8px', background: 'var(--k-warning-bg)', border: '1px solid var(--k-warning-border)', borderRadius: 'var(--k-radius-md)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)', color: 'var(--k-warning-text)' }}>
                      Flag for PIP
                    </button>
                    <button onClick={() => { setFlagType('release'); setFlagError('') }}
                      style={{ flex: 1, padding: '8px', background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)', color: 'var(--k-danger-text)' }}>
                      Flag to Release
                    </button>
                  </div>
                </div>
              </div>
            )}

            {flagType && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: flagType === 'pip' ? 'var(--k-warning-text)' : 'var(--k-danger-text)' }}>
                    {flagType === 'pip' ? 'Flag for PIP' : 'Flag to Release'}
                  </span>
                  <button onClick={resetFlag} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', color: 'var(--k-text-muted)' }}>Cancel</button>
                </div>

                {flagType === 'release' && (
                  <div style={{ background: 'var(--k-danger-bg)', borderRadius: 'var(--k-radius-md)', padding: '10px', marginBottom: '10px', fontSize: '11px', color: 'var(--k-danger-text)', lineHeight: 1.5 }}>
                    This recommendation will be reviewed by HR before any action is taken. The employee will not be notified.
                  </div>
                )}

                {flagType === 'pip' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>

                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</div>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                        {([30, 60, 90] as const).map(d => (
                          <button key={d} onClick={() => applyDurationPreset(d)}
                            style={{ flex: 1, padding: '6px', fontSize: '12px', fontWeight: 700, borderRadius: 'var(--k-radius-md)', border: `1px solid ${pipDuration === d ? 'var(--k-warning-text)' : 'var(--k-border-default)'}`, background: pipDuration === d ? 'var(--k-warning-bg)' : 'var(--k-bg-input)', color: pipDuration === d ? 'var(--k-warning-text)' : 'var(--k-text-secondary)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
                            {d} days
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginBottom: '3px' }}>Start Date</div>
                          <input type="date" value={pipStartDate} onChange={e => { setPipStartDate(e.target.value); setPipDuration(null) }}
                            min={new Date().toISOString().split('T')[0]}
                            style={{ width: '100%', fontSize: '12px', padding: '7px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginBottom: '3px' }}>End Date</div>
                          <input type="date" value={pipEndDate} onChange={e => { setPipEndDate(e.target.value); setPipDuration(null) }}
                            min={pipStartDate || new Date().toISOString().split('T')[0]}
                            style={{ width: '100%', fontSize: '12px', padding: '7px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                      {pipDuration && (
                        <div style={{ fontSize: '10px', color: 'var(--k-brand-primary)', marginTop: '4px' }}>
                          {pipDuration} days selected
                        </div>
                      )}
                    </div>

                    {(pipKpisLoading || pipKpis.length > 0) && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>KPI Improvement Targets</div>
                        {pipKpisLoading ? (
                          <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', padding: '8px' }}>Loading KPIs...</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {pipKpis.map((kpi: any) => (
                              <div key={kpi.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: 'var(--k-bg-input)', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--k-text-primary)' }}>{kpi.name}</div>
                                  <div style={{ fontSize: '10px', color: kpi.rag_status === 'red' ? 'var(--k-danger-text)' : 'var(--k-warning-text)' }}>Current score: {kpi.score}% &middot; RAG: {kpi.rag_status}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                  <div style={{ fontSize: '9px', color: 'var(--k-text-muted)' }}>PIP target %</div>
                                  <input type="number" min="0" max="100"
                                    value={pipKpiTargets[kpi.name] || ''}
                                    onChange={e => setPipKpiTargets(prev => ({ ...prev, [kpi.name]: e.target.value }))}
                                    placeholder={String(kpi.target_value)}
                                    style={{ width: '64px', fontSize: '12px', padding: '4px 6px', borderRadius: 'var(--k-radius-sm)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', textAlign: 'center' }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Review Frequency</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {(['weekly', 'fortnightly', 'monthly'] as const).map(freq => (
                          <button key={freq} onClick={() => setPipReviewFreq(freq)}
                            style={{ flex: 1, padding: '6px', fontSize: '11px', fontWeight: 700, borderRadius: 'var(--k-radius-md)', border: `1px solid ${pipReviewFreq === freq ? 'var(--k-brand-primary)' : 'var(--k-border-default)'}`, background: pipReviewFreq === freq ? 'var(--k-brand-faint)' : 'var(--k-bg-input)', color: pipReviewFreq === freq ? 'var(--k-brand-primary)' : 'var(--k-text-secondary)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)', textTransform: 'capitalize' }}>
                            {freq}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Support Plan</div>
                      <textarea value={pipSupportPlan} onChange={e => setPipSupportPlan(e.target.value)}
                        placeholder="What coaching, training, or support will be provided to help the employee improve?"
                        rows={3}
                        style={{ width: '100%', fontSize: '12px', padding: '8px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'vertical', boxSizing: 'border-box' }} />
                      <div style={{ fontSize: '10px', color: isGenuineComment(pipSupportPlan) ? 'var(--k-success-text)' : pipSupportPlan.length > 0 ? 'var(--k-danger-text)' : 'var(--k-text-muted)', marginTop: '2px' }}>
                        {pipSupportPlan.length === 0 ? 'Describe the coaching, training, or resources being provided' : isGenuineComment(pipSupportPlan) ? 'Support plan looks good' : 'Please describe a genuine support plan with specific details'}
                      </div>
                    </div>

                  </div>
                )}

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '4px' }}>
                    {flagType === 'pip' ? 'What coaching has been attempted? What improvement is expected?' : 'Business justification for release recommendation'}
                  </div>
                  <textarea value={flagComment} onChange={e => setFlagComment(e.target.value)}
                    placeholder={flagType === 'pip' ? 'Describe coaching attempts, specific KPI gaps, and the improvement targets you expect...' : 'Describe the business reasons and performance history supporting this recommendation...'}
                    rows={5}
                    style={{ width: '100%', fontSize: '12px', padding: '8px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'vertical', boxSizing: 'border-box' }} />
                  <div style={{ fontSize: '10px', color: isGenuineComment(flagComment) ? 'var(--k-success-text)' : 'var(--k-danger-text)', marginTop: '2px' }}>
                    {isGenuineComment(flagComment) ? 'Comment looks good' : `${flagComment.trim().split(/\s+/).filter((w: string) => w.length > 0).length} words — need at least 4 meaningful words`}
                  </div>
                </div>

                {flagError && <div style={{ fontSize: '12px', color: 'var(--k-danger-text)', marginBottom: '8px' }}>{flagError}</div>}

                <button onClick={handleFlag} disabled={flagLoading || !isGenuineComment(flagComment)}
                  style={{ width: '100%', padding: '10px', background: flagType === 'pip' ? 'var(--k-warning-text)' : 'var(--k-danger-text)', border: 'none', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 700, cursor: flagLoading || !isGenuineComment(flagComment) ? 'not-allowed' : 'pointer', fontFamily: 'var(--k-font-sans)', color: 'white', opacity: flagLoading || !isGenuineComment(flagComment) ? 0.6 : 1 }}>
                  {flagLoading ? 'Submitting...' : `Submit ${flagType === 'pip' ? 'PIP' : 'Release'} Flag to HR`}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
