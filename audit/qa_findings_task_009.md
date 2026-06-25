# QA Findings — task_009 (D9: Performance Checklist Frontend Subset — Items 1-46)

**task_id**: task_009 · **repo**: kinalys-web · **dimension**: D9 (performance)
**model**: Sonnet 4.6 (intended Sonnet 4.6 — correct tier for mechanical performance checklist)
**date**: 2026-06-22
**scope**: docs/performance-audit.md items 1-46 (rendering/re-render control, memoization, list virtualization, bundle size/code-splitting, images/fonts/media, perceived-perf). Client network/caching items → task_010.
**findings**: W-021 (S3) · W-022 (S4)
**running totals (kinalys-web) after this task**: 🔴 S1: 0 · 🟠 S2: 3 · 🟡 S3: 8 · 🟢 S4: 11 = **22 findings**

---

## W-021 · 🟡 S3 · No code-splitting — all 31 pages imported eagerly; xlsx + jspdf (~1MB gzipped) ship to every user in the initial bundle (items 32, 33, 42)

**QA dimension**: D9 · **Checklist items**: 32 (Shrink the JavaScript Bundle), 33 (Route-Based Code Splitting), 42 (Optimize the Critical Rendering Path)

**What happens**: `App.tsx:5-36` imports every one of the 31 page components as static top-level imports — there is no `React.lazy`, no `Suspense`, and no dynamic `import()` anywhere in the codebase. CRA/webpack therefore bundles all 31 pages into a **single main chunk** that every user must download and parse before anything is interactive.

This is compounded by two heavy library chains that land in the initial bundle:

**Chain 1 — xlsx + jspdf (via reportExport.ts):**
```
App.tsx:26 (static import)
  → COPCReport.tsx:3  — import { exportCOPCPDF, exportCOPCXLSX } from '../utils/reportExport'
  → SixSigmaReport.tsx:3 — import { exportSixSigmaPDF, exportSixSigmaXLSX } from '../utils/reportExport'
      → utils/reportExport.ts:1-3
            → jspdf@4.2.1 + jspdf-autotable@5.0.7
            → xlsx@0.18.5
```

**Chain 2 — xlsx (via KpiTemplates.tsx):**
```
App.tsx:13 (static import)
  → KpiTemplates.tsx:2 — import * as XLSX from 'xlsx'
      → xlsx@0.18.5 (same library, deduplicated by webpack, but the import ensures it bundles)
```

Approximate production bundle weight added by these libs (minified + gzipped estimates):
- `xlsx@0.18.5`: ~230 KB gzipped
- `jspdf@4.2.1`: ~160 KB gzipped
- `jspdf-autotable@5.0.7`: ~30 KB gzipped

These PDF/spreadsheet libraries are only used in three niche pages (COPCReport, SixSigmaReport, KpiTemplates) that the vast majority of users — employees on Scorecard/OneOnOne/MyLearning — will never visit. Yet every user pays the download + parse cost on every first visit.

**Context**: `lucide-react@1.9.0` and `@anthropic-ai/sdk@0.91.1` are in `package.json` but have **zero imports** in any src file and are therefore tree-shaken. They do not appear in the production bundle.

**Impact**: S3 at demo scale (local network, no latency). At internet scale, the combined initial bundle (31 pages + xlsx + jspdf) will significantly exceed the ~150 KB gzipped JS budget that targets 3G mobile (<5 second TTI). The COPC/SixSigma Report pages are HR-admin-only and accessed rarely — this is exactly the code-splitting use case. CRA already ships webpack with this capability; no new tooling is needed.

**Suggested fix**:
1. Wrap all 31 page imports with `React.lazy`: `const COPCReport = React.lazy(() => import('./pages/COPCReport'))`. Add a single `<Suspense fallback={<div>Loading…</div>}>` wrapper around the main content ternary in App.tsx.
2. This alone chunks each page separately. Start with the heaviest (COPCReport, SixSigmaReport, KpiTemplates) to immediately drop xlsx+jspdf from the initial bundle.
3. For even finer control: dynamic-import `reportExport.ts` inside the export functions themselves rather than at module level.

---

## W-022 · 🟢 S4 · No re-render isolation in App.tsx — 15+ co-located state variables cause the active page to re-render on every App-level state change (items 37, 38 partial)

**QA dimension**: D9 · **Checklist item**: 37 (Eliminate Unnecessary Component Re-renders)

**What happens**: The App component holds all application shell state in a flat list of `useState` declarations: `activeNav`, `role`, `profile`, `dashboardStats`, `alerts`, `unreadCount`, `showAlerts`, `isLoading`, `apiError`, `talentPosition`, `hasPip`, `pipData`, `pipAcknowledging`, `privacyStatus`, `needsPrivacyAck` (15+ state variables). Every one of these state updates triggers a full re-render of App, which in turn re-renders the currently active page component.

Common triggers:
- Alert polling or marking-as-read → `setUnreadCount` / `setAlerts` → active page re-renders
- Opening/closing the notification dropdown → `setShowAlerts(true/false)` → active page re-renders
- Any dashboard stat refresh → `setDashboardStats` → active page re-renders

