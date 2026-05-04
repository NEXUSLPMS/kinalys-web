import { useState, useEffect } from 'react'
import { getCompetencyFrameworks, getFrameworkCompetencies, getCompetencySettings, updateCompetencySettings, getMyCompetencyAssessments, getUserCompetencyAssessments, saveCompetencyAssessment, getTeamScorecards, getReviewCycles } from '../api/client'

const PROFICIENCY_LEVELS = [
  { level: 1, label: 'Awareness', color: 'var(--k-danger-text)', bg: 'var(--k-danger-bg)', desc: 'Basic awareness of the competency' },
  { level: 2, label: 'Basic', color: '#B45309', bg: '#FEF3C7', desc: 'Developing capability with guidance needed' },
  { level: 3, label: 'Proficient', color: 'var(--k-warning-text)', bg: 'var(--k-warning-bg)', desc: 'Independently competent in most situations' },
  { level: 4, label: 'Advanced', color: '#0F6E56', bg: '#D6F0E4', desc: 'Highly skilled, coaches others' },
  { level: 5, label: 'Expert', color: 'var(--k-brand-primary)', bg: 'var(--k-brand-faint)', desc: 'Recognised authority, sets standards' },
]

const LEVEL_LABELS: Record<string, string> = {
  core: 'Core — All Employees',
  leadership: 'Leadership — Managers and Above',
  functional: 'Functional — Role Specific',
}

