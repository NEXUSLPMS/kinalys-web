import { useState, useEffect } from 'react'
import { getTenantSettings, updateTenantSettings, triggerHrisSync, getHrisSyncHistory } from '../api/client'

interface TenantSettings {
  tenant_name: string
  plan: string
  module_mode: 'lms_only' | 'pms_only' | 'unified'
  pending_module_mode: 'lms_only' | 'pms_only' | 'unified' | null
  module_change_date: string | null
  default_methodology: 'copc' | 'six_sigma' | 'okr' | 'balanced_scorecard' | 'custom'
  lms_enabled: boolean
  pms_enabled: boolean
  gamification_enabled: boolean
  ai_coaching_enabled: boolean
  hris_provider: string | null
  hris_last_synced_at: string | null
}

const MODULE_OPTIONS = [
  {
    id: 'lms_only', icon: '📚', name: 'LMS Only', price: '$399/mo',
    desc: 'Full learning management — courses, certifications, gamification, AI recommendations.',
    includes: ['Course catalog', 'SCORM + Video + VILT', 'Certifications', 'Gamification', 'AI recommendations'],
    excludes: ['Performance scorecards', 'KPI management', 'AI coaching'],
  },
  {
    id: 'unified', icon: '🔗', name: 'Unified', price: '$649/mo',
    desc: 'Full LMS + Full PMS + AI Coaching + the LMS-PMS bridge. Every learning hour impacts every performance score.',
    includes: ['Everything in LMS', 'Performance scorecards', 'KPI management', 'AI coaching', 'LMS-PMS bridge', '9-Box talent grid'],
    excludes: [], recommended: true,
  },
  {
    id: 'pms_only', icon: '📊', name: 'PMS Only', price: '$399/mo',
    desc: 'Full performance management — scorecards, KPIs, 360 feedback, AI coaching, talent grid.',
    includes: ['Performance scorecards', 'All methodologies', 'AI coaching', '9-Box talent grid', '360 feedback'],
    excludes: ['Course catalog', 'SCORM content', 'Certifications'],
  },
]

const METHODOLOGY_OPTIONS = [
  { id: 'copc', icon: '🏢', name: 'COPC', desc: 'Contact centres and BPO — AHT, FCR, CSAT, Schedule Adherence, Quality Score' },
  { id: 'six_sigma', icon: '⚙️', name: 'Six Sigma', desc: 'Operations and manufacturing — DPMO, Process Cycle Efficiency, Sigma Level' },
  { id: 'okr', icon: '🎯', name: 'OKR', desc: 'Objectives and Key Results — three-tier hierarchy with interdepartmental dependency scoring' },
  { id: 'balanced_scorecard', icon: '⚖️', name: 'Balanced Scorecard', desc: 'Kaplan-Norton four perspectives — Financial, Customer, Internal Process, Learning & Growth' },
  { id: 'custom', icon: '🔧', name: 'Custom', desc: 'Fully configurable — define your own KPIs, weights, and scoring rules' },
]

const HRIS_OPTIONS = [
  { id: 'darwinbox', name: 'Darwinbox', region: 'India', logo: '🏢' },
  { id: 'zoho_people', name: 'ZOHO People', region: 'India', logo: '🟡' },
  { id: 'keka', name: 'Keka', region: 'India', logo: '🟣' },
  { id: 'greythr', name: 'GreytHR', region: 'India', logo: '🔵' },
  { id: 'bamboohr', name: 'BambooHR', region: 'Global', logo: '🟢' },
  { id: 'bayzat', name: 'Bayzat', region: 'UAE', logo: '🔷' },
  { id: 'workday', name: 'Workday', region: 'Enterprise', logo: '⚪' },
  { id: 'adp', name: 'ADP', region: 'Global', logo: '🔴' },
]

