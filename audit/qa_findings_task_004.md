# QA Findings — task_004 (D7: Frontend Architecture & Correctness)

**task_id**: task_004 · **repo**: kinalys-web · **dimension**: D7 (frontend logic/architecture)
**model**: Opus 4.8 (intended Opus 4.7 — over-powered, permitted)
**date**: 2026-06-22
**scope**: component/state architecture, state-based navigation + `window.location` usage, prop/type validation, loading/error states, unhandled rejections, Decision-82 hardcoded performance bands.
**findings**: W-003 (S2) · W-004 (S3) · W-005 (S3) · W-006 (S4)
**running totals (kinalys-web) after this task**: 🔴 S1: 0 · 🟠 S2: 3 · 🟡 S3: 2 · 🟢 S4: 1 = **6 findings**

---

## W-003 · 🟠 S2 · Auth0 bearer token obtained but never attached — `setAuthToken()` is imported and defined but never called (App.tsx:116; client.ts:27-29)

**QA dimension**: D7/D1 · **Impact**: broken production-auth path

**What happens**: `setAuthToken(token)` exists (`client.ts:27-29`, sets `apiClient.defaults.headers.common['Authorization'] = Bearer …`) and is imported into `App.tsx:3` — but a repo-wide grep shows it is **never called**. `App.tsx:116` obtains the access token (`getAccessTokenSilently({ audience: 'https://api.kinalys.io' })`) into a local `token` and then (line 117) immediately issues the API calls via `Promise.allSettled` — the token is **never passed to `setAuthToken`**. So the axios client never sets an `Authorization` header.

**Impact**: The app authenticates to the backend **only** through the demo `X-Demo-User-Id` header (the demo path). In a real (non-demo) deployment — where the backend ignores the demo header — **every API request goes out with no bearer token and fails closed (401)**. The production-auth path is unwired in the frontend. Combined with W-002 (demo path not gated out of prod), the app currently *depends on* the demo header to function.

**Severity (S2)**: a go-live-blocking auth gap (fix before launch), not a security hole (it fails closed). Pairs with W-002.

**Suggested fix**: call `setAuthToken(token)` immediately after `getAccessTokenSilently` (App.tsx:116) and before the API batch; ideally attach it via an axios request interceptor that pulls a fresh token, so token refresh is handled centrally rather than once per `Dashboard` mount.

---

## W-004 · 🟡 S3 · Hardcoded performance-band thresholds duplicated across 10+ files — violates Decision 82 (bands must be configurable)

**QA dimension**: D7 · **PRD/TRD**: Decision 82 (performance bands must be tenant-configurable) + one-source-per-number rule

**What happens**: RAG/performance-band thresholds are hardcoded inline throughout the UI — **36 occurrences across 10 files** (`>= 90`, `>= 80`, `>= 75`, `< 70`, …): `App.tsx` (e.g. :650 `overall_score >= 90 ? success : >= 80 ? warning : danger`, :654, :658-659), `ExecDashboard.tsx` (10×), `Scorecard.tsx`, `TalentGrid.tsx`, `COPCScorecard.tsx`, `PKTEngine.tsx`, `PredictiveAnalysis.tsx`, `CompetencyFramework.tsx`, `reportExport.ts`. Each site independently encodes the band boundaries **and** the color mapping.

**Impact**: Decision 82 requires these bands to be configurable (per tenant). Hardcoding them in 36 places means (a) they cannot be configured without code changes, and (b) a band change requires editing 10 files consistently — a drift/maintainability hazard (the frontend analog of the backend "one-source-per-number" rule). Different files already risk diverging (`>=90/>=80` vs `>=75`).

**Suggested fix**: centralize bands + their color mapping in one config/util (ideally fed by tenant settings from the API), e.g. `ragBand(score, bands)` returning `{ label, colorVar }`; replace all inline ternaries with calls to it.

---

## W-005 · 🟡 S3 · Pervasive `any` typing defeats TypeScript safety — 246 occurrences across 38 files (incl. the whole API layer)

**QA dimension**: D4/D7 · **Impact**: type system provides little protection on data-handling paths

