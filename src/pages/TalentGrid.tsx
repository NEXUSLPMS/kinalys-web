import { useState, useEffect } from 'react'
import { getTalentAssessments, setTalentPotential, seedDemoScorecards } from '../api/client'

interface Employee {
  id: string
  full_name: string
  email: string
  employment_status: string
  department_name: string
  designation_name: string
  overall_score: number | null
  final_score: number | null
  potential_rating: 'low' | 'medium' | 'high' | null
  potential_source: string | null
  potential_notes: string | null
  assessment_id: string | null
  box_position: string | null
  performance_band: 'low' | 'medium' | 'high' | null
  recommended_action: string | null
}

const BOX_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  top_talent:      { label: 'Top Talent',      color: '#1A7A4A', bg: '#D6F0E4', border: '#1A7A4A' },
  rising_star:     { label: 'Rising Star',     color: '#0F6E56', bg: '#E1F5EE', border: '#0F6E56' },
  high_performer:  { label: 'High Performer',  color: '#0F6E56', bg: '#E1F5EE', border: '#0F6E56' },
  potential_gem:   { label: 'Potential Gem',   color: '#B45309', bg: '#FEF3C7', border: '#B45309' },
  key_player:      { label: 'Key Player',      color: '#444441', bg: '#F4F6F9', border: '#D0D5DD' },
  core_player:     { label: 'Core Player',     color: '#888780', bg: '#F4F6F9', border: '#D0D5DD' },
  consistent_star: { label: 'Consistent Star', color: '#1D4ED8', bg: '#EFF6FF', border: '#1D4ED8' },
  question_mark:   { label: 'Question Mark',   color: '#B91C1C', bg: '#FEE2E2', border: '#B91C1C' },
  underperformer:  { label: 'Underperformer',  color: '#B91C1C', bg: '#FEE2E2', border: '#B91C1C' },
}

const GRID_LAYOUT = [
  ['low', 'high'],    ['medium', 'high'],   ['high', 'high'],
  ['low', 'medium'],  ['medium', 'medium'], ['high', 'medium'],
  ['low', 'low'],     ['medium', 'low'],    ['high', 'low'],
]

function getBoxFromBands(perf: string, pot: string): string {
  const matrix: Record<string, Record<string, string>> = {
    high:   { low: 'consistent_star', medium: 'high_performer',  high: 'top_talent' },
    medium: { low: 'core_player',     medium: 'key_player',      high: 'rising_star' },
    low:    { low: 'underperformer',  medium: 'question_mark',   high: 'potential_gem' },
  }
  return matrix[perf]?.[pot] || 'key_player'
}

// ── Suggested potential based on score ───────────────────────
function getSuggestedPotential(score: number | null): 'low' | 'medium' | 'high' | null {
  if (score === null) return null
  if (score >= 90) return 'high'
  if (score >= 80) return 'medium'
  return null // below 80 = Need Improvement, not eligible
}

function isEligibleForGrid(score: number | null): boolean {
  return score !== null && score >= 80
}

