# QA Findings — task_010 (D9: Performance Checklist — Client Network & Caching Subset)

**task_id**: task_010 · **repo**: kinalys-web · **dimension**: D9 (performance, client network/caching)
**model**: Opus 4.8 (intended Opus 4.7 — operator `/model opus`; correct/higher tier for network-architecture judgment)
**date**: 2026-06-22
**scope**: docs/performance-audit.md client-side items (~38, 47-59): request parallelization/waterfalls, request dedup, client cache (stale-while-revalidate), prefetch, payload trimming, request cancellation. Server-side caching → N/A (backend, kinalys-platform — not in scope).
**findings**: W-023 (S3) · W-024 (S4)
**running totals (kinalys-web) after this task**: 🔴 S1: 0 · 🟠 S2: 3 · 🟡 S3: 9 · 🟢 S4: 12 = **24 findings**

---

## W-023 · 🟡 S3 · No client-side cache or request-dedup layer — every navigation remounts the page and refetches from scratch; reference data is re-requested on every page that needs it (items 38, 47, 51, 55)

**QA dimension**: D9 · **Checklist items**: 38 (Cache and Dedupe Data Fetching), 47/51/55 (client caching / stale-while-revalidate / payload reuse)

**What happens**: The app has **no client-side data cache** of any kind. A repo-wide grep for `localStorage`/`sessionStorage`/`cache`/`staleTime` confirms the only client storage is theme preferences (`KinalysTheme.tsx`, `AccountSettings.tsx`) and the demo user id (`DemoSwitcher.tsx`) — **never API response data**. There is no `react-query`, `swr`, RTK-Query, or hand-rolled cache (none in `package.json`, none in src).

The consequence of the state-based navigation (W-006) combined with no cache:
- Each of the 31 pages fetches its data in a `useEffect(..., [])` on mount.
- Switching `activeNav` unmounts the current page component and mounts the next, which fires its fetch fresh.
- **Navigating back to a page you just visited refetches everything** — there is no stale-while-revalidate, no "show cached then refresh." Every visit is a cold load with a text-loading state (W-013).

**Redundant reference-data fetching.** Slow-changing reference data is fetched repeatedly rather than fetched once and shared:
- `getDepartments()` is called in App.tsx's initial load (App.tsx:117), **and again** in UserManagement (UserManagement.tsx:89 via `getDepartments()`), and in other pages that need a department list.
- `getDesignations()`, tenant settings, and the user profile follow the same pattern — each consuming page re-requests them on mount.

Because these are effectively static for a session, they are ideal cache candidates; instead they generate duplicate round-trips on every navigation to a page that needs them.

**Impact**: S3. At demo scale (localhost, sub-millisecond latency) this is invisible. Over a real network it means every navigation incurs a full set of round-trips with a visible loading state, and reference data that never changes during a session is fetched 5-10× per session. This is a perceived-performance and bandwidth concern that scales with usage, not a correctness bug. It also amplifies W-016 (unbounded lists): not only is the full list fetched, it is re-fetched on every return visit.

**Suggested fix**: Introduce a lightweight client cache. Lowest-effort, highest-leverage:
1. Adopt `@tanstack/react-query` (or `swr`) — gives caching, dedup, stale-while-revalidate, and background refresh with minimal code change (wrap each `getX()` call in a `useQuery`). This directly fixes items 38/47/51/55.
2. If avoiding a dependency: move truly-static reference data (departments, designations, tenant settings, profile) into a React context fetched once at app load and read by pages — eliminating the duplicate reference fetches immediately.

---

## W-024 · 🟢 S4 · No request cancellation — in-flight requests are never aborted on unmount or re-fetch, allowing out-of-order responses and "setState on unmounted component" races (items 41 partial, 48)

**QA dimension**: D9 · **Checklist items**: 41 (Debounce/Throttle — partial), 48 (request lifecycle / cancellation)

**What happens**: No page uses `AbortController` or axios cancellation (grep for `AbortController`/`abort(` = zero matches). Every `useEffect` data fetch sets state in its `.then`/`await` without checking whether the component is still mounted or whether a newer request has superseded it. Two concrete race windows:

1. **Rapid navigation**: if a user clicks Page A then immediately Page B, Page A's fetch may resolve *after* it has unmounted → React logs a "state update on unmounted component" warning, and the work is wasted. (React 19 tolerates this without crashing, but it's a leak/waste.)

2. **Debounced filter, no cancel**: UserManagement debounces its search with a 300ms timer (UserManagement.tsx:97) — good — but it does **not cancel** the previous in-flight `getManagedUsers()` request. If request N (broad search) is slow and request N+1 (narrowed search) returns first, the slower N can land last and **overwrite** the UI with stale results. The debounce reduces the frequency of this race but does not eliminate it.

