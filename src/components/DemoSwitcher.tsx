import { useState } from 'react'

export const DEMO_PERSONAS = [
  { user_id: '69797e41-29ba-4c0a-83e7-e6e849c9cc1a', name: 'Neha Joshi', role: 'Org Admin', roleKey: 'super_admin', emoji: '', description: 'Org Admin - Full platform control', dept: 'Leadership & Strategy' },
  { user_id: 'dc16d342-a608-4966-8d0a-2f383bffeba2', name: 'Sanmeet Sahni', role: 'HR Admin', roleKey: 'hr_admin', emoji: '', description: 'HR Admin - Platform configuration', dept: 'Leadership & Strategy' },
  { user_id: '1de83431-8c7e-4dcc-811c-0b294da67665', name: 'Deepa Nair', role: 'Chief Experience Officer', roleKey: 'executive', emoji: '', description: 'CXO - Org-wide exec dashboard - OKR owner', dept: 'Leadership & Strategy' },
  { user_id: '6269c1af-b768-40f8-a463-0930b7c6c0c2', name: 'Vikram Singh', role: 'VP Operations', roleKey: 'leadership', emoji: '', description: 'VP - IT - Six Sigma OKR owner - top of cohort', dept: 'Information Technology' },
  { user_id: '5501f29a-aa47-4895-b876-e1ac9f844ccc', name: 'Rajesh Kumar', role: 'Operations Manager', roleKey: 'manager', emoji: '', description: 'Manager - Customer Ops - COPC team', dept: 'Customer Operations' },
  { user_id: 'cbc7594d-acd6-4771-9243-fdfabd7101ee', name: 'Suresh Nair', role: 'IT Manager', roleKey: 'manager', emoji: '', description: 'Manager - IT - Six Sigma - strong performer', dept: 'Information Technology' },
  { user_id: '7b9cede9-af6a-4e23-a860-c372d4b7175e', name: 'Kavya Reddy', role: 'Sales Manager', roleKey: 'manager', emoji: '', description: 'Manager - Sales - BSC team', dept: 'Sales & Business Development' },
  { user_id: '96b41561-902b-4be0-be96-f1386e9d12aa', name: 'Arjun Menon', role: 'Team Lead', roleKey: 'team_lead', emoji: '', description: 'Team Lead - Customer Ops - COPC - strong performer', dept: 'Customer Operations' },
  { user_id: 'a2443fd5-bb36-454a-a829-d4a1d2aaaf00', name: 'Priya Sharma', role: 'Agent', roleKey: 'individual_contributor', emoji: '', description: 'Customer Ops - COPC - solid performer', dept: 'Customer Operations' },
  { user_id: '5a89cd93-91d5-4d40-98ff-bc9ad165142f', name: 'Mariam Al Hashimi', role: 'Agent - Needs Coaching', roleKey: 'individual_contributor', emoji: '', description: 'At-risk - solid overall masks a red KPI - COPC', dept: 'Customer Operations' },
  { user_id: '93d72504-7837-48e7-9eba-4d6fdf55e735', name: 'Rajan Pillai', role: 'Agent - Slipping', roleKey: 'individual_contributor', emoji: '', description: 'Declining trend - PIP candidate - COPC', dept: 'Customer Operations' },
  { user_id: 'ee811f7a-d0ed-4641-ad67-34dbad4d5d41', name: 'Rahul Mehta', role: 'Developer', roleKey: 'individual_contributor', emoji: '', description: 'IT - Six Sigma - solid performer', dept: 'Information Technology' },
  { user_id: '6a1dada9-59ff-478d-986a-aa6b8bba6e54', name: 'Pooja Iyer', role: 'HR Executive', roleKey: 'individual_contributor', emoji: '', description: 'HR - BSC - solid performer', dept: 'Human Resources' },
  { user_id: '712c9b7d-1df1-4854-918b-2795f00988a4', name: 'Aryan Kapoor', role: 'Sales Executive', roleKey: 'individual_contributor', emoji: '', description: 'Sales - BSC - strong performer', dept: 'Sales & Business Development' },
  { user_id: 'cfef3b05-8415-4e02-b9a5-c144fcb0e761', name: 'Fatima Al Zaabi', role: 'Sales Executive', roleKey: 'individual_contributor', emoji: '', description: 'Declining sales - predictive catch - BSC', dept: 'Sales & Business Development' },
  { user_id: '16fad8c6-c8f1-4a03-a510-0fadf129e2eb', name: 'Khalid Al Neyadi', role: 'QA Analyst', roleKey: 'individual_contributor', emoji: '', description: 'QA - Six Sigma - solid performer', dept: 'Quality Assurance' },
  { user_id: '6627071b-799b-468a-b3cd-5f14659ce2e4', name: 'Mohammed Al Rashid', role: 'Finance Analyst', roleKey: 'individual_contributor', emoji: '', description: 'Finance - BSC - solid performer', dept: 'Finance & Accounting' },
]