export default function TalentGrid() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [savingPotential, setSavingPotential] = useState(false)
  const [potentialForm, setPotentialForm] = useState<{
    rating: 'low' | 'medium' | 'high'
    notes: string
  }>({ rating: 'medium', notes: '' })
  const [notesRequired, setNotesRequired] = useState(false)

  useEffect(() => { loadAssessments() }, [])

  async function loadAssessments() {
    setLoading(true)
    try {
      const data = await getTalentAssessments()
      setEmployees(data.employees)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function seedDemo() {
    setSeeding(true)
    try {
      await seedDemoScorecards()
      await loadAssessments()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSeeding(false)
    }
  }

  function openAssessModal(emp: Employee) {
    const suggested = getSuggestedPotential(emp.final_score)
    setSelectedEmployee(emp)
    setPotentialForm({
      rating: emp.potential_rating || suggested || 'medium',
      notes: emp.potential_notes || '',
    })
    setNotesRequired(false)
  }

  function handleRatingChange(rating: 'low' | 'medium' | 'high') {
    const suggested = getSuggestedPotential(selectedEmployee?.final_score ?? null)
    setPotentialForm(prev => ({ ...prev, rating }))
    setNotesRequired(suggested !== null && rating !== suggested)
  }

  async function savePotential() {
    if (!selectedEmployee) return
    const suggested = getSuggestedPotential(selectedEmployee.final_score)
    const isOverride = suggested !== null && potentialForm.rating !== suggested
    if (isOverride && !potentialForm.notes.trim()) {
      setNotesRequired(true)
      return
    }
    setSavingPotential(true)
    try {
      const result = await setTalentPotential(selectedEmployee.id, {
        potential_rating: potentialForm.rating,
        potential_source: isOverride ? 'hr_assessment' : 'hr_assessment',
        potential_notes: potentialForm.notes || null,
      })
      setEmployees(prev => prev.map(e => e.id === selectedEmployee.id ? {
        ...e,
        potential_rating: potentialForm.rating,
        potential_notes: potentialForm.notes,
        box_position: result.box_position,
        performance_band: result.performance_band,
        recommended_action: result.recommended_action,
      } : e))
      setSelectedEmployee(null)
      setNotesRequired(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingPotential(false)
    }
  }

  function getBoxEmployees(perfBand: string, potBand: string): Employee[] {
    return employees.filter(e => {
      if (!e.potential_rating || !isEligibleForGrid(e.final_score)) return false
      const perf = e.performance_band ||
        (e.final_score !== null ? (e.final_score >= 90 ? 'high' : e.final_score >= 80 ? 'medium' : 'low') : null)
      return perf === perfBand && e.potential_rating === potBand
    })
  }

  const eligibleEmployees = employees.filter(e => isEligibleForGrid(e.final_score))
  const needsImprovement = employees.filter(e => e.final_score !== null && e.final_score < 80)
  const noScore = employees.filter(e => e.final_score === null)
  const assessed = eligibleEmployees.filter(e => e.potential_rating !== null).length
  const hasScores = employees.some(e => e.final_score !== null)

  if (loading) return (
    <div className="k-page">
      <div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading Talent Grid...</div>
    </div>
  )

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="k-page">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div className="k-page-title">🎯 9-Box Talent Grid</div>
            <div className="k-page-sub">Score ≥ 80% eligible · Performance axis = scorecard · Potential axis = HR assessment · Employees never see box position</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={`k-btn ${view === 'grid' ? 'k-btn-primary' : 'k-btn-secondary'}`} onClick={() => setView('grid')} style={{ fontSize: '12px' }}>⊞ Grid</button>
            <button className={`k-btn ${view === 'list' ? 'k-btn-primary' : 'k-btn-secondary'}`} onClick={() => setView('list')} style={{ fontSize: '12px' }}>≡ List</button>
            {!hasScores && (
              <button className="k-btn k-btn-secondary" onClick={seedDemo} disabled={seeding} style={{ fontSize: '12px' }}>
                {seeding ? '⏳ Seeding...' : '🌱 Seed Demo Scores'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-danger-text)', display: 'flex', justifyContent: 'space-between' }}>
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--k-danger-text)', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* Summary */}
        <div className="k-stat-grid k-stat-grid-4" style={{ marginBottom: '24px' }}>
          <div className="k-stat-card accent">
            <div className="k-stat-label">Eligible for Grid</div>
            <div className="k-stat-value">{eligibleEmployees.length}</div>
            <div className="k-stat-trend">Score ≥ 80%</div>
          </div>
          <div className="k-stat-card green">
            <div className="k-stat-label">Assessed</div>
            <div className="k-stat-value">{assessed}</div>
            <div className="k-stat-trend">Potential rated</div>
          </div>
          <div className="k-stat-card red" style={{ '--k-stat-color': 'var(--k-danger-text)' } as any}>
            <div className="k-stat-label">Need Improvement</div>
            <div className="k-stat-value">{needsImprovement.length}</div>
            <div className="k-stat-trend">Score &lt; 80%</div>
          </div>
          <div className="k-stat-card purple">
            <div className="k-stat-label">Top Talent</div>
            <div className="k-stat-value">{employees.filter(e => e.box_position === 'top_talent').length}</div>
            <div className="k-stat-trend">High perf + High pot</div>
          </div>
        </div>

        {/* ── GRID VIEW ─────────────────────────────────── */}
        {view === 'grid' && (
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '24px' }}/>
              {['Low Performance', 'Medium Performance', 'High Performance'].map(label => (
                <div key={label} style={{ flex: 1, textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '24px' }}>
                {['High Potential', 'Med Potential', 'Low Potential'].map(label => (
                  <div key={label} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '10px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, minmax(120px, auto))', gap: '8px' }}>
                {GRID_LAYOUT.map(([perf, pot], idx) => {
                  const boxKey = getBoxFromBands(perf, pot)
                  const config = BOX_CONFIG[boxKey]
                  const boxEmps = getBoxEmployees(perf, pot)
                  return (
                    <div key={idx} style={{ background: config.bg, border: `1px solid ${config.border}`, borderRadius: 'var(--k-radius-md)', padding: '10px 12px', minHeight: '120px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: config.color, marginBottom: '8px' }}>{config.label}</div>
                      {boxEmps.length === 0 ? (
                        <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', fontStyle: 'italic' }}>No employees</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {boxEmps.map(emp => (
                            <div key={emp.id} style={{ fontSize: '11px', fontWeight: 500, color: config.color, background: 'rgba(255,255,255,0.6)', padding: '2px 6px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{emp.full_name}</span>
                              {emp.final_score && <span style={{ fontSize: '10px', opacity: 0.7 }}>{emp.final_score}%</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Need Improvement section */}
            {needsImprovement.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-danger-text)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚠ Need Improvement — Score below 80%
                  <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--k-text-muted)' }}>These employees are not eligible for 9-Box placement until they reach 80%</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {needsImprovement.map(emp => (
                    <div key={emp.id} style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 14px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-primary)', marginBottom: '4px' }}>{emp.full_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginBottom: '8px' }}>{emp.department_name} · {emp.designation_name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--k-danger-text)' }}>{emp.final_score}%</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--k-danger-text)', background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', padding: '2px 8px', borderRadius: '10px' }}>
                          NEEDS IMPROVEMENT
                        </span>
                      </div>
                      <div style={{ marginTop: '8px', height: '4px', background: 'var(--k-border-default)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${emp.final_score}%`, background: 'var(--k-danger-solid)', borderRadius: '2px' }}/>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginTop: '4px' }}>
                        Needs {emp.final_score !== null ? (80 - emp.final_score).toFixed(0) : '—'}% more to be eligible
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── LIST VIEW ─────────────────────────────────── */}
        {view === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Eligible employees */}
            <div className="k-card">
              <div className="k-card-header">
                <div className="k-card-title">✅ Eligible for 9-Box — Score ≥ 80%</div>
                <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{assessed} of {eligibleEmployees.length} assessed</span>
              </div>
              {eligibleEmployees.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--k-text-muted)', padding: '16px 0' }}>No employees with score ≥ 80% this cycle.</div>
              ) : (
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Employee', 'Department', 'Score', 'Suggested', 'Potential', 'Box', 'Action'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {eligibleEmployees.map(emp => {
                      const config = emp.box_position ? BOX_CONFIG[emp.box_position] : null
                      const suggested = getSuggestedPotential(emp.final_score)
                      const isOverride = emp.potential_rating && suggested && emp.potential_rating !== suggested
                      return (
                        <tr key={emp.id} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--k-text-primary)' }}>{emp.full_name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>{emp.designation_name || '—'}</div>
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--k-text-muted)', fontSize: '12px' }}>{emp.department_name || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontWeight: 700, color: emp.final_score! >= 90 ? 'var(--k-success-text)' : 'var(--k-warning-text)' }}>
                              {emp.final_score}%
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: suggested === 'high' ? 'var(--k-success-text)' : 'var(--k-warning-text)', background: suggested === 'high' ? 'var(--k-success-bg)' : 'var(--k-warning-bg)', padding: '2px 8px', borderRadius: '10px' }}>
                              {suggested ? suggested.toUpperCase() : '—'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {emp.potential_rating ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: emp.potential_rating === 'high' ? 'var(--k-success-text)' : emp.potential_rating === 'medium' ? 'var(--k-warning-text)' : 'var(--k-danger-text)' }}>
                                  {emp.potential_rating}
                                </span>
                                {isOverride && <span style={{ fontSize: '9px', color: 'var(--k-warning-text)', fontWeight: 700 }}>OVERRIDE</span>}
                              </div>
                            ) : <span style={{ color: 'var(--k-text-muted)', fontSize: '11px' }}>Not assessed</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {config ? (
                              <span style={{ fontSize: '11px', fontWeight: 700, color: config.color, background: config.bg, padding: '2px 8px', borderRadius: '10px' }}>
                                {config.label}
                              </span>
                            ) : <span style={{ color: 'var(--k-text-muted)', fontSize: '11px' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <button
                              onClick={() => openAssessModal(emp)}
                              style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', color: 'var(--k-text-secondary)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}
                            >
                              {emp.potential_rating ? 'Edit' : 'Assess'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Need improvement */}
            {needsImprovement.length > 0 && (
              <div className="k-card">
                <div className="k-card-header">
                  <div className="k-card-title" style={{ color: 'var(--k-danger-text)' }}>⚠ Need Improvement — Score below 80%</div>
                  <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{needsImprovement.length} employees</span>
                </div>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Employee', 'Department', 'Score', 'Gap to 80%', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {needsImprovement.map(emp => (
                      <tr key={emp.id} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--k-text-primary)' }}>{emp.full_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>{emp.designation_name || '—'}</div>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--k-text-muted)', fontSize: '12px' }}>{emp.department_name || '—'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--k-danger-text)' }}>{emp.final_score}%</span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--k-warning-text)', fontWeight: 600, fontSize: '12px' }}>
                          +{emp.final_score !== null ? (80 - emp.final_score).toFixed(0) : '—'}% needed
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-danger-text)', background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', padding: '2px 8px', borderRadius: '10px' }}>
                            NOT ELIGIBLE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* No score */}
            {noScore.length > 0 && (
              <div className="k-card">
                <div className="k-card-header">
                  <div className="k-card-title" style={{ color: 'var(--k-text-muted)' }}>⏳ No Scorecard — {noScore.length} employees</div>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--k-text-muted)', lineHeight: 1.7 }}>
                  {noScore.map(e => e.full_name).join(', ')} — complete their scorecards to include them in the talent assessment.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ASSESSMENT MODAL ──────────────────────────── */}
        {selectedEmployee && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-lg)', padding: '28px', width: '500px', maxWidth: '90vw', boxShadow: 'var(--k-shadow-lg)' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '4px' }}>
                Assess Potential — {selectedEmployee.full_name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', marginBottom: '20px' }}>
                {selectedEmployee.department_name} · {selectedEmployee.designation_name}
                {selectedEmployee.final_score !== null && ` · Score: ${selectedEmployee.final_score}%`}
              </div>

              {/* System suggestion */}
              {getSuggestedPotential(selectedEmployee.final_score) && (
                <div style={{ background: 'var(--k-success-bg)', border: '1px solid var(--k-success-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 14px', marginBottom: '16px', fontSize: '12px', color: 'var(--k-success-text)', lineHeight: 1.6 }}>
                  💡 <strong>System suggestion:</strong> Based on a score of {selectedEmployee.final_score}%,
                  Kinalys suggests <strong>{getSuggestedPotential(selectedEmployee.final_score)?.toUpperCase()}</strong> potential.
                  You can accept this or override it — overrides require a written justification.
                </div>
              )}

              <div style={{ background: 'var(--k-ai-bg)', border: '1px solid var(--k-ai-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 14px', marginBottom: '20px', fontSize: '12px', color: 'var(--k-ai-text)', lineHeight: 1.6 }}>
                🔒 The employee will NOT see their box position. They will only see recommended development actions.
              </div>

              {/* Potential rating selector */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Potential Rating</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(['low', 'medium', 'high'] as const).map(rating => {
                    const suggested = getSuggestedPotential(selectedEmployee.final_score)
                    const isSuggested = rating === suggested
                    const isSelected = potentialForm.rating === rating
                    return (
                      <div
                        key={rating}
                        onClick={() => handleRatingChange(rating)}
                        style={{
                          flex: 1, padding: '14px', borderRadius: 'var(--k-radius-md)', textAlign: 'center', cursor: 'pointer',
                          border: `2px solid ${isSelected ? 'var(--k-brand-primary)' : 'var(--k-border-default)'}`,
                          background: isSelected ? 'var(--k-brand-faint)' : 'var(--k-bg-page)',
                          transition: 'all var(--k-transition)',
                          position: 'relative',
                        }}
                      >
                        {isSuggested && (
                          <div style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: 700, background: 'var(--k-success-solid)', color: 'white', padding: '1px 6px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                            SUGGESTED
                          </div>
                        )}
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                          {rating === 'low' ? '📉' : rating === 'medium' ? '📊' : '🚀'}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? 'var(--k-brand-primary)' : 'var(--k-text-primary)', textTransform: 'capitalize' }}>{rating}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Notes — mandatory on override */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: notesRequired ? 'var(--k-danger-text)' : 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                  {notesRequired ? '⚠ Justification Required for Override' : 'Notes'}
                  {!notesRequired && getSuggestedPotential(selectedEmployee.final_score) !== potentialForm.rating && ' (required — override detected)'}
                </div>
                <textarea
                  value={potentialForm.notes}
                  onChange={e => { setPotentialForm(prev => ({ ...prev, notes: e.target.value })); if (e.target.value.trim()) setNotesRequired(false) }}
                  placeholder={notesRequired ? 'You must explain why you are overriding the system suggestion...' : 'Optional observations about this employee\'s potential...'}
                  rows={3}
                  style={{
                    width: '100%', fontSize: '13px', padding: '8px 12px',
                    borderRadius: 'var(--k-radius-md)',
                    border: `1px solid ${notesRequired ? 'var(--k-danger-border)' : 'var(--k-border-input)'}`,
                    background: 'var(--k-bg-input)', color: 'var(--k-text-primary)',
                    fontFamily: 'var(--k-font-sans)', resize: 'vertical',
                  }}
                />
                {notesRequired && (
                  <div style={{ fontSize: '11px', color: 'var(--k-danger-text)', marginTop: '4px' }}>
                    A written justification is required when overriding the system suggestion. This is logged in the audit trail.
                  </div>
                )}
              </div>

              {/* Box preview */}
              {selectedEmployee.performance_band && (
                <div style={{ marginBottom: '20px', padding: '12px 14px', borderRadius: 'var(--k-radius-md)', background: 'var(--k-bg-page)', border: '1px solid var(--k-border-default)', fontSize: '12px' }}>
                  <div style={{ color: 'var(--k-text-muted)', marginBottom: '4px' }}>Predicted box position:</div>
                  <div style={{ fontWeight: 700, color: 'var(--k-brand-primary)' }}>
                    {BOX_CONFIG[getBoxFromBands(selectedEmployee.performance_band, potentialForm.rating)]?.label || '—'}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="k-btn k-btn-primary"
                  onClick={savePotential}
                  disabled={savingPotential}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {savingPotential ? '⏳ Saving...' : '✓ Save Assessment'}
                </button>
                <button className="k-btn k-btn-secondary" onClick={() => { setSelectedEmployee(null); setNotesRequired(false) }} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compliance note */}
        <div style={{ marginTop: '20px', padding: '14px 18px', borderRadius: 'var(--k-radius-md)', background: 'var(--k-bg-surface)', border: '1px solid var(--k-border-default)', fontSize: '12px', color: 'var(--k-text-muted)', lineHeight: 1.7 }}>
          🔒 <strong style={{ color: 'var(--k-text-secondary)' }}>Kinalys 9-Box rules:</strong> Only employees scoring ≥ 80% are eligible. Performance axis = objective scorecard score. Potential ratings suggested by system — overrides require mandatory written justification logged in audit trail. Employees never see their box position.
        </div>

      </div>
    </div>
  )
}