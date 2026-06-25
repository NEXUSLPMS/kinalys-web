# QA Findings — task_005 (D7: UI Checklist Batch 1 — Design System, Layout, Typography)

**task_id**: task_005 · **repo**: kinalys-web · **dimension**: D7 (UI checklist)
**model**: Sonnet 4.6 (correct tier — mechanical checklist sweep)
**date**: 2026-06-22
**scope**: docs/ui-audit.md items 1-33 — Design System & Visual Foundations (1-10), Layout & Responsive Design (11-20), Typography & Readability (21-30), Performance intro (31-33)
**findings**: W-007 (S4) · W-008 (S3) · W-009 (S3) · W-010 (S4)
**running totals (kinalys-web) after this task**: 🔴 S1: 0 · 🟠 S2: 3 · 🟡 S3: 4 · 🟢 S4: 3 = **10 findings**

---

## W-007 · 🟢 S4 · Design token bypass — hardcoded hex/px in inline styles + undefined CSS vars in privacy modal (items 1-3, 10)

**QA dimension**: D7 · **Checklist items**: 1 (token system), 2 (semantic colors), 3 (spacing scale), 10 (consistency audit)

**What happens**: `src/styles/kinalys.css` defines a comprehensive `--k-*` design token system (8 font-size tokens, 10 spacing tokens, 5 radius tokens, 5 shadow tokens, semantic color palette across 9 themes). However inline styles throughout the codebase bypass these tokens with hardcoded values:

- **Hardcoded hex colors** in App.tsx: `background: '#EF4444'` (notification badge, lines 409, 418), `background: '#FFFBEB'` (unread alert row, line 435), `color: '#B45309'` (alert KPI name, line 439) — these should consume `--k-danger-solid`, `--k-warning-bg`, `--k-warning-text` respectively and would break/look wrong under dark or themed builds.
- **Hardcoded spacing** in inline styles: `marginBottom: '24px'`, `padding: '12px 16px'`, `gap: '16px'` instead of `var(--k-space-6)`, `var(--k-space-3) var(--k-space-4)`, etc. — pervasive across App.tsx, KpiTemplates.tsx, ExecDashboard.tsx and others.
- **Undefined CSS variables** in the privacy modal block (kinalys.css:1279-1390, appended section): references to `--k-font-body` (lines 1328, 1332, 1343, 1371), `--k-border-faint` (lines 1344, 1347, 1375), `--k-red-faint` (line 1367), `--k-red` (line 1368) — none of these tokens exist in the `:root` block. They silently fall back to browser defaults, making the privacy acknowledgement modal immune to theme changes.

**Impact**: The token bypass means themed builds (dark mode, Cyberpunk, etc.) will show light-theme colors for those specific components. Undefined CSS vars mean the privacy modal ignores the selected theme entirely. Design-system consistency gap.

**Suggested fix**: Replace hardcoded hex colors with their token equivalents; replace raw px spacing with `var(--k-space-*)` references; define the missing tokens (`--k-font-body` → alias `--k-font-sans`; `--k-border-faint` → alias `--k-border-default`; `--k-red` → `--k-danger-solid`) in the `:root` block.

---

## W-008 · 🟡 S3 · No mobile navigation — sidebar hidden at ≤768px with no replacement (item 11)

**QA dimension**: D7 · **Checklist item**: 11 (Mobile/Tablet breakpoints)

**What happens**: `kinalys.css:1227` sets `.k-sidebar { display: none }` at the 768px breakpoint. The sidebar contains the **entire navigation system** for the app — 5 collapsible sections with 28+ nav items covering all routes (Dashboard, Learning, Performance, Management, Help, Platform). No hamburger button, drawer, bottom navigation bar, or any mobile navigation alternative exists in either the CSS or App.tsx.

On a phone (≤480px) or tablet (≤768px), after login the authenticated user sees only the topbar and the main content area. The `activeNav` state defaults to `'home'` — once the user is on the home dashboard, **they cannot navigate to any other page**. Every other route is completely unreachable on mobile.

The topbar is present at all viewports (with the wordmark and Sign Out button) but no nav trigger exists within it at mobile widths.

**Impact**: Complete navigation failure on mobile/tablet. For a B2B SaaS this is partially mitigated by the primarily desktop user base, but blocks mobile use entirely and would block QA/testing on a phone. S3 rather than S2 because the target demo audience is laptop/desktop.

**Suggested fix**: Add a hamburger button to `.k-topbar` on mobile viewports that toggles a slide-in drawer containing the sidebar nav, or a bottom navigation bar for the most frequently used sections. The CSS toggle pattern can use a state boolean in App.tsx.

---

## W-009 · 🟡 S3 · Muted text contrast failure — `--k-text-muted` (#94A3B8 on white) ~2.4:1, below WCAG AA 4.5:1 (item 25)

