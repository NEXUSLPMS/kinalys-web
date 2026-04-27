import { useAuth0 } from '@auth0/auth0-react'
import { useKinalysTheme, ThemeId } from '../contexts/KinalysTheme'
import { useState, useEffect } from 'react'

type ThemeMode = 'system' | 'manual' | 'monthly_surprise' | 'seasonal' | 'scheduled'

const SEASONAL_MAP: Record<number, ThemeId> = {
  1: 'matcha', 2: 'matcha', 3: 'matcha',
  4: 'light',  5: 'light',  6: 'light',
  7: 'coffee', 8: 'coffee', 9: 'coffee',
  10: 'dark',  11: 'dark',  12: 'dark',
}

interface Theme {
  id: string
  name: string
  description: string
  color: string
  available: boolean
  tier: string
}

interface ThemeDotPickerProps {
  value: ThemeId
  onChange: (id: ThemeId) => void
  themeList: Theme[]
  label: string
}

function ThemeDotPicker({ value, onChange, themeList, label }: ThemeDotPickerProps) {
  return (
    <div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--k-text-secondary)', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {themeList.map((t: Theme) => (
          <div
            key={t.id}
            onClick={() => onChange(t.id as ThemeId)}
            title={t.name}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: t.color, cursor: 'pointer',
              border: value === t.id ? '3px solid var(--k-brand-primary)' : '2px solid transparent',
              boxShadow: value === t.id ? '0 0 0 2px var(--k-bg-surface)' : 'none',
              transition: 'all var(--k-transition)',
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginTop: '6px' }}>
        {themeList.find((t: Theme) => t.id === value)?.name || '—'}
      </div>
    </div>
  )
}