There is **no `React.memo`** anywhere in the codebase — not on any page component, not on StatRing, not on any shared component. There are **no memoized values** (`useMemo` — zero). `useCallback` exists in exactly two files (UserManagement, HrDeparturesInbox) and only for debouncing data loads, not for stabilising prop callbacks.

**Impact**: S4 at demo scale — React's reconciler handles the wasted renders within a few milliseconds on a fast device with a small component tree. At production scale with 100+ employees (larger data in DOM) and more complex component trees (more KPIs in Scorecard, more flags in HrFlagsInbox), wasted renders from notification badge updates accumulate. Not a blocking issue; it is a maintainability and scalability concern.

**Suggested fix**: Split the App state into concerns and lift only what needs to be shared. Immediate win: move `alerts`/`unreadCount`/`showAlerts` into a `NotificationsContext`; the notification bell reads from context and the active page component is not in the re-render subtree. Longer-term: `React.memo` page components or move to a React context/reducer pattern. Also: once `React.lazy` is added (W-021 fix), the lazy-loaded page components are naturally module-isolated and will benefit more from memoization.

---

## PASS / N/A checklist items (items 1-46)

| Item | Status | Notes |
|---|---|---|
| 31. Full performance audit | — | This task is that audit (read-only). |
| 32. Shrink JS bundle | 🟡 W-021 | No code-splitting; xlsx+jspdf in initial chunk. |
| 33. Route-based code splitting | 🟡 W-021 | No React.lazy on any of the 31 pages. |
| 34. Optimize images | N/A | No content `<img>` elements in src. Emoji and inline SVG only. |
| 35. Loading skeletons | → W-013 | Already recorded task_006. |
| 36. Virtualize long lists | → W-016 | Already recorded task_007 (no pagination/virtualization). Cross-ref only; not re-raised here. |
| 37. Eliminate re-renders | 🟢 W-022 | No React.memo/useMemo; 15+ state vars in App. |
| 38. Cache and dedupe data fetching | → task_010 | Client-side caching is task_010 scope. Debounce: UserManagement 300ms timer ✅. |
| 39. Optimistic UI updates | N/A | Not applicable for a data-management SaaS where accuracy matters more than latency feel. |
| 40. Prefetch on intent | N/A | State-based nav has no route-level prefetch concept. After React.lazy is added (W-021 fix), hovering nav items could preload the chunk — but premature now. |
| 41. Debounce/throttle | ✅ PASS | UserManagement.tsx:97 — 300ms debounce on search using `setTimeout` + cleanup in `useCallback`. HrDeparturesInbox: same pattern. |
| 42. Critical rendering path | ⚠ PARTIAL | No render-blocking inline scripts or stylesheets (beyond Google Fonts @import → W-010 already recorded). CRA's default webpack config inlines critical CSS. The 31 eager page imports all land in one chunk (W-021). |
| 43. Third-party scripts | ✅ PASS | No external script tags in index.html. Google Fonts only (W-010). No analytics/tracking/intercom/etc. script loaded. |
| 44. Load critical content first | ✅ PASS | Per-page data fetches are scoped; app doesn't load all 31 pages' data up front. Each page fetches independently on mount. |
| 45. Full accessibility audit | → W-017..W-020 | Covered task_008. |
| 46. Keyboard navigable | → W-017 | Covered task_008. |

### Positive patterns worth noting
- **Two-call parallelization**: `Promise.allSettled([getDepartments(), getDesignations()])` in UserManagement.tsx:89, `Promise.all([loadTeam(), loadCycles()])` patterns in other pages — good.
- **Per-fetch loading state**: every page sets `setLoading(true/false)` around its fetch; UI doesn't flash unbounded raw data.
- **No waterfall on dashboard**: `getDashboardStats`, `getMyAlerts`, `getMyTalentPosition`, `getMyPip` are initiated in one `useEffect` in App.tsx (though not parallelized — potential carry for task_010).
- **GENERATE_SOURCEMAP**: not disabled (`.env` has only `REACT_APP_DEMO_MODE=true`); CRA defaults to shipping source maps in production builds. This is a security/info-disclosure concern → task_013.

### Notable observation (non-finding, additional W-002 evidence)
`.env` contains `REACT_APP_DEMO_MODE=true`. However, the task_003 grep confirmed **zero** references to `process.env` in any src file — the flag is set but never read. This corroborates W-002 (demo scaffolding ungated): the variable exists as if the gating was *planned* but not yet implemented. Not a new finding — additional evidence for W-002.

---

## Carries to task_010 (D9 — Client network/caching)
- **No client-side cache layer** (no react-query/swr) → every page nav refetches fresh; assessed in task_010.
- **App.tsx dashboard calls not parallelized** (getDashboardStats / getMyAlerts / getMyTalentPosition / getMyPip called sequentially in a single useEffect block?) → task_010 waterfall assessment.
- **Source map exposure in production** (GENERATE_SOURCEMAP not disabled) → task_013 (D2/D9 deps/build security).

## Next pending
**task_010** (D9 — Performance client network/caching subset). `intended_model: Opus 4.7` — a tier UP from running Sonnet 4.6; operator may `/model opus` before **"resume the audit"**.
