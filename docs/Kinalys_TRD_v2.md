# KINALYS — TECHNICAL REFERENCE DOCUMENT (TRD) v2
**Date:** 16 Jun 2026 (W6D2) · Companion to PRD v24 · One source of truth for technical internals
**Scope:** Schema, API contracts, scoring engine internals, measurement methodology, demo-vs-prod boundary,
enum definitions. The PRD answers *what/why* (product); the TRD answers *how* (technical).
**v2 changes:** scorecard display reads stored engine score + natural-units formatter (§2.2); `unit`/`direction`
columns + template join DONE (§8); DEMO_MODE instance separation (§6); per-cycle jitter drift fix + active-scope
distribution (§7); configurable per-dept bands + active-scope debt (§8).

> Folds in and retires: SCORING_UNIFICATION_DESIGN(_v2), SIXSIGMA_REALISM_CORRECTION,
> RESEED_DESIGN_15-17JUN(_v2), FEATURE_anomaly_vs_decline_PIP, ENCODING_CLEANUP_LOG.

---

## 1. Stack & Conventions
- **API:** Fastify + TypeScript + tsx. Routes `fastify.get/post/put` with `{ preHandler: authenticate }`.
  **No Express.** No `getCallerInfo()` helper — every route extracts caller inline (demoUserId pattern, demo-only; Auth0 JWT permanent).
- **DB:** PostgreSQL 18, custom `query()` wrapper. **All numeric/decimal columns return as JS strings** — coerce with `Number()` before arithmetic (Rule 38).
- **Frontend:** React 18 + TS. Navigation via `setActiveNav` callback only, never `window.location.href` (Rule 18).
- **Repos:** `kinalys-platform` (api), `kinalys-web` (frontend), NEXUSLPMS org.
- **Run discipline:** tsx `--no-cache`; UTF-8 no-BOM writes; ASCII-safe source until encoding cleanup (Rule 34); confirm on disk before run (Rule 40).

## 2. Scoring Engine (`apps/api/src/services/scoring.ts`) — PERMANENT
Single source of truth for all scoring. 34/34 tests passing.

### 2.1 Exports
- `scoreKpi(name, actual, green, amber) -> { score, rag }` — **the single entry point** (Decision 67/Rule 37).
  Branches: DPMO name → `sigmaToScore(dpmoToSigma(actual))`; else `computeKpiScore`. RAG always from score band.
- `computeKpiScore(actual, green, amber)` — threshold-relative score. Handles inverted (amber>green ⇒ lower-better).
- `computeRag(score)` — Option-2: ≥85 green, ≥70 amber, else red. (Decision 68)
- `weightedOverall(items)` — weight_pct-weighted aggregate.
- `dpmoToSigma(dpmo)`, `sigmaToScore(sigma, floor, excellent)`, `normsinv(p)`.
- Consts: `BPO_IT_FLOOR_SIGMA=3.0`, `BPO_IT_EXCELLENT_SIGMA=4.5`, `AMBER_SCORE=70`, `RED_SPAN_FACTOR=1.0`.

### 2.2 Critical fixes (permanent)
- **Decision 69 — pg-numeric-as-string.** node-postgres returns numeric cols as strings; `amberThr + redEndDist`
  did string concat ("180"+"30"="18030") not addition → inverted KPIs past amber floored to 0. Surfaced via
  Mariam's non-monotonic AHT trend. FIX: `Number()` coercion at top of computeKpiScore, dpmoToSigma, scoreKpi.
  Writer fixed identically. +2 regression tests.
- **Decision 68 — Option-2 RAG.** RAG derived from SCORE BAND uniformly for ALL KPIs (was: per-KPI threshold RAG
  that could contradict the score, e.g. 96/amber). Score and RAG can no longer disagree. Matches DPMO sigma branch.
- **Decision 67 — one path.** Writer (`scorecard.ts`) refactored to import `{weightedOverall, dpmoToSigma, scoreKpi}`
  and call `scoreKpi`; inline DPMO/RAG logic deleted. Writer + any seeder share one implementation.
- **W6D2 — scorecard display reads stored engine score, not a recompute.** Frontend `Scorecard.tsx` previously
  recomputed `actual_value/target_value` for the overall and progress bars — this mis-scored inverted KPIs (AHT
  showed a full bar at 200/180). FIX: overall + bars use stored `kpi.score`; `fmtKpiValue(v, metric_type)` formats
  natural units (currency → INR lakh/crore ₹4.75L, count → "95 of 100", ratio, percentage). Backend scorecard
  route joins `kpi_templates` for `COALESCE(kt.metric_type, ka.metric_type)` + `kt.unit` (assignment `metric_type`
  was stale `numeric`). Permanent (natural-units = D75).

