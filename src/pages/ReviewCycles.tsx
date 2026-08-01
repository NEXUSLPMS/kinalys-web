import { useState, useEffect } from 'react'
import { getReviewCycles, createCycle, activateCycle } from '../api/client'
import DestructiveConfirmModal from '../components/DestructiveConfirmModal'
import { useToast } from '../contexts/ToastContext'

// Review Cycles management (cycle-lifecycle Stage A): list cycles, create a
// draft cycle, and activate a draft — which opens the cycle, makes it the
// tenant's single current cycle, and auto-applies the mandatory KPI templates.

interface ReviewCycle {
  id: string
  name: string
  cycle_type: string
  methodology: string
  status: 'draft' | 'active' | 'closed' | 'archived'
  is_current: boolean
  start_date: string
  end_date: string
  proposal_cutoff_day: number
  manager_approval_day: number
  hr_approval_day: number
  kpis_live_day: number
}

const CYCLE_TYPES = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'half_yearly', label: 'Half-yearly' },
  { id: 'annual', label: 'Annual' },
]

const METHODOLOGIES = [
  { id: 'copc', label: 'COPC' },
  { id: 'bsc', label: 'Balanced Scorecard' },
  { id: 'okr', label: 'OKR' },
  { id: 'six_sigma', label: 'Six Sigma' },
  { id: 'universal', label: 'Universal' },
]

const EMPTY_FORM = {
  name: '',
  cycle_type: 'quarterly',
  methodology: 'copc',
  start_date: '',
  end_date: '',
  proposal_cutoff_day: 7,
  manager_approval_day: 9,
  hr_approval_day: 12,
  kpis_live_day: 12,
}

function statusPill(status: string): { className: string; style?: React.CSSProperties } {
  if (status === 'active') return { className: 'k-pill green' }
  if (status === 'draft') return { className: 'k-pill amber' }
  // closed / archived — neutral, terminal.
  return { className: 'k-pill', style: { background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', border: '1px solid var(--k-border-default)' } }
}

const inputStyle: React.CSSProperties = {
  width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)',
  border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)',
  color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--k-text-primary)', marginBottom: '6px',
}

