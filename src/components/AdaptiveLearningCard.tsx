import { useState, useEffect } from 'react'
import { getMyAdaptiveAssignments } from '../api/client'

// ──────────────────────────────────────────────────────────────────────
// AdaptiveLearningCard — employee dashboard surface for assigned learning.
//
// Shows top 5 assignments prioritised by urgency (kpi_red → kpi_amber →
// pip → manager → role_path → self). Each row carries a coloured badge
// indicating the reason and, when applicable, the source KPI that drove
// the assignment.
//
// Mounts on Scorecard.tsx above the Live KPIs card.
// ──────────────────────────────────────────────────────────────────────

interface Assignment {
  enrollment_id: string
  course_id: string
  status: string
  progress_pct: number
  assigned_reason: string
  enrolled_at: string
  due_date: string | null
  course_title: string
  course_description: string | null
  course_category: string | null
  course_difficulty: string | null
  duration_hours: number
  thumbnail_emoji: string | null
  instructor: string | null
  source_kpi_name: string | null
  source_kpi_rag: string | null
  assigned_by_name: string | null
}

interface ApiResponse {
  assignments: Assignment[]
  total_count: number
  counts_by_reason: Record<string, number>
}

const REASON_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  kpi_red: {
    label: 'Urgent',
    color: 'var(--k-danger-text)',
    bg: 'var(--k-danger-bg)',
  },
  kpi_amber: {
    label: 'Attention',
    color: 'var(--k-warning-text)',
    bg: 'var(--k-warning-bg)',
  },
  pip: {
    label: 'PIP',
    color: '#9F1239',
    bg: '#FFE4E6',
  },
  manager_assigned: {
    label: 'Manager Assigned',
    color: '#6B21A8',
    bg: '#F3E8FF',
  },
  role_path: {
    label: 'Role Path',
    color: 'var(--k-brand-primary)',
    bg: 'var(--k-brand-faint)',
  },
  self: {
    label: 'Self',
    color: 'var(--k-text-muted)',
    bg: 'var(--k-bg-page)',
  },
}

const STATUS_BUTTON_LABEL: Record<string, string> = {
  enrolled: 'Start',
  in_progress: 'Resume',
  completed: 'Review',
}

export function AdaptiveLearningCard() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const result = await getMyAdaptiveAssignments()
        if (!cancelled) setData(result)
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || err.message || 'Failed to load assignments')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="k-card" style={{ marginBottom: '16px' }}>
        <div className="k-card-header">
          <div className="k-card-title">📚 Recommended for You</div>
        </div>
        <div style={{ padding: '16px', fontSize: '13px', color: 'var(--k-text-muted)' }}>
          Loading your assignments…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="k-card" style={{ marginBottom: '16px' }}>
        <div className="k-card-header">
          <div className="k-card-title">📚 Recommended for You</div>
        </div>
        <div style={{ padding: '16px', fontSize: '13px', color: 'var(--k-danger-text)' }}>
          {error}
        </div>
      </div>
    )
  }

  if (!data || data.total_count === 0) {
    return null
  }

  const top5 = data.assignments.slice(0, 5)
  const truncated = data.total_count > 5
  const urgentCount = (data.counts_by_reason.kpi_red || 0) + (data.counts_by_reason.kpi_amber || 0)

  return (
    <div className="k-card" style={{ marginBottom: '16px' }}>
      <div className="k-card-header">
        <div className="k-card-title">📚 Recommended for You</div>
        <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>
          {data.total_count} assignment{data.total_count === 1 ? '' : 's'}
          {urgentCount > 0 ? ` · ${urgentCount} need${urgentCount === 1 ? 's' : ''} attention` : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {top5.map((a, idx) => {
          const reasonCfg = REASON_CONFIG[a.assigned_reason] || REASON_CONFIG.self
          const buttonLabel = STATUS_BUTTON_LABEL[a.status] || 'Open'
          const isUrgent = a.assigned_reason === 'kpi_red' || a.assigned_reason === 'kpi_amber'

          return (
            <div
              key={a.enrollment_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                borderTop: idx === 0 ? 'none' : '1px solid var(--k-border-default)',
                borderLeft: isUrgent
                  ? `3px solid ${a.assigned_reason === 'kpi_red' ? 'var(--k-danger-text)' : 'var(--k-warning-text)'}`
                  : 'none',
                marginLeft: isUrgent ? '-3px' : '0',
              }}
            >
              <div style={{ fontSize: '24px', flexShrink: 0 }}>
                {a.thumbnail_emoji || '📖'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--k-text-primary)',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {a.course_title}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: reasonCfg.color,
                    background: reasonCfg.bg,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {reasonCfg.label}
                  </span>

                  {a.source_kpi_name && (
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--k-text-secondary)',
                    }}>
                      {a.source_kpi_name}
                    </span>
                  )}

                  {!a.source_kpi_name && a.course_category && (
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--k-text-muted)',
                    }}>
                      {a.course_category} · {a.duration_hours}h
                    </span>
                  )}
                </div>

                {a.progress_pct > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      flex: 1,
                      height: '4px',
                      background: 'var(--k-bg-page)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      maxWidth: '160px',
                    }}>
                      <div style={{
                        width: `${a.progress_pct}%`,
                        height: '100%',
                        background: 'var(--k-brand-primary)',
                        borderRadius: '2px',
                      }} />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>
                      {Math.round(Number(a.progress_pct))}%
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => window.location.href = '/my-learning'}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '6px 14px',
                  borderRadius: 'var(--k-radius-md)',
                  border: 'none',
                  background: isUrgent ? 'var(--k-brand-primary)' : 'var(--k-bg-page)',
                  color: isUrgent ? 'white' : 'var(--k-text-secondary)',
                  cursor: 'pointer',
                  fontFamily: 'var(--k-font-sans)',
                  flexShrink: 0,
                }}
              >
                {buttonLabel}
              </button>
            </div>
          )
        })}
      </div>

      {truncated && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--k-border-default)',
          textAlign: 'center',
        }}>
          <button
            onClick={() => window.location.href = '/my-learning'}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--k-brand-primary)',
              cursor: 'pointer',
              fontFamily: 'var(--k-font-sans)',
            }}
          >
            View all {data.total_count} in My Learning →
          </button>
        </div>
      )}
    </div>
  )
}
