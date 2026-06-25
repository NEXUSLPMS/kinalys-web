# DEMO SCAFFOLDING INVENTORY — kinalys-web (Frontend)

**Audit:** Kinalys QA Audit (Pass A, READ-ONLY) · **Phase:** 0 (frontend demo-scaffolding inventory)
**Repo:** `kinalys-web` (React 18/19 + TypeScript + CRA frontend) · **Scope:** `src/` only (sibling `kinalys-platform` audited separately — NOT touched this session)
**Session:** session_001 · **Date:** 2026-06-22 · **Model:** Sonnet 4.6 (mechanical inventory sweep)
**Finding prefix for this repo:** `W-` (Phase 1)

---

## Purpose & status of this document
This inventory LISTS every frontend demo-only artifact so Phase 1 does **not** flag it as a false anomaly (the
`DemoSwitcher` as an auth-bypass UI, the `X-Demo-User-Id` interceptor as a CRITICAL impersonation header, the
demo-breach button as a privilege issue, etc.). **Nothing here is a finding.** Per the audit prompt (§0.5), the only
demo-related Phase-1 finding allowed is a single S2 architectural item — "demo scaffolding is not yet gated behind
`DEMO_MODE` / `NODE_ENV`" — pointing at this file (queued as `task_003`). This inventory doubles as the **frontend
DEMO_MODE-separation spec**: the exact list of what a production build must strip or gate.

**Tag legend:** `DEMO-ONLY` = exclude from audit; gate behind `DEMO_MODE`/`NODE_ENV` or strip at Task 0.
**Companion:** the backend half lives in `kinalys-platform/audit/DEMO_SCAFFOLDING_INVENTORY.md` (the two together
form the complete dual-caller separation spec). It is referenced for context only — not read or modified this session.

> ⚠️ **Cross-cutting observation (for `task_003`, NOT a Phase-0 finding):** a repo-wide grep for `process.env`,
> `NODE_ENV`, `isDev`, `DEMO_MODE` across `src/` returns **zero** hits. **Nothing in the frontend is environment-gated.**
> Every artifact below renders/activates unconditionally in any build. This is exactly the single S2 DEMO_MODE-separation
> finding Phase 1 will record (the frontend analog of platform finding F-066).

---

## A. The `DemoSwitcher` component + `DEMO_PERSONAS` array

### A1. `src/components/DemoSwitcher.tsx` (124 LOC) — `DEMO-ONLY`
The floating persona-switcher used to swap demo identities during the investor demo.
- **`DEMO_PERSONAS` array** — `DemoSwitcher.tsx:3-21` — **17 hardcoded persona objects**, each with a hardcoded
  `user_id` UUID, real display name (incl. "Sanmeet Sahni" / "Neha Joshi" / etc.), `role`, `roleKey`, and `dept`.
  These are the demo cohort (mirrors the backend PROTECTED/DRILLED/POPULATION persona UUIDs). DEMO-ONLY fixture data.
- **`DEMO_KEY = 'kinalys_demo_user_id'`** + `getDemoUserId()` / `setDemoUserId()` / `clearDemoUserId()` —
  `DemoSwitcher.tsx:24-36` — localStorage read/write helpers for the active demo identity.
- **`DemoSwitcher` component** — `DemoSwitcher.tsx:38-123` — the floating dropdown (grouped Leadership/Management/
  Employees); `switchTo()` calls `setDemoUserId()` then **`window.location.reload()`** (line 46). The comment "Always
  show in development" (line 49) is **aspirational only — there is no environment check**; the component renders wherever
  it is mounted.
- **Disposition:** Pure demo tooling. Strip from production build, or gate the mount + the localStorage swap behind
  `DEMO_MODE`/`NODE_ENV !== 'production'`. The 17 persona UUIDs are demo fixtures.

### A2. Mount point — `src/App.tsx:775` — `DEMO-ONLY (wiring)`
`<DemoSwitcher />` is rendered **unconditionally** at the end of the authenticated `Dashboard` (App.tsx:775) — no
`process.env` / role / `DEMO_MODE` guard. So the persona switcher is present in every authenticated build.

---

## B. The `X-Demo-User-Id` "dual-caller" path (frontend half)

### B1. Axios request interceptor — `src/api/client.ts:19-26` — `DEMO-ONLY`
```ts
// Demo mode interceptor — sends override user id as header
apiClient.interceptors.request.use((config) => {
  const demoUserId = localStorage.getItem('kinalys_demo_user_id')
  if (demoUserId) {
    config.headers['X-Demo-User-Id'] = demoUserId   // sent on EVERY request, ungated
  }
  return config
})
```
This is the **frontend half** of the backend dual-caller pattern: whenever the `kinalys_demo_user_id` localStorage
key is set (by `DemoSwitcher`), the header is attached to **every** API request, telling the backend to impersonate
that persona. **No `DEMO_MODE`/env guard.** (The backend side — `auth.ts` reading the header — is inventoried in the
platform repo; the matching prod rule is "prod must IGNORE `X-Demo-User-Id`".)
- **Disposition:** Gate the interceptor behind `DEMO_MODE`/`NODE_ENV`, or strip it; a production bundle should never
  attach this header.

---

## C. Demo / seed / maintenance API wrappers + their UI triggers

### C1. `src/api/client.ts` — demo/seed API call wrappers — `DEMO-ONLY` (C1a/C1b) / `BORDERLINE` (C1c/C1d)
| Wrapper | Line | Calls | Tag |
| --- | --- | --- | --- |
| `seedDemoScorecards()` | client.ts:172-175 | `POST /talent/seed-demo` | **DEMO-ONLY** |
| `triggerDemoBreach()` | client.ts:469-472 | `POST /scorecard/demo-breach` | **DEMO-ONLY** |
| `seedKbArticles()` | client.ts:263-266 | `POST /kb/seed` | BORDERLINE (seed/maintenance) |
| `fixLmsEmojis()` | client.ts:391-394 | `POST /lms/fix-emojis` | BORDERLINE (one-off maintenance) |

