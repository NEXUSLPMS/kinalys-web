import { useState, useEffect } from 'react'
import { getLmsCertifications, getLmsStats } from '../api/client'

export default function Certifications() {
  const [certifications, setCertifications] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadData() }, []) // eslint-disable-line

  async function loadData() {
    try {
      const [certData, statsData] = await Promise.allSettled([getLmsCertifications(), getLmsStats()])
      if (certData.status === 'fulfilled') setCertifications(certData.value.certifications || [])
      if (statsData.status === 'fulfilled') setStats(statsData.value)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="k-page"><div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading certifications...</div></div>

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="k-page">

        <div style={{ marginBottom: '24px' }}>
          <div className="k-page-title">Certifications</div>
          <div className="k-page-sub">Certificates earned by completing courses</div>
        </div>

        {error && (
          <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-danger-text)' }}>
            {error}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="k-stat-grid k-stat-grid-4" style={{ marginBottom: '24px' }}>
            <div className="k-stat-card accent">
              <div className="k-stat-label">Total Certifications</div>
              <div className="k-stat-value">{stats.certifications}</div>
              <div className="k-stat-trend">Earned</div>
            </div>
            <div className="k-stat-card green">
              <div className="k-stat-label">Completed Courses</div>
              <div className="k-stat-value">{stats.completed_courses}</div>
              <div className="k-stat-trend">All time</div>
            </div>
            <div className="k-stat-card purple">
              <div className="k-stat-label">Learning Hours</div>
              <div className="k-stat-value">{stats.completed_hours}</div>
              <div className="k-stat-trend">Completed</div>
            </div>
            <div className="k-stat-card amber">
              <div className="k-stat-label">Target Progress</div>
              <div className="k-stat-value">{Math.round(stats.progress_pct)}%</div>
              <div className="k-stat-trend">of annual target</div>
            </div>
          </div>
        )}

        {certifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--k-text-muted)', fontSize: '14px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '8px' }}>No certifications yet</div>
            Complete courses in My Learning to earn certificates.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {certifications.map(cert => (
              <div key={cert.id} style={{ background: 'linear-gradient(135deg, var(--k-bg-surface), var(--k-brand-faint))', borderRadius: 'var(--k-radius-lg)', border: '1px solid var(--k-brand-primary)', padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: 'var(--k-brand-primary)', opacity: 0.06, borderRadius: '0 0 0 80px' }}/>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>{cert.thumbnail_emoji}</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--k-text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>{cert.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginBottom: '16px' }}>{cert.category} · {cert.duration_hours} hrs</div>
                <div style={{ background: 'var(--k-brand-primary)', color: 'white', borderRadius: 'var(--k-radius-md)', padding: '10px 16px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.8, marginBottom: '4px' }}>Certificate of Completion</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace' }}>{cert.certificate_number}</div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>
                  Issued {new Date(cert.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}