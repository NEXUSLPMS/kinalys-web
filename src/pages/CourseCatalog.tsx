import { useState, useEffect } from 'react'
import { getLmsCourses, enrollCourse } from '../api/client'

const DIFFICULTY_CONFIG: Record<string, { color: string; bg: string }> = {
  beginner:     { color: 'var(--k-success-text)', bg: 'var(--k-success-bg)' },
  intermediate: { color: 'var(--k-warning-text)', bg: 'var(--k-warning-bg)' },
  advanced:     { color: 'var(--k-danger-text)',  bg: 'var(--k-danger-bg)' },
}

const CATEGORIES = ['All', 'Operations', 'Performance', 'Customer Service', 'Quality', 'Analytics', 'Management', 'Strategy', 'HR', 'Soft Skills']
const DIFFICULTIES = ['All', 'beginner', 'intermediate', 'advanced']

export default function CourseCatalog() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [difficulty, setDifficulty] = useState('All')

  useEffect(() => { loadCourses() }, []) // eslint-disable-line
  useEffect(() => { loadCourses() }, [search, category, difficulty]) // eslint-disable-line

  async function loadCourses() {
    try {
      const data = await getLmsCourses({
        search: search || undefined,
        category: category !== 'All' ? category : undefined,
        difficulty: difficulty !== 'All' ? difficulty : undefined,
      })
      setCourses(data.courses || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleEnroll(courseId: string, courseTitle: string) {
    setEnrolling(courseId)
    try {
      await enrollCourse(courseId)
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, enrollment_status: 'enrolled', enrollment_id: 'new' } : c))
      setSuccess(`Enrolled in "${courseTitle}" successfully`)
      setTimeout(() => setSuccess(null), 4000)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setEnrolling(null)
    }
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="k-page">

        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="k-page-title">Course Catalog</div>
            <div className="k-page-sub">{courses.length} courses available · Completing courses adds hours to your scorecard</div>
          </div>
          <button onClick={async () => { const mod = await import('../api/client'); await (mod as any).fixLmsEmojis(); window.location.reload() }} style={{ fontSize: '12px', padding: '6px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', color: 'var(--k-text-muted)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>Fix Emojis</button>
        </div>

        {error && (
          <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-danger-text)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--k-danger-text)', fontWeight: 700 }}>X</button>
          </div>
        )}

        {success && (
          <div style={{ background: 'var(--k-success-bg)', border: '1px solid var(--k-success-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-success-text)', fontWeight: 600 }}>
            {success}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search courses..."
            style={{ flex: 1, minWidth: '200px', fontSize: '13px', padding: '8px 14px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }}
          />
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d === 'All' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading courses...</div>
        ) : courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--k-text-muted)', fontSize: '14px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            No courses found. Try a different search or filter.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {courses.map(course => {
              const diff = DIFFICULTY_CONFIG[course.difficulty] || DIFFICULTY_CONFIG.beginner
              const isEnrolled = !!course.enrollment_id
              return (
                <div key={course.id} style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-lg)', border: `1px solid ${course.is_mandatory ? 'var(--k-danger-border)' : 'var(--k-border-default)'}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* Card header */}
                  <div style={{ background: 'var(--k-bg-page)', padding: '20px', textAlign: 'center', borderBottom: '1px solid var(--k-border-default)' }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>{course.thumbnail_emoji}</div>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: diff.color, background: diff.bg, padding: '2px 8px', borderRadius: '8px' }}>{course.difficulty}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--k-brand-primary)', background: 'var(--k-brand-faint)', padding: '2px 8px', borderRadius: '8px' }}>{course.category}</span>
                      {course.is_mandatory && <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--k-danger-text)', background: 'var(--k-danger-bg)', padding: '2px 8px', borderRadius: '8px' }}>Mandatory</span>}
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '6px', lineHeight: 1.3 }}>{course.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', lineHeight: 1.6, marginBottom: '12px', flex: 1 }}>{course.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--k-text-muted)', marginBottom: '12px' }}>
                      <span>{course.instructor}</span>
                      <span style={{ fontWeight: 700, color: 'var(--k-brand-primary)' }}>{course.duration_hours} hrs</span>
                    </div>

                    {isEnrolled ? (
                      <div style={{ padding: '8px', borderRadius: 'var(--k-radius-md)', background: 'var(--k-success-bg)', border: '1px solid var(--k-success-border)', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--k-success-text)' }}>
                        {course.enrollment_status === 'completed' ? 'Completed' : course.enrollment_status === 'in_progress' ? 'In Progress' : 'Enrolled'}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id, course.title)}
                        disabled={enrolling === course.id}
                        style={{ width: '100%', padding: '8px', borderRadius: 'var(--k-radius-md)', background: 'var(--k-brand-primary)', border: 'none', color: 'white', cursor: enrolling === course.id ? 'default' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--k-font-sans)' }}
                      >
                        {enrolling === course.id ? 'Enrolling...' : 'Enroll Now'}
                      </button>
                    )}
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