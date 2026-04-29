import { useState, useEffect } from 'react'
import {
  getOkrObjectives, createOkrObjective, updateOkrObjective,
  deleteOkrObjective, getKeyResults, createKeyResult, updateKeyResult,
  getOkrSummary, getDepartments
} from '../api/client'

interface Objective {
  id: string
  tier: 'company' | 'department' | 'individual' | 'departmental_operational'
  title: string
  description: string
  owner_name: string
  department_name: string
  quarter: number
  year: number
  status: string
  overall_progress_pct: number
  kr_count: number
  avg_progress: number
}

interface KeyResult {
  id: string
  title: string
  owner_name: string
  department_name: string
  tier: string
  current_value: number
  target_value: number
  start_value: number
  progress_pct: number
  weight_pct: number
  own_weight_pct: number
  dependency_weight_pct: number
  status: string
  dependency_count: number
}

interface Summary {
  total_objectives: number
  total_key_results: number
  avg_progress: number
  on_track: number
  at_risk: number
  behind: number
}

const TIER_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  company:                  { label: 'Company',            icon: '🏢', color: '#0C447C', bg: '#EDF4FB' },
  department:               { label: 'Department',         icon: '🏬', color: '#27500A', bg: '#EAF3DE' },
  individual:               { label: 'Individual',         icon: '👤', color: '#412402', bg: '#FAEEDA' },
  departmental_operational: { label: 'Dept. Operational',  icon: '⚙️', color: '#26215C', bg: '#EEEDFE' },
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--k-text-muted)',
  active: 'var(--k-brand-primary)',
  on_track: 'var(--k-success-text)',
  at_risk: 'var(--k-warning-text)',
  behind: 'var(--k-danger-text)',
  completed: 'var(--k-success-text)',
}

const CURRENT_YEAR = new Date().getFullYear()
const CURRENT_QUARTER = Math.ceil((new Date().getMonth() + 1) / 3)