**Impact**: S4 — at demo scale the race window is effectively never hit; over a real network with variable latency it can produce momentary stale/incorrect filter results that self-correct on the next interaction. No data corruption (reads only). Low severity, but it's the kind of intermittent bug that's hard to diagnose later.

**Suggested fix**: Adopting react-query (the W-023 fix) solves this for free — it cancels superseded queries and ignores stale responses. Without it: create an `AbortController` per `useEffect` fetch, pass `signal` to axios, and `controller.abort()` in the effect cleanup; for the debounced search, abort the prior request before issuing the next.

---

## PASS / N/A checklist items (client network/caching)

| Item | Status | Notes |
|---|---|---|
| 38. Cache and dedupe fetching | 🟡 W-023 | No cache/dedup layer. |
| 39. Optimistic UI | N/A | Data-accuracy SaaS; explicit save + refetch is the appropriate pattern (e.g., TalentGrid updates local state from the server response after `setTalentPotential` — TalentGrid.tsx:132-139, a reasonable middle ground). |
| 40. Prefetch on intent | N/A | State-based nav; meaningful only after React.lazy (W-021) is added, then hovering nav could preload chunks. Premature now. |
| 41. Debounce/throttle | ✅ PASS (with W-024 caveat) | UserManagement.tsx:97 + HrDeparturesInbox debounce with `setTimeout` + cleanup. Debounce present; cancellation absent (W-024). |
| 47. Request parallelization | ✅ STRONG PASS | App.tsx:117 fires **8 dashboard calls in parallel** via `Promise.allSettled([getStatus(), getMyProfile(), getDepartments(), getDashboardStats(), getMyTalentPosition(), getMyAlerts(), getMyPip(), getPrivacyStatus()])`, then maps each result independently — no waterfall, and one failure doesn't sink the others. This is the correct pattern. |
| 48. Request cancellation | 🟢 W-024 | No AbortController anywhere. |
| 49. Waterfall elimination | ✅ PASS | The one necessary sequential step — `await getAccessTokenSilently()` *then* the parallel batch (App.tsx:116-117) — is unavoidable (the token gates the calls). Page-level fetches also use `Promise.allSettled`/`Promise.all` (e.g., UserManagement.tsx:89 `Promise.allSettled([getDepartments(), getDesignations()])`). No accidental sequential await chains found. |
| 50. Payload trimming (client) | ⚠ PARTIAL | The client requests full unbounded lists (cross-ref W-016) — no `fields=`/`limit=` query params to trim payloads. UserManagement does pass server-side filter params (search/dept/role/status) which trims the rows returned — partial credit. |
| Server-side caching (CDN/HTTP cache headers/edge) | N/A | Backend concern (kinalys-platform); not in this repo's scope. |

### Notable observations (non-findings)
- **`setAuthToken()` still never called** — App.tsx:116 obtains the Auth0 token but does not attach it via `setAuthToken()` (defined client.ts:27). The 8 parallel dashboard calls therefore rely entirely on the `X-Demo-User-Id` interceptor (client.ts:20-26) for identity. This is **W-003** (already recorded, go-live auth gap) — re-confirmed here from the network angle, not a new finding.
- **Mojibake in client.ts:3-6** — the box-drawing comment characters are corrupted (`â”€` instead of `─`). Encoding debt → already parked for **task_011**. Not re-raised.
- **Hardcoded `API_URL = 'http://localhost:3000'`** (client.ts:8) and **Auth0 audience `'https://api.kinalys.io'`** (App.tsx:116) — config-not-env → already parked for **task_011**.

---

## Carries to other tasks
- **Hardcoded `API_URL` + Auth0 audience + mojibake** → task_011 (D5/D6 config/encoding) — confirmed present, not re-raised here.
- **`setAuthToken()` never invoked** → already W-003 (go-live).
- **Unbounded list payloads** → already W-016; payload trimming would follow pagination work.
- **react-query adoption** would simultaneously resolve W-023 + W-024 + enable item 40 prefetch — recommend bundling these in one remediation.

## Next pending
**task_011** (D5/D6 — Frontend PRD/TRD compliance + config/DevOps + encoding debt: PRD module coverage matrix, Decision 82 hardcoded RAG bands, hardcoded `API_URL`/Auth0 audience, mojibake in client.ts). `intended_model: Sonnet 4.6` — a tier DOWN from running Opus 4.8; operator may `/model` down before **"resume the audit"**.