### 2.3 Six Sigma realism (Decision 70)
DPMO scored via sigma, **domain-relative** band (BPO/IT 3.0–4.5σ; realistic ceiling ~3.8σ for IT/QA). SS-High
personas top out ~79–86, NOT 92+. Cross-methodology score *difference* (a Six-Sigma 79 ≈ a COPC 90 in rigor) is
**intended**, not a bug. Assertion: no DPMO-derived score > 86.

## 3. Database Schema — Key Tables & Enums
(Full column lists in PRD §4. TRD records the technically-load-bearing facts.)

### 3.1 `kpi_assignments` (26 cols)
Per-person-per-cycle KPI. Carries `actual_value, score, rag_status, target_value, weight_pct, metric_type,
template_id, review_cycle_id, status`. `score/rag` written by the engine via `scoreKpi`. NUMERIC cols → strings.

### 3.2 `kpi_templates` (18 cols) — the MASTER CATALOG
- **71 SYSTEM rows** (`tenant_id IS NULL`, `is_system_default=true`) = global master catalog. CORRECT definitions.
- **Tenant-specific rows** (e.g. 16 Veridian BSC) override/extend. Veridian's were seeded with placeholder
  90/75 thresholds — corrected in §4 (Decision 78).
- Cols: `name, metric_type, target_value, rag_green_threshold, rag_amber_threshold, methodology, weight_pct,
  is_mandatory, is_system_default, designation_id, department_id`. **No `unit` column yet** — needed for
  natural-units (§4); add post-demo.
- Auto-apply: mandatory templates → assigned to matching designations when a cycle opens.

### 3.3 Enums (load-bearing)
- `kpi_status`: draft / pending_manager / pending_hr / approved / rejected / live / **archived**.
  `archived` = retire-state (orphan cleanup uses it). **'withdrawn' and 'completed' are NOT valid kpi_status**
  ('completed' is a dead value the flow never writes). Terminal-status filters historically omitted real terminals.
- `rag_status`: green / amber / red.
- Flag terminal states (Decision 58/72): **PIP-terminal** = completed_successful/unsuccessful/closed/withdrawn;
  **release-terminal** = `conversation_done`/closed/withdrawn. `conversation_done` is release-terminal, NOT PIP.

## 4. Measurement Methodology & KPI Definitions (canonical)
Measurement methodology is first-class: each KPI carries HOW it's computed. Five patterns:

| Pattern | Compute | Display | Examples |
| --- | --- | --- | --- |
| Direct-% | value = the % | "X%" | SLA, Client Retention, Compliance, On-Time Delivery |
| Achievement-vs-target | raw in natural units; score = % of target achieved | **"N of target"** (natural units, PERMANENT) | New Client Acquisition (count/100), Pipeline Value (₹/target), Training Hours (hrs/100) |
| Inverted | lower better; score scales down as value rises | "X (target ≤Y)" | Attrition %, Budget Variance %, Cost Efficiency Ratio |
| Special-formula | metric-specific formula | scale-specific | NPS (−100..100), eNPS (%promoters−%detractors) |
| Survey-based | top-2-box % (single Likert) OR multi-question avg | "X% rated 4+" or "X/5" | Employee Satisfaction (demo = Method A) |

### 4.1 Corrected VERIDIAN BSC template definitions (Decision 78)
Replaces placeholder green=90/amber=75. (Promote good defs to SYSTEM master catalog — lean: yes.)

| KPI | type | target | green | amber | direction |
| --- | --- | --- | --- | --- | --- |
| Attrition Rate | % | 10 | 8 | 15 | lower |
| Budget Variance | % | 5 | 3 | 7 | lower |
| Cost Efficiency Ratio | ratio (cost per unit revenue) | 0.70 | 0.70 | 0.85 | lower |
| Employee Satisfaction | % rated 4+ (Method A) | 80 | 80 | 65 | higher |
| Client Retention | % | 90 | 90 | 80 | higher |
| Hiring Fulfillment | % | 90 | 90 | 75 | higher |
| Internal Promotion Rate | % (40 = org target) | 40 | 35 | 25 | higher |
| On-Time Delivery | % | 90 | 95 | 85 | higher |
| Process Compliance Rate | % | 95 | 95 | 85 | higher |
| Revenue Target Achievement | % achieved | 100 | 95 | 85 | higher |
| SLA Compliance | % | 95 | 95 | 85 | higher |
| Skill Development | % | 80 | 80 | 65 | higher |
| NPS | special (−100..100) | 50 | 50 | 30 | higher |
| New Client Acquisition | count (/100), score = % achieved | 100 | 90 | 75 | higher |
| Pipeline Value | currency (₹, /target), score = % achieved | role-based | 90 | 75 | higher |
| Training Hours | hours (/100 role-based), score = % achieved | 100 | 90 | 75 | higher |

### 4.2 SYSTEM templates already correct (reference)
CSAT (numeric 1-5, green 4.2/amber 3.5, target 4.2) · AHT (numeric, green 150/amber 180) ·
Budget Variance (percentage, green 3/amber 7) · Attrition (percentage, green 8/amber 15).
Veridian assignments showing "CSAT 3.90 of 90" came from a wrong tenant-template target (90); fix = align to
SYSTEM def or Method-A %; verify which template the assignments reference before correcting.

