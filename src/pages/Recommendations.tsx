import { useState, useEffect } from 'react'
import { getMyRecommendations } from '../api/client'
import AILoadingAnimation from '../components/AILoadingAnimation'

export default function Recommendations() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const result = await getMyRecommendations()
      setData(result)
    } catch (err: any) {
      setError('Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  function ragColor(rag: string) {
    if (rag === 'red') return '#FFFFFF'
    return '#FFFFFF'
  }

  function ragBg(rag: string) {
    if (rag === 'red') return '#DC2626'
    return '#D97706'
  }

  if (loading) return (
    <div className="k-page">
      <div style={{ marginBottom: '24px' }}>
        <div className="k-page-title">AI Course Recommendations</div>
        <div className="k-page-sub">Analysing your performance data and matching courses...</div>
      </div>
      <AILoadingAnimation />
    </div>
  )

  if (error) return (
    <div className="k-page">
      <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', fontSize: '13px', color: 'var(--k-danger-text)' }}>{error}</div>
    </div>
  )

  return (
    <div className="k-page">
      <div style={{ marginBottom: '24px' }}>
        <div className="k-page-title">AI Course Recommendations</div>
        <div className="k-page-sub">
          {data?.total_at_risk > 0
            ? `${data.total_at_risk} KPI${data.total_at_risk !== 1 ? 's' : ''} need attention · Showing targeted courses to close your gaps`
            : 'Personalised learning based on your KPI performance'}
        </div>
      </div>

      {/* All green state */}
      {data?.recommendations?.length === 0 && (
        <div className="k-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--k-success-text)', marginBottom: '8px' }}>All KPIs On Track!</div>
          <div style={{ fontSize: '13px', color: 'var(--k-text-muted)', maxWidth: '400px', margin: '0 auto' }}>
            {data?.message || 'All your KPIs are green. No course recommendations needed right now. Keep up the great work!'}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data?.recommendations?.map((rec: any, idx: number) => (
        <div key={rec.kpi_id || idx} className="k-card" style={{ marginBottom: '20px', overflow: 'hidden' }}>
          {/* KPI header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--k-border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: ragBg(rec.kpi_rag) }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: ragColor(rec.kpi_rag) }}>{rec.kpi_name}</div>
              <div style={{ fontSize: '12px', color: ragColor(rec.kpi_rag), marginTop: '2px' }}>Current score: {rec.kpi_score}%</div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.25)', color: '#FFFFFF', textTransform: 'uppercase' }}>
              {rec.kpi_rag === 'red' ? 'Below Target' : 'Needs Attention'}
            </span>
          </div>

          <div style={{ padding: '16px 20px' }}>
            {/* AI gap analysis */}
            {rec.gap_analysis && (
              <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'var(--k-ai-bg)', borderRadius: 'var(--k-radius-md)', borderLeft: '3px solid var(--k-ai-text)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-ai-text)', marginBottom: '4px', letterSpacing: '1px' }}>AI ANALYSIS</div>
                <div style={{ fontSize: '13px', color: 'var(--k-text-primary)', lineHeight: 1.6 }}>{rec.gap_analysis?.replace(/\*\*[^*]+\*\*:?\s*/g, '').trim()}</div>
              </div>
            )}

            {/* Internal courses */}
            {rec.internal_courses?.length > 0 && (
              <div style={{ marginBottom: rec.marketplace_suggestion ? '16px' : '0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', marginBottom: '10px' }}>COURSES IN YOUR LMS</div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {rec.internal_courses.map((course: any) => (
                    <div key={course.id} style={{ flex: '1', minWidth: '200px', padding: '12px', background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <span style={{ fontSize: '24px', flexShrink: 0 }}>{course.thumbnail_emoji || '📚'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-primary)', marginBottom: '2px' }}>{course.title}</div>
                          <div style={{ fontSize: '13px', color: 'var(--k-text-muted)' }}>{course.category} · {course.difficulty} · {course.duration_hours}hrs</div>
                          {course.already_enrolled && (
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--k-success-text)', background: 'var(--k-success-bg)', padding: '2px 6px', borderRadius: '8px', marginTop: '4px', display: 'inline-block' }}>Already enrolled</span>
                          )}
                        </div>
                      </div>
                      {!course.already_enrolled && (
                        <button style={{ marginTop: '10px', width: '100%', padding: '7px', background: 'var(--k-brand-primary)', border: 'none', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: 'white', fontFamily: 'var(--k-font-sans)' }}>
                          Enroll Now
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Marketplace suggestion */}
            {rec.marketplace_suggestion && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px', marginBottom: '10px' }}>
                  {rec.internal_courses?.length === 0 ? `HR PROCUREMENT SUGGESTION — NOT IN YOUR LMS` : 'MARKETPLACE SUGGESTION'}
                </div>
                <div style={{ padding: '14px', background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-primary)', marginBottom: '2px' }}>{rec.marketplace_suggestion.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', marginBottom: '4px' }}>
                      {rec.internal_courses?.length === 0 ? `Available on ${rec.marketplace_suggestion.provider}` : rec.marketplace_suggestion.provider}
                    </div>
                    {rec.marketplace_suggestion.reason && (
                      <div style={{ fontSize: '12px', color: 'var(--k-text-secondary)' }}>{rec.marketplace_suggestion.reason?.replace(/\*\*[^*]+\*\*:?\s*/g, '').replace(/\[View Course\][^\n]*/gi, '').replace(/\[[^\]]*\]\([^)]*\)/g, '').replace(/https?:\/\/\S+/g, '').trim()}</div>
                    )}
                  </div>
                  <a href={rec.marketplace_suggestion.url} target="_blank" rel="noreferrer"
                    style={{ padding: '7px 16px', background: 'var(--k-bg-card)', border: '1px solid var(--k-border-default)', borderRadius: 'var(--k-radius-md)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    {rec.internal_courses?.length === 0 ? 'Suggest to HR' : 'View Course'}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}