export default function ReviewCycles() {
  const [cycles, setCycles] = useState<ReviewCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [pendingActivate, setPendingActivate] = useState<ReviewCycle | null>(null)
  const [activating, setActivating] = useState(false)
  const toast = useToast()

  async function load() {
    try {
      const data = await getReviewCycles()
      setCycles(data.cycles || [])
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.start_date || !form.end_date) {
      toast.error('Name, start date and end date are required')
      return
    }
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      toast.error('End date must be after the start date')
      return
    }
    setSaving(true)
    try {
      await createCycle({
        name: form.name.trim(),
        cycle_type: form.cycle_type,
        methodology: form.methodology,
        start_date: form.start_date,
        end_date: form.end_date,
        proposal_cutoff_day: Number(form.proposal_cutoff_day),
        manager_approval_day: Number(form.manager_approval_day),
        hr_approval_day: Number(form.hr_approval_day),
        kpis_live_day: Number(form.kpis_live_day),
      })
      toast.success(`Draft cycle "${form.name.trim()}" created`)
      setShowForm(false)
      setForm(EMPTY_FORM)
      await load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create cycle')
    } finally {
      setSaving(false)
    }
  }

  async function confirmActivate() {
    if (!pendingActivate) return
    setActivating(true)
    try {
      const result = await activateCycle(pendingActivate.id)
      toast.success(`"${pendingActivate.name}" activated — ${result.assigned} KPIs assigned${result.skipped ? `, ${result.skipped} already existed` : ''}`)
      setPendingActivate(null)
      await load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to activate cycle')
    } finally {
      setActivating(false)
    }
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {pendingActivate && (
        <DestructiveConfirmModal
          title={`Activate "${pendingActivate.name}"?`}
          message={`Activating this cycle will: open it for scoring (draft → active), assign every mandatory KPI template to matching employees, and make it your organisation's current cycle — the previously current cycle stops being current. This cannot be undone in this release.`}
          confirmLabel="Activate cycle"
          busy={activating}
          onConfirm={confirmActivate}
          onCancel={() => { if (!activating) setPendingActivate(null) }}
        />
      )}

      <div className="k-page">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div className="k-page-title">🗓️ Review Cycles</div>
            <div className="k-page-sub">Create and activate performance review cycles. Activation opens a cycle, assigns mandatory KPIs, and makes it the current cycle.</div>
          </div>
          <button className="k-btn k-btn-primary" onClick={openCreate} style={{ fontSize: '13px' }}>+ New Cycle</button>
        </div>

        {error && (
          <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-danger-text)', display: 'flex', justifyContent: 'space-between' }}>
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--k-danger-text)', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* New cycle form */}
        {showForm && (
          <form onSubmit={submitCreate} style={{ background: 'var(--k-bg-surface)', border: '1px solid var(--k-border-default)', borderRadius: 'var(--k-radius-lg)', padding: '24px', marginBottom: '24px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '16px' }}>New Review Cycle</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Cycle name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Q4 2026" style={inputStyle} maxLength={200} />
              </div>
              <div>
                <label style={labelStyle}>Cycle type</label>
                <select value={form.cycle_type} onChange={e => setForm({ ...form, cycle_type: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {CYCLE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Methodology</label>
                <select value={form.methodology} onChange={e => setForm({ ...form, methodology: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {METHODOLOGIES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Start date</label>
                <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>End date</label>
                <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Schedule (days into the cycle)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {([
                ['proposal_cutoff_day', 'Proposal cutoff'],
                ['manager_approval_day', 'Manager approval'],
                ['hr_approval_day', 'HR approval'],
                ['kpis_live_day', 'KPIs live'],
              ] as [keyof typeof EMPTY_FORM, string][]).map(([key, lbl]) => (
                <div key={key}>
                  <label style={labelStyle}>{lbl}</label>
                  <input type="number" min={1} max={366} value={form[key] as number} onChange={e => setForm({ ...form, [key]: e.target.value === '' ? '' : Number(e.target.value) })} style={inputStyle} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="k-btn k-btn-ghost" onClick={() => setShowForm(false)} disabled={saving} style={{ fontSize: '13px' }}>Cancel</button>
              <button type="submit" className="k-btn k-btn-primary" disabled={saving} style={{ fontSize: '13px' }}>{saving ? 'Creating…' : 'Create draft cycle'}</button>
            </div>
          </form>
        )}

        {/* Cycle list */}
        {loading ? (
          <div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading review cycles…</div>
        ) : cycles.length === 0 ? (
          <div style={{ padding: '32px', borderRadius: 'var(--k-radius-md)', background: 'var(--k-bg-page)', border: '1px solid var(--k-border-default)', fontSize: '13px', color: 'var(--k-text-muted)', textAlign: 'center' }}>
            No review cycles yet. Create your first cycle to get started.
          </div>
        ) : (
          <div style={{ background: 'var(--k-bg-surface)', border: '1px solid var(--k-border-default)', borderRadius: 'var(--k-radius-lg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Cycle', 'Type', 'Methodology', 'Window', 'Status', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 16px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cycles.map(c => {
                  const pill = statusPill(c.status)
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--k-text-primary)' }}>{c.name}</div>
                        {c.is_current && <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-brand-primary)' }}>● Current cycle</span>}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--k-text-muted)', textTransform: 'capitalize' }}>{c.cycle_type.replace('_', '-')}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--k-text-muted)', textTransform: 'uppercase' }}>{c.methodology}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--k-text-muted)' }}>{fmtDate(c.start_date)} → {fmtDate(c.end_date)}</td>
                      <td style={{ padding: '12px 16px' }}><span className={pill.className} style={pill.style}>{c.status}</span></td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {c.status === 'draft' && (
                          <button className="k-btn k-btn-primary" onClick={() => setPendingActivate(c)} style={{ fontSize: '12px', padding: '6px 14px' }}>Activate</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}
