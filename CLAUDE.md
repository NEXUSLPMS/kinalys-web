# CLAUDE.md — kinalys-web (Frontend)
Project memory for Claude Code. Read before any task in this repo.

## What this is
Kinalys — B2B HR/performance-management SaaS. This repo is the **React frontend**.
Sources of truth (in the API repo / project): `Kinalys_Master_PRD_v24.md`, `Kinalys_TRD_v2.md`,
`KINALYS_MASTER_CONTEXT_V23.md`. PRD/TRD win for spec; Master Context wins for operational rules.

## Stack (do NOT "correct" these — intentional)
- **React 18 + TypeScript**, Create React App (CRA). Custom `kinalys.css` design system (no Tailwind beyond utility classes).
- **State-based navigation, NOT react-router.** `activeNav` useState + conditional render; navigate via threaded
  `onNavigate` callbacks → `setActiveNav('target')`. **`window.location.href` is a BUG** (full reload, breaks state). Flag it.
- API calls via an Axios client (`src/api/client.ts`). The Anthropic AI key is **backend-only** — never in the frontend bundle. Only `REACT_APP_`-prefixed env vars reach the browser.

## Hard rules
- **ASCII-safe source** (current encoding debt): JSX text uses HTML entities (`&middot;`, `&mdash;`); JS string/
  template literals use unicode escapes (`\u20B9` ₹, `\u2014` —); emoji in JSX as `{'\u2705'}`. A `\u` escape in
  raw JSX text renders literally — entities in JSX text, escapes inside quotes only. (Repo-wide UTF-8 cleanup is a tracked post-demo task; until then, match this to avoid mojibake.)
- **Natural-units display** (permanent): currency as Indian lakh/crore (`₹4.75L`), counts as "95 of 100", via the `fmtKpiValue(value, metric_type)` formatter. Scorecard overall + progress bars use the STORED engine `kpi.score`, never an `actual/target` recompute.
- **Performance band thresholds are currently hardcoded (90/75)** across views (e.g. `ExecDashboard.tsx`). This is
  KNOWN DEBT (Decision 82): they must become a configurable per-department tenant setting read by every view.
  Every hardcoded `>= 90 / >= 75` band check is a finding pointing at that refactor — but it is KNOWN, log once, don't relitigate per-line.
- **No XSS via `dangerouslySetInnerHTML`** — especially on AI-generated content (briefs/recommendations). If used, it's a finding.
- Loading/error states: AI calls take 15–30s (synchronous, themed loading is expected UX). Async paths need loading + error states.

## DEMO SCAFFOLDING (demo-instance-only — Decision 80; DEMO_MODE-gated, NOT in production)
Intentional demo artifacts — do NOT flag as production vulnerabilities; inventory for audit exclusion:
- `src/components/DemoSwitcher.tsx` — the persona-switch UI.
- `DEMO_PERSONAS` array (in DemoSwitcher) — hardcoded demo personas.
- The Axios interceptor that sets the `X-Demo-User-Id` header.
These get gated behind a build-time/`DEMO_MODE` flag for production (the production frontend must not render the
switcher or send the demo header). When auditing (read-only), inventory separately, don't flag per-artifact.

## Current posture (19 Jun 2026)
Investor demo done (positive). Build FROZEN pending decision to start post-demo phase. Next: QA audit (read-only),
then DEMO_MODE separation, then Tier-1 hardening + Tier-2 features (360 form, support tickets + KB deflection,
AI-coaching refinement, TTS/voice, KB chatbot) for early-adopter readiness by ~October. Theme-matched UI elements
(IF-004) are explicitly low priority — ship light + dark first.
