import { useState, useEffect } from 'react'
import {
  getBscPerspectives, updateBscPerspective,
  getBscMetrics, createBscMetric, deleteBscMetric
} from '../api/client'

interface Perspective {
  id: string
  perspective: 'financial' | 'customer' | 'internal_process' | 'learning_growth'
  label: string
  description: string
  weight_pct: number
  lms_auto_feed: boolean
  metric_count: number
  total_metric_weight: number
}

interface Metric {
  id: string
  name: string
  description: string
  weight_pct: number
  metric_type: string
  target_value: number | null
  rag_green_threshold: number | null
  rag_amber_threshold: number | null
  data_source: string
  is_lms_auto_feed: boolean
}

const PERSPECTIVE_ICONS: Record<string, string> = {
  financial: '💰',
  customer: '🤝',
  internal_process: '⚙️',
  learning_growth: '📚',
}

const PERSPECTIVE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  financial:        { bg: '#EDF4FB', border: '#0C447C', text: '#0C447C' },
  customer:         { bg: '#EAF3DE', border: '#27500A', text: '#27500A' },
  internal_process: { bg: '#FAEEDA', border: '#412402', text: '#412402' },
  learning_growth:  { bg: '#EEEDFE', border: '#26215C', text: '#26215C' },
}

export default function BalancedScorecard() {
  const [perspectives, setPerspectives] = useState<Perspective[]>([])
  const [metrics, setMetrics] = useState<Record<string, Metric[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedPerspective, setExpandedPerspective] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [editLabelValue, setEditLabelValue] = useState('')
  const [editingWeight, setEditingWeight] = useState<string | null>(null)
  const [editWeightValue, setEditWeightValue] = useState('')
  const [addingMetric, setAddingMetric] = useState<string | null>(null)
  const [newMetric, setNewMetric] = useState({ name: '', weight_pct: 25, target_value: '', metric_type: 'numeric' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadPerspectives()
  }, [])

  async function loadPerspectives() {
    try {
      const data = await getBscPerspectives()
      setPerspectives(data.perspectives)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadMetrics(perspectiveId: string) {
    if (metrics[perspectiveId]) return
    try {
      const data = await getBscMetrics(perspectiveId)
      setMetrics(prev => ({ ...prev, [perspectiveId]: data.metrics }))
    } catch (err: any) {
      console.error('Load metrics error:', err.message)
    }
  }

  function togglePerspective(id: string) {
    if (expandedPerspective === id) {
      setExpandedPerspective(null)
    } else {
      setExpandedPerspective(id)
      loadMetrics(id)
    }
  }

  async function saveLabel(perspectiveId: string) {
    setSaving(true)
    try {
      await updateBscPerspective(perspectiveId, { label: editLabelValue })
      setPerspectives(prev => prev.map(p => p.id === perspectiveId ? { ...p, label: editLabelValue } : p))
      setEditingLabel(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveWeight(perspectiveId: string) {
    const weight = parseFloat(editWeightValue)
    if (isNaN(weight) || weight < 0 || weight > 100) {
      setError('Weight must be between 0 and 100')
      return
    }
    setSaving(true)
    try {
      await updateBscPerspective(perspectiveId, { weight_pct: weight })
      setPerspectives(prev => prev.map(p => p.id === perspectiveId ? { ...p, weight_pct: weight } : p))
      setEditingWeight(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function addMetric(perspectiveId: string) {
    if (!newMetric.name.trim()) return
    setSaving(true)
    try {
      const data = await createBscMetric(perspectiveId, {
        name: newMetric.name,
        weight_pct: newMetric.weight_pct,
        target_value: newMetric.target_value ? parseFloat(newMetric.target_value) : null,
        metric_type: newMetric.metric_type,
      })
      setMetrics(prev => ({
        ...prev,
        [perspectiveId]: [...(prev[perspectiveId] || []), data.metric]
      }))
      setPerspectives(prev => prev.map(p =>
        p.id === perspectiveId ? { ...p, metric_count: p.metric_count + 1 } : p
      ))
      setAddingMetric(null)
      setNewMetric({ name: '', weight_pct: 25, target_value: '', metric_type: 'numeric' })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function removeMetric(perspectiveId: string, metricId: string) {
    try {
      await deleteBscMetric(metricId)
      setMetrics(prev => ({
        ...prev,
        [perspectiveId]: prev[perspectiveId].filter(m => m.id !== metricId)
      }))
      setPerspectives(prev => prev.map(p =>
        p.id === perspectiveId ? { ...p, metric_count: p.metric_count - 1 } : p
      ))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const totalWeight = perspectives.reduce((sum, p) => sum + Number(p.weight_pct), 0)
  const weightValid = Math.abs(totalWeight - 100) < 0.01

  if (loading) return (
    <div className="k-page">
      <div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading Balanced Scorecard...</div>
    </div>
  )

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="k-page">

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div className="k-page-title">⚖️ Balanced Scorecard</div>
          <div className="k-page-sub">
            Kaplan-Norton four perspectives · Labels renameable · Learning & Growth auto-fed from LMS
          </div>
        </div>

        {error && (
          <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-danger-text)' }}>
            ⚠ {error} <button onClick={() => setError(null)} style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--k-danger-text)', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* Weight validation banner */}
        <div style={{
          background: weightValid ? 'var(--k-success-bg)' : 'var(--k-warning-bg)',
          border: `1px solid ${weightValid ? 'var(--k-success-border)' : 'var(--k-warning-border)'}`,
          borderRadius: 'var(--k-radius-md)',
          padding: '12px 18px', marginBottom: '24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '13px',
          color: weightValid ? 'var(--k-success-text)' : 'var(--k-warning-text)',
        }}>
          <span>
            {weightValid ? '✓ Perspective weights total 100%' : `⚠ Perspective weights total ${totalWeight.toFixed(1)}% — must equal 100%`}
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            {perspectives.map(p => (
              <span key={p.id} style={{ fontSize: '12px', fontWeight: 600 }}>
                {PERSPECTIVE_ICONS[p.perspective]} {p.weight_pct}%
              </span>
            ))}
          </div>
        </div>

        {/* Perspectives */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {perspectives.map(perspective => {
            const colors = PERSPECTIVE_COLORS[perspective.perspective]
            const isExpanded = expandedPerspective === perspective.id
            const perspMetrics = metrics[perspective.id] || []

            return (
              <div
                key={perspective.id}
                style={{
                  borderRadius: 'var(--k-radius-lg)',
                  border: `1px solid ${isExpanded ? colors.border : 'var(--k-border-default)'}`,
                  overflow: 'hidden',
                  transition: 'all var(--k-transition)',
                }}
              >
                {/* Perspective header */}
                <div
                  style={{
                    background: isExpanded ? colors.bg : 'var(--k-bg-surface)',
                    padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: '16px',
                    cursor: 'pointer',
                  }}
                  onClick={() => togglePerspective(perspective.id)}
                >
                  <div style={{ fontSize: '24px', flexShrink: 0 }}>{PERSPECTIVE_ICONS[perspective.perspective]}</div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {editingLabel === perspective.id ? (
                        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            value={editLabelValue}
                            onChange={e => setEditLabelValue(e.target.value)}
                            style={{ fontSize: '15px', fontWeight: 700, padding: '4px 8px', borderRadius: 'var(--k-radius-sm)', border: '1px solid var(--k-border-strong)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', width: '200px' }}
                            onKeyDown={e => { if (e.key === 'Enter') saveLabel(perspective.id); if (e.key === 'Escape') setEditingLabel(null) }}
                            autoFocus
                          />
                          <button className="k-btn k-btn-primary" onClick={() => saveLabel(perspective.id)} style={{ fontSize: '11px', padding: '4px 10px' }}>Save</button>
                          <button className="k-btn k-btn-secondary" onClick={() => setEditingLabel(null)} style={{ fontSize: '11px', padding: '4px 10px' }}>Cancel</button>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: isExpanded ? colors.text : 'var(--k-text-primary)' }}>{perspective.label}</div>
                          <button
                            onClick={e => { e.stopPropagation(); setEditingLabel(perspective.id); setEditLabelValue(perspective.label) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--k-text-muted)', padding: '0 4px' }}
                            title="Rename label"
                          >✏️</button>
                        </>
                      )}
                      <span style={{ fontSize: '10px', color: 'var(--k-text-muted)', background: 'var(--k-bg-page)', padding: '1px 6px', borderRadius: '10px' }}>
                        Kaplan-Norton: {perspective.perspective.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>
                      {perspective.metric_count} metrics · {perspective.total_metric_weight}% metric weight assigned
                      {perspective.lms_auto_feed && <span style={{ marginLeft: '8px', color: 'var(--k-ai-text)', fontWeight: 600 }}>🔗 LMS auto-feed active</span>}
                    </div>
                  </div>

                  {/* Weight editor */}
                  <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {editingWeight === perspective.id ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          value={editWeightValue}
                          onChange={e => setEditWeightValue(e.target.value)}
                          style={{ width: '60px', fontSize: '13px', padding: '4px 8px', borderRadius: 'var(--k-radius-sm)', border: '1px solid var(--k-border-strong)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', textAlign: 'center' }}
                          onKeyDown={e => { if (e.key === 'Enter') saveWeight(perspective.id); if (e.key === 'Escape') setEditingWeight(null) }}
                          autoFocus
                        />
                        <span style={{ fontSize: '12px' }}>%</span>
                        <button className="k-btn k-btn-primary" onClick={() => saveWeight(perspective.id)} style={{ fontSize: '11px', padding: '4px 10px' }}>Save</button>
                      </div>
                    ) : (
                      <div
                        style={{
                          background: isExpanded ? colors.border : 'var(--k-brand-primary)',
                          color: 'white', fontSize: '14px', fontWeight: 700,
                          padding: '6px 16px', borderRadius: 'var(--k-radius-pill)',
                          cursor: 'pointer', minWidth: '56px', textAlign: 'center',
                        }}
                        onClick={() => { setEditingWeight(perspective.id); setEditWeightValue(String(perspective.weight_pct)) }}
                        title="Click to edit weight"
                      >
                        {perspective.weight_pct}%
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '18px', color: 'var(--k-text-muted)', flexShrink: 0 }}>
                    {isExpanded ? '▲' : '▼'}
                  </div>
                </div>

                {/* Expanded metrics */}
                {isExpanded && (
                  <div style={{ padding: '20px', background: 'var(--k-bg-page)', borderTop: `1px solid ${colors.border}` }}>

                    {/* LMS auto-feed notice */}
                    {perspective.lms_auto_feed && (
                      <div style={{ background: 'var(--k-ai-bg)', border: '1px solid var(--k-ai-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: 'var(--k-ai-text)', lineHeight: 1.6 }}>
                        🔗 <strong>LMS Auto-Feed Active</strong> — Learning hours completed are automatically calculated and fed into this perspective. Additional metrics can be added below.
                      </div>
                    )}

                    {/* Metrics list */}
                    {perspMetrics.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                        {perspMetrics.map(metric => (
                          <div key={metric.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-primary)', marginBottom: '3px' }}>
                                {metric.name}
                                {metric.is_lms_auto_feed && <span style={{ marginLeft: '8px', fontSize: '10px', color: 'var(--k-ai-text)', fontWeight: 700 }}>LMS</span>}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>
                                Weight: {metric.weight_pct}% · Type: {metric.metric_type}
                                {metric.target_value && ` · Target: ${metric.target_value}`}
                              </div>
                            </div>
                            <button
                              onClick={() => removeMetric(perspective.id, metric.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--k-danger-text)', padding: '4px' }}
                              title="Remove metric"
                            >✕</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: 'var(--k-text-muted)', marginBottom: '16px', textAlign: 'center', padding: '16px' }}>
                        No metrics added yet. Add your first KRA below.
                      </div>
                    )}

                    {/* Add metric form */}
                    {addingMetric === perspective.id ? (
                      <div style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-md)', padding: '16px', border: '1px solid var(--k-border-default)' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '12px' }}>Add KRA / Metric</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', marginBottom: '10px' }}>
                          <input
                            placeholder="Metric name e.g. Net Promoter Score"
                            value={newMetric.name}
                            onChange={e => setNewMetric(prev => ({ ...prev, name: e.target.value }))}
                            style={{ fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }}
                            autoFocus
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number"
                              placeholder="Weight %"
                              value={newMetric.weight_pct}
                              onChange={e => setNewMetric(prev => ({ ...prev, weight_pct: parseFloat(e.target.value) }))}
                              style={{ width: '80px', fontSize: '13px', padding: '8px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', textAlign: 'center' }}
                            />
                            <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>%</span>
                          </div>
                          <input
                            type="number"
                            placeholder="Target value"
                            value={newMetric.target_value}
                            onChange={e => setNewMetric(prev => ({ ...prev, target_value: e.target.value }))}
                            style={{ width: '100px', fontSize: '13px', padding: '8px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', textAlign: 'center' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="k-btn k-btn-primary" onClick={() => addMetric(perspective.id)} disabled={saving} style={{ fontSize: '12px' }}>
                            {saving ? '⏳ Adding...' : '+ Add Metric'}
                          </button>
                          <button className="k-btn k-btn-secondary" onClick={() => setAddingMetric(null)} style={{ fontSize: '12px' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="k-btn k-btn-secondary"
                        onClick={() => setAddingMetric(perspective.id)}
                        style={{ fontSize: '12px' }}
                      >
                        + Add KRA / Metric
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Kinalys lock notice */}
        <div style={{ marginTop: '20px', padding: '14px 18px', borderRadius: 'var(--k-radius-md)', background: 'var(--k-bg-surface)', border: '1px solid var(--k-border-default)', fontSize: '12px', color: 'var(--k-text-muted)', lineHeight: 1.7 }}>
          🔒 <strong style={{ color: 'var(--k-text-secondary)' }}>Kinalys enforces Kaplan-Norton compliance:</strong> The four perspective types (Financial, Customer, Internal Process, Learning & Growth) are fixed and cannot be removed or reordered. Labels can be renamed to match your industry. Weights must total 100%.
        </div>

        {(saving || saved) && (
          <div style={{ position: 'fixed', bottom: '32px', right: '32px', background: saved ? 'var(--k-success-solid)' : 'var(--k-bg-topbar)', color: 'white', padding: '12px 20px', borderRadius: 'var(--k-radius-md)', fontSize: '13px', fontWeight: 600, boxShadow: 'var(--k-shadow-lg)' }}>
            {saving ? '⏳ Saving...' : '✓ Saved'}
          </div>
        )}

      </div>
    </div>
  )
}