**QA dimension**: D7 · **Checklist item**: 25 (Text color and contrast) · **WCAG**: 1.4.3 Contrast (AA)

**What happens**: The design token `--k-text-muted: #94A3B8` (RGB 148,163,184) on `--k-bg-surface: #FFFFFF` yields a contrast ratio of approximately **2.4:1** — well below the WCAG 2.1 AA requirement of **4.5:1** for normal text. `--k-text-disabled: #CBD5E1` is even lower (~1.6:1).

These tokens are applied to high-frequency UI elements throughout the app:
- `.k-sidebar-label`: section headers (uppercase 11px) — uses `var(--k-text-muted)`
- `.k-stat-trend`: the trend line under KPI stat cards — uses `var(--k-text-muted)` + `.up`/`.down` overrides
- `.k-page-sub`: page subtitle under the page title — uses `var(--k-text-muted)`
- `.k-stat-label`: KPI stat card labels (uppercase 11px) — uses `var(--k-text-muted)`
- Helper/secondary text throughout components

The muted color palette may have been chosen for visual aesthetics (low-contrast labels are fashionable in modern SaaS) but it creates a WCAG failure that affects every user in normal lighting conditions and is acutely problematic for users with low vision.

**Note**: The `--k-text-secondary: #475569` token achieves ~7.5:1 contrast on white (passes AA). The gap is specifically the `--k-text-muted` tier.

**Suggested fix**: Darken `--k-text-muted` to at least `#64748B` (approximately 4.6:1 on white) to pass WCAG AA while retaining the "muted" visual weight relative to `--k-text-primary`. Update the dark theme's `--k-text-muted: #64748B` value to a lighter equivalent that also passes on its dark background. Run all text/bg pairings through a contrast checker.

---

## W-010 · 🟢 S4 · Google Fonts loaded via CSS `@import` (render-blocking) with no font preloading (item 24)

**QA dimension**: D7 · **Checklist item**: 24 (Web font loading)

**What happens**: `kinalys.css` line 9 loads three Google Fonts families via a CSS `@import` statement:
```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&family=DM+Mono:wght@400;500&display=swap');
```

Issues:
1. **CSS `@import` is render-blocking** — the browser must download, parse, and execute the CSS file before discovering the `@import`, then issue a second round-trip for the Fonts CSS. The `<link rel="preload">` pattern in index.html is faster (parallel discovery).
2. **No `<link rel="preconnect">` in index.html** — the browser doesn't pre-establish the connection to `fonts.googleapis.com` / `fonts.gstatic.com`, adding DNS + TLS latency to the critical path.
3. The `display=swap` parameter IS included in the URL (preventing invisible text during load — PASS on FOIT).
4. index.html `<title>React App</title>` is the CRA default and never updated (see carries below).

**Impact**: Extended font loading time, potential FOUT (flash of unstyled text) duration. S4 rather than S3 because fonts do eventually load and `display=swap` prevents invisible text.

**Suggested fix**: Replace the CSS `@import` with `<link rel="preconnect" href="https://fonts.googleapis.com">` + `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` + `<link rel="stylesheet" href="...">` in `public/index.html`. This allows parallel discovery and connection pre-establishment.

---

## PASS / N-A checklist items (items 1-33)

