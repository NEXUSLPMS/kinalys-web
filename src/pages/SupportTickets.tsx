import { useState, useEffect, useRef } from 'react'
import { getSupportTickets, createSupportTicket } from '../api/client'

interface Ticket {
  id: string
  ticket_number: string
  category: string
  priority: string
  subject: string
  description: string
  status: string
  submitted_by_name: string
  created_at: string
  attachment_count: number
}

const CATEGORIES = [
  { value: 'bug', label: '🐛 Bug Report' },
  { value: 'feature_request', label: '💡 Feature Request' },
  { value: 'how_to', label: '❓ How-to Question' },
  { value: 'data_issue', label: '🔢 Data Issue' },
]

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'var(--k-success-text)', bg: 'var(--k-success-bg)' },
  { value: 'medium', label: 'Medium', color: 'var(--k-warning-text)', bg: 'var(--k-warning-bg)' },
  { value: 'high', label: 'High', color: 'var(--k-danger-text)', bg: 'var(--k-danger-bg)' },
]

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  open:         { color: 'var(--k-brand-primary)', bg: 'var(--k-brand-faint)' },
  in_progress:  { color: 'var(--k-warning-text)', bg: 'var(--k-warning-bg)' },
  pending_info: { color: '#6B21A8', bg: '#F3E8FF' },
  resolved:     { color: 'var(--k-success-text)', bg: 'var(--k-success-bg)' },
  closed:       { color: 'var(--k-text-muted)', bg: 'var(--k-bg-page)' },
}

const MIN_DESC_LENGTH = 300

