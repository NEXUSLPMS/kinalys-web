/**
 * KINALYS THEME SYSTEM
 * React context for theme switching across all 9 themes
 * 
 * Usage:
 *   1. Wrap your app in <KinalysThemeProvider>
 *   2. Use useKinalysTheme() hook anywhere to read/set theme
 *   3. Theme persists to localStorage automatically
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// ── Theme definitions ─────────────────────────────────────────
export type ThemeId =
  | 'light'       // Default — Light Professional
  | 'dark'        // Dark Mode
  | 'matcha'      // Matcha — Sprint 3
  | 'coffee'      // Coffee — Sprint 3
  | 'cyberpunk'   // Cyberpunk — Sprint 4
  | 'nfs'         // Need For Speed — Sprint 4
  | 'matrix'      // The Matrix — Sprint 4
  | 'avengers'    // Avengers — Pro
  | 'ironman'     // Iron Man — Pro

export interface Theme {
  id: ThemeId
  name: string
  description: string
  color: string        // Swatch colour for the theme picker
  available: boolean   // false = coming soon
  tier: 'standard' | 'sprint4' | 'pro'
}

export const THEMES: Theme[] = [
  {
    id: 'light',
    name: 'Light Professional',
    description: 'Clean teal and white — the default Kinalys experience',
    color: '#1D9E75',
    available: true,
    tier: 'standard',
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Deep dark with teal accents — easy on the eyes',
    color: '#0D4F4F',
    available: true,
    tier: 'standard',
  },
  {
    id: 'matcha',
    name: 'Matcha',
    description: 'Sage green and cream — calm and focused',
    color: '#4A7C59',
    available: true,
    tier: 'standard',
  },
  {
    id: 'coffee',
    name: 'Coffee',
    description: 'Espresso and warm amber — rich and grounded',
    color: '#3D1C02',
    available: true,
    tier: 'standard',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon magenta and cyan on near-black — electrifying',
    color: '#FF00FF',
    available: false,
    tier: 'sprint4',
  },
  {
    id: 'nfs',
    name: 'Need For Speed',
    description: 'Jet black and vivid orange — pure performance',
    color: '#FF6B00',
    available: false,
    tier: 'sprint4',
  },
  {
    id: 'matrix',
    name: 'The Matrix',
    description: 'Terminal green on black — you see the code',
    color: '#00FF41',
    available: false,
    tier: 'sprint4',
  },
  {
    id: 'avengers',
    name: 'Avengers',
    description: 'Deep navy and gold — heroic and aspirational',
    color: '#C9A84C',
    available: false,
    tier: 'pro',
  },
  {
    id: 'ironman',
    name: 'Iron Man',
    description: 'Black and gold with arc reactor teal — JARVIS mode',
    color: '#FFD700',
    available: false,
    tier: 'pro',
  },
]

// ── Context ───────────────────────────────────────────────────
interface KinalysThemeContextValue {
  theme: Theme
  themeId: ThemeId
  setTheme: (id: ThemeId) => void
  themes: Theme[]
}

const KinalysThemeContext = createContext<KinalysThemeContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────
interface KinalysThemeProviderProps {
  children: ReactNode
  defaultTheme?: ThemeId
}

export function KinalysThemeProvider({
  children,
  defaultTheme = 'light',
}: KinalysThemeProviderProps) {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    // Read from localStorage on first render
    try {
      const saved = localStorage.getItem('kinalys-theme') as ThemeId
      if (saved && THEMES.find(t => t.id === saved && t.available)) {
        return saved
      }
    } catch {}
    return defaultTheme
  })

  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0]

  useEffect(() => {
    // Apply theme to html element
    const html = document.documentElement
    
    // Remove all theme attributes
    html.removeAttribute('data-theme')
    
    // Apply new theme (light is the default — no attribute needed)
    if (themeId !== 'light') {
      html.setAttribute('data-theme', themeId)
    }

    // Save to localStorage
    try {
      localStorage.setItem('kinalys-theme', themeId)
    } catch {}
  }, [themeId])

  const setTheme = (id: ThemeId) => {
    const target = THEMES.find(t => t.id === id)
    if (target?.available) {
      setThemeId(id)
    }
  }

  return (
    <KinalysThemeContext.Provider value={{ theme, themeId, setTheme, themes: THEMES }}>
      {children}
    </KinalysThemeContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────
export function useKinalysTheme(): KinalysThemeContextValue {
  const ctx = useContext(KinalysThemeContext)
  if (!ctx) {
    throw new Error('useKinalysTheme must be used within KinalysThemeProvider')
  }
  return ctx
}

// ── Theme Switcher Component ──────────────────────────────────
export function ThemeSwitcher() {
  const { themeId, setTheme, themes } = useKinalysTheme()

  return (
    <div style={{ padding: '16px' }}>
      <p style={{
        fontSize: '11px',
        fontWeight: 700,
        color: 'var(--k-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        marginBottom: '12px',
      }}>
        Theme
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {themes.map(t => (
          <div
            key={t.id}
            title={t.available ? t.name : `${t.name} — Coming Soon`}
            onClick={() => t.available && setTheme(t.id)}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: t.color,
              cursor: t.available ? 'pointer' : 'not-allowed',
              opacity: t.available ? 1 : 0.35,
              border: themeId === t.id
                ? '2px solid var(--k-text-primary)'
                : '2px solid transparent',
              transform: themeId === t.id ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 150ms ease',
              position: 'relative',
            }}
          />
        ))}
      </div>
    </div>
  )
}
