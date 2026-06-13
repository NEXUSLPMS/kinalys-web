import { useState, useEffect } from 'react'
import { getClosedFlags, getFlagsReport } from '../api/client'

// Build 2 (W5D3): closed-flag history view. Read-only. Sources from GET /flags/closed
// (terminal PIP statuses + conversation_done releases, decision 58 / rule 32).
// Filters are MULTI-SELECT by default (rule 36 / decision 63). Client-side filtering on the
// loaded list -- one source per number (rule 33), no extra round-trips.
// Export: CSV (client-side, this file) + Print Report (GET /flags/report HTML, Ctrl+P -> PDF).
// Both honor the active filters (rule 33: what you see is what you export).

type FlagType = 'pip' | 'release'

// Outcome groupings keyed off the stored flag fields. Release "Released" == conversation_done.
const OUTCOME_OPTIONS = [
  { key: 'successful', label: 'Successful' },
  { key: 'unsuccessful', label: 'Unsuccessful' },
  { key: 'released', label: 'Released' },
  { key: 'withdrawn', label: 'Withdrawn' },
] as const
type OutcomeKey = typeof OUTCOME_OPTIONS[number]['key']

// Map a flag row to its outcome bucket (single source for the filter + the badge).
function outcomeOf(f: any): OutcomeKey | null {
  if (f.flag_type === 'release') {
    if (f.status === 'conversation_done') return 'released'
    if (f.status === 'withdrawn') return 'withdrawn'
    return null
  }
  // PIP
  if (f.status === 'completed_successful') return 'successful'
  if (f.status === 'completed_unsuccessful') return 'unsuccessful'
  if (f.status === 'withdrawn') return 'withdrawn'
  if (f.status === 'closed') return 'successful' // legacy 'closed' treated as a benign close
  return null
}

function outcomeLabel(o: OutcomeKey | null): string {
  const found = OUTCOME_OPTIONS.find(x => x.key === o)
  return found ? found.label : 'Closed'
}

function outcomeColor(o: OutcomeKey | null): string {
  switch (o) {
    case 'successful': return 'var(--k-success-text)'
    case 'unsuccessful': return 'var(--k-danger-text)'
    case 'released': return 'var(--k-danger-text)'
    case 'withdrawn': return 'var(--k-text-muted)'
    default: return 'var(--k-text-muted)'
  }
}