### C2. Demo/seed UI surfaces embedded in permanent pages — `DEMO-ONLY (UI blocks)`
| Location | What it is | Tag |
| --- | --- | --- |
| `src/App.tsx:458-480` | **"🎯 Demo Mode — Breach Alert Trigger"** card on the home dashboard — a visible "🔔 Fire Breach Alert" button that calls `triggerDemoBreach()`. Rendered unconditionally on the authenticated home page. | **DEMO-ONLY** |
| `src/pages/TalentGrid.tsx:89-185` | **"🌱 Seed Demo Scores"** button → `seedDemoScorecards()` (state at :64, handler `seedDemo()` at :89, button at :184-185). | **DEMO-ONLY** |
| `src/pages/KnowledgeBase.tsx:115-143` | **"🌱 Seed Articles"** button → `seedKbArticles()` (state at :54, handler `seed()` at :115, button at :142-143). | BORDERLINE (seed/maintenance) |

> The demo-breach card (C2, App.tsx:458-480) is the most visible production-risk surface — a prod build would show
> end users a "Fire Breach Alert" button that mutates live KPI/alert state. Strip or `DEMO_MODE`-gate.

---

## D. Hardcoded demo identifiers (frontend)

### D1. Demo persona UUIDs — `DemoSwitcher.tsx:4-20` (17 UUIDs)
The only hardcoded demo IDs in the frontend are the 17 `DEMO_PERSONAS` `user_id` values (§A1). Examples:
`69797e41-…` (Neha Joshi / super_admin), `dc16d342-…` (Sanmeet Sahni / hr_admin), `1de83431-…` (Deepa Nair /
executive), … DEMO-ONLY.

### D2. Demo tenant ID + cycle IDs — **NOT present in the frontend** ✅
A targeted grep for the demo tenant ID (`108810fc-…`) and the demo cycle IDs (`0705466e-…`, `28422b1f-…`,
`85e04121-…`) returns **no matches** in `src/`. Unlike the backend, the web repo hardcodes **only** persona UUIDs;
tenant/cycle context is resolved at runtime from the API. Recorded so Phase 1 doesn't go hunting for them.

---

## E. Out of scope for THIS (web) session
- **Backend demo artifacts** — `reseed_demo_data.ts`, `promote_bsc_to_system.ts`, the `X-Demo-User-Id` read path in
  `auth.ts`, hardcoded demo tenant/cycle IDs in SQL/migrations — all live in `kinalys-platform` and are inventoried
  in that repo's Phase 0. **N/A here** (this repo has no migrations/server code). Not read this session.

---

## F. Summary — what a production frontend build must strip or gate
1. **Strip or `DEMO_MODE`/`NODE_ENV`-gate (the dual-caller + switcher):**
   - The `<DemoSwitcher />` mount (`App.tsx:775`) + the whole `DemoSwitcher.tsx` component incl. `DEMO_PERSONAS`.
   - The `X-Demo-User-Id` axios interceptor (`client.ts:19-26`) — prod bundle must never attach the header.
2. **Strip the demo UI surfaces:**
   - The "Fire Breach Alert" card (`App.tsx:458-480`) + `triggerDemoBreach()` wrapper.
   - The "Seed Demo Scores" button (`TalentGrid.tsx`) + `seedDemoScorecards()` wrapper.
3. **De-risk the borderline seed/maintenance UI:** the "Seed Articles" button (`KnowledgeBase.tsx`) +
   `seedKbArticles()`, and `fixLmsEmojis()` — gate behind an admin/maintenance flag, not shipped to end users.

> **Net effect for Phase 1:** treat everything in §A–§D as intended demo-instance code — do NOT raise per-artifact
> findings against it. Phase 1's findings are about code that SHIPS TO CUSTOMERS. The single allowed demo finding
> ("frontend demo scaffolding is not gated behind `DEMO_MODE`/`NODE_ENV` — nothing is environment-gated") is recorded
> ONCE as an S2 architectural finding (`task_003`, W-prefixed), pointing here.

---

## Phase-1 carries surfaced during inventory (NOT findings yet — flagged for the right task)
These are NOT demo scaffolding; they were noticed while inventorying and are handed to the correct Phase-1 task:
- **`@anthropic-ai/sdk` in the FRONTEND `package.json`** (dependency) — potential AI-key-in-bundle / IF-007 secret-leak
  risk → `task_002` (frontend security: secrets in client bundle).
- **`API_URL = 'http://localhost:3000'` hardcoded** (`client.ts:8`) + **Auth0 audience `'https://api.kinalys.io'`
  hardcoded** (`App.tsx:116`) → `task_011` (config/DevOps; should be env-driven).
- **Encoding/mojibake debt** — box-drawing characters rendered as `â"€â"€…` in `client.ts:3-6,35` comments → `task_011`
  (D7 encoding/mojibake debt, mandate item 6).
- **`xlsx@0.18.5` + `jspdf` + `react-scripts@5` (CRA)** in `package.json` → `task_013` (frontend dependency CVE audit;
  `xlsx` is the same abandoned/CVE package flagged in the platform audit).
- **`window.location.reload()` / `window.location` usage** (e.g. `DemoSwitcher.tsx:46`) + **state-based navigation**
  (App.tsx `activeNav` switch, no router) → `task_004` (D7 navigation; per stack facts `window.location.href` for nav
  IS a real finding — verify each use).
