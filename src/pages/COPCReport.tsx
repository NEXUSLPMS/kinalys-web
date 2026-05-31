import { useState, useEffect } from 'react'
import { getCOPCReport, getMyProfile } from '../api/client'
import { exportCOPCPDF, exportCOPCXLSX } from '../utils/reportExport'

interface KPI {
  kpi_id: string
  kpi_name: string
  target_value: number
  actual_value: number
  score: number
  rag_status: string
  weight_pct: number
  copc_class: 'E' | 'S' | 'U'
}

interface Employee {
  user_id: string
  full_name: string
  role: string
  department_name: string
  kpis: KPI[]
  copc_index: number
  classification: 'E' | 'S' | 'U'
  green_count: number
  amber_count: number
  red_count: number
}

interface Summary {
  total: number
  excellent: number
  satisfactory: number
  unsatisfactory: number
  avg_copc_index: number
  excellent_pct: number
  satisfactory_pct: number
  unsatisfactory_pct: number
}

export default function COPCReport() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [cycle, setCycle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'E' | 'S' | 'U'>('ALL')
  const [userRole, setUserRole] = useState<string>('')
  const [userId, setUserId] = useState<string>('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [data, profile] = await Promise.all([getCOPCReport(), getMyProfile()])
      setUserRole(profile?.user?.role || '')
      setUserId(profile?.user?.id || '')
      setSummary(data.summary || null)
      setEmployees(data.employees || [])
      setCycle(data.cycle || null)
    } catch (err: any) {
      setError('Failed to load COPC report')
    } finally {
      setLoading(false)
    }
  }

  function classColor(c: string) {
    if (c === 'E') return 'var(--k-success-text)'
    if (c === 'S') return 'var(--k-warning-text)'
    return 'var(--k-danger-text)'
  }

  function classBg(c: string) {
    if (c === 'E') return 'var(--k-success-bg)'
    if (c === 'S') return 'var(--k-warning-bg)'
    return 'var(--k-danger-bg)'
  }

  function classLabel(c: string) {
    if (c === 'E') return 'Excellent'
    if (c === 'S') return 'Satisfactory'
    return 'Unsatisfactory'
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

  const filtered = filter === 'ALL' ? employees : employees.filter(e => e.classification === filter)

  if (loading) return (
    <div className="k-page">
      <div style={{ color: 'var(--k-text-muted)', fontSize: '14px', padding: '40px 0' }}>Loading COPC report...</div>
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
          <div className="k-page-title">COPC Performance Report</div>
          <div className="k-page-sub">{cycle?.name || 'Current Cycle'} · E/S/U Classification · COPC Index</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--k-text-muted)', fontWeight: 600 }}>FILTER:</span>
          {(['ALL', 'E', 'S', 'U'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '5px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)',
                background: filter === f ? (f === 'E' ? 'var(--k-success-bg)' : f === 'S' ? 'var(--k-warning-bg)' : f === 'U' ? 'var(--k-danger-bg)' : 'var(--k-brand-primary)') : 'var(--k-bg-page)',
                color: filter === f ? (f === 'E' ? 'var(--k-success-text)' : f === 'S' ? 'var(--k-warning-text)' : f === 'U' ? 'var(--k-danger-text)' : 'white') : 'var(--k-text-muted)',
                borderColor: filter === f ? 'transparent' : 'var(--k-border-default)' }}>
              {f === 'ALL' ? 'All' : f === 'E' ? 'Excellent' : f === 'S' ? 'Satisfactory' : 'Unsatisfactory'}
            </button>
          ))}
        </div>















      </div>
      {/* Export buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['hr_admin','super_admin','leadership','executive','manager'].includes(userRole) && (
          <button onClick={() => exportCOPCXLSX(employees, summary, cycle?.name || 'Q2 2026')}
            style={{ padding: '7px 16px', background: 'var(--k-success-bg)', color: 'var(--k-success-text)', border: '1px solid var(--k-success-border, #bbf7d0)', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
            Download Team XLSX
          </button>
        )}
        {employees.find((e: any) => e.user_id === userId) && (
          <button onClick={() => { const me = employees.find((e: any) => e.user_id === userId); if(me) exportCOPCPDF(me, cycle?.name || 'Q2 2026') }}
            style={{ padding: '7px 16px', background: 'var(--k-ai-bg)', color: 'var(--k-ai-text)', border: '1px solid var(--k-ai-border, #c4b5fd)', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
            Download My PDF
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {/* COPC Index */}
          <div className="k-card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', marginBottom: '8px' }}>COPC INDEX</div>
            <div style={{ fontSize: '40px', fontWeight: 800, color: 'var(--k-brand-primary)', fontFamily: 'var(--k-font-display)', lineHeight: 1 }}>{summary.avg_copc_index}%</div>
            <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', marginTop: '6px' }}>Team average</div>
          </div>
          {/* Excellent */}
          <div className="k-card" style={{ textAlign: 'center', padding: '20px', background: 'var(--k-success-bg)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-success-text)', letterSpacing: '1px', marginBottom: '8px' }}>EXCELLENT (E)</div>
            <div style={{ fontSize: '40px', fontWeight: 800, color: 'var(--k-success-text)', fontFamily: 'var(--k-font-display)', lineHeight: 1 }}>{summary.excellent}</div>
            <div style={{ fontSize: '12px', color: 'var(--k-success-text)', marginTop: '6px' }}>{summary.excellent_pct}% of team</div>
          </div>
          {/* Satisfactory */}
          <div className="k-card" style={{ textAlign: 'center', padding: '20px', background: 'var(--k-warning-bg)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-warning-text)', letterSpacing: '1px', marginBottom: '8px' }}>SATISFACTORY (S)</div>
            <div style={{ fontSize: '40px', fontWeight: 800, color: 'var(--k-warning-text)', fontFamily: 'var(--k-font-display)', lineHeight: 1 }}>{summary.satisfactory}</div>
            <div style={{ fontSize: '12px', color: 'var(--k-warning-text)', marginTop: '6px' }}>{summary.satisfactory_pct}% of team</div>
          </div>
          {/* Unsatisfactory */}
          <div className="k-card" style={{ textAlign: 'center', padding: '20px', background: 'var(--k-danger-bg)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-danger-text)', letterSpacing: '1px', marginBottom: '8px' }}>UNSATISFACTORY (U)</div>
            <div style={{ fontSize: '40px', fontWeight: 800, color: 'var(--k-danger-text)', fontFamily: 'var(--k-font-display)', lineHeight: 1 }}>{summary.unsatisfactory}</div>
            <div style={{ fontSize: '12px', color: 'var(--k-danger-text)', marginTop: '6px' }}>{summary.unsatisfactory_pct}% of team</div>
          </div>
        </div>
      )}

      {/* COPC Index Bar */}
      {summary && (
        <div className="k-card" style={{ marginBottom: '24px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '12px' }}>Team COPC Distribution</div>
          <div style={{ height: '24px', borderRadius: 'var(--k-radius-md)', overflow: 'hidden', display: 'flex', gap: '2px' }}>
            {summary.excellent_pct > 0 && (
              <div style={{ width: `${summary.excellent_pct}%`, background: 'var(--k-success-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>{summary.excellent_pct}% E</span>
              </div>
            )}
            {summary.satisfactory_pct > 0 && (
              <div style={{ width: `${summary.satisfactory_pct}%`, background: 'var(--k-warning-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>{summary.satisfactory_pct}% S</span>
              </div>
            )}
            {summary.unsatisfactory_pct > 0 && (
              <div style={{ width: `${summary.unsatisfactory_pct}%`, background: 'var(--k-danger-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>{summary.unsatisfactory_pct}% U</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '24px', marginTop: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--k-success-text)' }}>● Excellent ≥90%</span>
            <span style={{ fontSize: '11px', color: 'var(--k-warning-text)' }}>● Satisfactory ≥75%</span>
            <span style={{ fontSize: '11px', color: 'var(--k-danger-text)' }}>● Unsatisfactory &lt;75%</span>
          </div>
        </div>
      )}

      {/* Employee Table */}
      <div className="k-card">
        <div className="k-card-header">
          <div className="k-card-title">Employee COPC Breakdown</div>
          <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{filtered.length} employees · click row to expand KPIs</span>
        </div>
        <div>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr', gap: '0', padding: '10px 16px', background: 'var(--k-bg-page)', borderBottom: '1px solid var(--k-border-default)' }}>
            {['Employee', 'Department', 'COPC Index', 'Class', 'KPIs', 'RAG'].map((h, i) => (
              <div key={h} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', textAlign: i >= 2 ? 'center' : 'left' }}>{h}</div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--k-text-muted)', fontSize: '13px' }}>No employees found for this filter.</div>
          )}

          {filtered.map((emp, idx) => (
            <div key={emp.user_id}>
              {/* Row */}
              <div onClick={() => setExpanded(expanded === emp.user_id ? null : emp.user_id)}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr', gap: '0', padding: '14px 16px', borderBottom: '1px solid var(--k-border-default)', cursor: 'pointer', background: expanded === emp.user_id ? 'var(--k-bg-page)' : 'transparent', transition: 'background 0.15s' }}>

                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--k-text-muted)' }}>{expanded === emp.user_id ? '▼' : '▶'}</span>
                  {emp.full_name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--k-text-secondary)', display: 'flex', alignItems: 'center' }}>{emp.department_name || '—'}</div>
                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: classColor(emp.classification), fontFamily: 'var(--k-font-display)' }}>{emp.copc_index}%</span>
                </div>
                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ background: classBg(emp.classification), color: classColor(emp.classification), padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                    {emp.classification} — {classLabel(emp.classification)}
                  </span>
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
                    {['KPI', 'Target', 'Actual', 'Score', 'Class'].map((h, i) => (
                      <div key={h} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', textAlign: i >= 1 ? 'center' : 'left' }}>{h}</div>
                    ))}
                  </div>
                  {emp.kpis.map(kpi => (
                    <div key={kpi.kpi_id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '0', padding: '8px 0', borderBottom: '1px solid var(--k-border-default)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--k-text-primary)' }}>{kpi.kpi_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--k-text-secondary)', textAlign: 'center' }}>{kpi.target_value}%</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: ragColor(kpi.rag_status), textAlign: 'center' }}>{kpi.actual_value}%</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: ragColor(kpi.rag_status), textAlign: 'center' }}>{Number(kpi.score).toFixed(1)}%</div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ background: classBg(kpi.copc_class), color: classColor(kpi.copc_class), padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                          {kpi.copc_class}
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