## 5. API Contracts (key)
- **Auth:** `{ preHandler: authenticate }`; caller = Auth0 JWT (permanent) OR `X-Demo-User-Id` header (DEMO-ONLY, Task 0 strip).
- **Score write path:** assignment write → `scoreKpi` → persist `score, rag_status`. Single path (Rule 37).
- **Flags:** `/flags/closed` (terminal-status filtered, per Decision 58/72); exports honor active filters (Rule 33).
- Full route inventory: PRD §5.3 (117 routes).

## 6. Demo-vs-Production Boundary (authoritative)
| Concern | Demo (throwaway — Task 0) | Production (permanent) |
| --- | --- | --- |
| Data origin | `reseed_demo_data.ts` WS1–8 (synthetic) | Integration ingest (raw ops data) + manual fallback |
| Caller auth | `X-Demo-User-Id` header + DemoSwitcher (demo instance only) | Auth0 JWT only |
| Instance separation | `DEMO_MODE=true` → switcher renders, backend honors `X-Demo-User-Id` | `DEMO_MODE=false` (default) → switcher hidden, **backend ignores `X-Demo-User-Id`** (defense-in-depth, D80) |
| Performance bands | hardcoded 90/75 (uniform across views) | configurable tenant setting, per-dept overrides (D82) |
| Org-view scope | active employees only (matches prod) | active employees only — `IN ('active','probation','on_leave')` (D83) |
| Actuals | reverse-scored to hit bands (`actualForScore`, jitter) | real measured values |
| History | WS8 backfilled Q1/Q2 | accrues over real cycles |
| Personas | DEMO_PERSONAS hardcoded | real users via onboarding |
| Engine / templates / importer patterns | — | PERMANENT (scoring.ts, KPI Templates, harvested patterns) |

## 7. Reseed Architecture (demo-only; documented for Task 0 strip + pattern harvest)
`reseed_demo_data.ts`, dry-run default, `--execute` writes. Workstream order:
WS1 partition/fence → WS2 drilled (5 personas × cycles, verify-id-first, scoreKpi) → WS5 orphan archive →
**WS8 backfill Q1/Q2** (clone Q3 KPIs for 16 Q3-only personas, idempotent) → WS4 reshape population all 3 cycles
(band targets High 90+/Med 75-89/NI <75, bell jitter) → WS7 tenant-wide RAG coherence (score-preserving) →
postPassAssertions (orphans, coherence, narratives, distribution, six-sigma realism). Verified state:
**active distribution 5 High / 27 Med / 7 NI (of 39 active)** — assertion scoped to
`employment_status IN ('active','probation','on_leave')`, weighted `SUM(score*weight)/SUM(weight)`;
2 departed (Suresh Iyer, Lakshmi Nair) excluded; total persona rows 41 incl. departed. Cycle headcount 41/41/41.
**W6D2 jitter fix:** `scoreJitter` now takes `cycleKey` as an explicit param with stable per-KPI spread +
gentle per-cycle linear drift (±2.5 pts/step, Q2-centred). Prior version appended `|Q3` to the kpiName string;
the weak rolling hash barely moved on a single trailing-char change → Q1/Q2/Q3 collapsed to byte-identical values
(an "identical quarters" credibility tell). See Rule 43. **Harvest for prod importer:** verify-first,
dry-run→review→execute, partition/fence, post-pass assertions. **Strip:** everything else (Task 0).

## 8. Known Technical Debt (post-demo)
- ~~Add `unit` column to `kpi_templates`~~ **DONE (W6D2)** — `unit` + `direction` columns added; scorecard route joins template for `COALESCE(kt.metric_type, ka.metric_type)` + `kt.unit` (assignment `metric_type` was stale `numeric` for currency/count KPIs).
- **Configurable performance bands (D82):** band cutoffs (High/Med/NI + RAG green/amber) hardcoded across views (`ExecDashboard.tsx`, scoring engine, etc.). Centralise into a `performance_bands` tenant config with per-department overrides; one resolution service read by all views. The 80-vs-75 exec/scoring mismatch (W6D2) is exactly this debt. (Rule 41)
- **Active-employee scope (D83):** `employment_status IN ('active','probation','on_leave') AND deleted_at IS NULL` for all org/exec/manager distributions. Implemented in exec route + reseed assertion; formalise as a shared scope helper. (Rule 42)
- `measurement_method` as a first-class template field (currently implied by metric_type + name).
- Central `TERMINAL_FLAG_STATUSES` constant (terminal-status filters duplicated across routes).
- Repo-wide UTF-8 encoding cleanup (revert Rule-34 ASCII workarounds; fix DEMO_PERSONAS mojibake — moot after Task 0).
- Cycle-calendar `is_current` presentation correction (review_cycles only).
