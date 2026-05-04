import { useState, useEffect } from 'react'
import { getCourseSections, completeCourseSection } from '../api/client'

interface Section {
  id: string
  title: string
  content: string
  section_order: number
  duration_minutes: number
}

export default function CourseViewer({ courseId, courseTitle, enrollmentId, onBack, onComplete }: {
  courseId: string
  courseTitle: string
  enrollmentId: string
  onBack: () => void
  onComplete: () => void
}) {
  const [sections, setSections] = useState<Section[]>([])
  const [completedSections, setCompletedSections] = useState<string[]>([])
  const [activeSection, setActiveSection] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [courseCompleted, setCourseCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadSections() }, []) // eslint-disable-line

  async function loadSections() {
    setLoading(true)
    try {
      const data = await getCourseSections(courseId)
      setSections(data.sections || [])
      setCompletedSections(data.enrollment?.completed_sections || [])
      if (data.enrollment?.status === 'completed') setCourseCompleted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function markSectionComplete(section: Section) {
    if (completedSections.includes(section.id)) return
    setCompleting(true)
    try {
      const data = await completeCourseSection(enrollmentId, section.id)
      setCompletedSections(prev => [...prev, section.id])
      if (data.course_completed) {
        setCourseCompleted(true)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCompleting(false)
    }
  }

  const currentSection = sections[activeSection]
  const progress = sections.length > 0 ? Math.round((completedSections.length / sections.length) * 100) : 0
  const currentCompleted = currentSection ? completedSections.includes(currentSection.id) : false

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading course content...</div>
    </div>
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={onBack} style={{ fontSize: '12px', padding: '5px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
              Back
            </button>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--k-text-primary)' }}>{courseTitle}</div>
              <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>{completedSections.length} of {sections.length} sections complete</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: progress === 100 ? 'var(--k-success-text)' : 'var(--k-brand-primary)' }}>{progress}%</span>
            {courseCompleted && (
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-success-text)', background: 'var(--k-success-bg)', padding: '4px 12px', borderRadius: '10px' }}>
                Completed
              </span>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height: '6px', background: 'var(--k-border-default)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? 'var(--k-success-text)' : 'var(--k-brand-primary)', borderRadius: '3px', transition: 'width 0.4s' }} />
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--k-danger-bg)', padding: '10px 24px', fontSize: '13px', color: 'var(--k-danger-text)', flexShrink: 0 }}>
          {error}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar — section list */}
        <div style={{ width: '260px', borderRight: '1px solid var(--k-border-default)', background: 'var(--k-bg-page)', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--k-border-default)' }}>
            Course Content
          </div>
          {sections.map((section, idx) => {
            const isCompleted = completedSections.includes(section.id)
            const isActive = activeSection === idx
            return (
              <div
                key={section.id}
                onClick={() => setActiveSection(idx)}
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--k-border-default)',
                  background: isActive ? 'var(--k-brand-faint)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--k-brand-primary)' : '3px solid transparent',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                    background: isCompleted ? 'var(--k-success-text)' : isActive ? 'var(--k-brand-primary)' : 'var(--k-border-default)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, color: 'white'
                  }}>
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--k-brand-primary)' : 'var(--k-text-primary)', lineHeight: 1.3 }}>
                      {section.title}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginTop: '2px' }}>{section.duration_minutes} min</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Main content area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
          {currentSection ? (
            <>
              {/* Section header */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  Section {activeSection + 1} of {sections.length}  ·  {currentSection.duration_minutes} min read
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--k-text-primary)', marginBottom: '4px' }}>
                  {currentSection.title}
                </div>
                {currentCompleted && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-success-text)', background: 'var(--k-success-bg)', padding: '2px 10px', borderRadius: '10px' }}>
                    ✓ Completed
                  </span>
                )}
              </div>

              {/* Content */}
              <div style={{ fontSize: '14px', color: 'var(--k-text-secondary)', lineHeight: 1.85, whiteSpace: 'pre-wrap', marginBottom: '40px', maxWidth: '720px' }}>
                {currentSection.content}
              </div>

              {/* Navigation and completion */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid var(--k-border-default)', maxWidth: '720px' }}>
                {activeSection > 0 && (
                  <button onClick={() => setActiveSection(activeSection - 1)} style={{ fontSize: '13px', padding: '10px 20px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', color: 'var(--k-text-secondary)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
                    Previous
                  </button>
                )}

                {!currentCompleted && (
                  <button
                    onClick={() => markSectionComplete(currentSection)}
                    disabled={completing}
                    className="k-btn k-btn-primary"
                    style={{ fontSize: '13px', padding: '10px 24px' }}
                  >
                    {completing ? 'Saving...' : 'Mark as Complete'}
                  </button>
                )}

                {currentCompleted && activeSection < sections.length - 1 && (
                  <button onClick={() => setActiveSection(activeSection + 1)} className="k-btn k-btn-primary" style={{ fontSize: '13px', padding: '10px 24px' }}>
                    Next Section →
                  </button>
                )}

                {courseCompleted && (
                  <button onClick={onComplete} className="k-btn k-btn-primary" style={{ fontSize: '13px', padding: '10px 24px', background: 'var(--k-success-text)' }}>
                    🎓 View Certificate
                  </button>
                )}
              </div>

              {/* Course completed celebration */}
              {courseCompleted && (
                <div style={{ marginTop: '32px', background: 'var(--k-success-bg)', border: '1px solid var(--k-success-border)', borderRadius: 'var(--k-radius-lg)', padding: '24px', maxWidth: '720px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎓</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--k-success-text)', marginBottom: '6px' }}>Course Complete!</div>
                  <div style={{ fontSize: '13px', color: 'var(--k-success-text)' }}>
                    Your certificate has been issued and your Learning Hours KPI has been updated on your scorecard.
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '64px', color: 'var(--k-text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
              No sections available for this course yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}