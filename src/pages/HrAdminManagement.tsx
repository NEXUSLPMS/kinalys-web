import { useState, useEffect } from 'react'
import { getHrAdmins } from '../api/client'

export default function HrAdminManagement() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const result = await getHrAdmins()
      setData(result)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load HR Admins')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="k-page"><div style={{ color: 'var(--k-text-muted)', padding: '40px 0', fontSize: '14px' }}>Loading...</div></div>
  if (error) return <div className="k-page"><div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', fontSize: '13px', color: 'var(--k-danger-text)' }}>{error}</div></div>

  return (
    <div className="k-page">
      <div style={{ marginBottom: '24px' }}>
        <div className="k-page-title">HR Admin Management</div>
        <div className="k-page-sub">Only the Org Admin can assign or remove HR Admin access. Maximum 2 active HR Admins per organisation.</div>
      </div>

      {/* Slots indicator */}
      <div className="k-card" style={{ marginBottom: '24px', padding: '20px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', fontWeight: 800, color: 'var(--k-brand-primary)', fontFamily: 'var(--k-font-display)' }}>{data?.count || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', marginTop: '4px' }}>Active HR Admins</div>
        </div>
        <div style={{ width: '1px', height: '60px', background: 'var(--k-border-default)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', fontWeight: 800, color: data?.slots_remaining > 0 ? 'var(--k-success-text)' : 'var(--k-danger-text)', fontFamily: 'var(--k-font-display)' }}>{data?.slots_remaining}</div>
          <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', marginTop: '4px' }}>Slots Remaining</div>
        </div>
        <div style={{ width: '1px', height: '60px', background: 'var(--k-border-default)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-primary)', marginBottom: '6px' }}>Why only 2 HR Admins?</div>
          <div style={{ fontSize: '12px', color: 'var(--k-text-muted)', lineHeight: 1.6 }}>
            Limiting HR Admin access to 2 users ensures accountability and prevents privilege creep. One can serve as the primary administrator, the other as a fallback for leave or absence. All other HR staff should have Manager, Team Lead, or Employee access.
          </div>
        </div>
      </div>

      {/* HR Admin list */}
      <div className="k-card">
        <div className="k-card-header">
          <div className="k-card-title">Active HR Admins</div>
          {data?.slots_remaining > 0 ? (
            <span style={{ fontSize: '12px', color: 'var(--k-success-text)', background: 'var(--k-success-bg)', padding: '3px 10px', borderRadius: '20px', fontWeight: 600 }}>
              {data.slots_remaining} slot{data.slots_remaining !== 1 ? 's' : ''} available
            </span>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--k-danger-text)', background: 'var(--k-danger-bg)', padding: '3px 10px', borderRadius: '20px', fontWeight: 600 }}>
              Maximum reached
            </span>
          )}
        </div>

        {data?.hr_admins?.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--k-text-muted)', fontSize: '13px' }}>
            No HR Admins assigned yet. Go to User Management to assign the HR Admin role to a user.
          </div>
        )}

        {data?.hr_admins?.map((admin: any) => (
          <div key={admin.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--k-border-default)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--k-brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
              {admin.full_name?.charAt(0) || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--k-text-primary)' }}>{admin.full_name}</div>
              <div style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{admin.email} · {admin.department_name || 'No department'}</div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-success-text)', background: 'var(--k-success-bg)', padding: '3px 10px', borderRadius: '20px' }}>
              HR Admin
            </span>
            <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>
              Since {new Date(admin.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        ))}
      </div>

      {/* Rules card */}
      <div className="k-card" style={{ marginTop: '20px', padding: '20px', background: 'var(--k-warning-bg)', border: '1px solid var(--k-warning-border, #fcd34d)' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-warning-text)', marginBottom: '10px' }}>HR Admin Role Rules</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            'Only the Org Admin (super_admin) can assign or remove the HR Admin role.',
            'Maximum 2 active HR Admins are allowed per organisation at any time.',
            'To assign a new HR Admin when slots are full, first change an existing HR Admin to a lower role in User Management.',
            'The super_admin role cannot be assigned or changed through the platform interface.',
            'All other HR department staff should have Manager, Team Lead, or Employee access only.',
          ].map((rule, i) => (
            <div key={i} style={{ fontSize: '12px', color: 'var(--k-warning-text)', display: 'flex', gap: '8px' }}>
              <span style={{ fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}