function fmtDate(d: string | null): string {
  if (!d) return '\u2014'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Resolved date = when the flag reached its terminal state (mirrors the route's ORDER BY).
function resolvedAt(f: any): string | null {
  return f.final_outcome_at || f.hr_confirmed_at || f.updated_at || null
}

// CSV export -- serialize the FILTERED list (rule 33: honors active filters; what you see is what you export).
function csvCell(v: any): string {
  if (v === null || v === undefined) return ''
  const s = String(v).replace(/\r?\n/g, ' ').trim()
  if (/[",]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

function exportClosedFlagsCsv(rows: any[]): void {
  const headers = [
    'Employee', 'Department', 'Type', 'Outcome', 'Flagged By',
    'Raised', 'Resolved', 'PIP Start', 'PIP End', 'PIP Duration (days)',
    'Manager Note', 'HR Note', 'Employee Response', 'Outcome Notes',
  ]
  const body = rows.map(f => [
    csvCell(f.employee_name),
    csvCell(f.department_name),
    csvCell(f.flag_type === 'pip' ? 'PIP' : 'Release'),
    csvCell(outcomeLabel(outcomeOf(f))),
    csvCell(f.flagged_by_name),
    csvCell(fmtDate(f.created_at)),
    csvCell(fmtDate(resolvedAt(f))),
    csvCell(fmtDate(f.pip_start_date)),
    csvCell(fmtDate(f.pip_end_date)),
    csvCell(f.pip_duration_days),
    csvCell(f.manager_comment),
    csvCell(f.hr_comment),
    csvCell(f.employee_response),
    csvCell(f.final_outcome_notes),
  ].join(','))
  const csv = [headers.join(','), ...body].join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `flag-history-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function ClosedFlagsHistory() {
  const [flags, setFlags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Multi-select filters (rule 36). Empty array = no filter applied (show all).
  const [typeFilter, setTypeFilter] = useState<FlagType[]>([])
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeKey[]>([])
  const [nameSearch, setNameSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Print Report in-flight guard (the report fetch takes a moment; block double-fire).
  const [printing, setPrinting] = useState(false)
  const [printErr, setPrintErr] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const data = await getClosedFlags()
        setFlags(data.flags || [])
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load closed flags.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function toggleType(t: FlagType) {
    setTypeFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }
  function toggleOutcome(o: OutcomeKey) {
    setOutcomeFilter(prev => prev.includes(o) ? prev.filter(x => x !== o) : [...prev, o])
  }

  // Print Report: fetch the HTML via axios (demo header travels) then open as a blob tab.
  // Passes the CURRENT filter state so the report matches the screen (rule 33). No filters -> full audit set.
  async function handlePrintReport() {
    if (printing) return
    setPrinting(true)
    setPrintErr(null)
    try {
      const html = await getFlagsReport({ type: typeFilter, outcome: outcomeFilter, name: nameSearch })
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const w = window.open(url, '_blank')
      if (!w) setPrintErr('Popup blocked. Allow popups to open the report.')
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (err: any) {
      setPrintErr(err?.response?.data?.message || err?.message || 'Failed to generate report.')
    } finally {
      setPrinting(false)
    }
  }

  const filtered = flags.filter(f => {
    if (typeFilter.length > 0 && !typeFilter.includes(f.flag_type)) return false
    if (outcomeFilter.length > 0) {
      const o = outcomeOf(f)
      if (!o || !outcomeFilter.includes(o)) return false
    }
    if (nameSearch.trim()) {
      const q = nameSearch.trim().toLowerCase()
      if (!(f.employee_name || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  if (loading) return <div className="k-page"><div style={{ color: 'var(--k-text-muted)', fontSize: '14px', padding: '40px 0' }}>Loading flag history...</div></div>
  if (error) return <div className="k-page"><div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', fontSize: '13px', color: 'var(--k-danger-text)' }}>{error}</div></div>

  const pill = (active: boolean) => ({
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: 'var(--k-radius-md)',
    cursor: 'pointer',
    border: active ? '1px solid transparent' : '1px solid var(--k-border-default)',
    background: active ? 'var(--k-brand)' : 'transparent',
    color: active ? 'white' : 'var(--k-text-secondary)',
    transition: 'background 0.12s',
  })

  const exportBtn = (disabled: boolean) => ({
    padding: '7px 16px',
    fontSize: '12px',
    fontWeight: 700,
    borderRadius: 'var(--k-radius-md)',
    cursor: disabled ? 'default' : 'pointer',
    border: '1px solid var(--k-brand)',
    color: disabled ? 'var(--k-text-muted)' : 'var(--k-brand)',
    background: 'transparent',
    whiteSpace: 'nowrap' as const,
    opacity: disabled ? 0.6 : 1,
  })

  return (
    <div className="k-page">
      <div className="k-page-title">Flag History</div>
      <div className="k-page-sub">Closed PIP and release flags &middot; Read-only audit record &middot; {flags.length} total</div>

      {/* Filters -- all multi-select (rule 36) */}
      <div className="k-card" style={{ padding: '14px 18px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: 'var(--k-text-muted)', marginBottom: '6px' }}>TYPE</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div onClick={() => toggleType('pip')} style={pill(typeFilter.includes('pip'))}>PIP</div>
            <div onClick={() => toggleType('release')} style={pill(typeFilter.includes('release'))}>Release</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: 'var(--k-text-muted)', marginBottom: '6px' }}>OUTCOME</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {OUTCOME_OPTIONS.map(o => (
              <div key={o.key} onClick={() => toggleOutcome(o.key)} style={pill(outcomeFilter.includes(o.key))}>{o.label}</div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: 'var(--k-text-muted)', marginBottom: '6px' }}>EMPLOYEE</div>
          <input
            value={nameSearch}
            onChange={e => setNameSearch(e.target.value)}
            placeholder="Search by name..."
            style={{ width: '100%', padding: '7px 10px', fontSize: '13px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)' }}
          />
        </div>

        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: 'var(--k-text-muted)', marginBottom: '6px', visibility: 'hidden' }}>EXPORT</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div onClick={() => exportClosedFlagsCsv(filtered)} style={exportBtn(false)}>Export CSV</div>
            <div onClick={handlePrintReport} style={exportBtn(printing)}>{printing ? 'Opening...' : 'Print Report'}</div>
          </div>
        </div>

      </div>

      {printErr && (
        <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '8px 12px', fontSize: '12px', color: 'var(--k-danger-text)', marginBottom: '10px' }}>
          {printErr}
        </div>
      )}

      <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginBottom: '10px' }}>
        Showing {filtered.length} of {flags.length}
      </div>

      {filtered.length === 0 && (
        <div className="k-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--k-text-muted)', fontSize: '13px' }}>
          No closed flags match the current filters.
        </div>
      )}

      {filtered.map(f => {
        const o = outcomeOf(f)
        const isExpanded = expandedId === f.id
        const isPip = f.flag_type === 'pip'
        return (
          <div key={f.id} className="k-card" style={{ padding: '0', marginBottom: '10px', overflow: 'hidden' }}>
            {/* Row header -- clickable to expand */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : f.id)}
              style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '16px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-text-primary)' }}>{f.employee_name}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', padding: '2px 8px', borderRadius: 'var(--k-radius-sm)',
                  background: isPip ? 'var(--k-warning-bg)' : 'var(--k-danger-bg)',
                  color: isPip ? 'var(--k-warning-text)' : 'var(--k-danger-text)' }}>
                  {isPip ? 'PIP' : 'RELEASE'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>{f.department_name || '\u2014'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: outcomeColor(o) }}>{outcomeLabel(o)}</span>
                <span style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>{fmtDate(resolvedAt(f))}</span>
                <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{isExpanded ? '\u2212' : '+'}</span>
              </div>
            </div>

            {/* Lean detail drill-in -- stored fields only, conditional by flag_type.
                pip_checkins has 1 row tenant-wide so there is no check-in timeline to show (issue 34). */}
            {isExpanded && (
              <div style={{ padding: '4px 18px 18px 18px', borderTop: '1px solid var(--k-border-default)', fontSize: '13px', color: 'var(--k-text-secondary)' }}>
                <DetailRow label="Flagged by" value={f.flagged_by_name} />
                <DetailRow label="Raised" value={fmtDate(f.created_at)} />
                {f.manager_comment && <DetailRow label="Manager note" value={f.manager_comment} block />}
                {f.hr_comment && <DetailRow label="HR note" value={f.hr_comment} block />}

                {isPip && (
                  <>
                    <DetailRow label="PIP period" value={`${fmtDate(f.pip_start_date)} \u2013 ${fmtDate(f.pip_end_date)}${f.pip_duration_days ? `  (${f.pip_duration_days} days)` : ''}`} />
                    {f.employee_acknowledged_at && <DetailRow label="Acknowledged" value={fmtDate(f.employee_acknowledged_at)} />}
                    {f.employee_response && <DetailRow label="Employee response" value={f.employee_response} block />}
                    {f.final_outcome && <DetailRow label="Outcome" value={f.final_outcome} />}
                    {f.final_outcome_notes && <DetailRow label="Outcome notes" value={f.final_outcome_notes} block />}
                  </>
                )}

                {!isPip && (
                  <DetailRow label="Confirmed" value={fmtDate(f.hr_confirmed_at)} />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function DetailRow({ label, value, block }: { label: string; value: any; block?: boolean }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div style={{ display: block ? 'block' : 'flex', gap: '10px', padding: '5px 0', borderBottom: '1px solid var(--k-border-subtle)' }}>
      <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--k-text-muted)', minWidth: '130px', display: 'inline-block', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ color: 'var(--k-text-primary)' }}>{String(value)}</span>
    </div>
  )
}
