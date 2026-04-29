import { useState, useEffect, useCallback } from 'react'
import { getManagedUsers, updateManagedUser, getDepartments, getDesignations } from '../api/client'

interface ManagedUser {
  id: string
  email: string
  full_name: string
  role: string
  employment_status: string
  department_name: string | null
  department_id: string | null
  designation_name: string | null
  designation_id: string | null
  manager_name: string | null
  manager_id: string | null
  hris_external_id: string | null
  hris_sync_source: string | null
  created_at: string
}

const ROLES = ['individual_contributor', 'team_lead', 'manager', 'hr_admin', 'executive']
const STATUSES = ['active', 'on_leave', 'probation', 'inactive']

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  active:    { color: 'var(--k-success-text)', bg: 'var(--k-success-bg)' },
  on_leave:  { color: 'var(--k-warning-text)', bg: 'var(--k-warning-bg)' },
  probation: { color: '#6B21A8', bg: '#F3E8FF' },
  inactive:  { color: 'var(--k-danger-text)', bg: 'var(--k-danger-bg)' },
}

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [designations, setDesignations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Edit form
  const [editForm, setEditForm] = useState<Partial<ManagedUser>>({})

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getManagedUsers({
        search: search || undefined,
        department_id: filterDept || undefined,
        role: filterRole || undefined,
        employment_status: filterStatus || undefined,
      })
      setUsers(data.users)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, filterDept, filterRole, filterStatus])

  useEffect(() => {
    async function loadMeta() {
      const [deptData, desigData] = await Promise.allSettled([getDepartments(), getDesignations()])
      if (deptData.status === 'fulfilled') setDepartments(deptData.value.departments || [])
      if (desigData.status === 'fulfilled') setDesignations(desigData.value.designations || [])
    }
    loadMeta()
  }, [])

  useEffect(() => {
    const timer = setTimeout(loadUsers, 300)
    return () => clearTimeout(timer)
  }, [loadUsers])

  function openEdit(user: ManagedUser) {
    setSelectedUser(user)
    setEditForm({
      full_name: user.full_name,
      role: user.role,
      employment_status: user.employment_status,
      department_id: user.department_id || '',
      designation_id: user.designation_id || '',
    })
  }

  async function saveUser() {
    if (!selectedUser) return
    setSaving(true)
    try {
      await updateManagedUser(selectedUser.id, editForm)
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...editForm,
        department_name: departments.find(d => d.id === editForm.department_id)?.name || u.department_name,
        designation_name: designations.find(d => d.id === editForm.designation_id)?.name || u.designation_name,
      } : u))
      setSaved(true)
      setTimeout(() => { setSaved(false); setSelectedUser(null) }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s] = users.filter(u => u.employment_status === s).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="k-page">

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div className="k-page-title">👥 User Management</div>
          <div className="k-page-sub">View, search, and manage all employees in your organisation</div>
        </div>

        {error && (
          <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--k-danger-text)', display: 'flex', justifyContent: 'space-between' }}>
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--k-danger-text)', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* Status summary */}
        <div className="k-stat-grid k-stat-grid-4" style={{ marginBottom: '24px' }}>
          {[
            { status: 'active',    label: 'Active',    desc: 'Currently employed',  cardClass: 'green'  },
            { status: 'on_leave',  label: 'On Leave',  desc: 'Temporarily away',    cardClass: 'amber'  },
            { status: 'probation', label: 'Probation', desc: 'Trial period',        cardClass: 'purple' },
            { status: 'inactive',  label: 'Inactive',  desc: 'No longer employed',  cardClass: 'accent' },
          ].map(({ status, label, desc, cardClass }) => (
            <div
              key={status}
              className={`k-stat-card ${cardClass}`}
              onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
              style={{
                cursor: 'pointer',
                outline: filterStatus === status ? '2px solid var(--k-brand-primary)' : 'none',
                outlineOffset: '2px',
                transition: 'all var(--k-transition)',
                transform: filterStatus === status ? 'translateY(-2px)' : 'none',
              }}
            >
              <div className="k-stat-label">{label}</div>
              <div className="k-stat-value">{statusCounts[status] || 0}</div>
              <div className="k-stat-trend">
                {filterStatus === status ? '✓ Filtering — click to clear' : desc}
              </div>
            </div>
          ))}
        </div>

