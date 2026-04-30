import { useState, useEffect } from 'react'
import { getSixSigmaData, saveSixSigmaData } from '../api/client'

// DPMO to Sigma level conversion table
const SIGMA_TABLE = [
  { sigma: 6.0, dpmo: 3.4,     yield: 99.99966 },
  { sigma: 5.5, dpmo: 32,      yield: 99.997 },
  { sigma: 5.0, dpmo: 233,     yield: 99.977 },
  { sigma: 4.5, dpmo: 1350,    yield: 99.865 },
  { sigma: 4.0, dpmo: 6210,    yield: 99.379 },
  { sigma: 3.5, dpmo: 22750,   yield: 97.725 },
  { sigma: 3.0, dpmo: 66807,   yield: 93.319 },
  { sigma: 2.5, dpmo: 158655,  yield: 84.134 },
  { sigma: 2.0, dpmo: 308538,  yield: 69.146 },
  { sigma: 1.5, dpmo: 500000,  yield: 50.000 },
  { sigma: 1.0, dpmo: 691462,  yield: 30.854 },
]

function dpmoToSigma(dpmo: number): number {
  if (dpmo <= 3.4) return 6.0
  if (dpmo >= 691462) return 1.0
  for (let i = 0; i < SIGMA_TABLE.length - 1; i++) {
    const upper = SIGMA_TABLE[i]
    const lower = SIGMA_TABLE[i + 1]
    if (dpmo >= upper.dpmo && dpmo <= lower.dpmo) {
      const ratio = (dpmo - upper.dpmo) / (lower.dpmo - upper.dpmo)
      return upper.sigma - ratio * (upper.sigma - lower.sigma)
    }
  }
  return 1.0
}

function calculateDPMO(defects: number, opportunities: number, units: number): number {
  if (opportunities <= 0 || units <= 0) return 0
  return (defects / (opportunities * units)) * 1_000_000
}

function getSigmaColor(sigma: number): string {
  if (sigma >= 5) return '#0F6E56'
  if (sigma >= 4) return '#1D9E75'
  if (sigma >= 3) return '#B45309'
  if (sigma >= 2) return '#DC6803'
  return '#B91C1C'
}

function getSigmaLabel(sigma: number): string {
  if (sigma >= 5.5) return 'World Class'
  if (sigma >= 4.5) return 'Industry Leading'
  if (sigma >= 3.5) return 'Average Industry'
  if (sigma >= 2.5) return 'Below Average'
  return 'Needs Significant Improvement'
}

const INDUSTRY_BENCHMARKS = [
  { industry: 'Best in Class (Six Sigma)', sigma: 6.0, dpmo: 3.4 },
  { industry: 'Healthcare', sigma: 4.0, dpmo: 6210 },
  { industry: 'BPO / Contact Centre', sigma: 3.5, dpmo: 22750 },
  { industry: 'Financial Services', sigma: 4.5, dpmo: 1350 },
  { industry: 'Manufacturing', sigma: 4.0, dpmo: 6210 },
  { industry: 'Average Company', sigma: 3.0, dpmo: 66807 },
]

const PROCESS_PRESETS = [
  { name: 'Call Handling Accuracy', opportunities: 1, units: 1000, defects: 50 },
  { name: 'Data Entry', opportunities: 5, units: 500, defects: 25 },
  { name: 'Invoice Processing', opportunities: 8, units: 200, defects: 10 },
  { name: 'Customer Complaint Resolution', opportunities: 3, units: 300, defects: 30 },
]