export default function OKR() {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [keyResults, setKeyResults] = useState<Record<string, KeyResult[]>>({})
  const [summary, setSummary] = useState<Summary | null>(null)
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)
  const [selectedQuarter, setSelectedQuarter] = useState(CURRENT_QUARTER)
  const [expandedObjective, setExpandedObjective] = useState<string | null>(null)
  const [showAddObjective, setShowAddObjective] = useState(false)
  const [addingKR, setAddingKR] = useState<string | null>(null)
  const [filterTier, setFilterTier] = useState<string>('all')
  const [newObjective, setNewObjective] = useState({ tier: 'company', title: '', description: '', department_id: '' })
  const [newKR, setNewKR] = useState({ title: '', current_value: 0, target_value: 100, tier: 'department', own_weight_pct: 70, dependency_weight_pct: 30 })

  useEffect(() => {
    loadAll()
  }, [selectedYear, selectedQuarter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    setLoading(true)
    try {
      const [objData, sumData, deptData] = await Promise.allSettled([
        getOkrObjectives(selectedYear, selectedQuarter),
        getOkrSummary(selectedYear, selectedQuarter),
        getDepartments(),
      ])
      if (objData.status === 'fulfilled') setObjectives(objData.value.objectives)
      if (sumData.status === 'fulfilled') setSummary(sumData.value.summary)
      if (deptData.status === 'fulfilled') setDepartments(deptData.value.departments || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadKRs(objectiveId: string) {
    if (keyResults[objectiveId]) return
    try {
      const data = await getKeyResults(objectiveId)
      setKeyResults(prev => ({ ...prev, [objectiveId]: data.key_results }))
    } catch (err: any) {
      console.error('Load KRs error:', err.message)
    }
  }

  function toggleObjective(id: string) {
    if (expandedObjective === id) {
      setExpandedObjective(null)
    } else {
      setExpandedObjective(id)
      loadKRs(id)
    }
  }

  async function addObjective() {
    if (!newObjective.title.trim()) return
    try {
      const data = await createOkrObjective({
        ...newObjective,
        year: selectedYear,
        quarter: selectedQuarter,
        department_id: newObjective.department_id || null,
      })
      setObjectives(prev => [data.objective, ...prev])
      setShowAddObjective(false)
      setNewObjective({ tier: 'company', title: '', description: '', department_id: '' })
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    }
  }

  async function addKR(objectiveId: string) {
    if (!newKR.title.trim()) return
    try {
      console.log('Adding KR:', objectiveId, newKR)
      const data = await createKeyResult(objectiveId, newKR)
      setKeyResults(prev => ({ ...prev, [objectiveId]: [...(prev[objectiveId] || []), data.key_result] }))
      setObjectives(prev => prev.map(o => o.id === objectiveId ? { ...o, kr_count: o.kr_count + 1 } : o))
      setAddingKR(null)
      setNewKR({ title: '', current_value: 0, target_value: 100, tier: 'department', own_weight_pct: 70, dependency_weight_pct: 30 })
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    }
  }

  async function updateProgress(krId: string, objectiveId: string, currentValue: number, targetValue: number) {
    try {
      const data = await updateKeyResult(krId, { current_value: currentValue, target_value: targetValue })
      setKeyResults(prev => ({ ...prev, [objectiveId]: prev[objectiveId].map(kr => kr.id === krId ? { ...kr, ...data.key_result } : kr) }))
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function deleteObjective(id: string) {
    try {
      await deleteOkrObjective(id)
      setObjectives(prev => prev.filter(o => o.id !== id))
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    }
  }

  const filteredObjectives = filterTier === 'all' ? objectives : objectives.filter(o => o.tier === filterTier)

  if (loading) return (
    <div className="k-page">
      <div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading OKR Framework...</div>
    </div>
  )

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="k-page">

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div className="k-page-title">🎯 OKR Framework</div>
            <div className="k-page-sub">Objectives and Key Results · Three-tier hierarchy · Interdepartmental dependency scoring</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} style={{ fontSize: '13px', padding: '6px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
              {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={selectedQuarter} onChange={e => setSelectedQuarter(parseInt(e.target.value))} style={{ fontSize: '13px', padding: '6px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
              {[1,2,3,4].map(q => <option key={q} value={q}>Q{q}</option>)}
            </select>
            <button className="k-btn k-btn-primary" onClick={() => setShowAddObjective(true)} style={{ fontSize: '13px' }}>+ Add Objective</button>
          </div>
        </div>

        {error && (
          <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-danger-text)', display: 'flex', justifyContent: 'space-between' }}>
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--k-danger-text)', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {summary && (
          <div className="k-stat-grid k-stat-grid-4" style={{ marginBottom: '24px' }}>
            <div className="k-stat-card accent"><div className="k-stat-label">Objectives</div><div className="k-stat-value">{summary.total_objectives}</div><div className="k-stat-trend">Q{selectedQuarter} {selectedYear}</div></div>
            <div className="k-stat-card green"><div className="k-stat-label">Avg Progress</div><div className="k-stat-value">{Number(summary.avg_progress).toFixed(0)}%</div><div className="k-stat-trend up">Across all KRs</div></div>
            <div className="k-stat-card amber"><div className="k-stat-label">At Risk</div><div className="k-stat-value">{summary.at_risk}</div><div className="k-stat-trend">Need attention</div></div>
            <div className="k-stat-card purple"><div className="k-stat-label">Key Results</div><div className="k-stat-value">{summary.total_key_results}</div><div className="k-stat-trend">Total KRs</div></div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--k-bg-page)', padding: '4px', borderRadius: 'var(--k-radius-md)', width: 'fit-content' }}>
          {[['all', '📋 All'], ...Object.entries(TIER_CONFIG).map(([k, v]) => [k, `${v.icon} ${v.label}`])].map(([tier, label]) => (
            <button key={tier} onClick={() => setFilterTier(tier)} style={{ padding: '6px 14px', borderRadius: 'var(--k-radius-md)', border: 'none', background: filterTier === tier ? 'var(--k-bg-surface)' : 'transparent', color: filterTier === tier ? 'var(--k-text-primary)' : 'var(--k-text-muted)', fontFamily: 'var(--k-font-sans)', fontSize: '12px', fontWeight: filterTier === tier ? 600 : 400, cursor: 'pointer', boxShadow: filterTier === tier ? 'var(--k-shadow-sm)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>

        {showAddObjective && (
          <div style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-lg)', padding: '20px', marginBottom: '20px', border: '1px solid var(--k-brand-primary)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '16px' }}>New Objective</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--k-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tier</div>
                <select value={newObjective.tier} onChange={e => setNewObjective(prev => ({ ...prev, tier: e.target.value }))} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }}>
                  <option value="company">🏢 Company</option>
                  <option value="department">🏬 Department</option>
                  <option value="individual">👤 Individual</option>
                  <option value="departmental_operational">⚙️ Departmental Operational</option>
                </select>
              </div>
              {(newObjective.tier === 'department' || newObjective.tier === 'departmental_operational') && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--k-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Department</div>
                  <select value={newObjective.department_id} onChange={e => setNewObjective(prev => ({ ...prev, department_id: e.target.value }))} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }}>
                    <option value="">Select department</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--k-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Objective Title</div>
              <input placeholder="e.g. Achieve market leadership in customer satisfaction" value={newObjective.title} onChange={e => setNewObjective(prev => ({ ...prev, title: e.target.value }))} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }} autoFocus />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--k-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Description (optional)</div>
              <textarea placeholder="Why this objective matters..." value={newObjective.description} onChange={e => setNewObjective(prev => ({ ...prev, description: e.target.value }))} rows={2} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="k-btn k-btn-primary" onClick={addObjective} style={{ fontSize: '13px' }}>+ Create Objective</button>
              <button className="k-btn k-btn-secondary" onClick={() => setShowAddObjective(false)} style={{ fontSize: '13px' }}>Cancel</button>
            </div>
          </div>
        )}

        {filteredObjectives.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--k-text-muted)', fontSize: '14px' }}>
            No objectives for Q{selectedQuarter} {selectedYear}. Click "+ Add Objective" to get started.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredObjectives.map(objective => {
              const tierConfig = TIER_CONFIG[objective.tier] || TIER_CONFIG.company
              const isExpanded = expandedObjective === objective.id
              const objKRs = keyResults[objective.id] || []

              return (
                <div key={objective.id} style={{ borderRadius: 'var(--k-radius-lg)', border: `1px solid ${isExpanded ? tierConfig.color : 'var(--k-border-default)'}`, overflow: 'hidden' }}>
                  <div style={{ background: isExpanded ? tierConfig.bg : 'var(--k-bg-surface)', padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }} onClick={() => toggleObjective(objective.id)}>
                    <div style={{ fontSize: '22px', flexShrink: 0 }}>{tierConfig.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, background: tierConfig.color, color: 'white', padding: '2px 8px', borderRadius: '10px' }}>{tierConfig.label}</span>
                        {objective.department_name && <span style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>· {objective.department_name}</span>}
                        <span style={{ fontSize: '11px', color: STATUS_COLORS[objective.status] || 'var(--k-text-muted)', fontWeight: 600 }}>● {objective.status}</span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--k-text-primary)', marginBottom: '4px' }}>{objective.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{objective.kr_count} Key Results · {Number(objective.avg_progress).toFixed(0)}% avg progress{objective.owner_name && ` · Owner: ${objective.owner_name}`}</div>
                    </div>
                    <div style={{ width: '120px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--k-text-muted)', marginBottom: '4px' }}>
                        <span>Progress</span>
                        <span style={{ fontWeight: 700, color: 'var(--k-text-primary)' }}>{Number(objective.avg_progress).toFixed(0)}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--k-border-default)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${objective.avg_progress}%`, background: objective.avg_progress >= 70 ? 'var(--k-success-solid)' : objective.avg_progress >= 40 ? '#F59E0B' : 'var(--k-danger-solid)', borderRadius: '3px', transition: 'width 0.3s' }}/>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteObjective(objective.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--k-text-muted)', padding: '4px', flexShrink: 0 }} title="Delete objective">✕</button>
                    <div style={{ fontSize: '18px', color: 'var(--k-text-muted)', flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '20px', background: 'var(--k-bg-page)', borderTop: `1px solid ${tierConfig.color}` }}>
                      {objKRs.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                          {objKRs.map(kr => (
                            <div key={kr.id} style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-md)', padding: '14px 16px', border: '1px solid var(--k-border-default)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-primary)', marginBottom: '3px' }}>{kr.title}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>
                                    {kr.owner_name && `Owner: ${kr.owner_name}`}{kr.department_name && ` · ${kr.department_name}`}
                                    {` · Own: ${kr.own_weight_pct}% / Dependency: ${kr.dependency_weight_pct}%`}
                                    {kr.dependency_count > 0 && <span style={{ color: 'var(--k-warning-text)', marginLeft: '6px' }}>⚡ {kr.dependency_count} dependencies</span>}
                                  </div>
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: STATUS_COLORS[kr.status], flexShrink: 0 }}>● {kr.status}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ flex: 1, height: '8px', background: 'var(--k-border-default)', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${kr.progress_pct}%`, background: kr.progress_pct >= 70 ? 'var(--k-success-solid)' : kr.progress_pct >= 40 ? '#F59E0B' : 'var(--k-danger-solid)', transition: 'width 0.3s' }}/>
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-text-primary)', minWidth: '36px' }}>{Number(kr.progress_pct).toFixed(0)}%</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                  <input type="number" defaultValue={kr.current_value} onBlur={e => updateProgress(kr.id, objective.id, parseFloat(e.target.value), kr.target_value)} style={{ width: '64px', fontSize: '12px', padding: '4px 6px', borderRadius: 'var(--k-radius-sm)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', textAlign: 'center' }} />
                                  <span style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>/ {kr.target_value}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '13px', color: 'var(--k-text-muted)', textAlign: 'center', padding: '16px', marginBottom: '12px' }}>No Key Results yet. Add the first KR below.</div>
                      )}

                      {addingKR === objective.id ? (
                        <div style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-md)', padding: '16px', border: '1px solid var(--k-border-default)' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>Add Key Result</div>
                          <input placeholder="Key Result title e.g. Increase NPS from 45 to 65" value={newKR.title} onChange={e => setNewKR(prev => ({ ...prev, title: e.target.value }))} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', marginBottom: '10px' }} autoFocus />
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
                            <div>
                              <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginBottom: '4px' }}>Current Value</div>
                              <input type="number" value={newKR.current_value} onChange={e => setNewKR(prev => ({ ...prev, current_value: parseFloat(e.target.value) }))} style={{ width: '100%', fontSize: '13px', padding: '6px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }} />
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginBottom: '4px' }}>Target Value</div>
                              <input type="number" value={newKR.target_value} onChange={e => setNewKR(prev => ({ ...prev, target_value: parseFloat(e.target.value) }))} style={{ width: '100%', fontSize: '13px', padding: '6px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }} />
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginBottom: '4px' }}>Own Weight %</div>
                              <input type="number" value={newKR.own_weight_pct} onChange={e => setNewKR(prev => ({ ...prev, own_weight_pct: parseFloat(e.target.value), dependency_weight_pct: 100 - parseFloat(e.target.value) }))} style={{ width: '100%', fontSize: '13px', padding: '6px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }} />
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginBottom: '4px' }}>Dependency Weight %</div>
                              <input type="number" value={newKR.dependency_weight_pct} readOnly style={{ width: '100%', fontSize: '13px', padding: '6px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontFamily: 'var(--k-font-sans)' }} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="k-btn k-btn-primary" onClick={() => addKR(objective.id)} style={{ fontSize: '12px' }}>+ Add KR</button>
                            <button className="k-btn k-btn-secondary" onClick={() => setAddingKR(null)} style={{ fontSize: '12px' }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button className="k-btn k-btn-secondary" onClick={() => setAddingKR(objective.id)} style={{ fontSize: '12px' }}>+ Add Key Result</button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div style={{ marginTop: '20px', padding: '14px 18px', borderRadius: 'var(--k-radius-md)', background: 'var(--k-bg-surface)', border: '1px solid var(--k-border-default)', fontSize: '12px', color: 'var(--k-text-muted)', lineHeight: 1.7 }}>
          🔒 <strong style={{ color: 'var(--k-text-secondary)' }}>Kinalys enforces OKR integrity:</strong> Every Key Result must belong to an Objective. Objectives with active Key Results cannot be deleted. Dependency weights (own vs interdepartmental) must total 100% per KR.
        </div>

      </div>
    </div>
  )
}