export default function CompetencyFramework() {
  const [view, setView] = useState<'my' | 'team' | 'settings'>('my')
  const [frameworks, setFrameworks] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [competencies, setCompetencies] = useState<any[]>([])
  const [assessments, setAssessments] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [cycles, setCycles] = useState<any[]>([])
  const [selectedCycle, setSelectedCycle] = useState('')
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [memberCompetencies, setMemberCompetencies] = useState<any[]>([])
  const [memberAssessments, setMemberAssessments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isManager, setIsManager] = useState(false)
  const [assessmentComments, setAssessmentComments] = useState<Record<string, string>>({})
  const [pendingAssessment, setPendingAssessment] = useState<{userId: string, competencyId: string, level: number} | null>(null)
  const [memberAssessmentCounts, setMemberAssessmentCounts] = useState<Record<string, number>>({})

  // Settings form
  const [settingsForm, setSettingsForm] = useState({ framework_code: 'copc', score_weight_pct: 20, is_enabled: true })

  useEffect(() => { loadInitial() }, []) // eslint-disable-line
  useEffect(() => { if (selectedCycle && settings?.is_enabled) loadMyAssessments() }, [selectedCycle]) // eslint-disable-line

  async function loadInitial() {
    setLoading(true)
    try {
      const [fwData, settingsData, cycleData, teamData] = await Promise.allSettled([
        getCompetencyFrameworks(),
        getCompetencySettings(),
        getReviewCycles(),
        getTeamScorecards(),
      ])
      if (fwData.status === 'fulfilled') setFrameworks(fwData.value.frameworks || [])
      if (settingsData.status === 'fulfilled' && settingsData.value.settings) {
        setSettings(settingsData.value.settings)
        setSettingsForm({
          framework_code: settingsData.value.settings.framework_code || 'copc',
          score_weight_pct: settingsData.value.settings.score_weight_pct || 20,
          is_enabled: settingsData.value.settings.is_enabled !== false,
        })
      }
      if (cycleData.status === 'fulfilled') {
        setCycles(cycleData.value.cycles || [])
      }
      if (teamData.status === 'fulfilled') {
        const teamMembers = teamData.value.team || []
        setTeam(teamMembers)
        setIsManager(true)
        // Load assessment counts for all team members
        const counts: Record<string, number> = {}
        await Promise.allSettled(
          teamMembers.map(async (member: any) => {
            try {
              const data = await getUserCompetencyAssessments(member.id)
              counts[member.id] = (data.assessments || []).length
            } catch { counts[member.id] = 0 }
          })
        )
        setMemberAssessmentCounts(counts)
      }

      // Load my assessments
      const myData = await getMyCompetencyAssessments()
      setCompetencies(myData.competencies || [])
      setAssessments(myData.assessments || [])
      if (myData.cycle_id) setSelectedCycle(myData.cycle_id)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadMyAssessments() {
    try {
      const data = await getMyCompetencyAssessments(selectedCycle)
      setCompetencies(data.competencies || [])
      setAssessments(data.assessments || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function openMemberAssessment(member: any) {
    setSelectedMember(member)
    try {
      const data = await getUserCompetencyAssessments(member.id, selectedCycle)
      setMemberCompetencies(data.competencies || [])
      setMemberAssessments(data.assessments || [])
      setMemberAssessmentCounts(prev => ({ ...prev, [member.id]: (data.assessments || []).length }))
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function saveAssessment(userId: string, competencyId: string, level: number, comment?: string) {
    if (level <= 3 && !comment?.trim()) {
      setPendingAssessment({ userId, competencyId, level })
      return
    }
    setSaving(competencyId)
    try {
      await saveCompetencyAssessment(userId, {
        competency_id: competencyId,
        proficiency_level: level,
        review_cycle_id: selectedCycle,
        notes: comment || null,
      })
      const updateFn = (prev: any[]) => {
        const exists = prev.find(a => a.competency_id === competencyId)
        if (exists) return prev.map(a => a.competency_id === competencyId ? { ...a, proficiency_level: level, notes: comment } : a)
        return [...prev, { competency_id: competencyId, proficiency_level: level, notes: comment }]
      }
      if (userId === selectedMember?.id) {
        setMemberAssessments(prev => {
          const updated = updateFn(prev)
          setMemberAssessmentCounts(counts => ({ ...counts, [userId]: updated.length }))
          return updated
        })
      } else {
        setAssessments(updateFn)
      }
      setPendingAssessment(null)
      setAssessmentComments(prev => ({ ...prev, [competencyId]: '' }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(null)
    }
  }

  async function saveSettings() {
    setSaving('settings')
    try {
      const data = await updateCompetencySettings(settingsForm)
      setSettings(data.settings)
      await loadInitial()
      setView('my')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(null)
    }
  }

  function getAssessment(competencyId: string, assessmentList: any[]) {
    return assessmentList.find(a => a.competency_id === competencyId)
  }

  function getCompetencyScore(assessmentList: any[]) {
    if (assessmentList.length === 0) return null
    const avg = assessmentList.reduce((sum, a) => sum + a.proficiency_level, 0) / assessmentList.length
    return Math.round(avg * 20)
  }

  const groupedCompetencies = competencies.reduce((acc: any, c: any) => {
    if (!acc[c.level]) acc[c.level] = []
    acc[c.level].push(c)
    return acc
  }, {})

  const myScore = getCompetencyScore(assessments)

  if (loading) return <div className="k-page"><div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading competency framework...</div></div>

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="k-page">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div className="k-page-title">Competency Framework</div>
            <div className="k-page-sub">
              {settings?.framework_name || 'No framework selected'} · 5-level proficiency scale
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select value={selectedCycle} onChange={e => setSelectedCycle(e.target.value)} style={{ fontSize: '13px', padding: '6px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
              {cycles.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className={`k-btn ${view === 'my' ? 'k-btn-primary' : 'k-btn-secondary'}`} onClick={() => { setView('my'); setSelectedMember(null) }} style={{ fontSize: '12px' }}>My Competencies</button>
            {isManager && <button className={`k-btn ${view === 'team' ? 'k-btn-primary' : 'k-btn-secondary'}`} onClick={() => setView('team')} style={{ fontSize: '12px' }}>Team</button>}
            <button className={`k-btn ${view === 'settings' ? 'k-btn-primary' : 'k-btn-secondary'}`} onClick={() => setView('settings')} style={{ fontSize: '12px' }}>⚙ Settings</button>
          </div>
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

        {/* No framework configured */}
        {!settings?.is_enabled && view !== 'settings' && (
          <div style={{ background: 'var(--k-brand-faint)', border: '1px solid var(--k-brand-primary)', borderRadius: 'var(--k-radius-lg)', padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎯</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '8px' }}>Competency Framework Not Configured</div>
            <div style={{ fontSize: '13px', color: 'var(--k-text-muted)', marginBottom: '20px' }}>Select a competency framework in Settings to enable competency assessments for your organisation.</div>
            <button className="k-btn k-btn-primary" onClick={() => setView('settings')}>Configure Framework</button>
          </div>
        )}

        {/* ── MY COMPETENCIES VIEW */}
        {view === 'my' && settings?.is_enabled && !selectedMember && (
          <>
            {/* Score summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '24px' }}>
              <div className="k-stat-card accent">
                <div className="k-stat-label">Competency Score</div>
                <div className="k-stat-value" style={{ color: myScore ? (myScore >= 80 ? 'var(--k-success-text)' : myScore >= 60 ? 'var(--k-warning-text)' : 'var(--k-danger-text)') : 'var(--k-text-muted)' }}>
                  {myScore !== null ? `${myScore}%` : '—'}
                </div>
                <div className="k-stat-trend">Based on {assessments.length} assessments</div>
              </div>
              <div className="k-stat-card green">
                <div className="k-stat-label">Assessed</div>
                <div className="k-stat-value">{assessments.length}</div>
                <div className="k-stat-trend">of {competencies.length} competencies</div>
              </div>
              <div className="k-stat-card purple">
                <div className="k-stat-label">Framework</div>
                <div className="k-stat-value" style={{ fontSize: '18px' }}>{settings?.framework_name?.split(' ')[0]}</div>
                <div className="k-stat-trend">Weight: {settings?.score_weight_pct}% of overall score</div>
              </div>
            </div>

            {/* Proficiency scale legend */}
            <div style={{ background: 'var(--k-bg-surface)', border: '1px solid var(--k-border-default)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {PROFICIENCY_LEVELS.map(pl => (
                <div key={pl.level} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: pl.color, background: pl.bg, padding: '2px 8px', borderRadius: '8px' }}>{pl.level} — {pl.label}</span>
                </div>
              ))}
            </div>

            {/* Competencies by level */}
            {['core', 'leadership', 'functional'].map(level => {
              const levelCompetencies = groupedCompetencies[level] || []
              if (levelCompetencies.length === 0) return null
              return (
                <div key={level} className="k-card" style={{ marginBottom: '16px' }}>
                  <div className="k-card-header">
                    <div className="k-card-title">{LEVEL_LABELS[level]}</div>
                    <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{levelCompetencies.length} competencies</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {levelCompetencies.map((comp: any) => {
                      const assessment = getAssessment(comp.id, assessments)
                      const currentLevel = assessment?.proficiency_level || 0
                      const proficiency = PROFICIENCY_LEVELS.find(p => p.level === currentLevel)
                      return (
                        <div key={comp.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--k-border-default)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-text-primary)' }}>{comp.name}</span>
                                {comp.category && <span style={{ fontSize: '10px', color: 'var(--k-text-muted)', background: 'var(--k-bg-page)', padding: '1px 6px', borderRadius: '6px' }}>{comp.category}</span>}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>{comp.description}</div>
                            </div>
                            {proficiency && (
                              <span style={{ fontSize: '11px', fontWeight: 700, color: proficiency.color, background: proficiency.bg, padding: '3px 10px', borderRadius: '10px', flexShrink: 0, marginLeft: '12px' }}>
                                {proficiency.level} — {proficiency.label}
                              </span>
                            )}
                            {!proficiency && (
                              <span style={{ fontSize: '11px', color: 'var(--k-text-muted)', flexShrink: 0, marginLeft: '12px' }}>Not assessed</span>
                            )}
                          </div>
                          {/* Proficiency bar visual */}
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {PROFICIENCY_LEVELS.map(pl => (
                              <div key={pl.level} style={{ flex: 1, height: '6px', borderRadius: '3px', background: currentLevel >= pl.level ? pl.color : 'var(--k-border-default)', transition: 'background 0.2s' }} />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ── TEAM VIEW */}
        {view === 'team' && settings?.is_enabled && !selectedMember && (
          <>
            <div style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 600, color: 'var(--k-text-primary)' }}>
              Team Competency Overview — {team.length} members
            </div>
            <div className="k-card">
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Employee', 'Designation', 'Department', 'Assessed', 'Action'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {team.map((member: any) => (
                    <tr key={member.id} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--k-text-primary)' }}>{member.full_name}</td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-text-muted)' }}>{member.designation_name || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-text-muted)' }}>{member.department_name || '—'}</td>
<td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-text-muted)' }}>
                        {memberAssessmentCounts[member.id] !== undefined ? `${memberAssessmentCounts[member.id]} assessed` : '—'}
                      </td>                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => openMemberAssessment(member)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--k-radius-md)', border: `1px solid ${memberAssessmentCounts[member.id] > 0 ? 'var(--k-success-border)' : 'var(--k-border-default)'}`, background: memberAssessmentCounts[member.id] > 0 ? 'var(--k-success-bg)' : 'var(--k-bg-surface)', color: memberAssessmentCounts[member.id] > 0 ? 'var(--k-success-text)' : 'var(--k-text-secondary)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)', fontWeight: memberAssessmentCounts[member.id] > 0 ? 700 : 400 }}>
                              {memberAssessmentCounts[member.id] > 0 ? `✓ ${memberAssessmentCounts[member.id]} assessed` : 'Assess'}
                            </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── MEMBER ASSESSMENT VIEW */}
        {view === 'team' && settings?.is_enabled && selectedMember && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button onClick={() => setSelectedMember(null)} style={{ fontSize: '12px', padding: '5px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', color: 'var(--k-text-muted)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
                Back to Team
              </button>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--k-text-primary)' }}>{selectedMember.full_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{selectedMember.designation_name} · {selectedMember.department_name}</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: 'var(--k-text-muted)' }}>{memberAssessments.length} of {memberCompetencies.length} assessed</div>
                {memberAssessments.length > 0 && (
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--k-brand-primary)' }}>
                    {getCompetencyScore(memberAssessments)}% competency score
                  </div>
                )}
              </div>
            </div>

            {/* Proficiency legend */}
            <div style={{ background: 'var(--k-bg-surface)', border: '1px solid var(--k-border-default)', borderRadius: 'var(--k-radius-md)', padding: '10px 16px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {PROFICIENCY_LEVELS.map(pl => (
                <span key={pl.level} style={{ fontSize: '11px', fontWeight: 700, color: pl.color, background: pl.bg, padding: '2px 8px', borderRadius: '8px' }}>
                  {pl.level} — {pl.label}: {pl.desc}
                </span>
              ))}
            </div>

            {['core', 'leadership', 'functional'].map(level => {
              const levelComps = memberCompetencies.filter((c: any) => c.level === level)
              if (levelComps.length === 0) return null
              return (
                <div key={level} className="k-card" style={{ marginBottom: '16px' }}>
                  <div className="k-card-header">
                    <div className="k-card-title">{LEVEL_LABELS[level]}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {levelComps.map((comp: any) => {
                      const assessment = getAssessment(comp.id, memberAssessments)
                      const currentLevel = assessment?.proficiency_level || 0
                      return (
                        <div key={comp.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--k-border-default)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '2px' }}>{comp.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>{comp.description}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', marginLeft: '16px', flexShrink: 0 }}>
                              {PROFICIENCY_LEVELS.map(pl => (
                                <button
                                  key={pl.level}
                                  onClick={() => saveAssessment(selectedMember.id, comp.id, pl.level)}
                                  disabled={saving === comp.id}
                                  style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    border: `2px solid ${currentLevel === pl.level ? pl.color : 'var(--k-border-default)'}`,
                                    background: currentLevel === pl.level ? pl.bg : 'var(--k-bg-page)',
                                    color: currentLevel === pl.level ? pl.color : 'var(--k-text-muted)',
                                    cursor: 'pointer', fontFamily: 'var(--k-font-sans)',
                                    fontSize: '12px', fontWeight: 700,
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  {pl.level}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {PROFICIENCY_LEVELS.map(pl => (
                              <div key={pl.level} style={{ flex: 1, height: '5px', borderRadius: '3px', background: currentLevel >= pl.level ? pl.color : 'var(--k-border-default)', transition: 'background 0.2s' }} />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ── SETTINGS VIEW */}
        {view === 'settings' && (
          <div style={{ maxWidth: '640px' }}>
            <div className="k-card" style={{ marginBottom: '20px' }}>
              <div className="k-card-header">
                <div className="k-card-title">Competency Framework Configuration</div>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div onClick={() => setSettingsForm(p => ({ ...p, is_enabled: !p.is_enabled }))} style={{ width: '48px', height: '26px', borderRadius: '13px', background: settingsForm.is_enabled ? 'var(--k-brand-primary)' : 'var(--k-border-default)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: '3px', left: settingsForm.is_enabled ? '25px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-primary)' }}>Enable Competency Framework</div>
                    <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>Activates competency assessments across your organisation</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Select Framework</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {frameworks.map((fw: any) => (
                      <div
                        key={fw.code}
                        onClick={() => setSettingsForm(p => ({ ...p, framework_code: fw.code }))}
                        style={{
                          padding: '14px 16px', borderRadius: 'var(--k-radius-md)', cursor: 'pointer',
                          border: `1px solid ${settingsForm.framework_code === fw.code ? 'var(--k-brand-primary)' : 'var(--k-border-default)'}`,
                          background: settingsForm.framework_code === fw.code ? 'var(--k-brand-faint)' : 'var(--k-bg-page)',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: settingsForm.framework_code === fw.code ? 'var(--k-brand-primary)' : 'var(--k-text-primary)' }}>{fw.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginTop: '2px' }}>{fw.description}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>{fw.competency_count} competencies</span>
                            {settingsForm.framework_code === fw.code && (
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-brand-primary)', background: 'var(--k-brand-faint)', padding: '2px 8px', borderRadius: '8px' }}>Selected</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                    Competency Score Weight in Overall Performance: {settingsForm.score_weight_pct}%
                  </div>
                  <input type="range" min={0} max={30} step={5} value={settingsForm.score_weight_pct} onChange={e => setSettingsForm(p => ({ ...p, score_weight_pct: parseInt(e.target.value) }))} style={{ width: '100%', accentColor: 'var(--k-brand-primary)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--k-text-muted)', marginTop: '4px' }}>
                    <span>0% (disabled)</span><span>Recommended: 20%</span><span>30% (max)</span>
                  </div>
                </div>

                <button className="k-btn k-btn-primary" onClick={saveSettings} disabled={saving === 'settings'} style={{ alignSelf: 'flex-start', fontSize: '13px' }}>
                  {saving === 'settings' ? 'Saving...' : 'Save Framework Settings'}
                </button>
              </div>
            </div>
          </div>
        )}


        {pendingAssessment && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-lg)', padding: '28px', width: '480px', maxWidth: '90vw', boxShadow: 'var(--k-shadow-lg)' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '6px' }}>Comment Required</div>
              <div style={{ fontSize: '13px', color: 'var(--k-text-muted)', marginBottom: '16px' }}>
                A rating of <strong>{PROFICIENCY_LEVELS.find(p => p.level === pendingAssessment.level)?.label}</strong> ({pendingAssessment.level}/5) requires a mandatory comment defining the area of improvement and recommended action.
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-danger-text)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Area of Improvement & Recommended Action *</div>
                <textarea
                  value={assessmentComments[pendingAssessment.competencyId] || ''}
                  onChange={e => setAssessmentComments(prev => ({ ...prev, [pendingAssessment.competencyId]: e.target.value }))}
                  placeholder="Describe the specific gap observed and the recommended development action..."
                  rows={4}
                  autoFocus
                  style={{ width: '100%', fontSize: '13px', padding: '10px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-danger-border)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="k-btn k-btn-primary"
                  onClick={() => {
                    const comment = assessmentComments[pendingAssessment.competencyId] || ''
                    if (!comment.trim()) { setError('Comment is mandatory for ratings of 3 or below'); return }
                    saveAssessment(pendingAssessment.userId, pendingAssessment.competencyId, pendingAssessment.level, comment)
                  }}
                  disabled={saving !== null}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Save Assessment
                </button>
                <button className="k-btn k-btn-secondary" onClick={() => setPendingAssessment(null)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}