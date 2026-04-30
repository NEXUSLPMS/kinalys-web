import { useState, useEffect } from 'react'
import { getMyLearning, getLmsStats, updateCourseProgress } from '../api/client'

const DIFFICULTY_CONFIG: Record<string, { color: string; bg: string }> = {
  beginner:     { color: 'var(--k-success-text)', bg: 'var(--k-success-bg)' },
  intermediate: { color: 'var(--k-warning-text)', bg: 'var(--k-warning-bg)' },
  advanced:     { color: 'var(--k-danger-text)',  bg: 'var(--k-danger-bg)' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  enrolled:    { label: 'Not Started', color: 'var(--k-text-muted)',    bg: 'var(--k-bg-page)' },
  in_progress: { label: 'In Progress', color: 'var(--k-warning-text)', bg: 'var(--k-warning-bg)' },
  completed:   { label: 'Completed',   color: 'var(--k-success-text)', bg: 'var(--k-success-bg)' },
}

export default function MyLearning() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed' | 'enrolled'>('all')

  useEffect(() => { loadData() }, []) // eslint-disable-line

  async function loadData() {
    setLoading(true)
    try {
      const [learningData, statsData] = await Promise.allSettled([getMyLearning(), getLmsStats()])
      if (learningData.status === 'fulfilled') setEnrollments(learningData.value.enrollments || [])
      if (statsData.status === 'fulfilled') setStats(statsData.value)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function markProgress(enrollmentId: string, progress: number) {
    setUpdating(enrollmentId)
    try {
      const data = await updateCourseProgress(enrollmentId, progress)
      setEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, progress_pct: progress, status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'enrolled', completed_at: progress === 100 ? new Date().toISOString() : null } : e))
      if (progress === 100) {
        await loadData()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdating(null)
    }
  }

  const filtered = enrollments.filter(e => filter === 'all' || e.status === filter)

  if (loading) return <div className="k-page"><div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading your learning...</div></div>

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="k-page">

        <div style={{ marginBottom: '24px' }}>
          <div className="k-page-title">My Learning</div>
          <div className="k-page-sub">Your enrolled courses, progress, and learning hours</div>
        </div>

        {error && (
          <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-danger-text)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--k-danger-text)', fontWeight: 700 }}>X</button>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <>
            <div className="k-stat-grid k-stat-grid-4" style={{ marginBottom: '20px' }}>
              <div className="k-stat-card accent">
                <div className="k-stat-label">Learning Hours</div>
                <div className="k-stat-value">{stats.completed_hours}</div>
                <div className="k-stat-trend">of {stats.learning_hours_target} hr target</div>
              </div>
              <div className="k-stat-card green">
                <div className="k-stat-label">Completed</div>
                <div className="k-stat-value">{stats.completed_courses}</div>
                <div className="k-stat-trend">Courses finished</div>
              </div>
              <div className="k-stat-card amber">
                <div className="k-stat-label">In Progress</div>
                <div className="k-stat-value">{stats.in_progress_courses}</div>
                <div className="k-stat-trend">Currently active</div>
              </div>
              <div className="k-stat-card purple">
                <div className="k-stat-label">Certifications</div>
                <div className="k-stat-value">{stats.certifications}</div>
                <div className="k-stat-trend">Earned</div>
              </div>
            </div>

            {/* Learning hours progress bar */}
            <div style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-lg)', border: '1px solid var(--k-border-default)', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-text-primary)' }}>Annual Learning Target</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: stats.progress_pct >= 100 ? 'var(--k-success-text)' : 'var(--k-brand-primary)' }}>
                  {stats.completed_hours} / {stats.learning_hours_target} hrs ({Math.round(stats.progress_pct)}%)
                </div>
              </div>
              <div style={{ height: '12px', background: 'var(--k-border-default)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, stats.progress_pct)}%`, background: stats.progress_pct >= 100 ? 'var(--k-success-text)' : 'var(--k-brand-primary)', borderRadius: '6px', transition: 'width 0.5s' }}/>
              </div>
              {stats.progress_pct >= 100 && (
                <div style={{ fontSize: '12px', color: 'var(--k-success-text)', fontWeight: 600, marginTop: '8px' }}>
                  Target achieved! Learning bonus active on your scorecard.
                </div>
              )}
              {stats.progress_pct < 100 && (
                <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', marginTop: '8px' }}>
                  {(stats.learning_hours_target - stats.completed_hours).toFixed(1)} hours remaining to hit your target · Complete courses to boost your Performance score
                </div>
              )}
            </div>
          </>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--k-bg-page)', padding: '4px', borderRadius: 'var(--k-radius-md)', width: 'fit-content' }}>
          {([['all', 'All'], ['in_progress', 'In Progress'], ['enrolled', 'Not Started'], ['completed', 'Completed']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{ padding: '6px 16px', borderRadius: 'var(--k-radius-md)', border: 'none', background: filter === val ? 'var(--k-bg-surface)' : 'transparent', color: filter === val ? 'var(--k-text-primary)' : 'var(--k-text-muted)', fontFamily: 'var(--k-font-sans)', fontSize: '13px', fontWeight: filter === val ? 600 : 400, cursor: 'pointer', boxShadow: filter === val ? 'var(--k-shadow-sm)' : 'none' }}>
              {label} {val !== 'all' && `(${enrollments.filter(e => e.status === val).length})`}
            </button>
          ))}
        </div>

        {/* Course list */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--k-text-muted)', fontSize: '14px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            {filter === 'all' ? 'No courses enrolled yet. Go to Course Catalog to enroll.' : `No ${filter.replace('_', ' ')} courses.`}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(enrollment => {
              const status = STATUS_CONFIG[enrollment.status] || STATUS_CONFIG.enrolled
              const difficulty = DIFFICULTY_CONFIG[enrollment.difficulty] || DIFFICULTY_CONFIG.beginner
              const progress = Number(enrollment.progress_pct)
              return (
                <div key={enrollment.id} style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-lg)', border: '1px solid var(--k-border-default)', padding: '20px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '32px', flexShrink: 0 }}>{enrollment.thumbnail_emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '3px' }}>
                            {enrollment.title}
                            {enrollment.is_mandatory && <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--k-danger-text)', background: 'var(--k-danger-bg)', padding: '1px 6px', borderRadius: '6px', marginLeft: '8px' }}>Mandatory</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>
                            {enrollment.instructor} · {enrollment.duration_hours} hrs · {enrollment.category}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: difficulty.color, background: difficulty.bg, padding: '2px 8px', borderRadius: '8px' }}>{enrollment.difficulty}</span>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: status.color, background: status.bg, padding: '2px 8px', borderRadius: '8px' }}>{status.label}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ height: '6px', background: 'var(--k-border-default)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: enrollment.status === 'completed' ? 'var(--k-success-text)' : 'var(--k-brand-primary)', borderRadius: '3px', transition: 'width 0.3s' }}/>
                      </div>

                      {/* Actions */}
                      {enrollment.status !== 'completed' ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{Math.round(progress)}% complete</span>
                          <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                            {[25, 50, 75, 100].map(pct => (
                              <button
                                key={pct}
                                onClick={() => markProgress(enrollment.id, pct)}
                                disabled={updating === enrollment.id || progress >= pct}
                                style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--k-radius-md)', border: `1px solid ${progress >= pct ? 'var(--k-success-border)' : 'var(--k-border-default)'}`, background: progress >= pct ? 'var(--k-success-bg)' : 'var(--k-bg-page)', color: progress >= pct ? 'var(--k-success-text)' : 'var(--k-text-muted)', cursor: progress >= pct ? 'default' : 'pointer', fontFamily: 'var(--k-font-sans)', fontWeight: 600 }}
                              >
                                {pct === 100 ? '✓ Complete' : `${pct}%`}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: 'var(--k-success-text)', fontWeight: 600 }}>
                            Completed {enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--k-success-text)', fontWeight: 700 }}>
                            +{enrollment.duration_hours} hrs added to your scorecard
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}