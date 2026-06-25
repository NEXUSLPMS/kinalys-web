**KINALYS**

*Kinetic Analysis*

**MASTER PRODUCT REQUIREMENTS DOCUMENT**

Version 24  ·  June 2026  ·  Investor & Engineering Reference

| **Field** | **Detail** |
| --- | --- |
| Company | Indyaah Techbytes Private Limited |
| Product | Kinalys — B2B SaaS Performance Management Platform |
| Version | V24 (W6D2 session, 16 June 2026) |
| Status | Pre-Seed · Demo-ready (24–30 June 2026) · Go-live 15 August 2026 · v24 adds Decisions 80–83 (demo/prod separation, avatar system, configurable per-dept bands, active-employee scope), Rules 41–43, and the consolidated post-demo build backlog (§12.1) |
| Founders | Sanmeet Sahni (CEO) · Chaitali Wayakule (CPO) |
| Contact | sanmeet@kinalys.io · kinalys.io |
| Repository | github.com/NEXUSLPMS/kinalys-platform · kinalys-web |
| Audience | Investor reference · Fable 5 code audit · Engineering onboarding |

# **0. POST-DEMO TASK 0 — STRIP ALL TEMPORARY DEMO FIXES (NON-NEGOTIABLE)**

**This is Task 0. It runs BEFORE any other post-demo work. Nothing else starts until this is complete.**
Everything built solely to make the 30 Jun investor demo work on a local machine is throwaway and MUST be
removed before go-live hardening. Demo scaffolding in production is a security, integrity, and credibility risk.

## 0.1 Strip List (everything tagged demo-only across W5D7–W6D1)

| # | Item | Location | Why it must go |
| --- | --- | --- | --- |
| 1 | **Entire reseed migration** (`reseed_demo_data.ts`, WS1–WS8) | `apps/api/src/migrations/reseed_demo_data.ts` | Fabricates fake 3-cycle history for the Veridian tenant. No production tenant is ever seeded; real data arrives via integration. Delete or quarantine to a demo-only branch. |
| 2 | **DemoSwitcher** persona-switch pill + `X-Demo-User-Id` header path | `kinalys-web/src/components/DemoSwitcher.tsx`; backend dual-caller (`X-Demo-User-Id` OR Auth0) | Lets anyone impersonate any persona with no auth — catastrophic if shipped to prod. **Strip from production/staging entirely** (Decision 80): the switcher + header path live ONLY in the Kinalys-controlled demo instance. Separation enforced by `DEMO_MODE` env flag — frontend gates the switcher render on it; **backend ignores `X-Demo-User-Id` when `DEMO_MODE` is false** (prod default), so the bypass physically cannot work against production (defense-in-depth). Persona "view-as" is NOT a client feature. |
| 3 | **DEMO_PERSONAS hardcoded list** | `DemoSwitcher.tsx` | 16 hardcoded user IDs/roles. Demo-only. |
| 4 | **Hardcoded band reshape + jitter + reverse-score** | reseed WS4 + helpers (`actualForScore`, `scoreJitter`, `POPULATION_BAND_MAP`, `BAND_TARGET`, `SS_*`) | Reverse-engineers actuals to hit target scores. Antithesis of real measurement. Demo-only. |
| 5 | **Backfilled Q1/Q2 history** (WS8, 128 synthetic rows) | DB rows for 16 population personas | Fake history. Real tenants accrue history over real cycles. |
| 6 | **Veridian's 16 placeholder BSC templates** — **DONE (W6D2): corrected + promoted to SYSTEM.** | `kpi_templates` | Corrected to real scales/thresholds and promoted to SYSTEM master catalog (tenant_id NULL); 216 assignments re-pointed; VERIDIAN duplicates removed. No strip needed — this became permanent SYSTEM catalog content. |
| 7 | **Demo-breach / demo-only routes** (any route added purely for the demo flow) | backend routes | Audit every route added in the demo run-up; remove demo-only ones. |
| 8 | **ASCII-safe workarounds (Rule 34)** once encoding cleanup is done | source files | Temporary until repo-wide UTF-8 cleanup; revert to real chars after. |
| 9 | **Hardcoded tenant/cycle IDs** in any demo helper | reseed, scripts | Veridian tenant + Q1/Q2/Q3 cycle IDs baked in. Demo-only. |
| 10 | **Mojibake emoji in DEMO_PERSONAS** | `DemoSwitcher.tsx` | Encoding artifacts; moot once item 2/3 removed. |

## 0.2 What STAYS (permanent — do NOT strip)
- **Scoring engine** (`scoring.ts`): `scoreKpi`, `computeKpiScore`, `dpmoToSigma`, `sigmaToScore`, domain sigma bands, Option-2 RAG, **pg-numeric-string coercion fix**. PERMANENT.
- **Writer** (`scorecard.ts`) refactored onto shared `scoreKpi`. PERMANENT.
- **KPI Templates** feature + SYSTEM master catalog (71 system-default templates). PERMANENT.
- **Reusable patterns harvested from reseed** → fold into the real Onboarding Importer: verify-id-first writes, dry-run→review→execute, partition/fence checks, post-pass assertions.

## 0.3 Acceptance
Task 0 is complete when: (a) no `X-Demo-User-Id` path exists, (b) reseed migration is removed/quarantined,
(c) no synthetic/reverse-scored data remains in any production-bound tenant, (d) a fresh tenant has ZERO
seeded performance data and accrues only via integration/manual entry, (e) all engine + template + importer
code compiles and tests pass without any demo artifact.

---

---

# **1. Executive Summary**

Kinalys is a sector-agnostic B2B SaaS platform that solves two problems no enterprise HR platform has addressed together: performance that is invisible until it is too late to act, and institutional knowledge that permanently disappears when employees leave.

The platform combines a multi-methodology KPI engine (COPC, Six Sigma, BSC, OKR), AI-powered adaptive learning triggered by KPI breaches, predictive performance analytics, a structured PIP lifecycle with full HR governance, and a three-tier Organisational Memory module that automatically converts employee departures into permanent, searchable institutional capital.

As of June 2026, the platform is production-grade with 117 verified API routes, demo personas across 8 departments, 3 quarters of historical data, and a full investor demo running on localhost (confirmed demo environment). AWS deployment is pending receipt of cloud credits and is NOT on the demo critical path — the demo runs on localhost. Investor demo: 24–30 June 2026 window. Production go-live: 15 August 2026.

| **Metric** | **Value** | **Status** |
| --- | --- | --- |
| API routes verified | 117 / 117 | Live |
| Demo personas | 16 across 8 departments | Seeded |
| KPI methodologies | COPC, Six Sigma, OKR live · BSC in development | Partial |
| PIP lifecycle stages | 6 (raised → confirmed → acknowledged → active → closure → outcome) | Live |
| Org Memory tiers | Tier 1 (Role Brief) live · Tiers 2-3 roadmap | Partial |
| Export formats | CSV (Flag History) · HTML report (Flag History) | Live |
| Investor demo | 24–30 June 2026 · Pune (in-person) · localhost (AWS pending credits) | Confirmed |
| AWS go-live | 15 August 2026 · ap-south-1 (Mumbai) | Planned |

# **2. Problem Space ****&**** Solution**

## **2.1 Problem 1 — Performance is Invisible**

Organisations running COPC, Six Sigma, BSC, and OKR operate disconnected systems for each methodology. KPIs live in spreadsheets. Learning lives in a separate LMS. Talent decisions live in another system. No connection exists between them. A Satisfactory-rated employee can hide two red KPIs underneath a passing aggregate — managers find out after the quarter ends, too late to intervene. Kinalys connects performance signals to learning prescriptions in real time, surfaces the composition beneath the headline, and projects next-cycle scores so managers can act before the damage is done.

## **2.2 Problem 2 — Knowledge Disappears Forever**

25-35% of employees in knowledge-intensive industries leave every year. When they leave, everything they knew — process expertise, client context, decision history, tribal knowledge nobody wrote down — leaves with them. Immediate releases provide zero handover. Notice periods are selective and incomplete. No HR platform has ever solved this. Kinalys's Organisational Memory captures every departing employee's knowledge automatically, AI-distils communication history, and builds a searchable knowledge base that compounds with every departure.

## **2.3 Solution Architecture**

Five product layers working as one system:

- Multi-methodology KPI engine — COPC, Six Sigma, BSC, OKR in one platform, per-department methodology assignment

- AI Performance Coaching — KPI breach triggers automatic course recommendation via Anthropic Claude API

- Predictive Analytics — two+ quarters of score history project next-cycle performance, SLIP alerts before quarter end

- PIP Module — six-stage improvement plan lifecycle with HR governance, check-ins, backfill planning, and audit trail

- Organisational Memory — three-tier knowledge preservation: Role Brief (auto), Communication Import (AI-distilled), Organisational Brain (searchable)

## **2.4 Competitive Positioning**

