import { useState, useEffect } from 'react'
import { getSixSigmaReport, getMyProfile } from '../api/client'
import { exportSixSigmaPDF, exportSixSigmaXLSX } from '../utils/reportExport'

interface KPI {
  kpi_id: string
  kpi_name: string
  target_value: number
  actual_value: number
  score: number
  rag_status: string
  weight_pct: number
  is_dpmo: boolean
}

interface Employee {
  user_id: string
  full_name: string
  role: string
  department_name: string
  kpis: KPI[]
  sigma_score: number
  avg_score: number
  green_count: number
  amber_count: number
  red_count: number
}

interface Summary {
  total: number
  avg_sigma: number
  avg_score: number
  at_target: number
  below_target: number
  at_target_pct: number
  below_target_pct: number
}

export default function SixSigmaReport() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [cycle, setCycle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'AT' | 'BELOW'>('ALL')
  const [userRole, setUserRole] = useState<string>('')
  const [userId, setUserId] = useState<string>('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [data, profile] = await Promise.all([getSixSigmaReport(), getMyProfile()])
      setUserRole(profile?.user?.role || '')
      setUserId(profile?.user?.id || '')
      setEmployees(data.employees || [])
      setSummary(data.summary || null)
      setCycle(data.cycle || null)
    } catch (err: any) {
      setError('Failed to load Six Sigma report')
    } finally {
      setLoading(false)
    }
  }

  function sigmaColor(sigma: number) {
    if (sigma >= 4.0) return 'var(--k-success-text)'
    if (sigma >= 3.0) return 'var(--k-warning-text)'
    return 'var(--k-danger-text)'
  }

  function sigmaBg(sigma: number) {
    if (sigma >= 4.0) return 'var(--k-success-bg)'
    if (sigma >= 3.0) return 'var(--k-warning-bg)'
    return 'var(--k-danger-bg)'
  }

  function sigmaLabel(sigma: number) {
    if (sigma >= 6.0) return '6σ — World Class'
    if (sigma >= 5.0) return '5σ — Excellent'
    if (sigma >= 4.0) return '4σ — Good'
    if (sigma >= 3.0) return '3σ — Average'
    return '2σ — Below Target'
  }

  function ragColor(r: string) {
    if (r === 'green') return 'var(--k-success-text)'
    if (r === 'amber') return 'var(--k-warning-text)'
    return 'var(--k-danger-text)'
  }

  function ragBg(r: string) {
    if (r === 'green') return 'var(--k-success-bg)'
    if (r === 'amber') return 'var(--k-warning-bg)'
    return 'var(--k-danger-bg)'
  }

  const filtered = filter === 'ALL' ? employees
    : filter === 'AT' ? employees.filter(e => e.sigma_score >= 4.0)
    : employees.filter(e => e.sigma_score < 4.0)

  if (loading) return (
    <div className="k-page">
      <div style={{ color: 'var(--k-text-muted)', fontSize: '14px', padding: '40px 0' }}>Loading Six Sigma report...</div>
    </div>
  )

  if (error) return (
    <div className="k-page">
      <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', fontSize: '13px', color: 'var(--k-danger-text)' }}>{error}</div>
    </div>
  )

  return (
    <div className="k-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="k-page-title">Six Sigma Report</div>
          <div className="k-page-sub">{cycle?.name || 'Current Cycle'} · Sigma Level · DPMO · Process Yield</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--k-text-muted)', fontWeight: 600 }}>FILTER:</span>
          {(['ALL', 'AT', 'BELOW'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '5px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)',
                background: filter === f ? (f === 'AT' ? 'var(--k-success-bg)' : f === 'BELOW' ? 'var(--k-danger-bg)' : 'var(--k-brand-primary)') : 'var(--k-bg-page)',
                color: filter === f ? (f === 'AT' ? 'var(--k-success-text)' : f === 'BELOW' ? 'var(--k-danger-text)' : 'white') : 'var(--k-text-muted)',
                borderColor: filter === f ? 'transparent' : 'var(--k-border-default)' }}>
              {f === 'ALL' ? 'All' : f === 'AT' ? '≥4σ On Target' : '<4σ Below Target'}
            </button>
          ))}
        </div>















      </div>
      {/* Export buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['hr_admin','super_admin','leadership','executive','manager'].includes(userRole) && (
          <button onClick={() => exportSixSigmaXLSX(employees, summary, cycle?.name || 'Q2 2026')}
            style={{ padding: '7px 16px', background: 'var(--k-success-bg)', color: 'var(--k-success-text)', border: '1px solid var(--k-success-border, #bbf7d0)', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
            Download Team XLSX
          </button>
        )}
        {employees.find((e: any) => e.user_id === userId) && (
          <button onClick={() => { const me = employees.find((e: any) => e.user_id === userId); if(me) exportSixSigmaPDF(me, cycle?.name || 'Q2 2026') }}
            style={{ padding: '7px 16px', background: 'var(--k-ai-bg)', color: 'var(--k-ai-text)', border: '1px solid var(--k-ai-border, #c4b5fd)', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
            Download My PDF
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="k-card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', marginBottom: '8px' }}>AVG SIGMA LEVEL</div>
            <div style={{ fontSize: '40px', fontWeight: 800, color: sigmaColor(summary.avg_sigma), fontFamily: 'var(--k-font-display)', lineHeight: 1 }}>{summary.avg_sigma}σ</div>
            <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', marginTop: '6px' }}>{sigmaLabel(summary.avg_sigma)}</div>
          </div>
          <div className="k-card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', marginBottom: '8px' }}>AVG PROCESS SCORE</div>
            <div style={{ fontSize: '40px', fontWeight: 800, color: 'var(--k-brand-primary)', fontFamily: 'var(--k-font-display)', lineHeight: 1 }}>{summary.avg_score}%</div>
            <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', marginTop: '6px' }}>Weighted average</div>
          </div>
          <div className="k-card" style={{ textAlign: 'center', padding: '20px', background: 'var(--k-success-bg)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-success-text)', letterSpacing: '1px', marginBottom: '8px' }}>AT TARGET ≥4σ</div>
            <div style={{ fontSize: '40px', fontWeight: 800, color: 'var(--k-success-text)', fontFamily: 'var(--k-font-display)', lineHeight: 1 }}>{summary.at_target}</div>
            <div style={{ fontSize: '12px', color: 'var(--k-success-text)', marginTop: '6px' }}>{summary.at_target_pct}% of team</div>
          </div>
          <div className="k-card" style={{ textAlign: 'center', padding: '20px', background: 'var(--k-danger-bg)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-danger-text)', letterSpacing: '1px', marginBottom: '8px' }}>BELOW TARGET &lt;4σ</div>
            <div style={{ fontSize: '40px', fontWeight: 800, color: 'var(--k-danger-text)', fontFamily: 'var(--k-font-display)', lineHeight: 1 }}>{summary.below_target}</div>
            <div style={{ fontSize: '12px', color: 'var(--k-danger-text)', marginTop: '6px' }}>{summary.below_target_pct}% of team</div>
          </div>
        </div>
      )}

      {/* Sigma Reference Bar */}
      <div className="k-card" style={{ marginBottom: '24px', padding: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '12px' }}>Sigma Level Reference</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: '6σ', sub: '3.4 DPMO', color: 'var(--k-success-text)', bg: 'var(--k-success-bg)' },
            { label: '5σ', sub: '233 DPMO', color: 'var(--k-success-text)', bg: 'var(--k-success-bg)' },
            { label: '4σ', sub: '6,210 DPMO', color: 'var(--k-success-text)', bg: 'var(--k-success-bg)' },
            { label: '3σ', sub: '66,807 DPMO', color: 'var(--k-warning-text)', bg: 'var(--k-warning-bg)' },
            { label: '2σ', sub: '308,537 DPMO', color: 'var(--k-danger-text)', bg: 'var(--k-danger-bg)' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 'var(--k-radius-md)', padding: '8px 16px', textAlign: 'center', minWidth: '100px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: s.color, fontFamily: 'var(--k-font-display)' }}>{s.label}</div>
              <div style={{ fontSize: '11px', color: s.color, marginTop: '2px' }}>{s.sub}</div>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: '8px', fontSize: '12px', color: 'var(--k-text-muted)', fontStyle: 'italic' }}>
            Industry target: ≥4σ · World class: 6σ
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="k-card">
        <div className="k-card-header">
          <div className="k-card-title">Employee Six Sigma Breakdown</div>
          <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{filtered.length} employees · click row to expand KPIs</span>
        </div>
        <div>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr', gap: '0', padding: '10px 16px', background: 'var(--k-bg-page)', borderBottom: '1px solid var(--k-border-default)' }}>
            {['Employee', 'Department', 'Sigma Level', 'Avg Score', 'KPIs', 'RAG'].map((h, i) => (
              <div key={h} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', textAlign: i >= 2 ? 'center' : 'left' }}>{h}</div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--k-text-muted)', fontSize: '13px' }}>No employees found for this filter.</div>
          )}

          {filtered.map((emp) => (
            <div key={emp.user_id}>
              <div onClick={() => setExpanded(expanded === emp.user_id ? null : emp.user_id)}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr', gap: '0', padding: '14px 16px', borderBottom: '1px solid var(--k-border-default)', cursor: 'pointer', background: expanded === emp.user_id ? 'var(--k-bg-page)' : 'transparent', transition: 'background 0.15s' }}>

                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--k-text-muted)' }}>{expanded === emp.user_id ? '▼' : '▶'}</span>
                  {emp.full_name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--k-text-secondary)', display: 'flex', alignItems: 'center' }}>{emp.department_name || '—'}</div>
                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ background: sigmaBg(emp.sigma_score), color: sigmaColor(emp.sigma_score), padding: '3px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 800, fontFamily: 'var(--k-font-display)' }}>
                    {emp.sigma_score}σ
                  </span>
                </div>
                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: sigmaColor(emp.sigma_score), fontFamily: 'var(--k-font-display)' }}>{emp.avg_score}%</span>
                </div>
                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: 'var(--k-text-secondary)' }}>
                  {emp.kpis.length}
                </div>
                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--k-text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                    {emp.green_count > 0 && <span style={{ color: 'var(--k-success-text)', fontWeight: 600 }}>{emp.green_count} Green</span>}
                    {emp.amber_count > 0 && <span style={{ color: 'var(--k-warning-text)', fontWeight: 600 }}>{emp.amber_count} Amber</span>}
                    {emp.red_count > 0 && <span style={{ color: 'var(--k-danger-text)', fontWeight: 600 }}>{emp.red_count} Red</span>}
                  </div>
                </div>
              </div>

              {/* Expanded KPI rows */}
              {expanded === emp.user_id && (
                <div style={{ background: 'var(--k-bg-page)', borderBottom: '1px solid var(--k-border-default)', padding: '0 16px 12px 40px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '0', padding: '8px 0 4px', borderBottom: '1px solid var(--k-border-default)', marginBottom: '4px' }}>
                    {['KPI', 'Target', 'Actual', 'Score', 'Status'].map((h, i) => (
                      <div key={h} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', textAlign: i >= 1 ? 'center' : 'left' }}>{h}</div>
                    ))}
                  </div>
                  {emp.kpis.map(kpi => (
                    <div key={kpi.kpi_id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '0', padding: '8px 0', borderBottom: '1px solid var(--k-border-default)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--k-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {kpi.kpi_name}
                        {kpi.is_dpmo && <span style={{ fontSize: '10px', background: 'var(--k-ai-bg)', color: 'var(--k-ai-text)', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>DPMO</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--k-text-secondary)', textAlign: 'center' }}>{kpi.target_value}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: ragColor(kpi.rag_status), textAlign: 'center' }}>{kpi.actual_value}</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: ragColor(kpi.rag_status), textAlign: 'center' }}>{Number(kpi.score).toFixed(1)}%</div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ background: ragBg(kpi.rag_status), color: ragColor(kpi.rag_status), padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize' }}>
                          {kpi.rag_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