const DEMO_KEY = 'kinalys_demo_user_id'

export function getDemoUserId(): string | null {
  return localStorage.getItem(DEMO_KEY)
}

export function setDemoUserId(id: string) {
  localStorage.setItem(DEMO_KEY, id)
}

export function clearDemoUserId() {
  localStorage.removeItem(DEMO_KEY)
}

export default function DemoSwitcher() {
  const [open, setOpen] = useState(false)
  const currentUserId = getDemoUserId()
  const currentPersona = DEMO_PERSONAS.find(p => p.user_id === currentUserId) || DEMO_PERSONAS.find(p => p.roleKey === 'hr_admin') || DEMO_PERSONAS[0]

  function switchTo(persona: typeof DEMO_PERSONAS[0]) {
    setDemoUserId(persona.user_id)
    setOpen(false)
    window.location.reload()
  }

  // Always show in development

  const grouped = [
    { label: 'Leadership', personas: DEMO_PERSONAS.filter(p => ['super_admin','hr_admin','executive','leadership'].includes(p.roleKey)) },
    { label: 'Management', personas: DEMO_PERSONAS.filter(p => ['manager','team_lead'].includes(p.roleKey)) },
    { label: 'Employees', personas: DEMO_PERSONAS.filter(p => p.roleKey === 'individual_contributor') },
  ]

  return (
    <div style={{ position: 'fixed', top: '8px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'var(--k-brand-primary)', color: 'white',
          border: 'none', borderRadius: '40px',
          padding: '10px 18px 10px 14px',
          fontSize: '13px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'var(--k-font-sans)',
          boxShadow: '0 4px 20px rgba(13,148,136,0.4)',
        }}>
        <span style={{ fontSize: '18px' }}>{currentPersona.emoji}</span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '11px', opacity: 0.8, lineHeight: 1 }}>Demo Mode</div>
          <div style={{ fontSize: '13px', lineHeight: 1.3 }}>{currentPersona.name}</div>
        </div>
        <span style={{ fontSize: '10px', opacity: 0.8, marginLeft: '4px' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '56px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--k-bg-card)', borderRadius: 'var(--k-radius-lg)',
          border: '1px solid var(--k-border-default)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
          minWidth: '300px', overflow: 'hidden', maxHeight: '70vh', overflowY: 'auto'
        }}>
          <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid var(--k-border-default)', position: 'sticky', top: 0, background: 'var(--k-bg-card)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', letterSpacing: '1px' }}>SWITCH DEMO PERSONA</div>
          </div>
          {grouped.map(group => (
            <div key={group.label}>
              <div style={{ padding: '8px 16px 4px', fontSize: '10px', fontWeight: 700, color: 'var(--k-brand-primary)', letterSpacing: '1px', background: 'var(--k-brand-faint)' }}>
                {group.label.toUpperCase()}
              </div>
              {group.personas.map(persona => {
                const isActive = persona.user_id === currentUserId
                return (
                  <button
                    key={persona.user_id}
                    onClick={() => switchTo(persona)}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '8px 16px', border: 'none',
                      background: isActive ? 'var(--k-brand-faint)' : 'transparent',
                      cursor: 'pointer', fontFamily: 'var(--k-font-sans)',
                      borderLeft: isActive ? '3px solid var(--k-brand-primary)' : '3px solid transparent',
                      display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>{persona.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--k-text-primary)' }}>{persona.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--k-text-muted)' }}>{persona.description}</div>
                    </div>
                    {isActive && <span style={{ fontSize: '12px', color: 'var(--k-brand-primary)', fontWeight: 700 }}>✓</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