export default function Organisation() {
  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedMessage, setSavedMessage] = useState('Saved')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'modules' | 'methodology' | 'hris' | 'features'>('modules')
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [syncHistory, setSyncHistory] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const data = await getTenantSettings()
        setSettings(data.settings)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function save(updates: Partial<TenantSettings>) {
    if (!settings) return
    setSaving(true)
    try {
      const data = await updateTenantSettings(updates)
      setSettings(data.settings)
      setSavedMessage(data.message || 'Saved')
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function runSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const result = await triggerHrisSync()
      setSyncResult(result)
      const history = await getHrisSyncHistory()
      setSyncHistory(history.history || [])
    } catch (err: any) {
      setSyncResult({ error: err.response?.data?.message || err.message })
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="k-page">
        <div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading organisation settings...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="k-page">
        <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '16px', fontSize: '13px', color: 'var(--k-danger-text)' }}>
          ⚠ Could not load settings: {error}. Make sure the API server is running.
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="k-page">

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div className="k-page-title">🏢 Organisation</div>
          <div className="k-page-sub">
            {settings?.tenant_name} · {settings?.plan} plan · Configure modules, methodology, and integrations
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--k-bg-page)', padding: '4px', borderRadius: 'var(--k-radius-md)', width: 'fit-content' }}>
          {([
            ['modules', '📦 Modules'],
            ['methodology', '🎯 Methodology'],
            ['hris', '🔗 HRIS Sync'],
            ['features', '⚙️ Features'],
          ] as ['modules' | 'methodology' | 'hris' | 'features', string][]).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 18px', borderRadius: 'var(--k-radius-md)', border: 'none',
                background: activeTab === tab ? 'var(--k-bg-surface)' : 'transparent',
                color: activeTab === tab ? 'var(--k-text-primary)' : 'var(--k-text-muted)',
                fontFamily: 'var(--k-font-sans)', fontSize: '13px',
                fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer',
                boxShadow: activeTab === tab ? 'var(--k-shadow-sm)' : 'none',
                transition: 'all var(--k-transition)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── MODULES TAB ─────────────────────────────────────── */}
        {activeTab === 'modules' && (
          <div>
            {settings?.pending_module_mode && settings?.module_change_date && (
              <div style={{
                background: 'var(--k-warning-bg)', border: '1px solid var(--k-warning-border)',
                borderRadius: 'var(--k-radius-md)', padding: '14px 18px', marginBottom: '20px',
                fontSize: '13px', color: 'var(--k-warning-text)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>
                  ⏳ <strong>Pending change:</strong> Switching to{' '}
                  <strong>{settings.pending_module_mode.replace('_', ' ')}</strong> on{' '}
                  <strong>{new Date(settings.module_change_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </span>
                <button
                  onClick={() => save({ pending_module_mode: null, module_change_date: null } as any)}
                  style={{ background: 'none', border: '1px solid var(--k-warning-border)', borderRadius: 'var(--k-radius-md)', padding: '4px 12px', fontSize: '12px', color: 'var(--k-warning-text)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}
                >
                  Cancel change
                </button>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
              {MODULE_OPTIONS.map(mod => (
                <div
                  key={mod.id}
                  onClick={() => !saving && save({ module_mode: mod.id as any })}
                  style={{
                    borderRadius: 'var(--k-radius-lg)',
                    border: `2px solid ${settings?.module_mode === mod.id ? 'var(--k-brand-primary)' : 'var(--k-border-default)'}`,
                    background: settings?.module_mode === mod.id ? 'var(--k-brand-faint)' : 'var(--k-bg-surface)',
                    padding: '24px', cursor: 'pointer', transition: 'all var(--k-transition)', position: 'relative',
                  }}
                >
                  {(mod as any).recommended && (
                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--k-brand-primary)', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 14px', borderRadius: 'var(--k-radius-pill)', whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>
                      MOST POPULAR
                    </div>
                  )}
                  <div style={{ fontSize: '28px', marginBottom: '12px' }}>{mod.icon}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--k-text-primary)' }}>{mod.name}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-brand-primary)' }}>{mod.price}</div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--k-text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>{mod.desc}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {mod.includes.map(f => (
                      <div key={f} style={{ fontSize: '12px', color: 'var(--k-success-text)', display: 'flex', gap: '6px' }}>
                        <span>✓</span><span>{f}</span>
                      </div>
                    ))}
                    {mod.excludes.map(f => (
                      <div key={f} style={{ fontSize: '12px', color: 'var(--k-text-muted)', display: 'flex', gap: '6px', opacity: 0.6 }}>
                        <span>—</span><span>{f}</span>
                      </div>
                    ))}
                  </div>
                  {settings?.module_mode === mod.id && (
                    <div style={{ marginTop: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--k-brand-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>●</span> Currently active
                    </div>
                  )}
                  {settings?.pending_module_mode === mod.id && (
                    <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--k-warning-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⏳</span> Activates {new Date(settings.module_change_date!).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', textAlign: 'center' }}>
              Upgrades take effect immediately · Downgrades activate on the 1st of the following month
            </div>
          </div>
        )}

        {/* ── METHODOLOGY TAB ─────────────────────────────────── */}
        {activeTab === 'methodology' && (
          <div>
            <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--k-text-secondary)', lineHeight: 1.7 }}>
              Select the default performance methodology for your organisation. Department managers can override per department in Sprint 5.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {METHODOLOGY_OPTIONS.map(method => (
                <div
                  key={method.id}
                  onClick={() => save({ default_methodology: method.id as any })}
                  style={{
                    padding: '20px', borderRadius: 'var(--k-radius-lg)',
                    border: `2px solid ${settings?.default_methodology === method.id ? 'var(--k-brand-primary)' : 'var(--k-border-default)'}`,
                    background: settings?.default_methodology === method.id ? 'var(--k-brand-faint)' : 'var(--k-bg-surface)',
                    cursor: 'pointer', transition: 'all var(--k-transition)',
                    display: 'flex', gap: '16px', alignItems: 'flex-start',
                  }}
                >
                  <div style={{ fontSize: '28px', flexShrink: 0 }}>{method.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--k-text-primary)' }}>{method.name}</div>
                      {settings?.default_methodology === method.id && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--k-brand-primary)', background: 'var(--k-brand-faint)', padding: '2px 8px', borderRadius: 'var(--k-radius-pill)' }}>ACTIVE</span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--k-text-muted)', lineHeight: 1.6 }}>{method.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '20px', padding: '16px', borderRadius: 'var(--k-radius-md)', background: 'var(--k-ai-bg)', border: '1px solid var(--k-ai-border)', fontSize: '13px', color: 'var(--k-ai-text)', lineHeight: 1.7 }}>
              🤖 <strong>Coming in Sprint 5:</strong> Per-department methodology override.
            </div>
          </div>
        )}

        {/* ── HRIS TAB ────────────────────────────────────────── */}
        {activeTab === 'hris' && (
          <div>
            <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--k-text-secondary)', lineHeight: 1.7 }}>
              Connect your HRIS to sync employees automatically. New joiners appear in Kinalys within hours. Terminations and department changes sync overnight.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }}>
              {HRIS_OPTIONS.map(hris => (
                <div
                  key={hris.id}
                  onClick={() => save({ hris_provider: hris.id })}
                  style={{
                    padding: '16px', borderRadius: 'var(--k-radius-lg)',
                    border: `2px solid ${settings?.hris_provider === hris.id ? 'var(--k-brand-primary)' : 'var(--k-border-default)'}`,
                    background: settings?.hris_provider === hris.id ? 'var(--k-brand-faint)' : 'var(--k-bg-surface)',
                    cursor: 'pointer', transition: 'all var(--k-transition)', textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{hris.logo}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-primary)', marginBottom: '4px' }}>{hris.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>{hris.region}</div>
                  {settings?.hris_provider === hris.id && (
                    <div style={{ marginTop: '8px', fontSize: '10px', fontWeight: 700, color: 'var(--k-brand-primary)' }}>● SELECTED</div>
                  )}
                </div>
              ))}
            </div>

            {settings?.hris_provider ? (
              <div style={{ padding: '20px', borderRadius: 'var(--k-radius-lg)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '12px' }}>
                  {HRIS_OPTIONS.find(h => h.id === settings.hris_provider)?.name} — Manual Sync
                </div>
                <div style={{ fontSize: '13px', color: 'var(--k-text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>
                  Phase 1 — Manual trigger. Click Sync Now to pull the latest employee list. Scheduled nightly sync coming in Sprint 6.
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <button className="k-btn k-btn-primary" onClick={runSync} disabled={syncing} style={{ fontSize: '13px' }}>
                    {syncing ? '⏳ Syncing...' : '🔄 Sync Now'}
                  </button>
                  <button className="k-btn k-btn-secondary" style={{ fontSize: '13px' }}>
                    ⚙️ Configure Connection
                  </button>
                </div>

                {syncResult && !syncResult.error && (
                  <div style={{ background: 'var(--k-success-bg)', border: '1px solid var(--k-success-border)', borderRadius: 'var(--k-radius-md)', padding: '14px 18px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-success-text)', marginBottom: '8px' }}>✓ {syncResult.message}</div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--k-success-text)' }}>
                      <span>📥 Fetched: {syncResult.records_fetched}</span>
                      <span>✓ Created: {syncResult.created}</span>
                      <span>↻ Updated: {syncResult.updated}</span>
                      {syncResult.failed > 0 && <span style={{ color: 'var(--k-danger-text)' }}>⚠ Failed: {syncResult.failed}</span>}
                    </div>
                  </div>
                )}

                {syncResult?.error && (
                  <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '14px 18px', marginBottom: '16px', fontSize: '13px', color: 'var(--k-danger-text)' }}>
                    ⚠ Sync failed: {syncResult.error}
                  </div>
                )}

                {syncHistory.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Recent Syncs</div>
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Date', 'Status', 'Fetched', 'Created', 'Updated', 'Failed'].map(h => (
                            <th key={h} style={{ padding: '6px 10px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {syncHistory.map((job: any) => (
                          <tr key={job.id} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                            <td style={{ padding: '6px 10px', color: 'var(--k-text-muted)' }}>
                              {new Date(job.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td style={{ padding: '6px 10px' }}>
                              <span className={`k-pill ${job.status === 'completed' ? 'green' : job.status === 'failed' ? 'red' : 'amber'}`}>{job.status}</span>
                            </td>
                            <td style={{ padding: '6px 10px' }}>{job.records_fetched}</td>
                            <td style={{ padding: '6px 10px', color: 'var(--k-success-text)' }}>{job.records_created}</td>
                            <td style={{ padding: '6px 10px' }}>{job.records_updated}</td>
                            <td style={{ padding: '6px 10px', color: job.records_failed > 0 ? 'var(--k-danger-text)' : 'var(--k-text-muted)' }}>{job.records_failed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--k-text-muted)' }}>
                  Last synced: {settings?.hris_last_synced_at
                    ? new Date(settings.hris_last_synced_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Never'} · Scheduled sync: Sprint 6
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', borderRadius: 'var(--k-radius-md)', background: 'var(--k-bg-page)', border: '1px solid var(--k-border-default)', fontSize: '13px', color: 'var(--k-text-muted)', textAlign: 'center', lineHeight: 1.7 }}>
                No HRIS connected yet. Select your HRIS above to enable sync.<br/>
                No HRIS? Use <strong style={{ color: 'var(--k-text-primary)' }}>Excel Import</strong> to bulk-load your team.
              </div>
            )}
          </div>
        )}

        {/* ── FEATURES TAB ────────────────────────────────────── */}
        {activeTab === 'features' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'gamification_enabled', icon: '🏆', title: 'Gamification', desc: 'Points, badges, leaderboards, and streaks for learning activity' },
              { key: 'ai_coaching_enabled', icon: '🤖', title: 'AI Coaching', desc: 'AI-generated coaching recommendations, at-risk detection, and course suggestions (Sprint 7)' },
            ].map(feature => (
              <div
                key={feature.key}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderRadius: 'var(--k-radius-lg)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)' }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '28px' }}>{feature.icon}</div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '4px' }}>{feature.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--k-text-muted)', lineHeight: 1.5 }}>{feature.desc}</div>
                  </div>
                </div>
                <div
                  onClick={() => save({ [feature.key]: !settings?.[feature.key as keyof TenantSettings] } as any)}
                  style={{ width: '48px', height: '26px', borderRadius: '13px', background: settings?.[feature.key as keyof TenantSettings] ? 'var(--k-brand-primary)' : 'var(--k-border-default)', cursor: 'pointer', position: 'relative', transition: 'background var(--k-transition)', flexShrink: 0 }}
                >
                  <div style={{ position: 'absolute', top: '3px', left: settings?.[feature.key as keyof TenantSettings] ? '25px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left var(--k-transition)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {(saving || saved) && (
          <div style={{ position: 'fixed', bottom: '32px', right: '32px', background: saved ? 'var(--k-success-solid)' : 'var(--k-bg-topbar)', color: 'white', padding: '12px 20px', borderRadius: 'var(--k-radius-md)', fontSize: '13px', fontWeight: 600, boxShadow: 'var(--k-shadow-lg)', transition: 'all var(--k-transition)', maxWidth: '320px' }}>
            {saving ? '⏳ Saving...' : `✓ ${savedMessage}`}
          </div>
        )}

      </div>
    </div>
  )
}