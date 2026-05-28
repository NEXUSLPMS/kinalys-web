import { useState, useEffect } from 'react'
import { getBrief } from '../api/client'

// ──────────────────────────────────────────────────────────────────────
// BriefViewerModal — read-only Role Intelligence Brief display
//
// Fetches GET /briefs/:departureId and renders the AI narrative:
// executive summary, knowledge areas, key relationships, open threads,
// recommended onboarding focus, plus a generation metadata footer.
//
// Audience framing: this is a handover document for the successor's manager.
// ──────────────────────────────────────────────────────────────────────

interface Props {
  departureId: string
  employeeName: string
  onClose: () => void
}

function formatDateTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function BriefViewerModal({ departureId, employeeName, onClose }: Props) {
  const [brief, setBrief] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getBrief(departureId)
        if (!cancelled) setBrief(data.brief)
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || err.message || 'Failed to load brief.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [departureId])

  // Parse JSONB fields — they arrive as arrays/objects already from PG, but guard anyway
  const knowledgeAreas: Array<{ area: string; detail: string }> =
    Array.isArray(brief?.knowledge_areas) ? brief.knowledge_areas : []
  const keyRelationships: Array<{ name_or_role: string; nature: string }> =
    Array.isArray(brief?.key_relationships) ? brief.key_relationships : []

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'var(--k-bg-surface)',
          borderRadius: 'var(--k-radius-lg)',
          padding: '32px',
          width: '760px',
          maxWidth: '94vw',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: 'var(--k-shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-brand-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Role Intelligence Brief
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-display, var(--k-font-sans))' }}>
              {employeeName}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--k-text-muted)' }}
          >
            ✕
          </button>
        </div>

        {loading && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--k-text-muted)', fontSize: '14px' }}>
            Loading brief…
          </div>
        )}

        {error && !loading && (
          <div style={{ background: 'var(--k-danger-bg)', color: 'var(--k-danger-text)', padding: '14px', borderRadius: 'var(--k-radius-md)', fontSize: '13px', marginTop: '16px' }}>
            {error}
          </div>
        )}

        {!loading && !error && brief && (
          <>
            {/* Sub-header meta */}
            <div style={{ fontSize: '12px', color: 'var(--k-text-secondary)', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--k-border-default)' }}>
              {brief.designation_name || brief.employee_snapshot?.role?.replace(/_/g, ' ') || ''}
              {brief.department_name ? ` · ${brief.department_name}` : ''}
              {brief.departed_at ? ` · Departed ${formatDateTime(brief.departed_at)}` : ''}
            </div>

            {/* Executive Summary */}
            <Section title="Executive Summary">
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--k-text-primary)', margin: 0 }}>
                {brief.executive_summary || 'No summary generated.'}
              </p>
            </Section>

            {/* Knowledge Areas */}
            {knowledgeAreas.length > 0 && (
              <Section title="Knowledge Areas">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {knowledgeAreas.map((k, i) => (
                    <div key={i} style={{ padding: '14px 16px', background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', borderLeft: '3px solid var(--k-brand-primary)' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '4px' }}>
                        {k.area}
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--k-text-secondary)' }}>
                        {k.detail}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Key Relationships */}
            {keyRelationships.length > 0 && (
              <Section title="Key Relationships">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {keyRelationships.map((r, i) => (
                    <div key={i} style={{ padding: '14px 16px', background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', borderLeft: '3px solid var(--k-ai-text, var(--k-brand-primary))' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '4px' }}>
                        {r.name_or_role}
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--k-text-secondary)' }}>
                        {r.nature}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Open Threads */}
            {brief.open_threads && (
              <Section title="Open Threads">
                <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--k-text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {brief.open_threads}
                </p>
              </Section>
            )}

            {/* Onboarding Focus */}
            {brief.recommended_onboarding_focus && (
              <Section title="Recommended Onboarding Focus">
                <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--k-text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {brief.recommended_onboarding_focus}
                </p>
              </Section>
            )}

            {/* Footer / provenance */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--k-border-default)', fontSize: '11px', color: 'var(--k-text-muted)', lineHeight: 1.6 }}>
              Generated by {brief.ai_model || 'AI'} from Kinalys performance data
              {brief.generated_at ? ` on ${formatDateTime(brief.generated_at)}` : ''}
              {brief.generation_duration_ms ? ` · ${(brief.generation_duration_ms / 1000).toFixed(1)}s` : ''}
              {brief.tokens_input && brief.tokens_output ? ` · ${brief.tokens_input + brief.tokens_output} tokens` : ''}
              .
              <br />
              This is an AI-generated synthesis intended to accelerate handover. Review and verify before acting on it.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="k-btn k-btn-secondary" onClick={onClose} style={{ minWidth: '100px' }}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
        {title}
      </div>
      {children}
    </div>
  )
}