| Item | Status | Notes |
|---|---|---|
| 1. Design token system | ✅ PASS | Comprehensive `--k-*` system in kinalys.css; 9 themes; font/spacing/color/shadow/radius tokens defined. W-007 covers bypass. |
| 2. Semantic color system | ✅ PASS | bg-page/surface, text-primary/secondary/muted, border-default, success/warning/danger/ai roles all defined. |
| 3. Spacing scale | ✅ PASS | 8px-base scale `--k-space-1..16` defined. W-007 covers inline bypasses. |
| 4. Elevation shadow system | ✅ PASS | 4+1 tier system: sm/md/lg/focus/glow. Compound shadows (ambient+diffuse). Cards use sm→md on hover. |
| 5. Border radius scale | ✅ PASS | 5-point scale: sm/md/lg/xl/pill. Nested elements respect hierarchy. |
| 6. Visual hierarchy | ✅ PASS | Clear k-page-title → k-card-title → body text → k-stat-label hierarchy. |
| 7. Button states | ⚠ PARTIAL | Hover states defined. No `:focus-visible`, `:active`, or `[disabled]` in design system CSS. → carry task_008 (a11y). |
| 8. Empty states | ⚠ PARTIAL | Alert dropdown has empty state (line 429-432). Other views to be assessed in task_006. |
| 9. Iconography | ⚠ GAP | Emoji used as icons throughout (🏠⚙️🔔⚠️✅✖) — no consistent icon library. Emoji lack ARIA labels. → carry task_008 (a11y). |
| 10. Consistency audit | ⚠ SEE W-007 | W-007 covers inconsistencies (token bypass, undefined CSS vars, hardcoded colors). |
| 11. Mobile/tablet breakpoints | 🔴 W-008 | Two breakpoints (768px, 480px) exist but nav disappears with no replacement. |
| 12. Horizontal scroll | ✅ PASS | `overflow-x: hidden` on html/body; tables get `display:block; overflow-x:auto` at 768px. |
| 13. Responsive grid | ✅ PASS | Stat grids collapse 4→2→1 at breakpoints. Not `auto-fit/minmax` but adequate for current layout. |
| 14. Touch targets | ⚠ GAP | Nav items (~36px height, 8px padding) and theme dots (28×28px) below 44×44px minimum. → carry task_008. |
| 15. Layout shift | ⚠ PARTIAL | No image dimension policies observed. Fonts use display=swap (FOUT handled). Skeleton/spinner loading not assessed here → task_006. |
| 16. Safe area insets | ⚠ MINOR | No `env(safe-area-inset-*)` or `viewport-fit=cover`. → noted (S5 enhancement). |
| 17. Sticky header | ✅ PASS | Topbar is always visible via grid `grid-row: 1; grid-column: 1/-1`. Content scrolls in `.k-main`. |
| 18. Content density | ✅ PASS | Balanced for B2B SaaS. Card padding 20px, stat cards 16-20px. Appropriate density for data-heavy screens. |
| 19. Container queries | N/A | Not implemented; no single component serves multiple container widths. Enhancement only. |
| 20. Z-index stacking | ⚠ MINOR | Only 2 z-index values in system (topbar:100, privacy:99999); alert dropdown uses inline `zIndex:1000`. No formal z-index scale documented. Minor. |
| 21. Type scale | ✅ PASS | 8 defined size tokens (11/12/14/16/18/22/28/36px). Named tiers (xs/sm/base/md/lg/xl/2xl/3xl). |
| 22. Fluid typography | N/A | Fixed px sizes; no `clamp()`. N/A for data-dense SaaS dashboard. |
| 23. Reading line length | N/A | Not a reading/editorial app. Dashboard/table content is not long-form prose. |
| 24. Font loading | 🟡 W-010 | CSS @import render-blocking; no preconnect/preload in index.html. display=swap present (FOIT OK). |
| 25. Text contrast | 🔴 W-009 | --k-text-muted (#94A3B8 on white) ~2.4:1, fails WCAG AA 4.5:1. |
| 26. Heading structure | ⚠ PARTIAL | LoginPage has `<h1>` (line 72). Dashboard uses `<div className="k-page-title">` — semantic heading tags not used in main app shell. Page titles are presentation only (divs with CSS classes). → carry task_008 (semantic HTML / a11y). |
| 27. Text overflow | ✅ PASS | `.k-page-title` has ellipsis/nowrap on mobile. Tables scroll horizontally. |
| 28. Number formatting | ✅ PASS | `.toFixed(1)`/`.toLocaleString()` used consistently. Date formatting via `toLocaleDateString('en-IN', ...)`. Custom INR currency formatter in Scorecard.tsx. |
| 29. Typographic details | ⚠ MINOR | No curly quotes; no `text-rendering: optimizeLegibility`. Low priority for SaaS. |
| 30. Text casing | ✅ PASS | Nav items sentence case. Labels uppercase via CSS. Buttons sentence case. Consistent. |
| 31. Performance audit | → task_009 | Carry: bundle size, eager imports of 31 pages, xlsx/jspdf heavy deps. |
| 32. Bundle size | → task_009/013 | Carry: heavy deps (xlsx@0.18.5, jspdf, @anthropic-ai/sdk unused). |
| 33. Code splitting | → task_009 | Carry: no React.lazy on 31 pages imported at App.tsx:5-36. Already recorded in task_004 carries. |

---

## Carries to other tasks

- **Button `:focus-visible` / `:active` / `disabled` gaps** → task_006 (button states / UX) + task_008 (keyboard/a11y)
- **Emoji-as-icon without ARIA** (🏠⚙️🔔 etc.) → task_008 (a11y: icons need accessible labels)
- **Semantic heading structure** (div.k-page-title vs h1-h3) → task_008 (semantic HTML)
- **Touch target sizes below 44px** (nav items 36px, theme dots 28px) → task_008 (a11y)
- **Static page title "React App"** (document.title never set) → item 56 scope, task_008
- **Safe area insets / viewport-fit=cover** → task_008 (minor S5)
- **No `<link rel="preconnect">` for Google Fonts** (confirm fix alongside W-010)
- **Empty states for other views** → task_006 (loading/error/empty system states)
- **Code-splitting and bundle size** → task_009 / task_013

## Next pending
**task_006** (D7 — UI checklist batch 2, items ~34-66: forms/inputs, feedback states, loading/empty/error/success, motion, buttons). `intended_model: Sonnet 4.6` — same tier, no switch needed.
