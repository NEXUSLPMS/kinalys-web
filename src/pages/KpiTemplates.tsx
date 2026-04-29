import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  getKpiTemplates, createKpiTemplate, updateKpiTemplate,
  deleteKpiTemplate, applyKpiTemplates, getDepartments,
  getDesignations, getReviewCycles
} from '../api/client'

interface KpiTemplate {
  id: string
  name: string
  description: string | null
  designation_id: string | null
  designation_name: string | null
  department_id: string | null
  department_name: string | null
  weight_pct: number
  metric_type: string
  target_value: number | null
  rag_green_threshold: number | null
  rag_amber_threshold: number | null
 is_mandatory: boolean
  is_system_default: boolean
  created_by_name: string | null
}

const METRIC_TYPES = ['numeric', 'percentage', 'boolean', 'rating']

export default function KpiTemplates() {
  const [templates, setTemplates] = useState<KpiTemplate[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [designations, setDesignations] = useState<any[]>([])
  const [cycles, setCycles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<KpiTemplate | null>(null)
  const [saving, setSaving] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applyResult, setApplyResult] = useState<string | null>(null)
  const [filterDesignation, setFilterDesignation] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [selectedCycle, setSelectedCycle] = useState('')
  const [showDesignationPicker, setShowDesignationPicker] = useState(false)
  const [bulkData, setBulkData] = useState<any[]>([])
  const [bulkUploading, setBulkUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    designation_ids: [] as string[],
    department_id: '',
    weight_pct: 25,
    metric_type: 'numeric',
    target_value: '',
    rag_green_threshold: '',
    rag_amber_threshold: '',
    is_mandatory: true,
  })

  useEffect(() => { loadAll() }, [filterDesignation, filterDept]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    setLoading(true)
    try {
      const [tmplData, deptData, desigData, cycleData] = await Promise.allSettled([
        getKpiTemplates({ designation_id: filterDesignation || undefined, department_id: filterDept || undefined }),
        getDepartments(),
        getDesignations(),
        getReviewCycles(),
      ])
      if (tmplData.status === 'fulfilled') setTemplates(tmplData.value.templates)
      if (deptData.status === 'fulfilled') setDepartments(deptData.value.departments || [])
      if (desigData.status === 'fulfilled') setDesignations(desigData.value.designations || [])
      if (cycleData.status === 'fulfilled') setCycles(cycleData.value.cycles || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingTemplate(null)
    setForm({ name: '', description: '', designation_ids: [], department_id: '', weight_pct: 25, metric_type: 'numeric', target_value: '', rag_green_threshold: '', rag_amber_threshold: '', is_mandatory: true })
    setShowDesignationPicker(false)
    setShowForm(true)
  }

  function openEdit(template: KpiTemplate) {
    setEditingTemplate(template)
    setForm({
      name: template.name,
      description: template.description || '',
      designation_ids: template.designation_id ? [template.designation_id] : [],
      department_id: template.department_id || '',
      weight_pct: template.weight_pct,
      metric_type: template.metric_type,
      target_value: template.target_value?.toString() || '',
      rag_green_threshold: template.rag_green_threshold?.toString() || '',
      rag_amber_threshold: template.rag_amber_threshold?.toString() || '',
      is_mandatory: template.is_mandatory,
    })
    setShowDesignationPicker(false)
    setShowForm(true)
  }

  function validateForm(): string | null {
    if (!form.name.trim()) return 'KPI Name is required'
    if (form.designation_ids.length === 0) return 'At least one designation must be selected'
    if (!form.department_id) return 'Department is required'
    return null
  }

  async function saveTemplate() {
    const validationError = validateForm()
    if (validationError) { setError(validationError); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        target_value: form.target_value ? parseFloat(form.target_value) : null,
        rag_green_threshold: form.rag_green_threshold ? parseFloat(form.rag_green_threshold) : null,
        rag_amber_threshold: form.rag_amber_threshold ? parseFloat(form.rag_amber_threshold) : null,
        department_id: form.department_id,
      }
      if (editingTemplate) {
        const data = await updateKpiTemplate(editingTemplate.id, { ...payload, designation_id: form.designation_ids[0] || null })
        setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, ...data.template } : t))
      } else {
        const data = await createKpiTemplate(payload)
        const newTemplates = data.templates || [data.template]
        setTemplates(prev => [...newTemplates, ...prev])
      }
      setShowForm(false)
      setEditingTemplate(null)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteTemplate(id: string) {
    try {
      await deleteKpiTemplate(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function applyToCycle() {
    if (!selectedCycle) return
    setApplying(true)
    setApplyResult(null)
    try {
      const result = await applyKpiTemplates(selectedCycle)
      setApplyResult(result.message)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setApplying(false)
    }
  }

  function downloadTemplate() {
    const wb = XLSX.utils.book_new()
    const headers = ['KPI Name', 'Description', 'Designation', 'Department', 'Metric Type', 'Weight %', 'Target Value', 'RAG Green Threshold', 'RAG Amber Threshold', 'Is Mandatory (Yes/No)']
    const example = [
      'Average Handle Time', 'Average time to resolve a customer call', 'Customer Service Agent', 'Customer Operations', 'numeric', 25, 180, 150, 180, 'Yes'
    ]
    const ws = XLSX.utils.aoa_to_sheet([headers, example])
    ws['!cols'] = headers.map(() => ({ wch: 22 }))
    XLSX.utils.book_append_sheet(wb, ws, 'KPI Templates')
    XLSX.writeFile(wb, 'kpi_templates_upload.xlsx')
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]
      if (rows.length < 2) { setError('No data rows found in the file'); return }
      const dataRows = rows.slice(1).filter(r => r[0])
      const parsed = dataRows.map(r => ({
        name: r[0]?.toString() || '',
        description: r[1]?.toString() || '',
        designation_name: r[2]?.toString() || '',
        department_name: r[3]?.toString() || '',
        metric_type: r[4]?.toString() || 'numeric',
        weight_pct: parseFloat(r[5]) || 25,
        target_value: r[6] ? parseFloat(r[6]) : null,
        rag_green_threshold: r[7] ? parseFloat(r[7]) : null,
        rag_amber_threshold: r[8] ? parseFloat(r[8]) : null,
        is_mandatory: r[9]?.toString().toLowerCase() !== 'no',
      }))
      setBulkData(parsed)
    }
    reader.readAsBinaryString(file)
  }

  async function processBulkUpload() {
    if (bulkData.length === 0) return
    setBulkUploading(true)
    let successCount = 0
    let failCount = 0
    for (const row of bulkData) {
      try {
        const desig = designations.find(d => d.name.toLowerCase() === row.designation_name.toLowerCase())
        const dept = departments.find(d => d.name.toLowerCase() === row.department_name.toLowerCase())
        if (!desig || !dept) { failCount++; continue }
        await createKpiTemplate({
          ...row,
          designation_ids: [desig.id],
          department_id: dept.id,
        })
        successCount++
      } catch { failCount++ }
    }
    setBulkData([])
    setShowBulkUpload(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    await loadAll()
    setApplyResult(`Bulk upload complete — ${successCount} created, ${failCount} failed`)
    setBulkUploading(false)
  }

  const grouped = templates.reduce((acc, t) => {
    const key = t.designation_name || 'All Designations'
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {} as Record<string, KpiTemplate[]>)

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="k-page">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div className="k-page-title">📋 KPI Templates</div>
            <div className="k-page-sub">Define standard KPIs per designation — auto-applied to all employees when a cycle opens</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="k-btn k-btn-secondary" onClick={() => setShowBulkUpload(true)} style={{ fontSize: '13px' }}>📥 Bulk Upload</button>
            <button className="k-btn k-btn-primary" onClick={openCreate} style={{ fontSize: '13px' }}>+ New KPI Template</button>
          </div>
        </div>

        {error && (
          <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-danger-text)', display: 'flex', justifyContent: 'space-between' }}>
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--k-danger-text)', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* Apply to cycle */}
        <div style={{ background: 'var(--k-bg-surface)', border: '1px solid var(--k-border-default)', borderRadius: 'var(--k-radius-lg)', padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '8px' }}>Apply Templates to Review Cycle</div>
          <div style={{ fontSize: '13px', color: 'var(--k-text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>
            Select a cycle and click Apply — all mandatory templates will be auto-assigned to matching employees. Template KPIs go live immediately.
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select value={selectedCycle} onChange={e => setSelectedCycle(e.target.value)} style={{ fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer', minWidth: '200px' }}>
              <option value="">Select cycle...</option>
              {cycles.map((c: any) => <option key={c.id} value={c.id}>{c.name} — {c.status}</option>)}
            </select>
            <button className="k-btn k-btn-primary" onClick={applyToCycle} disabled={applying || !selectedCycle} style={{ fontSize: '13px', opacity: !selectedCycle ? 0.5 : 1 }}>
              {applying ? '⏳ Applying...' : '🚀 Apply Templates'}
            </button>
          </div>
          {applyResult && <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--k-success-text)', fontWeight: 600 }}>✓ {applyResult}</div>}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
          <select value={filterDesignation} onChange={e => setFilterDesignation(e.target.value)} style={{ fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
            <option value="">All Designations</option>
            {designations.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
            <option value="">All Departments</option>
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <div style={{ fontSize: '13px', color: 'var(--k-text-muted)' }}>{templates.length} templates</div>
        </div>

        {/* Templates grouped by designation */}
        {loading ? (
          <div style={{ fontSize: '14px', color: 'var(--k-text-muted)' }}>Loading templates...</div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--k-text-muted)', fontSize: '14px' }}>
            No KPI templates yet. Click "+ New KPI Template" or "📥 Bulk Upload" to get started.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(grouped).map(([designation, tmplList]) => (
              <div key={designation} className="k-card">
                <div className="k-card-header">
                  <div className="k-card-title">{designation}<span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--k-text-muted)', marginLeft: '8px' }}>{tmplList.length} KPI{tmplList.length !== 1 ? 's' : ''}</span></div>
                  <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>Total weight: {tmplList.reduce((s, t) => s + Number(t.weight_pct), 0).toFixed(0)}%</span>
                </div>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['KPI Name', 'Department', 'Type', 'Target', 'Weight', 'RAG Green', 'RAG Amber', 'Mandatory', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tmplList.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--k-text-primary)' }}>{t.name}</div>
                          {t.description && <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>{t.description}</div>}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-text-secondary)' }}>{t.department_name || '—'}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-text-muted)' }}>{t.metric_type}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{t.target_value ?? '—'}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--k-brand-primary)' }}>{t.weight_pct}%</td>
                        <td style={{ padding: '10px 12px', color: 'var(--k-success-text)' }}>{t.rag_green_threshold ?? '—'}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--k-warning-text)' }}>{t.rag_amber_threshold ?? '—'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: t.is_mandatory ? 'var(--k-success-text)' : 'var(--k-text-muted)', background: t.is_mandatory ? 'var(--k-success-bg)' : 'var(--k-bg-page)', padding: '2px 8px', borderRadius: '10px' }}>
                            {t.is_mandatory ? 'Yes' : 'No'}
                          </span>
                        </td>
                       <td style={{ padding: '10px 12px' }}>
                          {t.is_system_default ? (
                            <span style={{ fontSize: '10px', color: 'var(--k-text-muted)', fontStyle: 'italic' }}>🔒 System default</span>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => openEdit(t)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', color: 'var(--k-text-secondary)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>✏️</button>
                              <button onClick={() => deleteTemplate(t.id)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-danger-border)', background: 'var(--k-danger-bg)', color: 'var(--k-danger-text)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}>✕</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowDesignationPicker(false)}>
            <div style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-lg)', padding: '28px', width: '580px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--k-shadow-lg)' }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '20px' }}>
                {editingTemplate ? 'Edit KPI Template' : 'New KPI Template'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>KPI Name *</div>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Average Handle Time, Customer Satisfaction Score" style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }} autoFocus />
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Description</div>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What does this KPI measure?" rows={2} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Multi-select designation picker */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                      Designation * <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--k-brand-primary)' }}>(multi-select)</span>
                    </div>
                    <div
                      onClick={e => { e.stopPropagation(); setShowDesignationPicker(p => !p) }}
                      style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: `1px solid ${form.designation_ids.length === 0 ? 'var(--k-border-input)' : 'var(--k-brand-primary)'}`, background: 'var(--k-bg-input)', color: form.designation_ids.length > 0 ? 'var(--k-text-primary)' : 'var(--k-text-muted)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '38px' }}
                    >
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px' }}>
                        {form.designation_ids.length === 0 ? 'Select designation(s)...'
                          : form.designation_ids.length === 1 ? designations.find(d => d.id === form.designation_ids[0])?.name
                          : `${form.designation_ids.length} designations selected`}
                      </span>
                      <span style={{ fontSize: '10px', marginLeft: '8px', flexShrink: 0 }}>{showDesignationPicker ? '▲' : '▼'}</span>
                    </div>
                    {/* Selected pills */}
                    {form.designation_ids.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        {form.designation_ids.map(id => {
                          const d = designations.find(x => x.id === id)
                          return d ? (
                            <span key={id} style={{ fontSize: '11px', background: 'var(--k-brand-faint)', color: 'var(--k-brand-primary)', border: '1px solid var(--k-brand-primary)', padding: '2px 8px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {d.name}
                              <span onClick={() => setForm(p => ({ ...p, designation_ids: p.designation_ids.filter(x => x !== id) }))} style={{ cursor: 'pointer', fontWeight: 700, fontSize: '10px' }}>✕</span>
                            </span>
                          ) : null
                        })}
                      </div>
                    )}
                    {showDesignationPicker && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'var(--k-bg-surface)', border: '1px solid var(--k-border-strong)', borderRadius: 'var(--k-radius-md)', boxShadow: 'var(--k-shadow-md)', maxHeight: '220px', overflowY: 'auto', marginTop: '4px' }}>
                        {designations.map((d: any) => {
                          const isSelected = form.designation_ids.includes(d.id)
                          return (
                            <div
                              key={d.id}
                              onClick={() => setForm(p => ({ ...p, designation_ids: isSelected ? p.designation_ids.filter(id => id !== d.id) : [...p.designation_ids, d.id] }))}
                              style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', background: isSelected ? 'var(--k-brand-faint)' : 'transparent', color: isSelected ? 'var(--k-brand-primary)' : 'var(--k-text-primary)' }}
                            >
                              <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${isSelected ? 'var(--k-brand-primary)' : 'var(--k-border-default)'}`, background: isSelected ? 'var(--k-brand-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {isSelected && <span style={{ color: 'white', fontSize: '10px', fontWeight: 700 }}>✓</span>}
                              </div>
                              {d.name}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Department - mandatory */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Department *</div>
                    <select value={form.department_id} onChange={e => setForm(p => ({ ...p, department_id: e.target.value }))} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: `1px solid ${!form.department_id ? 'var(--k-border-input)' : 'var(--k-brand-primary)'}`, background: 'var(--k-bg-input)', color: form.department_id ? 'var(--k-text-primary)' : 'var(--k-text-muted)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
                      <option value="">Select department...</option>
                      {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Metric Type</div>
                    <select value={form.metric_type} onChange={e => setForm(p => ({ ...p, metric_type: e.target.value }))} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}>
                      {METRIC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Weight %</div>
                    <input type="number" value={form.weight_pct} onChange={e => setForm(p => ({ ...p, weight_pct: parseFloat(e.target.value) }))} style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Target Value</div>
                    <input type="number" value={form.target_value} onChange={e => setForm(p => ({ ...p, target_value: e.target.value }))} placeholder="Optional" style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-success-text)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>RAG Green Threshold</div>
                    <input type="number" value={form.rag_green_threshold} onChange={e => setForm(p => ({ ...p, rag_green_threshold: e.target.value }))} placeholder="e.g. 90" style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-success-border)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-warning-text)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>RAG Amber Threshold</div>
                    <input type="number" value={form.rag_amber_threshold} onChange={e => setForm(p => ({ ...p, rag_amber_threshold: e.target.value }))} placeholder="e.g. 75" style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-warning-border)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div onClick={() => setForm(p => ({ ...p, is_mandatory: !p.is_mandatory }))} style={{ width: '48px', height: '26px', borderRadius: '13px', background: form.is_mandatory ? 'var(--k-brand-primary)' : 'var(--k-border-default)', cursor: 'pointer', position: 'relative', transition: 'background var(--k-transition)', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: '3px', left: form.is_mandatory ? '25px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left var(--k-transition)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}/>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-primary)' }}>Mandatory KPI</div>
                    <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>Mandatory KPIs auto-apply to all matching employees — no approval needed</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button className="k-btn k-btn-primary" onClick={saveTemplate} disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? '⏳ Saving...' : editingTemplate ? '✓ Update Template' : '+ Create Template'}
                </button>
                <button className="k-btn k-btn-secondary" onClick={() => { setShowForm(false); setEditingTemplate(null); setShowDesignationPicker(false) }} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Upload modal */}
        {showBulkUpload && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-lg)', padding: '28px', width: '600px', maxWidth: '90vw', boxShadow: 'var(--k-shadow-lg)' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '8px' }}>📥 Bulk Upload KPI Templates</div>
              <div style={{ fontSize: '13px', color: 'var(--k-text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
                Download the Excel template, fill in your KPIs, and upload it here. Designation and Department names must exactly match what is configured in the system.
              </div>

              <button className="k-btn k-btn-secondary" onClick={downloadTemplate} style={{ fontSize: '13px', marginBottom: '20px' }}>
                ⬇️ Download Excel Template
              </button>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Upload File</div>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} style={{ fontSize: '13px', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }} />
              </div>

              {bulkData.length > 0 && (
                <div style={{ background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '16px', border: '1px solid var(--k-border-default)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-success-text)', marginBottom: '8px' }}>✓ {bulkData.length} KPIs ready to import</div>
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {bulkData.map((row, i) => (
                      <div key={i} style={{ fontSize: '12px', color: 'var(--k-text-secondary)', padding: '4px 0', borderBottom: '1px solid var(--k-border-default)', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>{row.name}</span>
                        <span style={{ color: 'var(--k-text-muted)' }}>{row.designation_name} · {row.department_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="k-btn k-btn-primary" onClick={processBulkUpload} disabled={bulkUploading || bulkData.length === 0} style={{ flex: 1, justifyContent: 'center', opacity: bulkData.length === 0 ? 0.5 : 1 }}>
                  {bulkUploading ? '⏳ Uploading...' : `🚀 Import ${bulkData.length} KPIs`}
                </button>
                <button className="k-btn k-btn-secondary" onClick={() => { setShowBulkUpload(false); setBulkData([]); if (fileInputRef.current) fileInputRef.current.value = '' }} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