{/* Active filter indicator + clear */}
        {(filterStatus || filterDept || filterRole || search) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>Filtering by:</span>
            {filterStatus && (
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--k-brand-primary)', background: 'var(--k-brand-faint)', border: '1px solid var(--k-brand-primary)', padding: '3px 10px', borderRadius: 'var(--k-radius-pill)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {filterStatus.replace('_', ' ')}
                <span onClick={() => setFilterStatus('')} style={{ cursor: 'pointer', fontWeight: 700 }}>✕</span>
              </span>
            )}
            {filterDept && (
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--k-brand-primary)', background: 'var(--k-brand-faint)', border: '1px solid var(--k-brand-primary)', padding: '3px 10px', borderRadius: 'var(--k-radius-pill)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {departments.find(d => d.id === filterDept)?.name}
                <span onClick={() => setFilterDept('')} style={{ cursor: 'pointer', fontWeight: 700 }}>✕</span>
              </span>
            )}
            {filterRole && (
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--k-brand-primary)', background: 'var(--k-brand-faint)', border: '1px solid var(--k-brand-primary)', padding: '3px 10px', borderRadius: 'var(--k-radius-pill)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {filterRole.replace(/_/g, ' ')}
                <span onClick={() => setFilterRole('')} style={{ cursor: 'pointer', fontWeight: 700 }}>✕</span>
              </span>
            )}
            {search && (
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--k-brand-primary)', background: 'var(--k-brand-faint)', border: '1px solid var(--k-brand-primary)', padding: '3px 10px', borderRadius: 'var(--k-radius-pill)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                "{search}"
                <span onClick={() => setSearch('')} style={{ cursor: 'pointer', fontWeight: 700 }}>✕</span>
              </span>
            )}
            <button
              onClick={() => { setFilterStatus(''); setFilterDept(''); setFilterRole(''); setSearch('') }}
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--k-text-muted)', background: 'none', border: '1px solid var(--k-border-default)', padding: '3px 10px', borderRadius: 'var(--k-radius-pill)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}
            >
              Clear all · Show all employees
            </button>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }}
          />
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            style={{ fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}
          >
            <option value="">All Departments</option>
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            style={{ fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}
          >
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        {/* User table */}
        <div className="k-card">
          <div className="k-card-header">
            <div className="k-card-title">Employees</div>
            <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{loading ? 'Loading...' : `${users.length} employees`}</span>
          </div>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Employee', 'Department', 'Designation', 'Role', 'Status', 'Source', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--k-bg-page)', color: 'var(--k-text-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--k-border-default)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const statusStyle = STATUS_COLORS[user.employment_status] || STATUS_COLORS.active
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--k-text-primary)' }}>{user.full_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>{user.email}</div>
                      {user.hris_external_id && (
                        <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', fontFamily: 'var(--k-font-mono)' }}>{user.hris_external_id}</div>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-text-secondary)' }}>
                      {user.department_name || <span style={{ color: 'var(--k-text-muted)', fontStyle: 'italic' }}>Not assigned</span>}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--k-text-secondary)' }}>
                      {user.designation_name || <span style={{ color: 'var(--k-text-muted)', fontStyle: 'italic' }}>Not assigned</span>}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--k-text-secondary)', background: 'var(--k-bg-page)', padding: '2px 8px', borderRadius: '10px', border: '1px solid var(--k-border-default)' }}>
                        {user.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: statusStyle.color, background: statusStyle.bg, padding: '2px 8px', borderRadius: '10px' }}>
                        {user.employment_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {user.hris_sync_source ? (
                        <span style={{ fontSize: '10px', color: 'var(--k-ai-text)', background: 'var(--k-ai-bg)', padding: '2px 8px', borderRadius: '10px' }}>
                          {user.hris_sync_source}
                        </span>
                      ) : user.hris_external_id ? (
                        <span style={{ fontSize: '10px', color: 'var(--k-text-muted)' }}>import</span>
                      ) : (
                        <span style={{ fontSize: '10px', color: 'var(--k-text-muted)' }}>manual</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <button
                        onClick={() => openEdit(user)}
                        style={{ fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-default)', background: 'var(--k-bg-surface)', color: 'var(--k-text-secondary)', cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--k-text-muted)', fontSize: '13px' }}>
                    No employees found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Edit modal */}
        {selectedUser && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--k-bg-surface)', borderRadius: 'var(--k-radius-lg)', padding: '28px', width: '500px', maxWidth: '90vw', boxShadow: 'var(--k-shadow-lg)' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--k-text-primary)', marginBottom: '4px' }}>
                Edit Employee — {selectedUser.full_name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', marginBottom: '20px' }}>{selectedUser.email}</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Full Name</div>
                  <input
                    value={editForm.full_name || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Role</div>
                    <select
                      value={editForm.role || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                      style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Employment Status</div>
                    <select
                      value={editForm.employment_status || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, employment_status: e.target.value }))}
                      style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Department</div>
                    <select
                      value={editForm.department_id || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, department_id: e.target.value }))}
                      style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}
                    >
                      <option value="">Not assigned</option>
                      {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Designation</div>
                    <select
                      value={editForm.designation_id || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, designation_id: e.target.value }))}
                      style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', cursor: 'pointer' }}
                    >
                      <option value="">Not assigned</option>
                      {designations.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button
                  className="k-btn k-btn-primary"
                  onClick={saveUser}
                  disabled={saving}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {saved ? '✓ Saved' : saving ? '⏳ Saving...' : '✓ Save Changes'}
                </button>
                <button
                  className="k-btn k-btn-secondary"
                  onClick={() => setSelectedUser(null)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}