export default function AccountSettings({ onBack }: { onBack: () => void }) {
  const { user } = useAuth0()
  const { themeId, setTheme, themes } = useKinalysTheme()

  const [themeMode, setThemeMode] = useState<ThemeMode>(
    () => (localStorage.getItem('kinalys-theme-mode') as ThemeMode) || 'system'
  )
  const [systemLightTheme, setSystemLightTheme] = useState<ThemeId>(
    () => (localStorage.getItem('kinalys-system-light') as ThemeId) || 'light'
  )
  const [systemDarkTheme, setSystemDarkTheme] = useState<ThemeId>(
    () => (localStorage.getItem('kinalys-system-dark') as ThemeId) || 'dark'
  )
  const [weekdayTheme, setWeekdayTheme] = useState<ThemeId>(
    () => (localStorage.getItem('kinalys-weekday-theme') as ThemeId) || 'light'
  )
  const [weekendTheme, setWeekendTheme] = useState<ThemeId>(
    () => (localStorage.getItem('kinalys-weekend-theme') as ThemeId) || 'dark'
  )
  const [saved, setSaved] = useState(false)

  const availableThemes = themes.filter((t: Theme) => t.available)
  const allAvailable = availableThemes
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isWeekend = [0, 6].includes(new Date().getDay())
  const month = new Date().getMonth() + 1

  // ── System mode — watch OS preference in real time ───────────
  useEffect(() => {
    if (themeMode !== 'system') return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    function applySystemTheme(isDark: boolean) {
      setTheme(isDark ? systemDarkTheme : systemLightTheme)
    }
    applySystemTheme(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => applySystemTheme(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [themeMode, systemLightTheme, systemDarkTheme, setTheme])

  function applyThemeMode(mode: ThemeMode) {
    setThemeMode(mode)
    localStorage.setItem('kinalys-theme-mode', mode)
    if (mode === 'seasonal') {
      const seasonal = SEASONAL_MAP[month]
      const t = themes.find((t: Theme) => t.id === seasonal && t.available)
      if (t) setTheme(seasonal)
    }
    if (mode === 'scheduled') {
      setTheme(isWeekend ? weekendTheme : weekdayTheme)
    }
  }

  function saveSettings() {
    localStorage.setItem('kinalys-theme-mode', themeMode)
    localStorage.setItem('kinalys-system-light', systemLightTheme)
    localStorage.setItem('kinalys-system-dark', systemDarkTheme)
    localStorage.setItem('kinalys-weekday-theme', weekdayTheme)
    localStorage.setItem('kinalys-weekend-theme', weekendTheme)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="k-page">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'var(--k-bg-surface)',
              border: '1px solid var(--k-border-default)',
              borderRadius: 'var(--k-radius-md)',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '13px',
              color: 'var(--k-text-secondary)',
              fontFamily: 'var(--k-font-sans)',
            }}
          >
            ← Back
          </button>
          <div>
            <div className="k-page-title">Account Settings</div>
            <div className="k-page-sub">Manage your profile and personalisation preferences</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* Profile card */}
          <div className="k-card">
            <div className="k-card-header">
              <div className="k-card-title">👤 Profile</div>
            </div>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['Name', user?.name || '—'],
                  ['Email', user?.email || '—'],
                  ['Auth0 ID', (user?.sub?.substring(0, 24) || '—') + '...'],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: '1px solid var(--k-border-default)' }}>
                    <td style={{ padding: '10px 0', color: 'var(--k-text-muted)', width: '35%' }}>{label}</td>
                    <td style={{ padding: '10px 0', fontWeight: 500, color: 'var(--k-text-primary)' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '16px' }}>
              <button className="k-btn k-btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }}>
                Change Password
              </button>
            </div>
          </div>

          {/* Theme Mode selector */}
          <div className="k-card">
            <div className="k-card-header">
              <div className="k-card-title">🎨 Theme Mode</div>
              <span style={{
                fontSize: '10px', fontWeight: 700,
                background: 'var(--k-ai-bg)', color: 'var(--k-ai-text)',
                padding: '2px 8px', borderRadius: 'var(--k-radius-pill)',
              }}>
                {isSystemDark ? 'OS: Dark' : 'OS: Light'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {([
                ['system',           '💻 System',           'Follows your device light/dark setting — updates in real time'],
                ['manual',           '🖱️ Manual',            'You choose a theme and it stays until you change it'],
                ['monthly_surprise', '🎲 Monthly Surprise',  'Kinalys picks a new theme on the 1st of each month'],
                ['seasonal',         '🌿 Seasonal',          'Theme changes automatically each quarter'],
                ['scheduled',        '📅 Scheduled',         'Different themes for weekdays and weekends'],
              ] as [ThemeMode, string, string][]).map(([mode, label, desc]) => (
                <div
                  key={mode}
                  onClick={() => applyThemeMode(mode)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--k-radius-md)',
                    border: `1px solid ${themeMode === mode ? 'var(--k-brand-primary)' : 'var(--k-border-default)'}`,
                    background: themeMode === mode ? 'var(--k-brand-faint)' : 'var(--k-bg-surface)',
                    cursor: 'pointer',
                    transition: 'all var(--k-transition)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-primary)' }}>
                      {label}
                      {mode === 'system' && (
                        <span style={{
                          marginLeft: '8px', fontSize: '10px',
                          background: 'var(--k-success-bg)', color: 'var(--k-success-text)',
                          padding: '1px 6px', borderRadius: '10px', fontWeight: 700,
                        }}>DEFAULT</span>
                      )}
                    </div>
                    {themeMode === mode && (
                      <span style={{ fontSize: '11px', color: 'var(--k-brand-primary)', fontWeight: 700 }}>● ACTIVE</span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginTop: '3px', lineHeight: 1.5 }}>
                    {desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System mode pickers */}
          {themeMode === 'system' && (
            <div className="k-card">
              <div className="k-card-header">
                <div className="k-card-title">💻 System Theme Preferences</div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--k-text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
                Choose which Kinalys theme to use when your device is in light mode and which to use in dark mode. Switches automatically when your OS switches.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <ThemeDotPicker
                  value={systemLightTheme}
                  onChange={(id) => {
                    setSystemLightTheme(id)
                    if (!isSystemDark) setTheme(id)
                  }}
                  themeList={allAvailable}
                  label={`☀️ When OS is in Light Mode${!isSystemDark ? ' ← active now' : ''}`}
                />
                <ThemeDotPicker
                  value={systemDarkTheme}
                  onChange={(id) => {
                    setSystemDarkTheme(id)
                    if (isSystemDark) setTheme(id)
                  }}
                  themeList={allAvailable}
                  label={`🌙 When OS is in Dark Mode${isSystemDark ? ' ← active now' : ''}`}
                />
              </div>
              <div style={{
                marginTop: '16px', fontSize: '12px', color: 'var(--k-text-muted)',
                background: 'var(--k-bg-page)', padding: '10px 14px',
                borderRadius: 'var(--k-radius-md)', lineHeight: 1.6,
              }}>
                Your OS is currently in{' '}
                <strong style={{ color: 'var(--k-text-primary)' }}>{isSystemDark ? 'Dark' : 'Light'} Mode</strong>.
                Kinalys is showing your{' '}
                <strong style={{ color: 'var(--k-text-primary)' }}>
                  {isSystemDark
                    ? themes.find((t: Theme) => t.id === systemDarkTheme)?.name
                    : themes.find((t: Theme) => t.id === systemLightTheme)?.name}
                </strong> theme.
              </div>
            </div>
          )}

          {/* Manual theme picker */}
          {themeMode === 'manual' && (
            <div className="k-card">
              <div className="k-card-header">
                <div className="k-card-title">🎨 Choose Your Theme</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginTop: '8px' }}>
                {availableThemes.map((t: Theme) => (
                  <div
                    key={t.id}
                    onClick={() => setTheme(t.id as ThemeId)}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--k-radius-md)',
                      border: `2px solid ${themeId === t.id ? 'var(--k-brand-primary)' : 'var(--k-border-default)'}`,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      transition: 'all var(--k-transition)',
                      background: themeId === t.id ? 'var(--k-brand-faint)' : 'var(--k-bg-surface)',
                    }}
                  >
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: t.color, flexShrink: 0,
                      border: themeId === t.id ? '2px solid var(--k-brand-primary)' : '2px solid transparent',
                    }}/>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-primary)' }}>{t.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--k-text-muted)', marginTop: '2px' }}>{t.description}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px' }}>
                <div style={{
                  fontSize: '11px', fontWeight: 700, color: 'var(--k-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px',
                }}>
                  Coming Soon
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {themes.filter((t: Theme) => !t.available).map((t: Theme) => (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', borderRadius: 'var(--k-radius-pill)',
                      background: 'var(--k-bg-page)', border: '1px solid var(--k-border-default)',
                      opacity: 0.6, fontSize: '12px', color: 'var(--k-text-muted)',
                    }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.color }}/>
                      {t.name}
                      <span style={{
                        fontSize: '10px', background: 'var(--k-ai-bg)',
                        color: 'var(--k-ai-text)', padding: '1px 6px', borderRadius: '10px',
                      }}>
                        {t.tier === 'pro' ? 'Pro' : 'Soon'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scheduled theme pickers */}
          {themeMode === 'scheduled' && (
            <div className="k-card">
              <div className="k-card-header">
                <div className="k-card-title">📅 Scheduled Themes</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <ThemeDotPicker
                  value={weekdayTheme}
                  onChange={(id) => {
                    setWeekdayTheme(id)
                    if (!isWeekend) setTheme(id)
                  }}
                  themeList={allAvailable}
                  label={`Weekday Theme (Mon–Fri)${!isWeekend ? ' ← active now' : ''}`}
                />
                <ThemeDotPicker
                  value={weekendTheme}
                  onChange={(id) => {
                    setWeekendTheme(id)
                    if (isWeekend) setTheme(id)
                  }}
                  themeList={allAvailable}
                  label={`Weekend Theme (Sat–Sun)${isWeekend ? ' ← active now' : ''}`}
                />
                <div style={{
                  fontSize: '12px', color: 'var(--k-text-muted)',
                  background: 'var(--k-bg-page)', padding: '10px 14px',
                  borderRadius: 'var(--k-radius-md)', lineHeight: 1.6,
                }}>
                  Today is a{' '}
                  <strong style={{ color: 'var(--k-text-primary)' }}>{isWeekend ? 'Weekend' : 'Weekday'}</strong>
                  {' '}— showing your{' '}
                  <strong style={{ color: 'var(--k-text-primary)' }}>
                    {isWeekend
                      ? themes.find((t: Theme) => t.id === weekendTheme)?.name
                      : themes.find((t: Theme) => t.id === weekdayTheme)?.name}
                  </strong> theme
                </div>
              </div>
            </div>
          )}

          {/* Seasonal schedule */}
          {themeMode === 'seasonal' && (
            <div className="k-card">
              <div className="k-card-header">
                <div className="k-card-title">🌿 Seasonal Schedule</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {([
                  ['Q1 Jan–Mar', 'matcha',  '#4A7C59', 'Fresh start, calm focus'],
                  ['Q2 Apr–Jun', 'light',   '#1D9E75', 'Bright, energetic, growth'],
                  ['Q3 Jul–Sep', 'coffee',  '#C8813A', 'Warm, grounded, delivery'],
                  ['Q4 Oct–Dec', 'dark',    '#0D4F4F', 'Deep focus, year-end push'],
                ] as [string, ThemeId, string, string][]).map(([quarter, tid, color, mood]) => {
                  const isCurrent =
                    (quarter.includes('Jan') && month <= 3) ||
                    (quarter.includes('Apr') && month >= 4 && month <= 6) ||
                    (quarter.includes('Jul') && month >= 7 && month <= 9) ||
                    (quarter.includes('Oct') && month >= 10)
                  return (
                    <div key={quarter} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 14px', borderRadius: 'var(--k-radius-md)',
                      background: isCurrent ? 'var(--k-brand-faint)' : 'var(--k-bg-page)',
                      border: `1px solid ${isCurrent ? 'var(--k-brand-primary)' : 'var(--k-border-default)'}`,
                    }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: color, flexShrink: 0 }}/>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--k-text-primary)' }}>
                          {quarter} — {themes.find((t: Theme) => t.id === tid)?.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>{mood}</div>
                      </div>
                      {isCurrent && (
                        <span style={{ fontSize: '10px', color: 'var(--k-brand-primary)', fontWeight: 700 }}>NOW</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Monthly Surprise info */}
          {themeMode === 'monthly_surprise' && (
            <div className="k-card">
              <div className="k-card-header">
                <div className="k-card-title">🎲 Monthly Surprise</div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--k-text-muted)', lineHeight: 1.7, marginBottom: '16px' }}>
                On the 1st of every month, Kinalys picks a new theme for you. You will receive a notification email — "Your [Month] theme is live."
              </p>
              <div style={{
                background: 'var(--k-bg-page)', borderRadius: 'var(--k-radius-md)',
                padding: '16px', fontSize: '13px', color: 'var(--k-text-secondary)', lineHeight: 1.6,
              }}>
                <div style={{ fontWeight: 600, color: 'var(--k-text-primary)', marginBottom: '8px' }}>
                  Current month theme
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1D9E75' }}/>
                  <div>
                    <div style={{ fontWeight: 600 }}>Light Professional</div>
                    <div style={{ fontSize: '11px', color: 'var(--k-text-muted)' }}>
                      {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--k-text-muted)' }}>
                Switch to Manual at any time to override the monthly theme.
              </div>
            </div>
          )}

        </div>

        {/* Save button */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            className="k-btn k-btn-primary"
            onClick={saveSettings}
            style={{ padding: '10px 28px' }}
          >
            {saved ? '✓ Saved' : 'Save Settings'}
          </button>
          <span style={{ fontSize: '12px', color: 'var(--k-text-muted)' }}>
            Theme preferences are saved to your browser automatically
          </span>
        </div>

      </div>
    </div>
  )
}