export default function SupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [attachment, setAttachment] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    description: '',
  })

  useEffect(() => { loadTickets() }, [])

  async function loadTickets() {
    setLoading(true)
    try {
      const data = await getSupportTickets()
      setTickets(data.tickets)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function validateForm(): string | null {
    if (!form.subject.trim()) return 'Subject is required'
    if (!form.category) return 'Category is required'
    if (!attachment) return 'A screenshot is required — please attach an image'
    if (form.description.length < MIN_DESC_LENGTH) return `Description must be at least ${MIN_DESC_LENGTH} characters (currently ${form.description.length})`
    return null
  }

  async function submitTicket() {
    const validationError = validateForm()
    if (validationError) { setError(validationError); return }

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        attachment_name: attachment!.name,
        attachment_mime: attachment!.type,
        attachment_key: `tickets/${Date.now()}_${attachment!.name}`,
      }
      const data = await createSupportTicket(payload)
      setSuccess(`✓ ${data.message}`)
      setTickets(prev => [data.ticket, ...prev])
      setShowForm(false)
      setForm({ subject: '', category: '', priority: 'medium', description: '' })
      setAttachment(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const descLength = form.description.length
  const descValid = descLength >= MIN_DESC_LENGTH

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="k-page">

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div className="k-page-title">🎫 Support Tickets</div>
            <div className="k-page-sub">Report bugs, request features, or ask how-to questions</div>
          </div>
          <button className="k-btn k-btn-primary" onClick={() => setShowForm(true)} style={{ fontSize: '13px' }}>+ Raise a Ticket</button>
        </div>

        {error && (
          <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-danger-text)', display: 'flex', justifyContent: 'space-between' }}>
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--k-danger-text)', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {success && (
          <div style={{ background: 'var(--k-success-bg)', border: '1px solid var(--k-success-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-success-text)', fontWeight: 600 }}>
            {success}
          </div>
        )}

        {/* Tickets list */}
        {loading ? (
          <div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--k-text-muted)', fontSize: '14px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎫</div>
            No tickets yet. Click "+ Raise a Ticket" if you need help.
          </div>
        ) : (
          <div className="k-card">
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Ticket', 'Subject', 'Category', 'Priority', 'Status', 'Submitted', 'Attachments'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => {
                  const statusStyle = STATUS_COLORS[ticket.status] || STATUS_COLORS.open
                  const priority = PRIORITIES.find(p => p.value === ticket.priority)
                  const category = CATEGORIES.find(c => c.value === ticket.category)
                  return (
                    <tr key={ticket.id} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--k-font-mono)', fontSize: '12px', color: 'var(--k-brand-primary)', fontWeight: 700 }}>{ticket.ticket_number}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--k-text-primary)' }}>{ticket.subject}</div>
                        <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>by {ticket.submitted_by_name}</div>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-text-secondary)' }}>{category?.label || ticket.category}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: priority?.color, background: priority?.bg, padding: '2px 8px', borderRadius: '10px' }}>
                          {priority?.label || ticket.priority}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: statusStyle.color, background: statusStyle.bg, padding: '2px 8px', borderRadius: '10px' }}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--k-text-muted)' }}>
                        {new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-text-muted)' }}>
                        {ticket.attachment_count > 0 ? `📎 ${ticket.attachment_count}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* New ticket modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-lg)', padding: '28px', width: '580px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--k-shadow-lg)' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '20px' }}>🎫 Raise a Support Ticket</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Subject *</div>
                  <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Brief summary of the issue" style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }} autoFocus />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Category *</div>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: form.category ? 'var(--k-text-primary)' : 'var(--k-text-muted)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
                      <option value="">Select category...</option>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Priority</div>
                    <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
                      {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Screenshot - mandatory */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: attachment ? 'var(--k-success-text)' : 'var(--k-danger-text)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                    Screenshot * — mandatory
                  </div>
                  <div style={{ padding: '16px', borderRadius: 'var(--k-radius-md)', border: `2px dashed ${attachment ? 'var(--k-success-border)' : 'var(--k-danger-border)'}`, background: attachment ? 'var(--k-success-bg)' : 'var(--k-danger-bg)', textAlign: 'center' }}>
                    {attachment ? (
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-success-text)', marginBottom: '4px' }}>✓ {attachment.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginBottom: '8px' }}>{(attachment.size / 1024).toFixed(0)} KB</div>
                        <button onClick={() => { setAttachment(null); if (fileRef.current) fileRef.current.value = '' }} style={{ fontSize: '11px', color: 'var(--k-danger-text)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>Remove</button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📸</div>
                        <div style={{ fontSize: '13px', color: 'var(--k-danger-text)', fontWeight: 600, marginBottom: '4px' }}>Screenshot required</div>
                        <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginBottom: '12px' }}>JPG, PNG, or GIF. Tickets cannot be submitted without a screenshot.</div>
                        <button onClick={() => fileRef.current?.click()} style={{ fontSize: '12px', padding: '6px 16px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-danger-border)', background: 'white', color: 'var(--k-danger-text)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)', fontWeight: 600 }}>Choose File</button>
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif" onChange={e => setAttachment(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                  </div>
                </div>

                {/* Description with character counter */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Description * — minimum 300 characters</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: descValid ? 'var(--k-success-text)' : descLength > 0 ? 'var(--k-warning-text)' : 'var(--k-text-muted)' }}>
                      {descLength}/{MIN_DESC_LENGTH}{descValid && ' ✓'}
                    </div>
                  </div>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Please describe the issue in detail. Include what you were doing, what you expected to happen, and what actually happened. The more detail you provide, the faster we can help. (minimum 300 characters)"
                    rows={6}
                    style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: `1px solid ${descValid ? 'var(--k-success-border)' : descLength > 0 ? 'var(--k-warning-border)' : 'var(--k-border-input)'}`, background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'vertical' }}
                  />
                  {!descValid && descLength > 0 && (
                    <div style={{ fontSize: '11px', color: 'var(--k-warning-text)', marginTop: '4px' }}>
                      {MIN_DESC_LENGTH - descLength} more characters needed
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button
                  className="k-btn k-btn-primary"
                  onClick={submitTicket}
                  disabled={submitting}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {submitting ? '⏳ Submitting...' : '🎫 Submit Ticket'}
                </button>
                <button className="k-btn k-btn-secondary" onClick={() => { setShowForm(false); setError(null) }} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
