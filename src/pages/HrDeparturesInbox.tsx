import { useState, useEffect, useCallback } from 'react'
import { listDepartures, getDeparture } from '../api/client'

// ──────────────────────────────────────────────────────────────────────
// HR Departures Inbox (Org Memory Tier 1)
//
// Lists all departure_events for the tenant with filters and a summary.
// Click a row to open the detail drawer with full snapshot + brief status.
//
// Day 3 scope: read-only audit view.
// Day 4 will add: trigger brief generation, view generated brief.
// ──────────────────────────────────────────────────────────────────────

interface Departure {
  id: string
  employee_id: string
  billing_year: number
  trigger_source: string
  triggered_by: string | null
  brief_status: string
  notes: string | null
  created_at: string
  employee_name: string
  employee_email: string
  employee_role: string
  employee_department_id: string | null
  employee_manager_id: string | null
  employee_department_name: string | null
  triggered_by_name: string | null
  brief_id: string | null
  brief_generated_at: string | null
  brief_assigned_to_manager_id: string | null
}

interface Summary {
  by_billing_year: Record<string, number>
  by_trigger_source: Record<string, number>
  by_brief_status: Record<string, number>
}

const TRIGGER_LABEL: Record<string, string> = {
  release_flag_confirmed: 'Release Flag',
  manual_status_change:   'Manual Update',
  hris_sync:              'HRIS Sync',
  soft_delete:            'User Removed',
}

const TRIGGER_COLORS: Record<string, { color: string; bg: string }> = {
  release_flag_confirmed: { color: 'var(--k-danger-text)',  bg: 'var(--k-danger-bg)' },
  manual_status_change:   { color: '#92400E',               bg: '#FEF3C7' },
  hris_sync:              { color: 'var(--k-ai-text)',      bg: 'var(--k-ai-bg)' },
  soft_delete:            { color: '#9F1239',               bg: '#FFE4E6' },
}

const BRIEF_LABEL: Record<string, string> = {
  pending:    'Pending',
  generating: 'Generating…',
  ready:      'Ready',
  failed:     'Failed',
}