**What happens**: `as any` / `: any` appears **246 times across 38 files**. The API layer (`client.ts`) types most responses as `Record<string, any>` / returns untyped `response.data`; pages hold state as `any` / `any[]` (e.g. `dashStats`, `alerts`, `talentPosition` in `App.tsx`), and access nested fields off untyped objects (`dashStats?.overall_score`, `alert.current_score`). Hotspots: `HrFlagsInbox.tsx` (24), `CompetencyFramework.tsx` (17), `KpiTemplates.tsx` (16), `Scorecard.tsx` (16), `PredictiveAnalysis.tsx` (16), `ExecDashboard.tsx` (15).

**Impact**: TypeScript cannot catch shape mismatches, typos, or null-access on exactly the data that crosses the API boundary — the highest-risk surface. Reliability/maintainability gap; pairs with the pg-numeric-as-string class on the backend (untyped numerics arrive as strings and are used in comparisons like `>= 90` without explicit typing).

**Suggested fix**: define response interfaces for the API functions in `client.ts` (several already exist — e.g. `softDeleteUser`, `listDepartures`, `suggestBriefsForUser` return typed shapes; extend that pattern to all), and type component state/props. Enable stricter lint (`@typescript-eslint/no-explicit-any`) to prevent regrowth.

---

## W-006 · 🟢 S4 · `window.location.reload()` used to refresh data instead of React state (CourseCatalog.tsx:64); state-based-nav has no deep-linking

**QA dimension**: D7 · **Impact**: full-page reload UX; no shareable/back-button navigation

**What happens**:
1. `CourseCatalog.tsx:64` — a "Fix Emojis" button does `await (mod as any).fixLmsEmojis(); window.location.reload()` — it forces a **full-page reload** to reflect the change rather than re-fetching into React state. Full reload discards SPA state and re-runs auth/bootstrap. (The button is also a maintenance action shipped to users — relates to W-002.)
2. **State-based navigation** (`App.tsx` `activeNav` ternary across ~30 views, no router) is intentional per the stack facts (no react-router) — but it means **no deep-linking, no browser back/forward, no URL-shareable views, and nav state is lost on reload**. Recorded as a known architectural limitation (S4), not a defect, since the no-router choice is deliberate; revisit if shareable URLs become a requirement.

**Note**: per the stack facts, `window.location.href` *for navigation* would be a real finding — the codebase does **not** do that (the only `window.location` uses are Auth0 `origin` for login/logout redirect [legitimate] and the two `.reload()` calls). So the specific anti-pattern the rule warns about is absent; W-006 is the milder reload-for-refresh variant.

**Suggested fix**: replace the CourseCatalog reload with a state re-fetch; if deep-linking is later required, adopt a router or sync `activeNav` to the URL.

---

## PASS / observations
- **Parallel data loading done right** — `App.tsx:117` uses `Promise.allSettled([...])` for the 8 dashboard fetches, so one failure doesn't block the rest and per-result `status` is checked. ✅
- **`window.location.href`-for-navigation anti-pattern is absent** (only Auth0 redirect `origin` + `.reload()`). ✅
- **Some API functions are properly typed** (`softDeleteUser`, `listDepartures`, `suggestBriefsForUser`, `getMyAdaptiveAssignments`) — the pattern to extend for W-005. ✅

## Carries to other tasks
- Native `alert()` / inline error display in async handlers (e.g. App.tsx demo-breach catch, TalentGrid) → **task_006** (UI feedback/system-states).
- The `fixLmsEmojis` maintenance button in CourseCatalog (shipped to users) → relates to **W-002** (demo/maintenance gating).
- Eager import of all 31 pages in `App.tsx` (no code-splitting) → **task_009** (frontend performance / code-splitting).

## Next pending
**task_005** (D7 — UI checklist `docs/ui-audit.md` batch 1, items ~1-33: layout/responsive/typography/design-system). `intended_model: Sonnet 4.6` — a tier DOWN from the current Opus 4.8; the operator may `/model` to Sonnet 4.6 to conserve (mechanical checklist sweep), or proceed on Opus 4.8.