| **Capability** | **Workday** | **Darwinbox** | **Lattice** | **Kinalys** |
| --- | --- | --- | --- | --- |
| Multi-methodology (4) | No | No | No | Yes ✔ |
| Org Memory / knowledge preservation | No | No | No | Yes ✔ |
| AI breach-triggered learning | No | No | Partial | Yes ✔ |
| Predictive at-risk scoring | Partial | No | Partial | Yes ✔ |
| Structured PIP with full lifecycle | Partial | Partial | No | Yes ✔ |
| India DPDP Act compliant | No | Yes | No | Yes ✔ |

# **3. Technical Stack**

| **Field** | **Detail** |
| --- | --- |
| API Framework | Fastify (Node.js 20) + TypeScript — high-performance, schema-validated REST API |
| Database | PostgreSQL 18 — multi-tenant via tenant_id isolation, JSONB for flexible columns |
| ORM / Query | Raw SQL via pg pool — no ORM; typed query helper function |
| Authentication | Auth0 JWT (HS256) — per-tenant user management, 9 role types, 24-hr token expiry |
| Frontend | React 18 + TypeScript — single-page application, compiled to static build by CRA |
| AI Integration | Anthropic Claude API (claude-sonnet-4-6) — course recommendations, Org Memory brief generation |
| Process Manager | PM2 — keeps Fastify alive on EC2, auto-restart on crash, log rotation |
| Reverse Proxy | Nginx — SSL termination, static file serving, /api/* proxy to Fastify port 3000 |
| SSL | Let's Encrypt via Certbot — free, auto-renewing, managed by Nginx |
| Storage | AWS S3 — Org Memory briefs, report exports, HRIS staging, logs |
| Infrastructure | AWS EC2 t3.medium — ap-south-1 (Mumbai) — single instance MVP, ASG growth path |
| Database Hosting | AWS RDS PostgreSQL db.t3.medium — private subnet, 50 GB gp3, auto-scale to 500 GB |
| Monitoring | AWS CloudWatch — EC2 + RDS metrics, SNS alerts, application log aggregation |
| Version Control | GitHub — NEXUSLPMS/kinalys-platform (API) + NEXUSLPMS/kinalys-web (frontend) |
| Monorepo structure | apps/api/src/routes/ — packages/db/ — kinalys-web/src/pages/ |

## **3.1 Repository Structure**

kinalys-platform/

  apps/api/src/

    index.ts           — Fastify server entry, route registration

    routes/            — all route handlers (auth, flags, scorecard, predictive, ...)

    services/          — scoring.ts (unified scorer, post-14-16 Jun build)

    middleware/        — authenticate.ts (dual demo+Auth0 gate)

  packages/db/src/schema/  — schema migration files 001-016

kinalys-web/

  src/pages/          — all React page components

  src/api/client.ts   — all API client functions (Axios, demo header interceptor)

  src/App.tsx         — top-level routing via activeNav state, role-based nav

  src/index.css       — kinalys.css design system (CSS custom properties + utility classes)

# **4. Database Schema — Complete**

*All tables include tenant_id (UUID, FK to tenants) for multi-tenant isolation. All queries filter by tenant_id at the query level — no RLS. All tables include created_at and updated_at timestamps.*

## **4.1 tenants**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK, gen_random_uuid() |
| name | varchar(255) | Company name, used on all reports |
| logo_url | varchar(2048) | Nullable — report logo; name-text fallback when null |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

## **4.2 users**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| tenant_id | uuid | FK tenants |
| auth0_sub | varchar | Auth0 subject; null for demo users |
| full_name | varchar(255) |  |
| email | varchar(255) |  |
| role | varchar(50) | enum: super_admin, hr_admin, executive, manager, team_lead, senior_employee, employee, intern, external |
| department_id | uuid | FK departments, nullable |
| designation_id | uuid | FK designations, nullable |
| employment_status | varchar | active, inactive, on_leave, terminated |
| is_first_login | boolean | Drives privacy ack modal |
| deleted_at | timestamptz | Soft delete |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

## **4.3 departments**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| tenant_id | uuid | FK tenants |
| name | varchar(255) |  |
| methodology | varchar(50) | copc, six_sigma, bsc, okr, universal |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

## **4.4 designations**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| tenant_id | uuid | FK tenants |
| name | varchar(255) |  |
| department_id | uuid | FK departments, nullable |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

## **4.5 review_cycles**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| tenant_id | uuid | FK tenants |
| name | varchar(255) | e.g. Q3 2026 |
| start_date | date |  |
| end_date | date |  |
| status | varchar | draft, active, closed |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

## **4.6 kpi_templates**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| tenant_id | uuid | FK tenants |
| designation_id | uuid | FK designations, nullable |
| department_id | uuid | FK departments, nullable |
| name | varchar(500) |  |
| description | text | nullable |
| weight_pct | numeric(5,2) | Default 25.00; must sum to 100 per designation |
| metric_type | varchar(20) | numeric, percentage |
| target_value | numeric(10,2) | nullable |
| rag_green_threshold | numeric(10,2) | NATIVE UNIT (decision 66) — e.g. AHT 150 = 150 seconds |
| rag_amber_threshold | numeric(10,2) | NATIVE UNIT — inversion: green < amber means lower-is-better KPI |
| is_mandatory | boolean | Default true |
| is_active | boolean | Default true |
| is_system_default | boolean | Default false |
| methodology | varchar(50) | Default universal; copc, six_sigma, bsc, okr, universal |
| perspective | bsc_perspective_type | NULLABLE — added for BSC build (14-16 Jun); financial, customer, internal_process, learning_growth |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

*INVERSION RULE (verified from live data): rag_green_threshold **<** rag_amber_threshold implies an inverted KPI (lower actual = better). AHT green 150 **<** amber 180 = inverted. FCR green 85 **>** amber 70 = normal. No is_inverted column needed; derived from existing data.*

## **4.7 kpi_assignments**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| tenant_id | uuid | FK tenants |
| user_id | uuid | FK users |
| review_cycle_id | uuid | FK review_cycles |
| template_id | uuid | FK kpi_templates, nullable |
| source | kpi_source | template (default), custom |
| name | varchar(500) | Copied from template at assignment |
| weight_pct | numeric(5,2) |  |
| metric_type | varchar(20) |  |
| target_value | numeric(10,2) |  |
| actual_value | numeric(10,2) | Null until manager enters actual |
| score | numeric(5,2) | Computed by writer at L151 — see Scoring section |
| rag_status | rag_status | green, amber, red — enum |
| status | kpi_status | draft, pending_manager, pending_hr, live, rejected |
| proposed_by | uuid | FK users |
| proposed_at | timestamptz |  |
| manager_reviewed_by | uuid | FK users |
| manager_reviewed_at | timestamptz |  |
| hr_reviewed_by | uuid | FK users |
| hr_reviewed_at | timestamptz |  |
| live_at | timestamptz | When status became live |
| rejection_reason | text | nullable |
| notes | text | nullable |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

*424/424 assignments in demo have a template_id (verified 10 Jun 2026). No orphan/ad-hoc assignments exist in the current dataset.*

## **4.8 employee_flags**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| tenant_id | uuid | FK tenants |
| employee_id | uuid | FK users |
| flagged_by | uuid | FK users — manager who raised the flag |
| flag_type | varchar | pip, release |
| status | varchar | Full lifecycle: pending_hr, pending_employee_ack, pip_active, hr_reviewing, extended, pending_hr_closure, completed_successful, completed_unsuccessful, closed, withdrawn, conversation_done |
| manager_comment | text | nullable — required for flag raise, must pass isGenuineComment gate |
| hr_comment | text | nullable — required for HR confirmation, must pass isGenuineComment gate |
| employee_response | text | nullable — written by employee on acknowledgement |
| pip_form_data | jsonb | nullable — structured PIP plan fields |
| pip_start_date | date | nullable |
| pip_end_date | date | nullable |
| pip_duration_days | integer | nullable |
| final_outcome | varchar | nullable — completed_successful, completed_unsuccessful, withdrawn |
| final_outcome_notes | text | nullable |
| final_outcome_at | timestamptz | nullable |
| hr_confirmed_at | timestamptz | nullable |
| performance_snapshot | jsonb | nullable — point-in-time scores at flag raise |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

## **4.9 pip_checkins**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| tenant_id | uuid | FK tenants |
| flag_id | uuid | FK employee_flags |
| checked_in_by | uuid | FK users |
| notes | text |  |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

## **4.10 audit_log**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| tenant_id | uuid | FK tenants |
| user_id | uuid | FK users |
| action | varchar | e.g. flag_status_changed, kpi_actual_entered, pip_confirmed |
| entity_type | varchar | employee_flags, kpi_assignments, etc. |
| entity_id | uuid |  |
| before_state | jsonb | nullable |
| after_state | jsonb | nullable |
| ip_address | varchar | nullable |
| user_agent | text | nullable |
| created_at | timestamptz |  |

*Immutable — no UPDATE or DELETE on audit_log. Every state change is logged. Required for ISO 9001 / COPC compliance.*

## **4.11 bsc_perspectives**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| tenant_id | uuid | FK tenants |
| perspective | bsc_perspective_type | financial, customer, internal_process, learning_growth |
| label | varchar(100) | Display name, org-customisable |
| description | text | nullable |
| weight_pct | numeric(5,2) | Default 25.00 — org-configurable |
| display_order | integer |  |
| lms_auto_feed | boolean | false |
| is_active | boolean | true |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

*UNIQUE constraint on (tenant_id, perspective). Veridian Solutions has 4 perspectives seeded: Financial 35% / Customer 25% / Internal Process 25% / Learning **&** Growth 15%.*

## **4.12 bsc_metrics (currently empty — BSC build 14-16 Jun)**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id | uuid | PK |
| tenant_id | uuid | FK tenants |
| perspective_id | uuid | FK bsc_perspectives |
| name | varchar(255) |  |
| description | text | nullable |
| weight_pct | numeric(5,2) |  |
| metric_type | varchar(20) |  |
| target_value | numeric(10,2) | nullable |
| rag_green_threshold | numeric(10,2) | nullable |
| rag_amber_threshold | numeric(10,2) | nullable |
| data_source | varchar(50) | manual (default), auto |
| is_active | boolean | true |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

*CRITICAL: bsc_metrics is empty (0 rows) and kpi_assignments has no perspective_id. BSC scoring requires a mapping layer: add perspective column (nullable bsc_perspective_type) to kpi_templates, tag each template, then score via weightedOverall grouped by perspective. Build window: 14-16 Jun alongside scoring unification.*

## **4.13 okr_objectives + okr_key_results**

Tables exist, populated with org-level OKRs (CEO) cascading to VP/Director/Manager/IC. OKR cascade engine (OKR-first cycle initialisation + KPI→KR rollup) is a post-demo build item. Schema: objectives (id, tenant_id, owner_id, title, description, cycle_id, parent_id, progress_pct) and key_results (id, objective_id, title, target_value, current_value, weight_pct).

## **4.14 lms_enrollments**

Tracks course recommendations and completions. source_kpi_assignment_id links each enrollment to the KPI breach that triggered it (FK to kpi_assignments ON DELETE SET NULL). Status: recommended, in_progress, completed, dismissed.

# **5. API Architecture**

## **5.1 Authentication Pattern**

Every route uses a dual-mode preHandler: authenticate middleware. Auth resolves in this order:

- Demo mode: if X-Demo-User-Id header is present, look up the user by id (not auth0_sub). Used for all demo and local development flows.

- Auth0 mode: verify JWT Bearer token, extract sub claim, look up user by auth0_sub.

- Both paths return { tenant_id, role, department_id, id } for the caller.

*The Axios interceptor in client.ts automatically attaches X-Demo-User-Id to every request when the app is running in demo mode. This means all frontend calls work identically in demo and production.*

## **5.2 Role Gate Pattern**

After caller lookup, routes gate on role. Standard patterns:

if (!['hr_admin','super_admin'].includes(role)) return reply.status(403).send(...)

if (!['manager','team_lead','hr_admin','super_admin'].includes(role)) return reply.status(403).send(...)

## **5.3 Route Inventory (117 routes verified)**

*Routes are registered in apps/api/src/routes/. 117 frontend API calls verified against backend route handlers with 100% match rate as of W5D2.*

| **Route Group** | **Key Routes** | **Auth Gate** |
| --- | --- | --- |
| auth | POST /auth/login, POST /auth/register, GET /auth/me | Public / JWT |
| users | GET /users, POST /users, PUT /users/:id, DELETE /users/:id (soft), GET /users/:id/profile | hr_admin+ |
| departments | GET /departments, POST /departments, PUT /departments/:id | hr_admin+ |
| designations | GET /designations, POST /designations, PUT /designations/:id | hr_admin+ |
| review-cycles | GET /review-cycles, POST /review-cycles, PUT /review-cycles/:id, POST /review-cycles/:id/activate, POST /review-cycles/:id/close | hr_admin+ |
| scorecard | GET /scorecard/team/:cycleId — exec/manager team view (actual_value path, RETIRING) GET /scorecard/employee/:userId — employee scorecard GET /scorecard/kpi/:id — single KPI detail PUT /scorecard/kpi/:id/actual — enter actual (SCORE WRITER) GET /scorecard/copc-report — COPC E/S/U indexed report GET /scorecard/sixsigma-report — Six Sigma sigma-level report GET /scorecard/bsc-report — PLANNED (14-16 Jun build) | All roles (filtered by role) |
| predictive | GET /predictive — per-user cycle-history projection GET /predictive/team — department-level predictions | manager+ (dept filtered) |
| flags | GET /flags/pending — active flags (inverse terminal filter) POST /flags — raise a new flag GET /flags/closed — terminal flags history (decision 58) GET /flags/counts — tile counts for HrFlagsInbox 8-tile grid GET /flags/report — printable HTML audit report (decision 64) PUT /flags/:id/confirm — HR confirms conversation done (release) PUT /flags/:id/pip-confirm — HR confirms PIP PUT /flags/:id/employee-ack — employee acknowledges PIP PUT /flags/:id/activate — HR activates PIP PUT /flags/:id/checkin — manager logs check-in PUT /flags/:id/close — HR closes PIP with outcome PUT /flags/:id/withdraw — HR withdraws flag POST /flags/:id/delegate — HR delegates to another executive | hr_admin+ for most; employee for ack |
| org-memory | GET /org-memory/briefs — all departure briefs GET /org-memory/briefs/:userId — single brief POST /org-memory/generate — trigger AI brief generation GET /org-memory/search — semantic search across briefs | hr_admin+ |
| okr | GET /okr/objectives, POST /okr/objectives, GET /okr/key-results/:objectiveId | All roles (filtered) |
| lms | GET /lms/recommendations, POST /lms/enroll, PUT /lms/enrollments/:id/progress | All roles (self-only for employees) |
| tenants | GET /tenants/current, PUT /tenants/current — settings, logo | super_admin |

## **5.4 Score Write Path (Critical — known bug, fix in 14-16 Jun build)**

Current PUT /scorecard/kpi/:id/actual (scorecard.ts L151):

const score = targetValue > 0 ? Math.min(100, (actualValue / targetValue) * 100) : 0

const ragStatus = score >= (rag_green_threshold || 90) ? 'green' : score >= (rag_amber_threshold || 75) ? 'amber' : 'red'

BUG 1: Non-inverted formula. For AHT (lower=better), actual=126, target=180 → score=70. Correct score under inversion should be 100 (126 ≤ green_thr 150). Affects all lower-is-better KPIs (AHT, DPMO, resolution times).

BUG 2: RAG comparison compares score (0-100) to native-unit threshold (AHT green=150). Only accidentally correct for percentage KPIs where units approximate 0-100.

FIX (14-16 Jun): Replace with computeKpiScore(actual, greenThr, amberThr) in new services/scoring.ts. Inversion derived from greenThr < amberThr. Linear-to-amber decay curve anchored to native-unit thresholds (decision 66).

# **6. Frontend Architecture**

## **6.1 Routing Model**

Navigation is state-based (activeNav string in App.tsx). No React Router, no window.location.href. setActiveNav is passed as onNavigate prop to child components that need to trigger navigation (decision 34 / rule 18). Page components do not own navigation — they fire a callback.

## **6.2 Page Inventory**

| **Page Component** | **activeNav Key** | **Audience** | **Status** |
| --- | --- | --- | --- |
| ExecDashboard | home | executive+ | Live |
| TeamPerformance | team | manager+ | Live |
| Predictive | predictive | manager+ | Live |
| HrFlagsInbox | hrflags | hr_admin+ | Live (Build 1+2 edits: Active-PIP tile, closed-tile click-through) |
| ClosedFlagsHistory | flaghistory | hr_admin+ | Live — shipped W5D3 Build 2 · multi-select filters · CSV + HTML export |
| PipCheckins | pipcheckins | manager+ | Live |
| Scorecard (employee) | scorecard | employee | Live |
| COPCReport | copc | hr_admin+ | Live |
| SixSigmaReport | sixsigma | hr_admin+ | Live |
| BSCReport | bsc | hr_admin+ | Planned (14-16 Jun if room) |
| OrgMemory | departures | hr_admin+ | Live (Tier 1 briefs) |
| LearningPath | learning | All roles (filtered) | Live |
| ReviewCycles | cycles | hr_admin+ | Live |
| KpiTemplates | templates | hr_admin+ | Live |
| UserManagement | users | hr_admin+ | Live |
| OneOnOne | 1on1 | manager+ | Live |
| TalentGrid | talent | executive+ | Live |
| OKRDashboard | okr | All roles | Live |
| DemoSwitcher | demo | super_admin | Live — 16 personas, switches X-Demo-User-Id header |

## **6.3 Role-Based Navigation (canSee function)**

App.tsx uses a canSee(feature) helper that maps role to visible nav items. Key gates:

- home (exec dashboard): executive, hr_admin, super_admin

- hrflags (Flags Inbox): hr_admin, super_admin

- flaghistory (Closed History): inherits hrflags audience

- predictive: manager, team_lead, hr_admin, super_admin, executive

- scorecard: all roles (employees see own; managers see team)

- departures (Org Memory): hr_admin, super_admin

## **6.4 API Client (client.ts) — Key Functions**

| **Function** | **Route** | **Returns** |
| --- | --- | --- |
| getPendingFlags() | GET /flags/pending | { flags, total } |
| getClosedFlags() | GET /flags/closed | { flags, total } |
| getFlagCounts() | GET /flags/counts | { breakdown: [{flag_type, status, count}] } |
| getFlagsReport(params?) | GET /flags/report?type=&outcome=&name= | HTML string (responseType: text) |
| getTeamScores(cycleId) | GET /scorecard/team/:cycleId | { employees: [...] } |
| getPredictive() | GET /predictive | { predictions: [...] } |
| getCOPCReport() | GET /scorecard/copc-report | { employees: [...], summary } |
| getSixSigmaReport() | GET /scorecard/sixsigma-report | { employees: [...], summary } |
| getDepartures() | GET /org-memory/briefs | { briefs: [...] } |
| confirmFlagConversation(id, comment) | PUT /flags/:id/confirm | { success } |
| confirmPipClosure(id, data) | PUT /flags/:id/close | { success } |

*The Axios interceptor in client.ts automatically attaches X-Demo-User-Id: **<**uuid**>** to every request when demoUserId is set. This means demo mode is transparent to all page components — they call the same functions as production.*

# **7. CSS Design System (kinalys.css)**

*The design system uses CSS custom properties (variables) prefixed with --k-. Component utility classes prefix with k-. The system supports light and dark mode via the class tokens, though the current demo defaults to the dark/navy theme.*

## **7.1 Color Tokens**

| **Token** | **Value** | **Usage** |
| --- | --- | --- |
| --k-brand | #0D9488 | Primary teal — buttons, active states, brand elements |
| --k-brand-hover | #0B8076 | Hover state for brand elements |
| --k-brand-light | #F0FDFA | Very light teal — highlighted backgrounds, active tile bg |
| --k-bg-primary | #0F172A | Page background (dark navy) |
| --k-bg-card | #1E293B | Card background |
| --k-bg-input | #1E293B | Input field background |
| --k-bg-hover | #334155 | Hover state for interactive rows |
| --k-text-primary | #F1F5F9 | Primary text on dark bg |
| --k-text-muted | #64748B | Secondary/muted text |
| --k-text-label | #94A3B8 | Labels, placeholders |
| --k-border-default | #334155 | Default border color |
| --k-border-focus | #0D9488 | Focus ring / active border |
| --k-success-bg | #064E3B | Success state background |
| --k-success-text | #10B981 | Success state text (green) |
| --k-success-border | #065F46 | Success state border |
| --k-warning-bg | #451A03 | Warning state background |
| --k-warning-text | #F59E0B | Warning state text (amber) |
| --k-warning-border | #78350F | Warning state border |
| --k-danger-bg | #450A0A | Danger/error background |
| --k-danger-text | #EF4444 | Danger/error text (red) |
| --k-danger-border | #7F1D1D | Danger/error border |
| --k-radius-sm | 4px | Small radius — badges, small elements |
| --k-radius-md | 8px | Medium radius — cards, inputs, buttons |
| --k-radius-lg | 12px | Large radius — modals, large panels |
| --k-shadow-sm | 0 1px 3px rgba(0,0,0,.4) | Small shadow |
| --k-shadow-md | 0 4px 12px rgba(0,0,0,.4) | Medium shadow — cards |

## **7.2 Typography**

| **Field** | **Detail** |
| --- | --- |
| Display font | Syne (Google Fonts) — used for page titles and large numbers |
| Body font | DM Sans (Google Fonts) — used for all body copy and UI text |
| Mono font | Courier New / system monospace — code blocks, IDs |
| Base size | 14px (20 DXA in docx terms) |
| Page title | 24px bold (k-page-title) |
| Section sub | 13px muted (k-page-sub) |
| Card header | 13px uppercase bold letter-spaced |
| Stat number | 28-36px Syne bold — used in exec dashboard stat cards |
| Badge text | 10-11px bold uppercase |

## **7.3 Component Classes**

| **Class** | **Usage** | **Key Styles** |
| --- | --- | --- |
| k-page | Page wrapper div | padding: 24px 28px; min-height: 100vh |
| k-page-title | H1 page heading | font-family: Syne; font-size: 24px; font-weight: 700; color: --k-text-primary |
| k-page-sub | Page subtitle / description | font-size: 13px; color: --k-text-muted; margin-top: 4px |
| k-card | Generic content card | background: --k-bg-card; border-radius: --k-radius-md; box-shadow: --k-shadow-md |
| k-nav-item | Left nav menu item | padding: 8px 12px; border-radius: 6px; cursor: pointer; color: --k-text-muted |
| k-nav-item.active | Active nav item | background: --k-brand-light; color: --k-brand; font-weight: 600 |
| k-badge-green | Green performance badge | background: --k-success-bg; color: --k-success-text; border: 1px solid --k-success-border |
| k-badge-amber | Amber performance badge | background: --k-warning-bg; color: --k-warning-text; border: 1px solid --k-warning-border |
| k-badge-red | Red performance badge | background: --k-danger-bg; color: --k-danger-text; border: 1px solid --k-danger-border |

## **7.4 Layout Patterns**

- All pages use k-page as the outer wrapper — consistent padding and background

- Cards use k-card with inline style overrides for specific cases (borderLeft accent for warning banners, opacity for dimmed tiles)

- Tile grids use CSS Grid with repeat(4, 1fr) for the 8-tile inbox layout

- Filter bars use display: flex with gap and alignItems: flex-end for baseline alignment of filter controls

- All text uses HTML entities for special chars in JSX (&middot; &mdash; &ndash;) to maintain ASCII-safe source files (rule 34)

# **8. Feature Specifications**

## **8.1 KPI Engine**

KPI assignments flow through a 5-state lifecycle: draft → pending_manager → pending_hr → live → rejected. The assignment is created from a kpi_template when a review cycle is activated. Managers enter actual values (PUT /scorecard/kpi/:id/actual), which triggers score computation and RAG classification. The breach hook fires if RAG transitions from green/null to amber/red, or from amber to red — triggering an AI course recommendation.

- KPI weight_pct must sum to 100 per designation per cycle — enforced at template setup

- Source can be template (default) or custom — managers can add ad-hoc KPIs

- 424 of 424 demo assignments are template-sourced (verified)

## **8.2 Predictive Analytics**

GET /predictive and /predictive/team read closed cycle history (review_cycles status=closed) and compute a weighted_score per cycle via SUM(ka.score * ka.weight_pct) / SUM(ka.weight_pct). A linear projection from the last two data points forecasts the next cycle score. SLIP alerts fire when the projected score falls below the org's amber band threshold. The team view is filtered by department_id for managers (they see their dept only).

## **8.3 PIP Lifecycle (6 stages)**

| **Stage** | **Status** | **Actor** | **Description** |
| --- | --- | --- | --- |
| 1. Raised | pending_hr | Manager | Manager raises flag with a mandatory comment. Goes to HR Flags Inbox pending_hr tile. |
| 2. HR Confirmed | pending_employee_ack | HR Admin | HR reviews, adds mandatory comment, confirms PIP. Moves to employee acknowledgement. |
| 3. Employee Acknowledged | pip_active | Employee | Employee reads the PIP plan and writes a mandatory response. PIP becomes active. |
| 4. Active PIP | pip_active / hr_reviewing | Manager | Manager logs regular check-ins. HR can review and extend the PIP period. |
| 5. Pending Closure | pending_hr_closure | HR Admin | Manager submits closure request. HR reviews and confirms outcome. |
| 6. Closed | completed_successful / completed_unsuccessful / withdrawn | HR Admin | Final outcome recorded. Flag moves to closed history. Org Memory brief updated. |

*Terminal PIP statuses (decision 58): completed_successful, completed_unsuccessful, closed, withdrawn, completed (legacy). These appear in /flags/closed, not /flags/pending.*

## **8.4 HR Flags Inbox — 8-Tile Grid**

| **Tile** | **Count Source** | **Color** | **Click Action** |
| --- | --- | --- | --- |
| Total Pending | TOTAL_PENDING_STATUSES (pending_hr + pending_employee_ack) | Teal | Filter to total pending |
| Pending HR | pending_hr + pending_hr_closure | Teal | Filter to pending_hr |
| Pending Employee | pending_employee_ack | Muted | Filter to pending_employee |
| Processed | hr_reviewing + extended | Muted | Filter to processed |
| Active PIPs | pip_active | Amber | Filter to active_pip |
| PIP Flags | All PIP type flags | Purple | Filter to pip type |
| Release Flags | Release flags not conversation_done | Teal | Filter to release |
| PIP Closed | PIP terminal statuses | Muted / clickable | Navigate to ClosedFlagsHistory |
| Release Closed | conversation_done | Muted / clickable | Navigate to ClosedFlagsHistory |

*All tile counts come from a single GET /flags/counts call (rule 31: one source per number). The counts breakdown is a flat [{flag_type, status, count}] array; tile logic in HrFlagsInbox.tsx aggregates from it.*

## **8.5 Closed Flag History (ClosedFlagsHistory.tsx)**

- Sources from GET /flags/closed — terminal flags only (decision 58)

- Multi-select TYPE filter (PIP / Release) — rule 36: all filter dropdowns are multi-select by default

- Multi-select OUTCOME filter (Successful / Unsuccessful / Released / Withdrawn)

- Name search (substring, case-insensitive)

- All filters are client-side on the loaded flags array (rule 33: one source per number)

- Lean expand drill-in: conditional by flag_type — PIP shows period/ack/response/outcome; Release shows note + confirmed date

- Export CSV button — exports filtered list with BOM + CRLF + RFC-4180 quoting

- Print Report button — fetches GET /flags/report with current filter state, opens as blob tab (Ctrl+P → PDF)

## **8.6 Org Memory — 3-Tier Architecture**

| **Tier** | **Name** | **Mechanism** | **Status** |
| --- | --- | --- | --- |
| Tier 1 | Role Intelligence Brief | Auto-generated on departure via Anthropic API. Includes: KPI history + trends, 1-on-1 notes, OKR contributions, competency profile, skill gaps, PIP history if applicable. | Live |
| Tier 2 | Communication Import | AI extracts decisions, contacts, project threads from Teams / Slack / Workspace. Raw messages deleted after 90 days (GDPR/DPDP compliant). Only AI-summarised knowledge retained. | Roadmap — go-live run-up |
| Tier 3 | Organisational Brain | Searchable knowledge base. 'How did the previous agent handle platinum escalations?' → AI answers from all past employees. Compounds with every departure. Standalone product potential. | Roadmap — Year 2 |

## **8.7 Adaptive Learning**

Two recommendation triggers: (1) Role-path: courses recommended based on the employee's designation and department methodology. (2) Breach-triggered: when a KPI transitions to amber or red, the breach hook fires and the AI recommends a specific course targeting that KPI's skill gap. If no course matches internally, the system flags to HR for external procurement. Powered by Anthropic claude-sonnet-4-6.

## **8.8 Export Layer (decision 64)**

| **Surface** | **Format** | **Mechanism** | **Status** |
| --- | --- | --- | --- |
| ClosedFlagsHistory | CSV | Client-side on filtered array. BOM + CRLF + RFC-4180 quoting. Excel-safe. Exports only what is currently visible (rule 33). | Live |
| ClosedFlagsHistory | HTML report (Print→PDF) | GET /flags/report — backend route. Reads tenant name + logo (null → name fallback). Supports type/outcome/name filter params. Scope label distinguishes full vs filtered. Opens as blob tab via Axios fetch (demo header travels). | Live |
| HrFlagsInbox | CSV per tile | Part 3 of export layer. Deferred to go-live run-up alongside Download As dropdown (rule 34 amendment). | Planned |
| Role Intelligence Brief | PDF / DOC | Programmatic PDF library. Part 4. Post-demo. | Planned |

# **9. Scoring Unification Design (14-16 Jun Build Spec)**

*This section supersedes V21 §6 in all cases where they disagree. The design is based on live code reads performed on 10 June 2026.*

## **9.1 Current State (Verified — NOT the V21 summary)**

| **Surface** | **File / Line** | **Reads** | **Formula** | **Inverted-aware** |
| --- | --- | --- | --- | --- |
| Exec / team dashboard | scorecard.ts L260-267 | actual_value | LEAST(actual/target,1)*100 · weighted · caps 100 | No |
| Score WRITER | scorecard.ts L151 | writes actual→score | Math.min(100, actual/target*100) | No |
| COPC report | scorecard.ts L527-528 | stored score | Σ(score·weight)/Σweight | reads only |
| Six Sigma report | scorecard.ts L666-667 | stored score | Σ(score·weight)/Σweight | reads only |
| Predictive history | predictive.ts L61-67 | stored score | ROUND(Σ(score·weight)/Σweight,1) | reads only |

*V21 §6 claimed Predictive reads actual_value (L71-72). FALSE. predictive.ts L61-67 reads stored score. Only exec/team is the outlier. The unification is smaller than §6 implied.*

## **9.2 The Root Problem**

Stored score is NOT authoritative — it is written by the same broken non-inverted formula (L151). Score is just the broken result cached on the row. Unifying all reads to stored score would make everyone consistently wrong on AHT/DPMO, not correct. The real fix is at the write path.

## **9.3 Inversion — Derivable Without Migration**

Verified from kpi_templates data: rag_green_threshold < rag_amber_threshold implies a lower-is-better KPI. No is_inverted column needed. All inverted KPIs in the demo data (AHT, DPMO, Incident Resolution Time, Ticket Resolution Time) have green threshold below amber threshold. All normal KPIs (FCR, CSAT, Compliance) have green above amber.

## **9.4 Target Architecture — computeKpiScore**

New services/scoring.ts with one exported function. All read and write paths import it.

function computeKpiScore(actual, greenThr, amberThr): number | null

  inverted = (greenThr < amberThr)

  if inverted:

    actual ≤ greenThr → 100

    greenThr < actual ≤ amberThr → lerp(100, AMBER_SCORE, t)

    amberThr < actual ≤ redEnd → lerp(AMBER_SCORE, 0, t)

    actual > redEnd → 0

  else: symmetric mirror for normal (higher=better) KPIs

AMBER_SCORE (default 70) and the red decay boundary are org-configurable tenant settings, not hardcodes. The ||90 / ||75 fallbacks in scorecard.ts L152-153 are replaced by this configurable band. Scorer reads setting-or-default.

## **9.5 Build Steps (Dependency Order)**

| **Step** | **What** | **File** |
| --- | --- | --- |
| 1 | Create services/scoring.ts with computeKpiScore + weightedOverall | NEW FILE |
| 2 | Fix score WRITER (L151): replace inline formula with computeKpiScore + template-join for thresholds | scorecard.ts |
| 3 | Fix RAG write (L152-153): compare ACTUAL to native-unit thresholds, not score to thresholds | scorecard.ts |
| 4 | Retire exec/team recompute (L260-267): read stored score + weightedOverall (same as COPC/Six Sigma) | scorecard.ts |
| 5 | BSC scoring core if room: perspective column on kpi_templates + tag seed + /bsc-report route | kpi_templates + scorecard.ts |

## **9.6 Mariam AHT — Critical Demo Fix**

Under correct inversion-aware scoring, Mariam's AHT actual of 126 against green_thr 150 scores 100 and renders GREEN — not red. The current demo's 'two red KPIs' narrative holds only because the broken non-inverted formula scores AHT as 70. Her AHT must be reseeded to a genuine overshoot (~210) in the 15-17 Jun data reset so 'red AHT' is true under correct math. A struggling agent has HIGH handle time — 126 was always narratively backwards.

# **10. Demo Configuration**

## **10.1 Tenant**

| **Field** | **Detail** |
| --- | --- |
| Tenant name | Veridian Solutions |
| Tenant ID | 108810fc-5c75-4c08-ab68-1e6ffd0555b0 |
| Logo URL | NULL (name-text fallback active in all reports) |
| Demo user | sanmeet.sahni@kinalys.io · role: hr_admin |

## **10.2 Demo Data State (verified 10 Jun 2026)**

| **Field** | **Detail** |
| --- | --- |
| Active flags | 2: Mariam (pending_hr PIP) + Mariam (completed_successful closed PIP) |
| Closed flags | 2: Mariam (completed_successful) + Suresh Iyer (conversation_done release) |
| Review cycles | Q1 2026 (closed), Q2 2026 (closed), Q3 2026 (active) |
| Departments | 8 (Customer Operations, Quality, Technology, HR, Finance, Sales, Operations, Training) |
| Personas (DemoSwitcher) | 16 including all role types |
| KPI assignments | 424 (all template-sourced, all with weights) |
| Org Memory briefs | 7 departure briefs generated |

## **10.3 Key Locked Personas (decision 51/55)**

| **Persona** | **Role** | **Dept** | **Narrative Purpose** |
| --- | --- | --- | --- |
| Mariam Al Hashimi | Employee (agent) | Customer Operations | Primary PIP subject — 78.0 NI, AHT and FCR red (bug: AHT will be ~210 post-reset), COPC demo |
| Suresh Iyer | Employee | Customer Operations | Release narrative — conversation_done, positive release |
| Rajesh Kumar | Manager | Customer Operations | Raises Mariam's PIP, uses Predictive to spot decline |
| Deepa [CEO] | Executive | All | Opens Exec Dashboard — sees org at a glance |
| Sanmeet Sahni | HR Admin | HR | Governs flags, confirms PIPs, views Org Memory |

## **10.4 The 5-Beat Demo Narrative**

| **Beat** | **Persona** | **Surface** | **What It Shows** |
| --- | --- | --- | --- |
| 1. Org view | Deepa (CEO) | Exec Dashboard | 6 High / 27 On Track / 8 Need Attention — composition beneath the headline |
| 2. Predictive | Rajesh (Manager) | Predictive | Mariam's 83.2→76.0→78.0 decline — SLIP alert — raise PIP live on stage |
| 3. HR Governance | Sanmeet (HR Admin) | Flags Inbox | Confirm PIP — route to employee — audit trail — mandatory comment gate |
| 4. Employee + AI | Mariam (Employee) | Scorecard + Learning | 78.0 NI — AI-recommended AHT course — adaptive path |
| 5. Org Memory | Sanmeet (HR Admin) | Org Memory | 7 departure briefs — Suresh's release — Org Brain query |

# **11. Current Development Status**

## **11.1 Live and Verified (as of W5D3, 10 June 2026)**

- Multi-methodology KPI engine — COPC, Six Sigma, OKR live · BSC tables exist but empty

- AI course recommendations via Anthropic claude-sonnet-4-6

- Predictive analytics with department drill-down and SLIP alerts

- Full PIP lifecycle — 6 stages, employee acknowledgement, check-ins, closure

- Active-PIP tile on HrFlagsInbox with manager backfill-planning band (decision 62)

- HR Flags Inbox — 8-tile grid, all tiles verified, click-through to closed history

- Closed Flag History page — multi-select filters, name search, conditional drill-in

- Flag Records Export — CSV (client-side, filtered) + HTML print report (backend)

- Org Memory Tier 1 — Role Intelligence Brief auto-generated on departure

- Adaptive Learning — role-path + breach-triggered recommendations

- Exec dashboard, scorecard, talent grid, 1-on-1 reviews, OKR dashboard

- DemoSwitcher with 16 personas covering all role types

- 117 / 117 API routes verified (frontend – backend path match 100%)

- Full audit_log, soft-delete, privacy ack modal

## **11.2 In Progress / Building (14-16 Jun)**

- Scoring-path unification — computeKpiScore in services/scoring.ts — fixes writer, retires exec recompute, fixes RAG unit-confusion bug

- BSC scoring core — perspective column on kpi_templates + /bsc-report route (if room in 14-16 window)

## **11.3 Scheduled (15-17 Jun)**

- Full demo data reset — reseed all personas with correct scores under new formula

- Mariam AHT reseeded to genuine overshoot (~210) so 'red AHT' is true under correct inversion-aware scoring

- Locked personas (Mariam, Suresh, Rajesh) deliberately set to narrative values, not regenerated

## **11.4 Planned (go-live run-up, Jul–Aug 2026)**

- BSC report UI page (BSC scoring core builds in 14-16; UI page is movable)

- Org Memory Tier 2 — Communication Import (Teams / Slack / Workspace)

- Scoring HR-governed edit path — HR-only KPI edits with mandatory reason, audit, and freeze-on-write

- Download As dropdown — replace per-format export buttons with unified dropdown (CSV / XLSX / PDF)

- PIP at-risk heuristic indicator (free tier preview)

- OKR cascade engine — OKR-first cycle initialisation + KPI→KR rollup

## **11.5 Known Issues ****&**** Technical Debt**

| **Issue** | **Severity** | **Notes** |
| --- | --- | --- |
| Scoring writer bug (scorecard.ts L151) | CRITICAL — fix 14-16 Jun | Non-inverted formula: Math.min(100, actual/target*100). Misscores all lower-is-better KPIs (AHT, DPMO, resolution times). Mariam's AHT 126/180 scores 70 (red) instead of 100 (green). |
| RAG unit-confusion bug (scorecard.ts L152-153) | CRITICAL — fix 14-16 Jun | Compares score (0-100) to native-unit threshold (AHT 150 seconds). Only correct by scale coincidence for percentage KPIs. |
| Exec/team recompute outlier (scorecard.ts L260-267) | HIGH — fix 14-16 Jun | Only scoring surface that reads actual_value instead of stored score. Creates inconsistency with COPC/Six Sigma/Predictive. |
| BSC tables empty | MEDIUM — 14-16 Jun | bsc_metrics is 0 rows. kpi_assignments has no perspective_id. BSC scoring needs perspective mapping layer. |
| CSV fmtDate null = em-dash | LOW — post-demo | fmtDate returns \u2014 for null dates, bleeds non-ASCII into CSV empty-date cells. Fix: CSV-specific date formatter returning empty string for null. |
| /flags/report paste rule miss (W5D3) | LOW — logged only | ~147-line route was applied via editor paste instead of full-file overwrite (rule 35). Verified clean, left in place per rule 19. No fix needed. |
| Encoding (BOM markers on 13 files) | LOW — 18-19 Jun polish | UTF-8 BOM markers on ~13 frontend files. Scheduled for repo-wide encoding cleanup pass. |
| window.open after async may be popup-blocked | LOW | getFlagsReport is async; some browsers block window.open after an await. Chrome allows it. Popup-block banner in place as fallback. Fix: open tab synchronously then redirect if consistent blocking. |
| Demo-breach hardcoded score (L375) | LOW — grandfathered for demo | score = 78 literal. Should call computeKpiScore post-reset. Grandfathered (decision 65) — fix in 15-17 Jun reset. |

# **16. Onboarding & Data Architecture (NEW)**

## 16.1 Integration-First Ingestion
Clients lack structured PMS; their history is messy (Excel, Word PIPs/1-on-1s). Kinalys does NOT ingest their
*assessments*. It ingests **raw operational data** (CRM: Salesforce/HubSpot; telephony/ACD; QA logs; ticketing —
historical + live) and **computes performance on its own parameters** via the scoring engine.

## 16.2 The Delta Report (Onboarding "Wow")
Kinalys runs its rigorous, consistent PMS over the same raw data the client already assessed informally, and
shows the **delta** — Kinalys's data-driven assessment vs the client's prior gut/inconsistent rating. "You rated
this person 'meets expectations'; the data says declining, PIP-bound." The delta IS the value proposition.

## 16.3 Ongoing Actuals = Integration (not manual)
Ongoing actuals flow via integration (tamper-resistant: pulled from systems of record). Manual entry is the
rare exception (manipulation risk). This is the integrity guarantee for the numbers that drive
appraisals/bonuses/promotions.

## 16.4 Small-Client Fallback
Clients with no integrable systems use the existing **KPI Templates** feature (manual/templated entry,
auto-applied per designation on cycle open). The SYSTEM master catalog gives them correct KPI definitions.

## 16.5 Data-Integrity Philosophy
- **Protect the numbers** (core performance → appraisals/bonuses/promotions) via integration-sourcing.
- **Human inputs** (manager feedback, 360 peer review) cannot be guaranteed unbiased — it is human. Accept it
  honestly; do NOT overclaim bias elimination. Control = **lock-on-submit, no-edit, full audit trail**.
- For **survey-based** inputs (employee satisfaction, eNPS): Kinalys SHIPS its own survey instrument (16.7)
  rather than ingesting arbitrary client surveys — owning the instrument controls the methodology.

## 16.6 Reusable vs Throwaway (from the reseed)
Reusable → Onboarding Importer: verify-first writes, `scoreKpi`, partition/assert patterns, dry-run discipline.
Throwaway → hardcoded bands, reverse-score reshape, synthetic history (see Task 0).

## 16.7 Shipped Employee Pulse Survey (POST-DEMO FEATURE)
Kinalys-owned, editable-question-text, fixed-scale quarterly pulse survey. Base = proven template + 2025 adds:
- **Sections:** eNPS (0-10, also the single-question variant) · Work Environment (WFH/office **logic-jump**) ·
  Daily Work & Collaboration · Leadership/Management/Culture (incl. **fairness/bias** item) · Growth & Retention.
- **2025 additions:** Wellbeing/sustainable-workload · Recognition (distinct from feedback) · Learning/skill-growth
  (ties to LMS) · 1-on-1 cadence (ties to 1-on-1 module — correlate survey vs actual 1-on-1 frequency) · Belonging.
- **Sub-dimension scoring:** each section → sub-score rolling into the Employee Satisfaction KPI (actionable:
  "high on Collaboration, low on Growth" vs a single flat number).
- **Two modes:** full multi-dimension survey OR single-question eNPS-only.
- **Fix needed:** standardize the retention-intent item scale (currently 4-point vs 5-point Likert elsewhere).
- **Why ship our own:** controls methodology, makes scores comparable/benchmarkable, avoids ingesting irrelevant
  client questions. Same integrity principle as integration-sourcing for operational KPIs.

## 16.8 Employee Self-Service Trend + Predictive View (POST-DEMO FEATURE)
Line graph on the employee Scorecard page: own Q-over-Q trend (overall + per-KPI) + lightweight personal
predictive ("on current trend you're heading toward X"). Live in integration-fed tenants. Currently employees
see current-cycle KPIs only; trend/predictive live in manager/HR/exec views.

---

---

# **17. Measurement Methodology & KPI Patterns (NEW — see TRD §4 for technical detail)**

Measurement methodology is a **first-class concept**: each KPI definition carries HOW its metric is computed
from raw inputs. KPI pattern taxonomy:
1. **Direct-%** — value IS the percentage (SLA, Client Retention, Compliance, On-Time Delivery).
2. **Achievement-vs-target (natural units)** — raw value in real units, score = % of target achieved.
   Display "N of target". (New Client Acquisition: count /100; Pipeline Value: currency /target;
   Training Hours: hours /100 role-based.) **Natural-units display is the PERMANENT correct model**, not demo polish.
3. **Inverted** — lower is better (Attrition %, Budget Variance %, Cost Efficiency Ratio).
4. **Special-formula** — eNPS (%promoters−%detractors), NPS (-100..100).
5. **Survey-based** — multi-method: top-2-box % (single Likert) OR multi-question average. Method depends on the
   shipped survey config (16.7). Demo uses Method A (% rated 4+).

---

---

# **18. Cycle Calendar Note**
Cycle dates are calendar-correct (Q1 Jan, Q2 Apr, Q3 Jul starts). Only oddity: Q3 is `is_current` on 14-15 Jun
(calendar Q2). This is PRESENTATION, not data — reseed writes by cycle_id; trends read correctly. Demo Q&A
answer ready: "Q3 review cycle opened for forward goal-setting; Q1/Q2 closed historicals." Post-demo course-correct
candidate (review_cycles table only). Does not block anything.

---

---

# **12. Build Roadmap — Demo to Go-Live**

| **Window** | **Dates** | **Work** | **Status** |
| --- | --- | --- | --- |
| **TASK 0** | **Post-demo, FIRST** | **STRIP ALL TEMPORARY DEMO FIXES (§0) — non-negotiable, blocks all other post-demo work** | **NON-NEGOTIABLE** |
| W5D4-W6D2 | 11-16 Jun | Scoring unification build (computeKpiScore, writer fix, exec recompute retirement, RAG fix) · BSC scoring core if room | NEXT |
| Data Reset | 15-17 Jun | Full demo data reseed against fixed scorer · Mariam AHT ~210 overshoot · Protected persona calibration | Depends on 14-16 |
| Polish | 18-19 Jun | Beat 3 + PIP beat re-runs · encoding cleanup · demo run 1 | Planned |
| Demo Run 1 | ~19 Jun | Post-unification drift check · verify all scoring surfaces agree · full 5-beat rehearsal | Planned |
| AWS Deployment | 22-29 Jun | EC2 + RDS + Nginx + PM2 + SSL + S3 + CloudWatch · DNS cutover · no new builds in this window | Planned |
| Investor Demo | 30 Jun | In-person · Pune · live URL backup · 5-beat narrative | Confirmed |
| Client Demos | Jul 2026 | First enterprise client demos (India ICP: BPO/ITeS 100-2000 employees) | Planned |
| Go-Live | 15 Aug 2026 | Production on AWS · real users · first paying tenants | Target |
| GCC Expansion | Year 2 | UAE / KSA / Qatar · ADGM entity · Hub71 pathway | Funded roadmap |
| Series A | Q1 2027 | $5-8M · GCC-anchored · ISV Accelerate · 20+ tenants | Planned |

## 12.1 Post-Demo Build Backlog (Task 0 → Go-Live, consolidated W6D2)

Ordered after Task 0 (§0), which blocks everything. Grouped by theme; each item traces to a decision.

**A. Demo/Prod separation (Task 0 core + D80)**
- `DEMO_MODE` env flag (frontend gates DemoSwitcher render; backend ignores `X-Demo-User-Id` when false). Defense-in-depth so the demo bypass cannot work against prod.
- Quarantine reseed + DEMO_PERSONAS to demo-instance build. Strip hardcoded tenant/cycle IDs.

**B. Configurable performance framework (D82, D83 — replaces all hardcoded bands)**
- `performance_bands` tenant config (schema): org-wide default High/Medium/NI cutoffs + RAG green/amber, with **per-department/function overrides** (Sales vs Support/COPC vs IT/Six Sigma differ).
- Central band-resolution service; refactor EVERY view (employee → manager → VP/Director → CEO/exec) to read from it. No magic numbers in any view (Rule 41).
- Org-admin settings UI to set bands during onboarding.
- Active-employee scope (Rule 42) already implemented in exec/manager views + reseed assertion; formalize as the shared scope helper.

**C. User Avatar System (D81)**
- Profile picture upload per user + themed initials-avatar fallback (active-theme colors). Render everywhere users appear. Remove all decorative/hardcoded emoji.

**D. Onboarding & data architecture (D73, D74)**
- Integration-first importer (CRM/telephony/QA/ticketing → Kinalys computes on own params) + delta report ("Kinalys vs your prior assessment") as onboarding wow. Manual KPI-template entry = small-client fallback.
- Harvest reseed patterns into the importer: verify-id-first writes, dry-run→review→execute, partition/fence checks, post-pass assertions.

**E. Employee-facing & survey (D76 + self-service)**
- Shipped Kinalys-owned pulse survey (editable text, fixed scale/methodology). (§16.7)
- Employee self-service trend + personal predictive view on Scorecard. (§16.8)

**F. Org Memory tiers 2-3, OKR cascade engine, export layer (CSV per tile, Role Intelligence Brief PDF)** — as previously rostered (§ above).

**G. Hygiene** — repo-wide UTF-8 encoding cleanup (then revert Rule 34 ASCII workarounds); CSV null-date formatter.



# **13. AWS Infrastructure**

## **13.1 Architecture (MVP)**

Single EC2 instance handles both Fastify API and Nginx-served React frontend. RDS PostgreSQL in a private subnet within the same VPC. No public RDS endpoint. Elastic IP attached to EC2 for stable DNS.

| **Field** | **Detail** |
| --- | --- |
| Region | ap-south-1 (Mumbai) — India DPDP Act 2023 data localisation compliance |
| EC2 | t3.medium (2 vCPU, 4 GB RAM) — Fastify + Nginx + PM2 |
| RDS | db.t3.medium · PostgreSQL 18 · gp3 50 GB provisioned · auto-scale to 500 GB · private subnet |
| Elastic IP | 1 static IPv4 — ensures DNS A record stability |
| S3 | Standard + Intelligent-Tiering · briefs, reports, HRIS staging, logs |
| SSL | Let's Encrypt via Certbot — auto-renewing |
| CloudWatch | EC2 + RDS metrics · SNS email alerts · application logs |
| Route 53 | DNS (once migrated from GoDaddy) — hosted zone for kinalys.io |
| IAM | EC2 instance role — least-privilege S3 write only · no hardcoded credentials |
| Deployment date | 23 June 2026 |

## **13.2 Security**

- VPC: public subnet (EC2 + Elastic IP) + private subnet (RDS, no internet route)

- EC2 Security Group: SSH port 22 restricted to founder IP only; inbound 80 + 443 from anywhere

- RDS Security Group: port 5432 from EC2 security group only

- KMS encryption at rest for RDS and S3 (AES-256)

- TLS 1.2+ enforced in Nginx configuration, HSTS headers

- Auth0 JWT on all API routes — HS256, 24-hour expiry

- Tenant_id filter on every database query — application-level multi-tenant isolation

- Parameterised queries throughout — no SQL injection surface

- audit_log table — immutable, every state change recorded

- Privacy ack modal on first login — GDPR, CCPA, India DPDP Act 2023 compliant

## **13.3 Growth Phase Architecture (Q4 2026+)**

- CloudFront CDN — serve React static assets from edge locations

- Application Load Balancer + Auto Scaling Group — horizontal scaling post 20+ tenants

- RDS Multi-AZ — high availability failover

- ElastiCache Redis — session caching and notification queuing

- Systems Manager Parameter Store — replace file-based .env

- GuardDuty + Security Hub — SOC 2 compliance preparation

- Aurora PostgreSQL — when storage exceeds 500 GB or per-tenant schema isolation required

# **14. Business Model ****&**** Pricing**

## **14.1 SaaS Pricing (per tenant per month)**

| **Plan** | **Users** | **INR / mo** | **USD / mo** | **Key Limits** |
| --- | --- | --- | --- | --- |
| Hatchling | 50 | ₹23,999 | $249 | All core features, Org Memory Tier 1 |
| Starter | 100 | ₹47,999 | $499 | All features |
| Growth | 200 | ₹76,999 | $799 | Most popular |
| Scale | 300 | ₹1,04,999 | $1,099 |  |
| Enterprise | 700+ | Custom | Custom | Dedicated support, custom SLAs |

*All plans include: KPI Management, Scorecard, AI Coaching, LMS, OKR, 1-on-1s, Talent Grid, 9 HRIS Connectors, Reports, Org Memory Tier 1. Overage: $22-35 per user above plan limit per month.*

## **14.2 High-Margin Add-Ons**

| **Add-on** | **Price** | **Notes** |
| --- | --- | --- |
| Org Memory Starter | $750/mo | 25 departures/year |
| Org Memory Growth | $1,250/mo | 75 departures/year |
| Org Memory Scale | $1,999/mo | 150 departures/year |
| PIP Predictive Engine | TBD — post-launch ML tier | Paid add-on after accuracy validation |
| Competency Framework | $350/mo | Custom framework builder |

## **14.3 Revenue Targets**

| **Field** | **Detail** |
| --- | --- |
| ICP (India beachhead) | BPO/ITeS · 100-2,000 employees · COPC/ISO-certified · 20%+ attrition |
| Q3 2026 | 3 paying pilot clients |
| Q4 2026 | ₹1 Cr ARR target |
| Year 2 | GCC expansion — UAE, KSA, Qatar · 5x ARR |
| Series A target | Q1 2027 · $5-8M · GCC-anchored |

## **14.4 Raise**

| **Field** | **Detail** |
| --- | --- |
| Amount | $1,000,000 pre-seed |
| Instrument | SAFE Note · 20% discount |
| Runway | 18 months |
| Use: Product & Engineering | 40% |
| Use: Sales & Marketing | 30% |
| Use: Operations & Infrastructure | 20% |
| Use: Legal & Admin | 10% |
| ESOP Pool | 10-12% post-money |

# **15. Key Decisions Log**

Selected decisions governing platform design and build discipline. Full log in V22 master context.

| **Decision** | **Date** | **Summary** |
| --- | --- | --- |
| 51/55 | Apr 2026 | Locked personas (Mariam, Suresh, Rajesh + Six Sigma five) must not be blanket-reseeded. Narrative values deliberately set, never random. |
| 58 | May 2026 | Terminal status classification: PIP terminal = completed_successful/unsuccessful/closed/withdrawn/completed. Release terminal = conversation_done/closed/withdrawn. Governs /flags/closed and ClosedFlagsHistory. |
| 62 | Jun 2026 | Active-PIP tile backfill planning band: Ending Soon = past midpoint of PIP duration, proportional. |
| 63 | W5D3 | Build 2 shipped — closed-flag history view + export layer Parts 1-2. |
| 64 | W5D3 | Flag records export: CSV (client-side, filtered) + HTML report (backend, tenant-aware, filter params). Parts 3+4 deferred. |
| 65 | W5D3 | No building-to-throw-away. From W5D3 onward, build the August/go-live version. Deliberate throwaway banned. Corrections and iteration fine. |
| 66 | W5D3 | RAG thresholds are NATIVE-UNIT (Design B), org-configurable with suggestive defaults. Never 0-100 score cutoffs. Enables inversion derivation from threshold direction. |

## **15.1 Standing Rules (selected critical ones)**

| **Rule** | **Summary** |
| --- | --- |
| Rule 18 | Navigation via setActiveNav callback. Never window.location.href. Child components fire onNavigate prop, never navigate directly. |
| Rule 19 | Never rewrite a verified-working file to satisfy process. If it compiled and API tests pass, leave it. |
| Rule 21 | Verify line numbers before every edit. Line counts change after every insertion. Re-read before editing. |
| Rule 31 | One source per number. Tile counts come from one route, one computation. No drift between display and data source. |
| Rule 33 | Export what you see. CSV and report exports honour active filters. The exported set matches the screen. |
| Rule 34 | ASCII-safe source files. HTML entities in JSX text, \u escapes in string literals. No raw multibyte chars until encoding cleanup pass (18-19 Jun). |
| Rule 35 | Full-file overwrite for changes >10 lines or multi-site. Never paste long blocks into a live file. |
| Rule 36 | Multi-select by default for ALL filter dropdowns. Never single-select on first build. |

Kinalys — Master PRD v22  ·  Confidential  ·  Indyaah Techbytes Pvt. Ltd.  ·  June 2026

---

# **15.2 Key Decisions Log — ADDITIONS (v23)**

| **Decision** | **Date** | **Summary** |
| --- | --- | --- |
| 67 | W5D7 | **Option A — single scoring entry point.** `scoreKpi(name,actual,green,amber)` shared by writer + reseed so they cannot drift. DPMO→sigma branch inside. |
| 68 | W5D7 | **Option 2 — RAG from SCORE BAND uniformly** (≥85 green, ≥70 amber, else red) for ALL KPIs. Score & RAG can never contradict. Matches the DPMO sigma branch. |
| 69 | W5D7 | **pg-numeric-as-string root-cause fix.** node-postgres returns numeric cols as strings; `amber+redEndDist` string-concatenated → inverted KPIs past amber floored to 0. `Number()` coercion in computeKpiScore/dpmoToSigma/scoreKpi. Fixed writer too. +2 regression tests (34/34). |
| 70 | W5D7 | **Six Sigma realism.** DPMO scored via sigma; domain-relative band (BPO/IT 3.0–4.5σ, realistic ceiling ~3.8σ). SS-High tops ~79–86, NOT 92. Cross-methodology score difference is intended, not a bug. |
| 71 | W5D7 | **Reseed = throwaway demo scaffolding.** Decision 65 (no build-to-throwaway) applies to ENGINE/PRODUCT, not demo seed data. See Task 0. |
| 72 | W5D7 | **`conversation_done` is release-terminal not PIP-terminal** (carried). `kpi_status` enum: draft/pending_manager/pending_hr/approved/rejected/live/**archived** (= retire-state; 'withdrawn' is NOT valid). |
| 73 | W6D1 | **Integration-first onboarding** + delta report + integration-sourced ongoing actuals. Never seed per-client. (§16) |
| 74 | W6D1 | **Measurement methodology = first-class concept**; KPI pattern taxonomy (§17, TRD §4). |
| 75 | W6D1 | **Natural-units display is permanent** for achievement/currency KPIs ("85 of 100 clients", "₹450K of ₹500K"). |
| 76 | W6D1 | **Ship Kinalys-owned employee pulse survey** (editable text, fixed scale/methodology) rather than ingest arbitrary client surveys. (§16.7) |
| 77 | W6D1 | **Population band structure** (org-standard): High 90+, Medium 75–89, NI <75. Per-KPI jitter (bell-distributed) so no two KPIs identical. (demo-only mechanism; bands concept is real) |
| 78 | W6D1 | **16 VERIDIAN BSC templates corrected** to real scales/thresholds (TRD §4 table). **DONE (W6D2): promoted to SYSTEM master catalog** (tenant_id NULL), 216 assignments re-pointed, VERIDIAN duplicates removed, `unit`+`direction` columns added. |
| 79 | W6D1 | **TASK 0 (§0) — strip all temporary demo fixes — is non-negotiable and runs first post-demo.** |
| 80 | W6D2 | **DemoSwitcher / `X-Demo-User-Id` / DEMO_PERSONAS / reseed = demo-instance-only.** Production/staging has NONE of it. Persona "view-as" is NOT a client feature (privilege/privacy boundary — clients never impersonate their users). Lives only in the Kinalys-controlled demo instance for investor/client demos. Post-demo: build/deploy separation via `DEMO_MODE` env flag (default false; the **production server ignores `X-Demo-User-Id`** for defense-in-depth, so the demo auth bypass physically cannot work against prod). |
| 81 | W6D2 | **User Avatar System (production feature).** Every user profile carries an avatar: (a) uploaded profile picture, (b) themed initials-avatar fallback (active-theme colors) when none. Renders everywhere users appear (scorecards, team/org/exec views, 1-on-1s). Replaces all decorative/hardcoded emoji. No random emoji. |
| 82 | W6D2 | **Performance band thresholds are org-admin-configurable tenant settings, read by EVERY scoring view** (employee → manager → VP/Director → CEO/exec). No hardcoded thresholds in any view. **Configurable per department/function** (Sales, Support/COPC, IT/Six Sigma) — a Sales "High" threshold may differ from a Support "High" because KPI profiles differ. Org setup allows org-wide defaults + per-department overrides. Enforces "one source" for bands; prevents drift (the 80-vs-75 exec-dashboard mismatch found W6D2). Demo uses hardcoded 90/75 uniformly (now consistent across all views). |
| 83 | W6D2 | **Org/exec performance views are scoped to ACTIVE employees** (`employment_status IN ('active','probation','on_leave') AND deleted_at IS NULL`). Departed employees retain historical records but are excluded from current-cycle org distributions. Exec dashboard, manager rollups, and the reseed distribution assertion all use this scope. Demo active distribution: **5 High / 27 Medium / 7 NI (39 active scored)** + 2 departed (Suresh Iyer, Lakshmi Nair) excluded + 3 unscored admins = 44 total personas. |

## 15.3 Standing Rules — ADDITIONS
| **Rule** | **Summary** |
| --- | --- |
| Rule 37 | One scoring path. Writer and any seeder both call `scoreKpi`. Never inline a second scoring implementation. |
| Rule 38 | Coerce pg numerics. Any value from a numeric/decimal column is a STRING in JS — `Number()` before arithmetic. |
| Rule 39 | Demo artifacts are tagged + listed in §0 the moment they're created, so Task 0 strip is complete and auditable. |
| Rule 40 | Confirm fix is on disk (Select-String) before running; a stale-file run has bitten us. tsx `--no-cache`. |
| Rule 41 | **Bands have one source.** Never hardcode High/Medium/NI cutoffs (or RAG green/amber) in a view. All views resolve bands from the configured tenant (per-dept) setting. Demo's hardcoded 90/75 must be identical everywhere until then. |
| Rule 42 | **Active-scope for org views.** Org/exec/manager distributions count `employment_status IN ('active','probation','on_leave') AND deleted_at IS NULL`. Departed are excluded from current distributions (history retained). Assertions use the same scope as the product. |
| Rule 43 | **Seed variation needs strong, explicit seeds.** A weak rolling hash barely moves when only a trailing char changes — appending `|Q3` to a key collapsed three cycles to identical values. Pass discriminators (cycle, etc.) as explicit params and mix them with real weight; verify cross-dimension variation in the data, not just the code. |

