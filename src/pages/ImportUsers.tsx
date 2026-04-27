import { useState, useRef } from 'react'
import { apiClient } from '../api/client'

interface ValidationResult {
  total_rows: number
  valid_rows: number
  invalid_rows: number
  valid: any[]
  invalid: any[]
  ready_to_import: boolean
}

interface ImportResult {
  message: string
  job_id: string
  created: number
  failed: number
  results: any[]
}

export default function ImportUsers() {
  const [step, setStep] = useState<'upload' | 'validate' | 'confirm' | 'complete'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function downloadTemplate() {
    try {
      const response = await apiClient.get('/import/template', { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Kinalys_User_Import_Template.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError('Could not download template. Make sure the API is running.')
    }
  }

  async function validateFile() {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await apiClient.post('/import/validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setValidation(response.data)
      setStep('validate')
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  async function processImport() {
    if (!validation) return
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.post('/import/process', {
        rows: validation.valid,
        filename: file?.name,
      })
      setImportResult(response.data)
      setStep('complete')
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep('upload')
    setFile(null)
    setValidation(null)
    setImportResult(null)
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="k-page">

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div className="k-page-title">📥 Import Users</div>
          <div className="k-page-sub">Bulk-load your team using the Kinalys Excel template</div>
        </div>

        {/* Progress steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          {[
            ['upload', '1', 'Upload'],
            ['validate', '2', 'Validate'],
            ['confirm', '3', 'Confirm'],
            ['complete', '4', 'Complete'],
          ].map(([s, num, label], idx) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: step === s ? 'var(--k-brand-primary)' :
                  ['upload', 'validate', 'confirm', 'complete'].indexOf(step) > idx ? 'var(--k-success-solid)' : 'var(--k-border-default)',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, flexShrink: 0,
              }}>
                {['upload', 'validate', 'confirm', 'complete'].indexOf(step) > idx ? '✓' : num}
              </div>
              <span style={{
                fontSize: '13px', fontWeight: step === s ? 600 : 400,
                color: step === s ? 'var(--k-text-primary)' : 'var(--k-text-muted)',
              }}>{label}</span>
              {idx < 3 && <div style={{ width: '32px', height: '1px', background: 'var(--k-border-default)' }}/>}
            </div>
          ))}
        </div>

        {error && (
          <div style={{
            background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)',
            borderRadius: 'var(--k-radius-md)', padding: '12px 16px',
            marginBottom: '20px', fontSize: '13px', color: 'var(--k-danger-text)',
          }}>
            ⚠ {error}
          </div>
        )}

        {/* ── STEP 1: UPLOAD ──────────────────────────────── */}
        {step === 'upload' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            <div className="k-card">
              <div className="k-card-header">
                <div className="k-card-title">Step 1 — Download Template</div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--k-text-muted)', marginBottom: '16px', lineHeight: 1.7 }}>
                Download the Kinalys Excel template. Fill in your employee data in the Users sheet. Do not change the column headers.
              </p>
              <div style={{ fontSize: '13px', color: 'var(--k-text-secondary)', marginBottom: '16px' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>Required columns:</div>
                {['Full Name', 'Email', 'Role', 'Department', 'Designation', 'Employment Status'].map(col => (
                  <div key={col} style={{ display: 'flex', gap: '6px', marginBottom: '4px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--k-success-text)' }}>✓</span>
                    <span>{col}</span>
                  </div>
                ))}
                <div style={{ fontWeight: 600, margin: '8px 0', }}>Optional columns:</div>
                {['Manager Email', 'Employee ID'].map(col => (
                  <div key={col} style={{ display: 'flex', gap: '6px', marginBottom: '4px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--k-text-muted)' }}>—</span>
                    <span>{col}</span>
                  </div>
                ))}
              </div>
              <button className="k-btn k-btn-primary" onClick={downloadTemplate}>
                📥 Download Template
              </button>
            </div>

            <div className="k-card">
              <div className="k-card-header">
                <div className="k-card-title">Step 2 — Upload Filled Template</div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--k-text-muted)', marginBottom: '16px', lineHeight: 1.7 }}>
                Once you have filled in the template, upload it here. Kinalys will validate every row before creating any users.
              </p>

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${file ? 'var(--k-brand-primary)' : 'var(--k-border-default)'}`,
                  borderRadius: 'var(--k-radius-lg)',
                  padding: '32px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: file ? 'var(--k-brand-faint)' : 'var(--k-bg-page)',
                  transition: 'all var(--k-transition)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
                {file ? (
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--k-brand-primary)' }}>{file.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', marginTop: '4px' }}>
                      {(file.size / 1024).toFixed(1)} KB · Click to change
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--k-text-primary)' }}>Click to select file</div>
                    <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', marginTop: '4px' }}>.xlsx files only</div>
                  </div>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".xlsx"
                style={{ display: 'none' }}
                onChange={e => setFile(e.target.files?.[0] || null)}
              />

              <button
                className="k-btn k-btn-primary"
                onClick={validateFile}
                disabled={!file || loading}
                style={{ width: '100%', justifyContent: 'center', opacity: !file ? 0.5 : 1 }}
              >
                {loading ? '⏳ Validating...' : '✓ Validate File'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: VALIDATION RESULTS ──────────────────── */}
        {step === 'validate' && validation && (
          <div>
            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
              <div className="k-stat-card green">
                <div className="k-stat-label">Valid Rows</div>
                <div className="k-stat-value">{validation.valid_rows}</div>
                <div className="k-stat-trend up">Ready to import</div>
              </div>
              <div className={`k-stat-card ${validation.invalid_rows > 0 ? 'red' : 'green'}`}>
                <div className="k-stat-label">Invalid Rows</div>
                <div className="k-stat-value">{validation.invalid_rows}</div>
                <div className="k-stat-trend">{validation.invalid_rows > 0 ? 'Needs fixing' : 'None'}</div>
              </div>
              <div className="k-stat-card accent">
                <div className="k-stat-label">Total Rows</div>
                <div className="k-stat-value">{validation.total_rows}</div>
                <div className="k-stat-trend">In uploaded file</div>
              </div>
            </div>

            {/* Invalid rows */}
            {validation.invalid_rows > 0 && (
              <div className="k-card" style={{ marginBottom: '20px' }}>
                <div className="k-card-header">
                  <div className="k-card-title" style={{ color: 'var(--k-danger-text)' }}>⚠ Rows with errors</div>
                  <span className="k-pill red">{validation.invalid_rows} errors</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {validation.invalid.map((row: any) => (
                    <div key={row.row_number} style={{
                      padding: '12px 16px', borderRadius: 'var(--k-radius-md)',
                      background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)',
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-danger-text)', marginBottom: '6px' }}>
                        Row {row.row_number} — {row.email || 'No email'}
                      </div>
                      {row.errors.map((err: string, i: number) => (
                        <div key={i} style={{ fontSize: '12px', color: 'var(--k-danger-text)', marginBottom: '2px' }}>
                          • {err}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Valid rows preview */}
            {validation.valid_rows > 0 && (
              <div className="k-card" style={{ marginBottom: '20px' }}>
                <div className="k-card-header">
                  <div className="k-card-title">✓ Valid rows — ready to import</div>
                  <span className="k-pill green">{validation.valid_rows} users</span>
                </div>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Row', 'Name', 'Email', 'Role', 'Department', 'Designation'].map(h => (
                        <th key={h} style={{
                          padding: '8px 12px', textAlign: 'left',
                          background: 'var(--k-bg-page)', color: 'var(--k-text-muted)',
                          fontWeight: 700, fontSize: '11px', textTransform: 'uppercase',
                          borderBottom: '1px solid var(--k-border-default)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validation.valid.slice(0, 10).map((row: any) => (
                      <tr key={row.row_number} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--k-text-muted)' }}>{row.row_number}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>{row.full_name}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--k-text-muted)' }}>{row.email}</td>
                        <td style={{ padding: '8px 12px' }}>{row.role}</td>
                        <td style={{ padding: '8px 12px' }}>{row.department}</td>
                        <td style={{ padding: '8px 12px' }}>{row.designation}</td>
                      </tr>
                    ))}
                    {validation.valid.length > 10 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '8px 12px', color: 'var(--k-text-muted)', fontStyle: 'italic', fontSize: '12px' }}>
                          ...and {validation.valid.length - 10} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="k-btn k-btn-secondary" onClick={reset}>
                ← Upload Different File
              </button>
              {validation.ready_to_import && (
                <button
                  className="k-btn k-btn-primary"
                  onClick={() => setStep('confirm')}
                >
                  Continue to Import →
                </button>
              )}
              {!validation.ready_to_import && (
                <div style={{ fontSize: '13px', color: 'var(--k-warning-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚠ Fix the errors above and re-upload before importing
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: CONFIRM ─────────────────────────────── */}
        {step === 'confirm' && validation && (
          <div className="k-card" style={{ maxWidth: '560px' }}>
            <div className="k-card-header">
              <div className="k-card-title">Confirm Import</div>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--k-text-secondary)', lineHeight: 1.8, marginBottom: '24px' }}>
              You are about to create <strong style={{ color: 'var(--k-text-primary)' }}>{validation.valid_rows} users</strong> in Kinalys.
              <br/><br/>
              For each user, Kinalys will:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {[
                'Create an Auth0 account with a temporary password',
                'Send a welcome email with a password reset link',
                'Create a user profile in the Kinalys database',
                'Assign the correct department and designation',
                'Record the import in the audit log',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'var(--k-text-secondary)' }}>
                  <span style={{ color: 'var(--k-success-text)', flexShrink: 0 }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div style={{
              background: 'var(--k-warning-bg)', border: '1px solid var(--k-warning-border)',
              borderRadius: 'var(--k-radius-md)', padding: '12px 16px',
              fontSize: '13px', color: 'var(--k-warning-text)', marginBottom: '24px',
            }}>
              ⚠ This action cannot be undone. Users will receive welcome emails immediately.
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="k-btn k-btn-secondary" onClick={() => setStep('validate')}>
                ← Back
              </button>
              <button
                className="k-btn k-btn-primary"
                onClick={processImport}
                disabled={loading}
              >
                {loading ? '⏳ Creating users...' : `🚀 Import ${validation.valid_rows} Users`}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: COMPLETE ────────────────────────────── */}
        {step === 'complete' && importResult && (
          <div>
            <div className="k-card" style={{ marginBottom: '20px', borderLeft: '4px solid var(--k-success-solid)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎉</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '8px' }}>
                Import Complete
              </div>
              <div style={{ fontSize: '14px', color: 'var(--k-text-secondary)', marginBottom: '16px' }}>
                {importResult.message}
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--k-success-text)' }}>
                  ✓ {importResult.created} users created successfully
                </div>
                {importResult.failed > 0 && (
                  <div style={{ fontSize: '13px', color: 'var(--k-danger-text)' }}>
                    ⚠ {importResult.failed} users failed
                  </div>
                )}
              </div>
              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--k-text-muted)' }}>
                Job ID: {importResult.job_id}
              </div>
            </div>

            {/* Results table */}
            <div className="k-card" style={{ marginBottom: '20px' }}>
              <div className="k-card-header">
                <div className="k-card-title">Import Results</div>
              </div>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Row', 'Email', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '8px 12px', textAlign: 'left',
                        background: 'var(--k-bg-page)', color: 'var(--k-text-muted)',
                        fontWeight: 700, fontSize: '11px', textTransform: 'uppercase',
                        borderBottom: '1px solid var(--k-border-default)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importResult.results.map((r: any) => (
                    <tr key={r.row_number} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                      <td style={{ padding: '8px 12px', color: 'var(--k-text-muted)' }}>{r.row_number}</td>
                      <td style={{ padding: '8px 12px' }}>{r.email}</td>
                      <td style={{ padding: '8px 12px' }}>
                        {r.status === 'success' ? (
                          <span className="k-pill green">✓ Created</span>
                        ) : (
                          <span className="k-pill red">⚠ {r.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="k-btn k-btn-secondary" onClick={reset}>
              Import More Users
            </button>
          </div>
        )}

      </div>
    </div>
  )
}