export default function SixSigma() {
  const [defects, setDefects] = useState<string>('50')
  const [opportunities, setOpportunities] = useState<string>('1')
  const [units, setUnits] = useState<string>('1000')
  const [processName, setProcessName] = useState<string>('Call Handling Accuracy')
  const [history, setHistory] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const d = parseFloat(defects) || 0
  const o = parseFloat(opportunities) || 1
  const u = parseFloat(units) || 1

  const dpmo = calculateDPMO(d, o, u)
  const sigma = dpmoToSigma(dpmo)
  const processYield = 100 - (dpmo / 10000)
  const sigmaRounded = Math.round(sigma * 10) / 10
  const dpmoRounded = Math.round(dpmo)

  function loadPreset(preset: typeof PROCESS_PRESETS[0]) {
    setProcessName(preset.name)
    setDefects(String(preset.defects))
    setOpportunities(String(preset.opportunities))
    setUnits(String(preset.units))
  }

  function addToHistory() {
    const entry = {
      id: Date.now(),
      process: processName,
      defects: d,
      opportunities: o,
      units: u,
      dpmo: dpmoRounded,
      sigma: sigmaRounded,
      yield: Math.round(processYield * 100) / 100,
      timestamp: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    }
    setHistory(prev => [entry, ...prev.slice(0, 9)])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="k-page">

        <div style={{ marginBottom: '24px' }}>
          <div className="k-page-title">Six Sigma DPMO Calculator</div>
          <div className="k-page-sub">Defects Per Million Opportunities · Sigma Level · Process Yield</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

          {/* Calculator */}
          <div className="k-card">
            <div className="k-card-header">
              <div className="k-card-title">Process Calculator</div>
            </div>

            {/* Presets */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Quick Presets</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {PROCESS_PRESETS.map(preset => (
                  <button key={preset.name} onClick={() => loadPreset(preset)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: processName === preset.name ? 'var(--k-brand-faint)' : 'var(--k-bg-page)', color: processName === preset.name ? 'var(--k-brand-primary)' : 'var(--k-text-muted)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Process Name</div>
                <input value={processName} onChange={e => setProcessName(e.target.value)} placeholder="e.g. Call Handling Accuracy" style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Defects</div>
                  <input type="number" value={defects} onChange={e => setDefects(e.target.value)} min="0" style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Opportunities</div>
                  <input type="number" value={opportunities} onChange={e => setOpportunities(e.target.value)} min="1" style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Units</div>
                  <input type="number" value={units} onChange={e => setUnits(e.target.value)} min="1" style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }} />
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', lineHeight: 1.6, background: 'var(--k-bg-page)', padding: '10px 12px', borderRadius: 'var(--k-radius-md)' }}>
                <strong>DPMO</strong> = (Defects / (Opportunities × Units)) × 1,000,000<br/>
                <strong>Example:</strong> 50 defects in 1,000 calls with 1 opportunity each = 50,000 DPMO = ~3.1σ
              </div>

              <button onClick={addToHistory} style={{ padding: '10px', borderRadius: 'var(--k-radius-md)', background: 'var(--k-brand-primary)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--k-font-sans)' }}>
                {saved ? '✓ Saved to History' : 'Save to History'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Sigma level display */}
            <div style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-lg)', border: `2px solid ${getSigmaColor(sigma)}`, padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>Sigma Level</div>
              <div style={{ fontSize: '64px', fontWeight: 800, color: getSigmaColor(sigma), lineHeight: 1, marginBottom: '4px' }}>{sigmaRounded}σ</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: getSigmaColor(sigma), marginBottom: '16px' }}>{getSigmaLabel(sigma)}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>DPMO</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--k-text-primary)' }}>{dpmoRounded.toLocaleString()}</div>
                </div>
                <div style={{ background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Process Yield</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--k-text-primary)' }}>{Math.min(99.99966, Math.max(0, 100 - dpmo / 10000)).toFixed(2)}%</div>
                </div>
              </div>
            </div>

            {/* Sigma scale visual */}
            <div style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-lg)', border: '1px solid var(--k-border-default)', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Sigma Scale</div>
              {[6, 5, 4, 3, 2, 1].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{ width: '28px', fontSize: '12px', fontWeight: 700, color: getSigmaColor(s), textAlign: 'right' }}>{s}σ</div>
                  <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'var(--k-border-default)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(s / 6) * 100}%`, background: getSigmaColor(s), borderRadius: '4px', position: 'relative' }}>
                      {Math.abs(sigmaRounded - s) < 0.3 && (
                        <div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: getSigmaColor(sigma), border: '2px solid white' }}/>
                      )}
                    </div>
                  </div>
                  <div style={{ width: '80px', fontSize: '10px', color: 'var(--k-text-muted)' }}>
                    {s === 6 ? '3.4 DPMO' : s === 5 ? '233 DPMO' : s === 4 ? '6,210 DPMO' : s === 3 ? '66,807 DPMO' : s === 2 ? '308,538 DPMO' : '691,462 DPMO'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Industry benchmarks */}
        <div className="k-card" style={{ marginBottom: '20px' }}>
          <div className="k-card-header">
            <div className="k-card-title">Industry Benchmarks</div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: getSigmaColor(sigma), background: 'var(--k-bg-page)', padding: '2px 10px', borderRadius: '8px' }}>
              Your process: {sigmaRounded}σ
            </span>
          </div>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Industry', 'Typical Sigma', 'DPMO', 'vs Your Process'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INDUSTRY_BENCHMARKS.map(bench => {
                const diff = sigmaRounded - bench.sigma
                return (
                  <tr key={bench.industry} style={{ borderBottom: '1px solid var(--k-border-default)', background: bench.industry === 'BPO / Contact Centre' ? 'var(--k-brand-faint)' : 'transparent' }}>
                    <td style={{ padding: '10px 12px', fontWeight: bench.industry === 'BPO / Contact Centre' ? 700 : 400, color: 'var(--k-text-primary)' }}>
                      {bench.industry}
                      {bench.industry === 'BPO / Contact Centre' && <span style={{ fontSize: '10px', color: 'var(--k-brand-primary)', marginLeft: '6px' }}>Your target market</span>}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: getSigmaColor(bench.sigma) }}>{bench.sigma}σ</td>
                    <td style={{ padding: '10px 12px', color: 'var(--k-text-muted)' }}>{bench.dpmo.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: diff >= 0 ? '#0F6E56' : '#B91C1C' }}>
                        {diff >= 0 ? `+${diff.toFixed(1)}σ above` : `${Math.abs(diff).toFixed(1)}σ below`}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="k-card">
            <div className="k-card-header">
              <div className="k-card-title">Calculation History</div>
              <button onClick={() => setHistory([])} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'transparent', color: 'var(--k-text-muted)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>Clear</button>
            </div>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Process', 'Defects', 'Units', 'DPMO', 'Sigma', 'Yield', 'Date'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((entry: any) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--k-text-primary)' }}>{entry.process}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--k-text-muted)' }}>{entry.defects}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--k-text-muted)' }}>{entry.units}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--k-text-muted)' }}>{entry.dpmo.toLocaleString()}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: getSigmaColor(entry.sigma) }}>{entry.sigma}σ</td>
                    <td style={{ padding: '8px 12px', color: 'var(--k-text-muted)' }}>{entry.yield}%</td>
                    <td style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--k-text-muted)' }}>{entry.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}