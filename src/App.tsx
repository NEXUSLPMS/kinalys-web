import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useState } from 'react'
import { setAuthToken, getMyProfile, getStatus, getDepartments, getDashboardStats, getMyAlerts, markAlertRead, markAllAlertsRead, getMyTalentPosition, triggerDemoBreach, getMyPip, acknowledgePip, getPrivacyStatus } from './api/client'
import { PrivacyAcknowledgementModal } from './components/PrivacyAcknowledgementModal'
import Organisation from './pages/Organisation'
import AccountSettings from './pages/AccountSettings'
import ImportUsers from './pages/ImportUsers'
import BalancedScorecard from './pages/BalancedScorecard'
import OKR from './pages/OKR'
import TalentGrid from './pages/TalentGrid'
import UserManagement from './pages/UserManagement'
import KpiTemplates from './pages/KpiTemplates'
import KnowledgeBase from './pages/KnowledgeBase'
import SupportTickets from './pages/SupportTickets'
import Scorecard from './pages/Scorecard'
import AICoaching from './pages/AICoaching'
import OneOnOne from './pages/OneOnOne'
import COPCScorecard from './pages/COPCScorecard'
import SixSigma from './pages/SixSigma'
import MyLearning from './pages/MyLearning'
import CourseCatalog from './pages/CourseCatalog'
import Certifications from './pages/Certifications'
import ExecDashboard from './pages/ExecDashboard'
import CompetencyFramework from './pages/CompetencyFramework'
import PKTEngine from './pages/PKTEngine'
import COPCReport from './pages/COPCReport'
import SixSigmaReport from './pages/SixSigmaReport'
import DemoSwitcher from './components/DemoSwitcher'
import HrAdminManagement from './pages/HrAdminManagement'
import HrFlagsInbox from './pages/HrFlagsInbox'
import PredictiveAnalysis from './pages/PredictiveAnalysis'
import Recommendations from './pages/Recommendations'
import StatRing from './components/StatRing'
import PipCheckins from './pages/PipCheckins'



interface UserProfile {
  id: string
  email: string
  fullName: string
  role: string
  department: string | null
  designation: string | null
  learningHoursTarget: number | null
  tenant: { id: string; name: string; plan: string }
}

interface ApiStatus {
  api: string
  database: string
  auth0: string
  sprint: string
  tables: string[]
}

function LoginPage() {
  const { loginWithRedirect, isLoading, error } = useAuth0()
  return (
    <div style={{ minHeight: '100vh', background: 'var(--k-bg-topbar)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ fontFamily: 'var(--k-font-display)', fontSize: '42px', fontWeight: '800', color: 'var(--k-brand-lighter)', letterSpacing: '6px', display: 'inline-flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
          KINALYS
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--k-brand-lighter)', flexShrink: 0 }}/>
          <div style={{ position: 'absolute', bottom: '-4px', left: 0, right: '20px', height: '1.5px', background: 'var(--k-brand-primary)', opacity: 0.6 }}/>
        </div>
        <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--k-brand-light)', letterSpacing: '4px' }}>KINETIC ANALYSIS</div>
      </div>
      <div className="k-card" style={{ width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--k-font-display)', fontSize: '22px', fontWeight: '700', color: 'var(--k-text-primary)', marginBottom: '8px' }}>Welcome back</h1>
        <p style={{ fontSize: '14px', color: 'var(--k-text-muted)', marginBottom: '32px' }}>Sign in to your Kinalys workspace</p>
        <button className="k-btn k-btn-primary" onClick={() => loginWithRedirect()} disabled={isLoading} style={{ width: '100%', justifyContent: 'center', padding: '12px 24px', fontSize: '15px' }}>
          {isLoading ? 'Loading...' : 'Sign in with Kinalys'}
        </button>
        {error && <p style={{ color: 'var(--k-danger-text)', fontSize: '12px', marginTop: '12px' }}>{error.message}</p>}
        <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--k-text-muted)' }}>Kinetic Analysis · Unified LMS + Performance Management</p>
      </div>
    </div>
  )
}