const BRIEF_COLORS: Record<string, { color: string; bg: string }> = {
  pending:    { color: '#6B21A8',               bg: '#F3E8FF' },
  generating: { color: 'var(--k-warning-text)', bg: 'var(--k-warning-bg)' },
  ready:      { color: 'var(--k-success-text)', bg: 'var(--k-success-bg)' },
  failed:     { color: 'var(--k-danger-text)',  bg: 'var(--k-danger-bg)' },
}

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function HrDeparturesInbox() {
  const [departures, setDepartures] = useState<Departure[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Departure | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Filters
  const [filterTrigger, setFilterTrigger] = useState('')
  const [filterBrief, setFilterBrief] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listDepartures({
        trigger_source: filterTrigger || undefined,
        brief_status: filterBrief || undefined,
      })
      setDepartures(data.departures)
      setSummary(data.summary)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load departures.')
    } finally {
      setLoading(false)
    }
  }, [filterTrigger, filterBrief])

  useEffect(() => {
    load()
  }, [load])

  async function openDetail(row: Departure) {
    setSelected(row)
    setSelectedDetail(null)
    setDetailLoading(true)
    try {
      const data = await getDeparture(row.id)
      setSelectedDetail(data.departure)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load departure detail.')
    } finally {
      setDetailLoading(false)
    }
  }

  function closeDetail() {
    setSelected(null)
    setSelectedDetail(null)
  }

  const currentYear = new Date().getUTCFullYear()
  const thisYearCount = summary?.by_billing_year?.[String(currentYear)] || 0
  const totalCount = Object.values(summary?.by_billing_year || {}).reduce((s, n) => s + n, 0)
  const pendingBriefs = summary?.by_brief_status?.pending || 0
  const readyBriefs = summary?.by_brief_status?.ready || 0

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--k-font-display, var(--k-font-sans))', color: 'var(--k-text-primary)', marginBottom: '4px' }}>
          Departures Inbox
        </div>
        <div style={{ fontSize: '13px', color: 'var(--k-text-secondary)' }}>
          Audit trail of every employee departure across all four trigger sources. Org Memory generates a Role Intelligence Brief for each.
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <SummaryCard label="This year" value={thisYearCount} sublabel={`${currentYear}`} />
        <SummaryCard label="All time" value={totalCount} sublabel={`across ${Object.keys(summary?.by_billing_year || {}).length} year(s)`} />
        <SummaryCard label="Pending briefs" value={pendingBriefs} sublabel="awaiting AI generation" warn={pendingBriefs > 0} />
        <SummaryCard label="Ready briefs" value={readyBriefs} sublabel="available to assign" success={readyBriefs > 0} />
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--k-text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Trigger
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <FilterPill active={filterTrigger === ''} onClick={() => setFilterTrigger('')}>All</FilterPill>
            {Object.keys(TRIGGER_LABEL).map(key => (
              <FilterPill
                key={key}
                active={filterTrigger === key}
                onClick={() => setFilterTrigger(filterTrigger === key ? '' : key)}
              >
                {TRIGGER_LABEL[key]}
              </FilterPill>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--k-text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Brief Status
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <FilterPill active={filterBrief === ''} onClick={() => setFilterBrief('')}>All</FilterPill>
            {Object.keys(BRIEF_LABEL).map(key => (
              <FilterPill
                key={key}
                active={filterBrief === key}
                onClick={() => setFilterBrief(filterBrief === key ? '' : key)}
              >
                {BRIEF_LABEL[key]}
              </FilterPill>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--k-danger-bg)', color: 'var(--k-danger-text)', padding: '12px 14px', borderRadius: 'var(--k-radius-md)', fontSize: '13px', marginBottom: '14px' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--k-bg-surface)', border: '1px solid var(--k-border-default)', borderRadius: 'var(--k-radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'var(--k-font-sans)' }}>
          <thead>
            <tr style={{ background: 'var(--k-bg-page)', borderBottom: '1px solid var(--k-border-default)' }}>
              {['Employee', 'Department', 'Trigger', 'Departure Date', 'Triggered By', 'Brief Status', 'Action'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--k-text-muted)', fontSize: '13px' }}>
                  Loading departures…
                </td>
              </tr>
            )}
            {!loading && departures.map(row => {
              const trigStyle = TRIGGER_COLORS[row.trigger_source] || TRIGGER_COLORS.soft_delete
              const briefStyle = BRIEF_COLORS[row.brief_status] || BRIEF_COLORS.pending
              return (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--k-text-primary)' }}>{row.employee_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>{row.employee_role.replace(/_/g, ' ')}</div>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-text-secondary)' }}>
                    {row.employee_department_name || '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: trigStyle.color, background: trigStyle.bg, padding: '2px 8px', borderRadius: '10px' }}>
                      {TRIGGER_LABEL[row.trigger_source] || row.trigger_source}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-text-secondary)' }}>
                    {formatDate(row.created_at)}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-text-secondary)' }}>
                    {row.triggered_by_name || (row.trigger_source === 'hris_sync' ? 'HRIS Sync' : '—')}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: briefStyle.color, background: briefStyle.bg, padding: '2px 8px', borderRadius: '10px' }}>
                      {BRIEF_LABEL[row.brief_status] || row.brief_status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <button
                      onClick={() => openDetail(row)}
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: 'var(--k-radius-md)',
                        border: '1px solid var(--k-border-default)',
                        background: 'var(--k-bg-surface)',
                        color: 'var(--k-text-secondary)',
                        cursor: 'pointer',
                        fontFamily: 'var(--k-font-sans)',
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              )
            })}
            {!loading && departures.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--k-text-muted)', fontSize: '13px' }}>
                  {(filterTrigger || filterBrief)
                    ? 'No departures match your filters.'
                    : 'No departures yet. Org Memory captures employees automatically when they leave.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeDetail() }}
        >
          <div
            style={{
              background: 'var(--k-bg-surface)',
              borderRadius: 'var(--k-radius-lg)',
              padding: '28px',
              width: '640px',
              maxWidth: '92vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--k-shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-display, var(--k-font-sans))' }}>
                  {selected.employee_name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--k-text-secondary)' }}>
                  {selected.employee_role.replace(/_/g, ' ')}
                  {selected.employee_department_name ? ` · ${selected.employee_department_name}` : ''}
                  {' · '}{selected.employee_email}
                </div>
              </div>
              <button
                onClick={closeDetail}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--k-text-muted)' }}
              >
                ✕
              </button>
            </div>

            {detailLoading && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--k-text-muted)', fontSize: '13px' }}>
                Loading details…
              </div>
            )}

            {!detailLoading && selectedDetail && (
              <>
                {/* Event metadata */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', padding: '14px', background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)' }}>
                  <DetailField label="Trigger Source" value={TRIGGER_LABEL[selected.trigger_source] || selected.trigger_source} />
                  <DetailField label="Brief Status" value={BRIEF_LABEL[selected.brief_status] || selected.brief_status} />
                  <DetailField label="Departed On" value={formatDateTime(selected.created_at)} />
                  <DetailField label="Billing Year" value={String(selected.billing_year)} />
                  <DetailField label="Triggered By" value={selected.triggered_by_name || (selected.trigger_source === 'hris_sync' ? 'HRIS Sync (automated)' : '—')} />
                  {selectedDetail.triggered_by_role && (
                    <DetailField label="Triggered By Role" value={selectedDetail.triggered_by_role.replace(/_/g, ' ')} />
                  )}
                </div>

                {/* Snapshot */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Employee Snapshot (frozen at departure)
                  </div>
                  <div style={{ padding: '12px 14px', background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', fontSize: '12px', color: 'var(--k-text-secondary)', lineHeight: 1.6 }}>
                    <div><strong>Department:</strong> {selectedDetail.employee_department_name || '—'}</div>
                    <div><strong>Designation:</strong> {selectedDetail.employee_designation_name || '—'}</div>
                    <div><strong>Manager ID:</strong> {selected.employee_manager_id || '—'}</div>
                    <div><strong>Status at exit:</strong> {selectedDetail.employee_snapshot?.employment_status || '—'}</div>
                  </div>
                </div>

                {/* Audit notes */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Audit Notes
                  </div>
                  <div style={{ padding: '12px 14px', background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', fontSize: '13px', color: 'var(--k-text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {selected.notes || <span style={{ color: 'var(--k-text-muted)' }}>No notes recorded.</span>}
                  </div>
                </div>

                {/* Brief status block */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Role Intelligence Brief
                  </div>
                  {selected.brief_status === 'ready' ? (
                    <div style={{ padding: '12px 14px', background: 'var(--k-success-bg)', color: 'var(--k-success-text)', borderRadius: 'var(--k-radius-md)', fontSize: '13px' }}>
                      Brief ready. Generated {formatDateTime(selected.brief_generated_at || '')}.
                      {/* Day 4 will add "View Brief" button here */}
                    </div>
                  ) : selected.brief_status === 'pending' ? (
                    <div style={{ padding: '12px 14px', background: 'var(--k-warning-bg)', color: 'var(--k-warning-text)', borderRadius: 'var(--k-radius-md)', fontSize: '13px' }}>
                      Brief generation pending. The AI generator service will pick this up next.
                    </div>
                  ) : selected.brief_status === 'generating' ? (
                    <div style={{ padding: '12px 14px', background: 'var(--k-warning-bg)', color: 'var(--k-warning-text)', borderRadius: 'var(--k-radius-md)', fontSize: '13px' }}>
                      Brief is currently being generated…
                    </div>
                  ) : (
                    <div style={{ padding: '12px 14px', background: 'var(--k-danger-bg)', color: 'var(--k-danger-text)', borderRadius: 'var(--k-radius-md)', fontSize: '13px' }}>
                      Brief generation failed.
                      {selectedDetail.brief_generation_error && (
                        <div style={{ marginTop: '6px', fontSize: '12px' }}>{selectedDetail.brief_generation_error}</div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="k-btn k-btn-secondary"
                    onClick={closeDetail}
                    style={{ minWidth: '100px' }}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Local sub-components ─────────────────────────────────────────────

function SummaryCard({
  label, value, sublabel, warn, success,
}: { label: string; value: number; sublabel?: string; warn?: boolean; success?: boolean }) {
  const accent = success ? 'var(--k-success-text)' : warn ? 'var(--k-warning-text)' : 'var(--k-brand-primary)'
  return (
    <div style={{
      background: 'var(--k-bg-surface)',
      border: '1px solid var(--k-border-default)',
      borderLeft: `3px solid ${accent}`,
      borderRadius: 'var(--k-radius-md)',
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-display, var(--k-font-sans))', lineHeight: 1 }}>
        {value}
      </div>
      {sublabel && (
        <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginTop: '4px' }}>
          {sublabel}
        </div>
      )}
    </div>
  )
}

function FilterPill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: '11px',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '12px',
        border: `1px solid ${active ? 'var(--k-brand-primary)' : 'var(--k-border-default)'}`,
        background: active ? 'var(--k-brand-primary)' : 'var(--k-bg-surface)',
        color: active ? 'white' : 'var(--k-text-secondary)',
        cursor: 'pointer',
        fontFamily: 'var(--k-font-sans)',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--k-text-primary)' }}>
        {value}
      </div>
    </div>
  )
}
