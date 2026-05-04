import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useState } from 'react'
import { setAuthToken, getMyProfile, getStatus, getDepartments, getDashboardStats, getMyTalentPosition } from './api/client'
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

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  function toggleSection(section: string) {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  useEffect(() => {
    async function loadData() {
      try {
        const token = await getAccessTokenSilently({ authorizationParams: { audience: 'https://api.kinalys.io' } })
        setAuthToken(token)
       const [statusData, profileData, deptData, statsData, talentData] = await Promise.allSettled([getStatus(), getMyProfile(), getDepartments(), getDashboardStats(), getMyTalentPosition()])
        if (statusData.status === 'fulfilled') setStatus(statusData.value)
        if (profileData.status === 'fulfilled') setProfile(profileData.value.user)
        if (deptData.status === 'fulfilled') setDepartments(deptData.value.departments || [])
        if (statsData.status === 'fulfilled') setDashStats(statsData.value)
        if (talentData.status === 'fulfilled') setTalentPosition(talentData.value)
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
            <div className={`k-nav-item ${activeNav === 'learning' ? 'active' : ''}`} onClick={() => setActiveNav('learning')}>🎓 My Learning</div>
            <div className={`k-nav-item ${activeNav === 'catalog' ? 'active' : ''}`} onClick={() => setActiveNav('catalog')}>📚 Course Catalog</div>
            <div className={`k-nav-item ${activeNav === 'certs' ? 'active' : ''}`} onClick={() => setActiveNav('certs')}>🏆 Certifications</div>
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
          {!collapsedSections['performance'] && <>
            <div className={`k-nav-item ${activeNav === 'exec' ? 'active' : ''}`} onClick={() => setActiveNav('exec')}>📈 Exec Dashboard</div>
            <div className={`k-nav-item ${activeNav === 'scorecard' ? 'active' : ''}`} onClick={() => setActiveNav('scorecard')}>📊 My Scorecard</div>
            <div className={`k-nav-item ${activeNav === 'ai' ? 'active' : ''}`} onClick={() => setActiveNav('ai')}>🤖 AI Coaching</div>
            <div className={`k-nav-item ${activeNav === 'copc' ? 'active' : ''}`} onClick={() => setActiveNav('copc')}>🏢 COPC Scorecard</div>
            <div className={`k-nav-item ${activeNav === 'sixsigma' ? 'active' : ''}`} onClick={() => setActiveNav('sixsigma')}>⚙️ Six Sigma</div>
            <div className={`k-nav-item ${activeNav === 'oneonone' ? 'active' : ''}`} onClick={() => setActiveNav('oneonone')}>🗣️ 1-on-1 Reviews</div>
            <div className={`k-nav-item ${activeNav === 'competency' ? 'active' : ''}`} onClick={() => setActiveNav('competency')}>🎯 Competency</div>
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
              <div className={`k-nav-item ${activeNav === 'org' ? 'active' : ''}`} onClick={() => setActiveNav('org')}>🏢 Organisation</div>
              <div className={`k-nav-item ${activeNav === 'import' ? 'active' : ''}`} onClick={() => setActiveNav('import')}>📥 Import Users</div>
              <div className={`k-nav-item ${activeNav === 'bsc' ? 'active' : ''}`} onClick={() => setActiveNav('bsc')}>⚖️ Balanced Scorecard</div>
              <div className={`k-nav-item ${activeNav === 'okr' ? 'active' : ''}`} onClick={() => setActiveNav('okr')}>🎯 OKR Framework</div>
              <div className={`k-nav-item ${activeNav === 'talent' ? 'active' : ''}`} onClick={() => setActiveNav('talent')}>🎯 Talent Grid</div>
              <div className={`k-nav-item ${activeNav === 'users' ? 'active' : ''}`} onClick={() => setActiveNav('users')}>👥 User Management</div>
              <div className={`k-nav-item ${activeNav === 'kpi' ? 'active' : ''}`} onClick={() => setActiveNav('kpi')}>📋 KPI Templates</div>
              <div className={`k-nav-item ${activeNav === 'exec' ? 'active' : ''}`} onClick={() => setActiveNav('exec')}>📈 Exec Dashboard</div>
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
            <div className={`k-nav-item ${activeNav === 'kb' ? 'active' : ''}`} onClick={() => setActiveNav('kb')}>📖 Knowledge Base</div>
            <div className={`k-nav-item ${activeNav === 'support' ? 'active' : ''}`} onClick={() => setActiveNav('support')}>🎫 Support Tickets</div>
          </>}
        </div>

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
        ) : (
          <div className="k-page">

            {apiError && (
              <div style={{ background: 'var(--k-danger-bg)', border: '1px solid var(--k-danger-border)', borderRadius: 'var(--k-radius-md)', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: 'var(--k-danger-text)' }}>
                ⚠ API connection issue: {apiError}
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <div className="k-page-title">Welcome back, {profile?.fullName || user?.name || 'there'} 👋</div>
              <div className="k-page-sub">{profile?.role === 'hr_admin' ? 'HR Admin' : 'Team Member'} · {profile?.tenant?.name || 'Your workspace'} · {profile?.designation || 'Kinalys Platform'}</div>
            </div>


            {/* 9-Box Position Card */}
            {talentPosition?.position && (
              <div className="k-card" style={{ marginBottom: '24px' }}>
                <div className="k-card-header">
                  <div className="k-card-title">My Talent Profile</div>
                  <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>{talentPosition.cycle?.name}</span>
                </div>
                <div style={{ padding: '20px', display: 'flex', gap: '32px', alignItems: 'center' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {talentPosition.position.has_potential_rating ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: talentPosition.position.potential_rating >= 4 ? 'var(--k-success-text)' : talentPosition.position.potential_rating >= 3 ? 'var(--k-warning-text)' : 'var(--k-danger-text)', background: talentPosition.position.potential_rating >= 4 ? 'var(--k-success-bg)' : talentPosition.position.potential_rating >= 3 ? 'var(--k-warning-bg)' : 'var(--k-danger-bg)', padding: '4px 14px', borderRadius: '10px' }}>
                              {talentPosition.position.potential_rating >= 4 ? 'High Potential' : talentPosition.position.potential_rating >= 3 ? 'Medium Potential' : 'Developing'}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>· Manager assessed</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '13px', color: 'var(--k-text-muted)' }}>Not yet assessed by your manager</span>
                        )}
                      </div>
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
              <div className="k-stat-card accent">
                <div className="k-stat-label">Overall Score</div>
                <div className="k-stat-value" style={{ color: dashStats?.overall_score >= 90 ? 'var(--k-success-text)' : dashStats?.overall_score >= 80 ? 'var(--k-warning-text)' : dashStats?.overall_score ? 'var(--k-danger-text)' : 'var(--k-text-muted)' }}>
                  {dashStats?.overall_score !== null && dashStats?.overall_score !== undefined ? `${dashStats.overall_score}%` : '—'}
                </div>
                <div className="k-stat-trend">
                  {dashStats?.overall_score >= 90 ? '🟢 High Performance' : dashStats?.overall_score >= 80 ? '🟡 Medium Performance' : dashStats?.overall_score ? '🔴 Needs Improvement' : 'No score yet'}
                </div>
              </div>
              <div className="k-stat-card green">
                <div className="k-stat-label">Learning Hours</div>
                <div className="k-stat-value">{dashStats?.completed_hours ?? '—'}</div>
                <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginTop: '4px' }}>
                  {dashStats?.learning_pct ?? 0}% of {dashStats?.learning_target ?? 40} hr target
                </div>
              </div>
              <div className="k-stat-card purple">
                <div className="k-stat-label">Pending KPIs</div>
                <div className="k-stat-value">{dashStats?.pending_kpis ?? '—'}</div>
                <div className="k-stat-trend">{dashStats?.pending_kpis > 0 ? 'Awaiting approval' : 'All approved'}</div>
              </div>
              <div className="k-stat-card amber">
                <div className="k-stat-label">Certifications</div>
                <div className="k-stat-value">{dashStats?.certifications ?? '—'}</div>
                <div className="k-stat-trend">{dashStats?.upcoming_one_on_ones > 0 ? `${dashStats.upcoming_one_on_ones} upcoming 1-on-1` : 'Earned'}</div>
              </div>
            </div>

            <div className="k-lms-banner" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>📚 Learning Hours</div>
                {dashStats?.learning_pct >= 100 && <span className="k-pill lms">TARGET HIT — BONUS ACTIVE</span>}
                {dashStats?.learning_pct < 100 && dashStats?.learning_pct > 0 && <span className="k-pill amber">{dashStats.learning_pct}% COMPLETE</span>}
              </div>
              <div className="k-lms-progress"><div className="k-lms-progress-fill" style={{ width: `${dashStats?.learning_pct ?? 0}%` }}/></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.8 }}>
                <span>{dashStats?.completed_hours ?? 0} hrs achieved</span>
                <span>{dashStats?.learning_pct ?? 0}% of target</span>
                <span>Annual target: {dashStats?.learning_target ?? 40} hrs</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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