function Dashboard() {
  const { user, logout, getAccessTokenSilently } = useAuth0()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [status, setStatus] = useState<ApiStatus | null>(null)
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [activeNav, setActiveNav] = useState('home')
  const [dashStats, setDashStats] = useState<any>(null)
  const [talentPosition, setTalentPosition] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showAlerts, setShowAlerts] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [myPip, setMyPip] = useState<any>(null)
  const [pipAckResponse, setPipAckResponse] = useState('')
  const [pipAckLoading, setPipAckLoading] = useState(false)
  const [pipAckSuccess, setPipAckSuccess] = useState(false)
  const [privacyStatus, setPrivacyStatus] = useState<{
    needs_acknowledgement: boolean
    current_version: string
    organization_name: string
    acknowledgement_text: string
  } | null>(null)

  function toggleSection(section: string) {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  useEffect(() => {
    async function loadData() {
      try {
        const token = await getAccessTokenSilently({ authorizationParams: { audience: 'https://api.kinalys.io' } })
        const [statusData, profileData, deptData, statsData, talentData, alertsData, pipData, privacyData] = await Promise.allSettled([getStatus(), getMyProfile(), getDepartments(), getDashboardStats(), getMyTalentPosition(), getMyAlerts(), getMyPip(), getPrivacyStatus()])
        if (profileData.status === 'fulfilled') setProfile(profileData.value.user)
        if (deptData.status === 'fulfilled') setDepartments(deptData.value.departments || [])
        if (statsData.status === 'fulfilled') setDashStats(statsData.value)
        if (talentData.status === 'fulfilled') setTalentPosition(talentData.value)
        if (alertsData.status === 'fulfilled') {
          setAlerts(alertsData.value.alerts || [])
          setUnreadCount(alertsData.value.unread_count || 0)
        }
        if (pipData.status === 'fulfilled') setMyPip(pipData.value.pip)
      
          if (privacyData.status === 'fulfilled' && privacyData.value.needs_acknowledgement) {
          setPrivacyStatus(privacyData.value)
        }
        
      } catch (err: any) {
        setApiError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [getAccessTokenSilently])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--k-bg-topbar)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--k-font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--k-brand-lighter)', letterSpacing: '4px' }}>KINALYS · Loading...</div>
      </div>
    )
  }

  const isAdmin = profile?.role === 'hr_admin' || profile?.role === 'executive'

  const role = profile?.role || 'individual_contributor'
  const isLeadership = ['super_admin','hr_admin','executive','leadership'].includes(role)
  const isManager = ['super_admin','hr_admin','executive','leadership','manager','team_lead'].includes(role)
  const isAdminOnly = ['super_admin','hr_admin'].includes(role)
  const canSee = (feature: string): boolean => {
    const access: Record<string, string[]> = {
      exec:          ['super_admin','hr_admin','executive','leadership'],
      copcreport:    ['super_admin','hr_admin','executive','leadership','manager'],
      sixsigmareport:['super_admin','hr_admin','executive','leadership','manager'],
      oneonone:      ['super_admin','hr_admin','executive','leadership','manager','team_lead','individual_contributor'],
      pkt:           ['super_admin','hr_admin','manager','team_lead','individual_contributor'],
      competency:    ['super_admin','hr_admin','executive','leadership','manager','team_lead','individual_contributor'],
      copc:          ['super_admin','hr_admin','manager','team_lead','individual_contributor'],
      sixsigma:      ['super_admin','hr_admin','manager','team_lead','individual_contributor'],
      talent:        ['super_admin','hr_admin','executive','leadership','manager'],
      okr:           ['super_admin','hr_admin','executive','leadership','manager'],
      bsc:           ['super_admin','hr_admin','executive','leadership'],
      org:           ['super_admin','hr_admin'],
      import:        ['super_admin','hr_admin'],
      users:         ['super_admin','hr_admin'],
      kpi:           ['super_admin','hr_admin'],
      learning:      ['super_admin','hr_admin','manager','team_lead','individual_contributor'],
      catalog:       ['super_admin','hr_admin','manager','team_lead','individual_contributor'],
      certs:         ['super_admin','hr_admin','manager','team_lead','individual_contributor'],
      kb:            ['super_admin','hr_admin','executive','leadership','manager','team_lead','individual_contributor'],
      support:       ['super_admin','hr_admin','executive','leadership','manager','team_lead','individual_contributor'],
      scorecard:     ['super_admin','hr_admin','executive','leadership','manager','team_lead','individual_contributor'],
      ai:            ['super_admin','hr_admin','executive','leadership','manager','team_lead','individual_contributor'],
      recommendations: ['super_admin','hr_admin','executive','leadership','manager','team_lead','individual_contributor'],
      settings:      ['super_admin','hr_admin'],
      predictive:    ['super_admin','hr_admin','executive','leadership','manager'],
      hrflags:       ['super_admin','hr_admin'],
      pip_checkins:  ['super_admin','hr_admin','manager','team_lead'],

    }
    return (access[feature] || []).includes(role)
  }

  if (privacyStatus?.needs_acknowledgement) {
    return (
      <PrivacyAcknowledgementModal
        organizationName={privacyStatus.organization_name}
        acknowledgementText={privacyStatus.acknowledgement_text}
        currentVersion={privacyStatus.current_version}
        onAcknowledged={() => setPrivacyStatus(null)}
      />
    )
  }
  
  return (
    <div className="k-shell">

      {/* Topbar */}
      <div className="k-topbar">
        <div onClick={() => setActiveNav('home')} style={{ fontFamily: 'var(--k-font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--k-text-topbar)', letterSpacing: '3px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          KINALYS<span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--k-text-topbar)', display: 'inline-block' }}/>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {profile?.tenant && <span style={{ fontSize: '12px', color: 'var(--k-text-topbar)', opacity: 0.7, background: 'rgba(255,255,255,0.1)', padding: '3px 12px', borderRadius: '20px' }}>{profile.tenant.name}</span>}
          <span style={{ fontSize: '12px', color: 'var(--k-text-topbar)', opacity: 0.7 }}>{user?.email}</span>
          <button className="k-btn k-btn-ghost" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} style={{ fontSize: '12px', padding: '6px 14px', color: 'var(--k-text-topbar)', borderColor: 'rgba(255,255,255,0.2)' }}>Sign out</button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="k-sidebar">
{/* Dashboard */}
        <div className="k-sidebar-section" style={{ marginBottom: '4px' }}>
          <div className={`k-nav-item ${activeNav === 'home' ? 'active' : ''}`} onClick={() => setActiveNav('home')}>
            🏠 Dashboard
          </div>
        </div>

        {/* Learning */}
        <div className="k-sidebar-section">
          <div
            className="k-sidebar-label"
            onClick={() => toggleSection('learning')}
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
          >
            Learning <span style={{ fontSize: '10px' }}>{collapsedSections['learning'] ? '▶' : '▼'}</span>
          </div>
          {!collapsedSections['learning'] && <>
            {canSee('learning') && <div className={`k-nav-item ${activeNav === 'learning' ? 'active' : ''}`} onClick={() => setActiveNav('learning')}>My Learning</div>}
            {canSee('catalog') && <div className={`k-nav-item ${activeNav === 'catalog' ? 'active' : ''}`} onClick={() => setActiveNav('catalog')}>Course Catalog</div>}
            {canSee('certs') && <div className={`k-nav-item ${activeNav === 'certs' ? 'active' : ''}`} onClick={() => setActiveNav('certs')}>Certifications</div>}
                      </>}
        </div>

        {/* Performance */}
        <div className="k-sidebar-section" style={{ marginTop: '4px' }}>
          <div
            className="k-sidebar-label"
            onClick={() => toggleSection('performance')}
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
          >
            Performance <span style={{ fontSize: '10px' }}>{collapsedSections['performance'] ? '▶' : '▼'}</span>
          </div>
          {canSee('predictive') && <div className={`k-nav-item ${activeNav === 'predictive' ? 'active' : ''}`} onClick={() => setActiveNav('predictive')}>Predictive Analysis</div>}
          {canSee('pip_checkins') && <div className={`k-nav-item ${activeNav === 'pip_checkins' ? 'active' : ''}`} onClick={() => setActiveNav('pip_checkins')}>PIP Check-ins</div>}
          
          {!collapsedSections['performance'] && <>
            {canSee('exec') && <div className={`k-nav-item ${activeNav === 'exec' ? 'active' : ''}`} onClick={() => setActiveNav('exec')}>Exec Dashboard</div>}
            {canSee('predictive') && <div className={`k-nav-item ${activeNav === 'predictive' ? 'active' : ''}`} onClick={() => setActiveNav('predictive')}>Predictive Analysis</div>}
            {canSee('scorecard') && <div className={`k-nav-item ${activeNav === 'scorecard' ? 'active' : ''}`} onClick={() => setActiveNav('scorecard')}>My Scorecard</div>}
            {canSee('ai') && <div className={`k-nav-item ${activeNav === 'ai' ? 'active' : ''}`} onClick={() => setActiveNav('ai')}>AI Coaching</div>}
            {canSee('recommendations') && <div className={`k-nav-item ${activeNav === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveNav('recommendations')}>AI Recommendations</div>}
            {canSee('copc') && <div className={`k-nav-item ${activeNav === 'copc' ? 'active' : ''}`} onClick={() => setActiveNav('copc')}>COPC Scorecard</div>}
            {canSee('copcreport') && <div className={`k-nav-item ${activeNav === 'copcreport' ? 'active' : ''}`} onClick={() => setActiveNav('copcreport')}>COPC Report</div>}
            {canSee('sixsigma') && <div className={`k-nav-item ${activeNav === 'sixsigma' ? 'active' : ''}`} onClick={() => setActiveNav('sixsigma')}>Six Sigma Scorecard</div>}
            {canSee('sixsigmareport') && <div className={`k-nav-item ${activeNav === 'sixsigmareport' ? 'active' : ''}`} onClick={() => setActiveNav('sixsigmareport')}>Six Sigma Report</div>}
            {canSee('oneonone') && <div className={`k-nav-item ${activeNav === 'oneonone' ? 'active' : ''}`} onClick={() => setActiveNav('oneonone')}>1-on-1 Reviews</div>}
            {canSee('competency') && <div className={`k-nav-item ${activeNav === 'competency' ? 'active' : ''}`} onClick={() => setActiveNav('competency')}>Competency</div>}
            {canSee('pkt') && <div className={`k-nav-item ${activeNav === 'pkt' ? 'active' : ''}`} onClick={() => setActiveNav('pkt')}>PKT Engine</div>}
          </>}
        </div>

        {/* Management */}
        {isAdmin && (
          <div className="k-sidebar-section" style={{ marginTop: '4px' }}>
            <div
              className="k-sidebar-label"
              onClick={() => toggleSection('management')}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
            >
              Management <span style={{ fontSize: '10px' }}>{collapsedSections['management'] ? '▶' : '▼'}</span>
            </div>
            {!collapsedSections['management'] && <>
              {canSee('org') && <div className={`k-nav-item ${activeNav === 'org' ? 'active' : ''}`} onClick={() => setActiveNav('org')}>Organisation</div>}
              {canSee('import') && <div className={`k-nav-item ${activeNav === 'import' ? 'active' : ''}`} onClick={() => setActiveNav('import')}>Import Users</div>}
              {canSee('bsc') && <div className={`k-nav-item ${activeNav === 'bsc' ? 'active' : ''}`} onClick={() => setActiveNav('bsc')}>Balanced Scorecard</div>}
              {canSee('okr') && <div className={`k-nav-item ${activeNav === 'okr' ? 'active' : ''}`} onClick={() => setActiveNav('okr')}>OKR Framework</div>}
              {canSee('talent') && <div className={`k-nav-item ${activeNav === 'talent' ? 'active' : ''}`} onClick={() => setActiveNav('talent')}>Talent Grid</div>}
              {canSee('users') && <div className={`k-nav-item ${activeNav === 'users' ? 'active' : ''}`} onClick={() => setActiveNav('users')}>User Management</div>}
              {canSee('kpi') && <div className={`k-nav-item ${activeNav === 'kpi' ? 'active' : ''}`} onClick={() => setActiveNav('kpi')}>KPI Templates</div>}
              {canSee('hrflags') && <div className={`k-nav-item ${activeNav === 'hrflags' ? 'active' : ''}`} onClick={() => setActiveNav('hrflags')}>Flags Inbox</div>}
               </>}
          </div>
        )}

        {/* Help */}
        <div className="k-sidebar-section" style={{ marginTop: '4px' }}>
          <div
            className="k-sidebar-label"
            onClick={() => toggleSection('help')}
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
          >
            Help <span style={{ fontSize: '10px' }}>{collapsedSections['help'] ? '▶' : '▼'}</span>
          </div>
          {!collapsedSections['help'] && <>
            {canSee('kb') && <div className={`k-nav-item ${activeNav === 'kb' ? 'active' : ''}`} onClick={() => setActiveNav('kb')}>Knowledge Base</div>}
            {canSee('support') && <div className={`k-nav-item ${activeNav === 'support' ? 'active' : ''}`} onClick={() => setActiveNav('support')}>Support Tickets</div>}
          </>}
        </div>

        {/* Platform - super_admin only */}
        {role === 'super_admin' && (
          <div className="k-sidebar-section" style={{ marginTop: '4px' }}>
            <div className="k-sidebar-label" onClick={() => toggleSection('platform')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
              Platform <span style={{ fontSize: '10px' }}>{collapsedSections['platform'] ? '▶' : '▼'}</span>
            </div>
            {!collapsedSections['platform'] && <>
              <div className={`k-nav-item ${activeNav === 'hradmin' ? 'active' : ''}`} onClick={() => setActiveNav('hradmin')}>HR Admin Management</div>
              <div className={`k-nav-item ${activeNav === 'auditlog' ? 'active' : ''}`} onClick={() => setActiveNav('auditlog')}>Audit Log</div>
              <div className={`k-nav-item ${activeNav === 'addons' ? 'active' : ''}`} onClick={() => setActiveNav('addons')}>Add-on Management</div>
              <div className={`k-nav-item ${activeNav === 'orgsetup' ? 'active' : ''}`} onClick={() => setActiveNav('orgsetup')}>Organisation Setup</div>
            </>}
          </div>
        )}

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--k-border-default)', padding: '12px 0' }}>
          <div className={`k-nav-item ${activeNav === 'settings' ? 'active' : ''}`} onClick={() => setActiveNav('settings')} style={{ margin: '0 var(--k-space-3)' }}>
            ⚙️ Account Settings
          </div>
        </div>

      </div>

      {/* Main content */}
      <div className="k-main">
        {activeNav === 'settings' ? (
          <AccountSettings onBack={() => setActiveNav('home')} />
        ) : activeNav === 'org' ? (
          <Organisation />
        ) : activeNav === 'import' ? (
          <ImportUsers />
        ) : activeNav === 'bsc' ? (
          <BalancedScorecard />
        ) : activeNav === 'scorecard' ? (
          <Scorecard />
          ) : activeNav === 'oneonone' ? (
          <OneOnOne />
        ) : activeNav === 'ai' ? (
          <AICoaching />
        ) : activeNav === 'okr' ? (
          <OKR />
        ) : activeNav === 'talent' ? (
          <TalentGrid />
        ) : activeNav === 'users' ? (
          <UserManagement />
        ) : activeNav === 'learning' ? (
          <MyLearning />
        ) : activeNav === 'catalog' ? (
          <CourseCatalog />
        ) : activeNav === 'certs' ? (
          <Certifications />
        ) : activeNav === 'exec' ? (
          <ExecDashboard />
        ) : activeNav === 'kpi' ? (
          <KpiTemplates />
        ) : activeNav === 'kb' ? (
          <KnowledgeBase />
        ) : activeNav === 'support' ? (
          <SupportTickets />
          ) : activeNav === 'copc' ? (
          <COPCScorecard />
          ) : activeNav === 'sixsigma' ? (
          <SixSigma />
          ) : activeNav === 'competency' ? (
          <CompetencyFramework />
          ) : activeNav === 'pkt' ? (
          <PKTEngine />
          ) : activeNav === 'copcreport' ? (
          <COPCReport />
          ) : activeNav === 'sixsigmareport' ? (
          <SixSigmaReport />
          ) : activeNav === 'hradmin' ? (
          <HrAdminManagement />
          ) : activeNav === 'predictive' ? (
          <PredictiveAnalysis />
          ) : activeNav === 'hrflags' ? (
          <HrFlagsInbox />
          ) : activeNav === 'recommendations' ? (
          <Recommendations />
          ) : activeNav === 'predictive' ? (
<PredictiveAnalysis />
) : activeNav === 'pip_checkins' ? (
          <PipCheckins />
        ) : (
          <div className="k-page">

            {apiError && (
              <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: 'var(--k-danger-text)' }}>
                ⚠ API connection issue: {apiError}
              </div>
            )}

            {/* Notification Bell */}
                <div style={{ position: 'relative', marginRight: '12px' }}>
                  <button
                    onClick={() => setShowAlerts(!showAlerts)}
                    style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: 'var(--k-radius-md)', color: 'var(--k-text-muted)', fontSize: '18px' }}
                  >
                    🔔
                    {unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#EF4444', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {showAlerts && (
                    <div className="k-alert-dropdown" style={{ position: 'absolute', right: 0, maxWidth: 'calc(100vw - 20px)', top: '40px', width: 'min(380px, calc(100vw - 20px))', background: 'var(--k-bg-surface)', border: '1px solid var(--k-border-default)', borderRadius: 'var(--k-radius-lg)', boxShadow: 'var(--k-shadow-lg)', zIndex: 1000, maxHeight: '480px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--k-border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-text-primary)' }}>
                          Alerts {unreadCount > 0 && <span style={{ fontSize: '12px', color: 'white', background: '#EF4444', padding: '1px 7px', borderRadius: '10px', marginLeft: '6px' }}>{unreadCount}</span>}
                        </div>
                        {unreadCount > 0 && (
                          <button onClick={async () => { await markAllAlertsRead(); setAlerts(prev => prev.map(a => ({ ...a, is_read: true }))); setUnreadCount(0) }} style={{ fontSize: '11px', color: 'var(--k-brand-primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--k-font-sans)', fontWeight: 600 }}>
                            Mark all read
                          </button>
                        )}
                        <button onClick={() => setShowAlerts(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--k-text-muted)', padding: '0 4px', lineHeight: 1 }}>✖</button>
                      </div>
                      <div style={{ overflowY: 'auto', flex: 1 }}>
                        {alerts.length === 0 ? (
                          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--k-text-muted)', fontSize: '13px' }}>
                            <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
                            No alerts — all KPIs on track
                          </div>
                        ) : (
                          alerts.map((alert: any) => (
                            <div key={alert.id} onClick={async () => { if (!alert.is_read) { await markAlertRead(alert.id); setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, is_read: true } : a)); setUnreadCount(prev => Math.max(0, prev - 1)) } }} style={{ padding: '14px 16px', borderBottom: '1px solid var(--k-border-default)', background: alert.is_read ? 'transparent' : '#FFFBEB', cursor: alert.is_read ? 'default' : 'pointer' }}>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '16px' }}>⚠️</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#B45309', marginBottom: '3px' }}>{alert.kpi_name}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--k-text-secondary)', lineHeight: 1.4 }}>{alert.message}</div>
                                  <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginTop: '4px' }}>Score: {Number(alert.current_score).toFixed(1)}% · {new Date(alert.fired_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                {!alert.is_read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', flexShrink: 0, marginTop: '4px' }} />}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

            <div style={{ marginBottom: '24px' }}>
              <div className="k-page-title" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>Welcome back, {profile?.fullName || user?.name || 'there'} 👋</div>
              <div className="k-page-sub">{profile?.role === 'super_admin' ? 'Org Admin' : profile?.role === 'hr_admin' ? 'HR Admin' : profile?.role === 'executive' ? 'Executive' : profile?.role === 'leadership' ? 'Leadership' : profile?.role === 'manager' ? 'Manager' : profile?.role === 'team_lead' ? 'Team Lead' : 'Employee'} · {profile?.tenant?.name || 'Your workspace'} · {profile?.designation || 'Kinalys Platform'}</div>
            </div>

            {/* DEMO BREACH TRIGGER */}
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'var(--k-warning-bg)', border: '1px solid var(--k-warning-border)', borderRadius: 'var(--k-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-warning-text)' }}>🎯 Demo Mode — Breach Alert Trigger</div>
                <div style={{ fontSize: '11px', color: 'var(--k-warning-text)', opacity: 0.8 }}>Drops a live KPI to amber and fires the notification bell in real time</div>
              </div>
              <button
                onClick={async () => {
                  try {
                    const result = await triggerDemoBreach()
                    const freshAlerts = await getMyAlerts()
                    setAlerts(freshAlerts.alerts || [])
                    setUnreadCount(freshAlerts.unread_count || 0)
                    alert(`✅ ${result.message}`)
                  } catch (err: any) {
                    alert('Error: ' + (err.response?.data?.error || err.message))
                  }
                }}
                style={{ background: 'var(--k-warning-solid)', color: 'white', border: 'none', borderRadius: 'var(--k-radius-md)', padding: '8px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--k-font-sans)' }}
              >
                🔔 Fire Breach Alert
              </button>
            </div>

{myPip && (
                  <div className="k-card" style={{ marginBottom: '24px', borderTop: '4px solid var(--k-warning-text)' }}>
                    <div className="k-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>⚠️</span>
                        <div className="k-card-title" style={{ color: 'var(--k-warning-text)' }}>Performance Improvement Plan — Action Required</div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-warning-text)', background: 'var(--k-warning-bg)', padding: '3px 10px', borderRadius: '20px' }}>
                       {myPip.status === 'pending_employee_ack' ? 'Performance Improvement Plan — Action Required' : 'Performance Improvement Plan — Active'}
  
                      </span>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--k-text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>
                        {myPip.status === 'pending_employee_ack'
                          ? 'Your manager has raised a Performance Improvement Plan. Please review the details below and acknowledge to activate your plan.'
                          : 'Your Performance Improvement Plan is active. Focus on the KPI targets below and attend all scheduled review sessions.'}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', padding: '10px 14px' }}>
                          <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginBottom: '3px', fontWeight: 700 }}>DURATION</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-text-primary)' }}>
                            {myPip.pip_form_data?.duration_days ? `${myPip.pip_form_data.duration_days} days` : '-'}
                          </div>
                        </div>
                        <div style={{ background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', padding: '10px 14px' }}>
                          <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginBottom: '3px', fontWeight: 700 }}>START DATE</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-text-primary)' }}>
                            {myPip.pip_start_date ? new Date(myPip.pip_start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </div>
                        </div>
                        <div style={{ background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', padding: '10px 14px' }}>
                          <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginBottom: '3px', fontWeight: 700 }}>END DATE</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-text-primary)' }}>
                            {myPip.pip_end_date ? new Date(myPip.pip_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', padding: '10px 14px' }}>
                          <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginBottom: '3px', fontWeight: 700 }}>REVIEW FREQUENCY</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-text-primary)', textTransform: 'capitalize' }}>
                            {myPip.pip_form_data?.review_frequency || '-'}
                          </div>
                        </div>
                        <div style={{ background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', padding: '10px 14px' }}>
                          <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginBottom: '3px', fontWeight: 700 }}>RAISED BY</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-text-primary)' }}>
                            {myPip.manager_name || '-'}
                          </div>
                        </div>
                      </div>

                      {myPip.pip_form_data?.kpi_targets && Object.keys(myPip.pip_form_data.kpi_targets).length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginBottom: '8px', fontWeight: 700 }}>KPI IMPROVEMENT TARGETS</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {Object.entries(myPip.pip_form_data.kpi_targets).map(([kpi, target]: [string, any]) => (
                              <div key={kpi} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', borderLeft: '3px solid var(--k-warning-text)' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--k-text-primary)' }}>{kpi}</span>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-warning-text)' }}>{target}% target</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {myPip.pip_form_data?.support_plan && (
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '10px', color: 'var(--k-text-muted)', marginBottom: '6px', fontWeight: 700 }}>SUPPORT PLAN</div>
                          <div style={{ fontSize: '12px', color: 'var(--k-text-primary)', lineHeight: 1.6, padding: '10px 14px', background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', borderLeft: '3px solid var(--k-brand-primary)' }}>
                            {myPip.pip_form_data.support_plan}
                          </div>
                        </div>
                      )}

                      {myPip.status === 'pending_employee_ack' && (
                        <div style={{ borderTop: '1px solid var(--k-border-default)', paddingTop: '16px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', marginBottom: '6px' }}>YOUR RESPONSE (OPTIONAL)</div>
                          <textarea
                            value={pipAckResponse}
                            onChange={e => setPipAckResponse(e.target.value)}
                            placeholder="You may add a response or comments before acknowledging..."
                            rows={3}
                            style={{ width: '100%', fontSize: '12px', padding: '8px', borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border-input)', background: 'var(--k-bg-input)', color: 'var(--k-text-primary)', fontFamily: 'var(--k-font-sans)', resize: 'vertical', boxSizing: 'border-box', marginBottom: '12px' }}
                          />
                          <button
                            disabled={pipAckLoading}
                            onClick={async () => {
                              setPipAckLoading(true)
                              try {
                                await acknowledgePip(myPip.id, pipAckResponse)
                                setPipAckSuccess(true)
                                setMyPip({ ...myPip, status: 'pip_active' })
                              } catch (err: any) {
                                alert(err.response?.data?.message || 'Failed to acknowledge PIP.')
                              } finally {
                                setPipAckLoading(false)
                              }
                            }}
                            style={{ width: '100%', padding: '12px', background: 'var(--k-warning-text)', border: 'none', borderRadius: 'var(--k-radius-md)', fontSize: '13px', fontWeight: 700, cursor: pipAckLoading ? 'not-allowed' : 'pointer', fontFamily: 'var(--k-font-sans)', color: 'white', opacity: pipAckLoading ? 0.6 : 1 }}>
                            {pipAckLoading ? 'Acknowledging...' : 'I Acknowledge This Performance Improvement Plan'}
                          </button>
                          <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', textAlign: 'center', marginTop: '8px' }}>
                            By acknowledging you confirm you have read and understood this PIP. This action is timestamped and cannot be undone.
                          </div>
                        </div>
                      )}

                      {myPip.status === 'pip_active' && (
                        <div style={{ background: 'var(--k-success-bg)', border: '1px solid var(--k-success-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', fontSize: '12px', color: 'var(--k-success-text)', fontWeight: 600 }}>
                          ✅ You have acknowledged this PIP. Your improvement plan is now active.
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {talentPosition?.position && (
<div className="k-card" style={{ marginBottom: '24px' }}>
                    <div className="k-card-header">
                      <div className="k-card-title">My Talent Profile</div>
                      <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{talentPosition.cycle?.name}</span>
                    </div>
                    <div className="k-mobile-stack" style={{ padding: '20px', display: 'flex', gap: '32px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Performance Score</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ fontSize: '32px', fontWeight: 800, color: talentPosition.position.performance_score >= 90 ? 'var(--k-success-text)' : talentPosition.position.performance_score >= 80 ? 'var(--k-warning-text)' : 'var(--k-danger-text)' }}>
                              {talentPosition.position.performance_score}%
                            </div>
                            <div style={{ flex: 1, height: '8px', background: 'var(--k-border-default)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${talentPosition.position.performance_score}%`, background: talentPosition.position.performance_score >= 90 ? 'var(--k-success-text)' : talentPosition.position.performance_score >= 80 ? 'var(--k-warning-text)' : 'var(--k-danger-text)', borderRadius: '4px' }} />
                            </div>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Potential</div>
                          {talentPosition.position.has_potential_rating ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '15px', fontWeight: 800, color: talentPosition.position.potential_rating >= 4 ? 'var(--k-success-text)' : talentPosition.position.potential_rating >= 3 ? 'var(--k-warning-text)' : 'var(--k-danger-text)', background: talentPosition.position.potential_rating >= 4 ? 'var(--k-success-bg)' : talentPosition.position.potential_rating >= 3 ? 'var(--k-warning-bg)' : 'var(--k-danger-bg)', padding: '4px 14px', borderRadius: '10px' }}>
                                {talentPosition.position.potential_rating >= 4 ? 'High Potential' : talentPosition.position.potential_rating >= 3 ? 'Medium Potential' : 'Developing'}
                              </span>
                              <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>Manager assessed</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '13px', color: 'var(--k-text-muted)' }}>Not yet assessed by your manager</span>
                          )}
                        </div>
                      </div>
                      <div style={{ background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', padding: '14px 20px', textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginBottom: '4px' }}>Your profile is reviewed</div>
                        <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginBottom: '8px' }}>by your manager each cycle.</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-brand-primary)' }}>Performance + Potential</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--k-brand-primary)' }}>drive your development plan.</div>
                      </div>
                    </div>
                  </div>
                )}

                  <div className="k-stat-grid k-stat-grid-4" style={{ marginBottom: '24px' }}>
                    <div className="k-stat-card accent" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div className="k-stat-label">Overall Score</div>
                        <div className="k-stat-value" style={{ color: dashStats?.overall_score >= 90 ? 'var(--k-success-text)' : dashStats?.overall_score >= 80 ? 'var(--k-warning-text)' : dashStats?.overall_score ? 'var(--k-danger-text)' : 'var(--k-text-muted)' }}>
                          {dashStats?.overall_score != null ? `${dashStats.overall_score}%` : '—'}
                        </div>
                        <div className="k-stat-trend">
                          {dashStats?.overall_score >= 90 ? '🟢 High Performance' : dashStats?.overall_score >= 80 ? '🟡 On Track' : dashStats?.overall_score ? '🔴 Needs Attention' : 'No score yet'}
                        </div>
                      </div>
                      <StatRing
                        value={dashStats?.overall_score ?? 0}
                        color={dashStats?.overall_score >= 90 ? 'var(--k-success-text)' : dashStats?.overall_score >= 80 ? 'var(--k-warning-text)' : dashStats?.overall_score ? 'var(--k-danger-text)' : 'var(--k-text-muted)'}
                      />
                    </div>
                    <div className="k-stat-card green" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div className="k-stat-label">Learning Hours</div>
                        <div className="k-stat-value">{dashStats?.completed_hours ?? '-'}</div>
                        <div className="k-stat-trend">{dashStats?.learning_pct > 0 ? `${dashStats.learning_pct}% of target` : 'No target set'}</div>
                      </div>
                      <StatRing
                        value={dashStats?.learning_pct ?? 0}
                        color="var(--k-success-text)"
                      />
                    </div>
                    <div className="k-stat-card purple" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div className="k-stat-label">Pending KPIs</div>
                        <div className="k-stat-value">{dashStats?.pending_kpis ?? '-'}</div>
                        <div className="k-stat-trend">{dashStats?.pending_kpis > 0 ? 'Awaiting approval' : 'All approved'}</div>
                      </div>
                      <StatRing
                        value={dashStats?.pending_kpis > 0 ? Math.min(100, dashStats.pending_kpis * 10) : 100}
                        color={dashStats?.pending_kpis > 0 ? 'var(--k-ai-solid)' : 'var(--k-success-text)'}
                      />
                    </div>
                    <div className="k-stat-card amber" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div className="k-stat-label">Certifications</div>
                        <div className="k-stat-value">{dashStats?.certifications ?? '-'}</div>
                        <div className="k-stat-trend">{dashStats?.upcoming_one_on_ones > 0 ? `${dashStats.upcoming_one_on_ones} upcoming 1-on-1` : 'Earned'}</div>
                      </div>
                      <StatRing
                        value={dashStats?.certifications > 0 ? Math.min(100, dashStats.certifications * 20) : 0}
                        color="var(--k-warning-text)"
                      />
                    </div>
                  </div>

            <div className="k-lms-banner" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>                <div style={{ fontSize: '14px', fontWeight: 700 }}>📚 Learning Hours</div>
                {dashStats?.learning_pct >= 100 && <span className="k-pill lms">TARGET HIT — BONUS ACTIVE</span>}
                {dashStats?.learning_pct < 100 && dashStats?.learning_pct > 0 && <span className="k-pill amber">{dashStats.learning_pct}% COMPLETE</span>}
              </div>
              <div className="k-lms-progress"><div className="k-lms-progress-fill" style={{ width: `${dashStats?.learning_pct ?? 0, 100}%` }}/></div>
              <div style={{ display: 'flex', justifyContent: 'flex-start', fontSize: '12px', opacity: 0.8, flexWrap: 'wrap', gap: '8px', width: '100%' }}>
                <span>{dashStats?.completed_hours ?? 0} hrs achieved</span>
                <span>{dashStats?.learning_pct ?? 0}% of target</span>
                <span>Annual target: {dashStats?.learning_target ?? 40} hrs</span>
              </div>
            </div>

            <div className="k-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="k-card">
                <div className="k-card-header"><div className="k-card-title">👤 My Profile</div><span className="k-pill green">Active</span></div>
                {profile ? (
                  <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                    <tbody>
                      {[
                        ['Name', profile.fullName],
                        ['Email', profile.email],
                        ['Role', profile.role.replace('_', ' ')],
                        ['Department', profile.department || 'Not assigned'],
                        ['Designation', profile.designation || 'Not assigned'],
                        ['Tenant', profile.tenant?.name],
                        ['Plan', profile.tenant?.plan],
                      ].map(([label, value]) => (
                        <tr key={label} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                          <td style={{ padding: '8px 0', color: 'var(--k-text-muted)', width: '40%' }}>{label}</td>
                          <td style={{ padding: '8px 0', fontWeight: 500, color: 'var(--k-text-primary)', textTransform: 'capitalize' }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--k-text-muted)' }}>Profile not found in database.</p>
                )}
              </div>

              <div className="k-card">
                <div className="k-card-header"><div className="k-card-title">🏢 Departments</div><span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{departments.length} total</span></div>
                {departments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {departments.map((dept: any) => (
                      <div key={dept.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)', fontSize: '13px' }}>
                        <span style={{ fontWeight: 500, color: 'var(--k-text-primary)' }}>{dept.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>{dept.user_count} members</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--k-text-muted)' }}>{apiError ? 'Could not load departments — API offline' : 'No departments found'}</p>
                )}
              </div>
            </div>

            {status && (
              <div className="k-card">
                <div className="k-card-header"><div className="k-card-title">⚡ System Status</div><span className="k-pill green">All systems operational</span></div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span className="k-pill green">● API: {status.api}</span>
                  <span className="k-pill green">● Database: {status.database}</span>
                  <span className="k-pill green">● Auth0: {status.auth0}</span>
                  <span className="k-pill ai">● {status.sprint}</span>
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {status.tables?.map((table: string) => (
                    <span key={table} style={{ fontSize: '11px', fontFamily: 'var(--k-font-mono)', background: 'var(--k-bg-page)', padding: '2px 8px', borderRadius: 'var(--k-radius-sm)', color: 'var(--k-text-muted)', border: '1px solid var(--k-border-default)' }}>{table}</span>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      <DemoSwitcher />
    </div>
  )
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth0()
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--k-bg-topbar)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--k-font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--k-brand-lighter)', letterSpacing: '4px' }}>KINALYS</div>
      </div>
    )
  }
  return isAuthenticated ? <Dashboard /> : <LoginPage />
}
