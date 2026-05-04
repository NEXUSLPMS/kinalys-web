# KINALYS — Master Context File v2.0
# Last updated: 1 May 2026 — End of Sprint 8 Day 1
# For use at the start of every new Claude session

---

## PROJECT IDENTITY

**Product:** Kinalys — Kinetic Analysis
**Type:** Unified LMS + PMS + Talent Management SaaS
**Company:** Indyaah Techbytes Private Limited, Pune, Maharashtra, India
**Founders:** Sanmeet Sahni (CEO) + Chaitali Wayakule (CPO)
**GitHub:** github.com/NEXUSLPMS/kinalys-platform (API) + github.com/NEXUSLPMS/kinalys-web (Frontend)
**Demo Date:** 21 May 2026 — Investor + First Client (BPO/Contact Centre)

---

## DEMO NARRATIVE (8 minutes)

1. HRIS sync — 9 providers, nightly 2AM
2. KPI workflow — 50+ standard KPIs, approval chain
3. Live scorecard — RAG, real data
4. LMS-PMS Bridge — enroll → complete → score moves live
5. 1-on-1 — 7 sections, sign-off
6. AI Coach — live Claude response
7. 9-Box — objective placement
8. Exec Dashboard — filters, drill-down
9. COPC Scoring — three-tier methodology
10. Six Sigma — DPMO calculator

---

## STARTUP COMMANDS

```powershell
Start-Service postgresql-x64-18
cd C:\Users\sssan\Documents\projects\kinalys-platform\apps\api
npx tsx --no-cache src\index.ts

cd C:\Users\sssan\Documents\kinalys-web
npm start
```

**CRITICAL RULES:**
- Always use `--no-cache` on server start
- Always restart server after ANY backend change
- Always use `[System.IO.File]::WriteAllText` with `[System.Text.Encoding]::UTF8` for file writes (preserves emojis)
- Never use PowerShell Set-Content for TypeScript files (breaks encoding)

---

## FILE LOCATIONS

| What | Path |
|---|---|
| Monorepo root | C:\Users\sssan\Documents\projects\kinalys-platform |
| API entry | apps\api\src\index.ts |
| API routes | apps\api\src\routes\ |
| Web app root | C:\Users\sssan\Documents\kinalys-web |
| Web pages | src\pages\ |
| API client | src\api\client.ts |
| Main app | src\App.tsx |

**Route files:**
tenants, users, org, settings, import, hris, bsc, okr, talent, kpi, support, scorecard, ai, oneonone, copc, lms

**Page files:**
AccountSettings, Organisation, ImportUsers, BalancedScorecard, OKR, TalentGrid, UserManagement, KpiTemplates, KnowledgeBase, SupportTickets, Scorecard, AICoaching, OneOnOne, COPCScorecard, SixSigma, MyLearning, CourseCatalog, Certifications, ExecDashboard

---

## DATABASE

**Connection:** postgresql://postgres:Kinalys2026@127.0.0.1:5432/kinalys

**Key tenant:** Veridian Solutions
**Tenant ID:** 108810fc-5c75-4c08-ab68-1e6ffd0555b0

**Key user:** Sanmeet Sahni
- Email: sanmeet.sahni@kinalys.io
- Auth0: auth0|69ea48a2b060f6c2aea7a435
- Role: hr_admin

**Review cycle:** Q2 2026
- Cycle ID: a195fa2a-c822-4d2a-939f-942f78c62974
- Start date: CURRENT_DATE - 3 days (Day 4 of cycle, proposal window open)
- Proposal cutoff: Day 7

**All tables (31):**
tenants, tenant_settings, users, departments, designations, audit_log,
hris_sync_jobs, import_jobs, import_rows,
review_cycles, bsc_perspectives, bsc_metrics,
okr_objectives, okr_key_results, okr_dependencies,
scorecards, scorecard_kpi_scores,
talent_grid_assessments, talent_grid_snapshots,
kpi_templates, kpi_assignments, kpi_approvals,
one_on_one_sessions, one_on_one_section_templates, one_on_one_entries, one_on_one_action_items,
support_tickets, support_attachments,
kb_categories, kb_articles,
lms_courses, lms_enrollments, lms_certifications

**Key schema notes:**
- kpi_templates.tenant_id is NULLABLE — system defaults have NULL
- kpi_templates.methodology: 'universal' | 'copc' | 'six_sigma' (column added Sprint 8)
- kpi_assignments has NO rag_green_threshold — thresholds are on kpi_templates
- one_on_one_entries columns: section_name, manager_rating (section_rating enum), manager_notes, employee_comments, is_manager_only
- section_rating enum: needs_attention, on_track, exceeding
- rag_status enum: green, amber, red (must cast as ::rag_status in SQL)

---

## AUTH0

- Domain: dev-zb6uoyfyk6iqoje2.us.auth0.com
- Web SPA Client ID: 2stbY7BtSqe2ml7Df5Kb6ciPTD7sot8J
- API Identifier: https://api.kinalys.io | RS256
- AI model: claude-sonnet-4-5 (NOT claude-sonnet-4-20250514)

---

## TECH STACK

Node.js 24 + TypeScript | Fastify | PostgreSQL 18 | Auth0 RS256 JWT
React 18 + CRA | Custom CSS (k- prefix variables) | Axios | xlsx
@anthropic-ai/sdk | dotenvx

---

## SPRINT STATUS

### Sprints 0-7 ✅ COMPLETE
Full platform: Auth, HRIS (9 providers), KPI workflow, Scorecards, BSC, OKR, 9-Box, 1-on-1, AI Coaching, Knowledge Base, Support Tickets, 7 themes

### Sprint 8 🔄 IN PROGRESS (started 1 May 2026)

**Completed today (1 May):**
- ✅ Employee KPI Proposal UI — proposal window banner, mandatory reason, submit to manager
- ✅ COPC Scoring Engine — three-tier (Excellent/Satisfactory/Unsatisfactory), COPC Index
- ✅ COPC Team Overview
- ✅ Six Sigma DPMO Calculator — sigma level, process yield, industry benchmarks, history
- ✅ LMS DB tables — lms_courses, lms_enrollments, lms_certifications
- ✅ 12 courses seeded across 8 categories (emojis fixed via /lms/fix-emojis)
- ✅ Course Catalog — search, filter, enroll
- ✅ My Learning — progress tracking, filter tabs, progress buttons (DEMO ONLY)
- ✅ Certifications — certificate number, issued date, card display
- ✅ LMS-PMS Bridge — course completion updates Learning Hours KPI automatically
- ✅ Exec Dashboard — 7 filters, drill-down to individual KPIs, pending KPIs visible
- ✅ Home dashboard — real data (score, learning hours, pending KPIs, certifications)
- ✅ COPC KPI templates — 16 COPC KPIs seeded with full methodology tagging
- ✅ Six Sigma KPI templates — 11 Six Sigma KPIs seeded
- ✅ methodology column added to kpi_templates
- ✅ KPI Templates page — COPC/Six Sigma shown in separate coloured sections
- ✅ Methodology filter on KPI Templates page
- ✅ Demo data seeded — all employees have KPI actuals, RAG status, learning enrollments

**Remaining Sprint 8 (2-7 May):**
- [ ] LMS course content viewer — slide-based player for COPC Fundamentals (2 May)
- [ ] Competency Framework — DB tables, seed all 4 frameworks, basic UI (3-4 May)
- [ ] Assessment/Quiz engine stub — 5-question quiz at end of COPC Fundamentals (4 May)
- [ ] Billing infrastructure stub — Razorpay ready tables + UI skeleton (5 May)

---

## SPRINT 9 PLAN (8-21 May)

| Dates | Focus |
|---|---|
| 8-10 May | AWS EC2 deployment — Ubuntu 24, nginx, PM2, SSL, demo.kinalys.io |
| 11-13 May | Mobile responsive fixes, PKT engine foundation, question bank |
| 14-17 May | Full demo rehearsal, bug fixes, data polish |
| 18-19 May | Code freeze, final data reset, dress rehearsal |
| 20 May | Rest |
| 21 May | DEMO |

---

## AWS DEPLOYMENT PLAN (8-10 May)

**Architecture:**
- EC2 t3.medium — Ubuntu 24
- Elastic IP — static
- Security groups: ports 80, 443, 22
- Domain: demo.kinalys.io or app.kinalys.io
- SSL: Let's Encrypt (free)
- Process manager: PM2
- Reverse proxy: nginx
- DB: PostgreSQL on same EC2 (demo only)

**Goal:** Any device on any network can access the demo via browser

---

## LOCKED PRODUCT DECISIONS

### KPI Option A (LOCKED)
- Designation-specific KPIs → only those apply, universal excluded
- No designation-specific KPIs → universal "All Roles" KPIs apply

### KPI Cycle Timeline (LOCKED)
Day 1 open → Day 7 proposal cutoff → Day 9 manager deadline → Day 12 HR deadline → Day 13+ live

### 1-on-1 Rules (LOCKED)
- 7 sections: Performance & Deliverables, Teamwork & Collaboration, Efficiency & Productivity, Learning & Development, Wellbeing & Engagement, Goals for Next Period, Manager Notes (private)
- Ratings: Needs Attention / On Track / Exceeding
- Mandatory before sign-off: Goals for Next Period (comments), Manager Notes (comments), Needs Attention (reason required)
- Both parties sign off digitally

### COPC Scoring (LOCKED)
- Three tiers: Excellent (≥target), Satisfactory (≥80% of target), Unsatisfactory (<80%)
- COPC Index = weighted average of all measured KPIs
- Lower-is-better KPIs: AHT, Transfer Rate, Abandon Rate, Agent Attrition Rate

### LMS Progress (LOCKED — DEMO ONLY)
- 25%/50%/75%/Complete buttons are DEMO ONLY
- Production: SCORM events, video completion (90%), assessment pass, manager manual
- Remove buttons before production launch

### Billing (LOCKED)
- India launch: Razorpay (UPI, cards, net banking, EMI)
- International: Stripe (deferred)
- Tiers: LMS-Only $399/mo, PMS-Only $399/mo, Unified $649/mo
- Razorpay Subscriptions for recurring billing

### Competency Framework (LOCKED)
- Four frameworks: SHRM, Lominger 67, COPC, Custom
- Client selects during onboarding in Organisation settings
- Custom: upload via Kinalys Excel template OR Sanmeet's generic framework as default starter (document to be shared)
- Three levels: Core (all), Leadership (managers+), Functional (role-specific)
- Five proficiency levels: 1-Awareness, 2-Basic, 3-Proficient, 4-Advanced, 5-Expert
- Competency score weight in overall performance: configurable, default 20%
- Build sequence: DB + seed + basic UI before demo, full integration Sprint 9/10

### Assessment & PKT Engine (Sprint 9)
- Question bank: client creates/maintains own questions
- Question types: MCQ single, MCQ multiple, True/False, Short answer
- Questions tagged by: Topic, Course, Difficulty, Department
- PKT: HR/Manager creates test, selects criteria, platform randomises questions
- Each agent gets different random set (prevents answer sharing)
- Scheduled: Daily, Weekly, Ad-hoc
- LMS-PMS: PKT pass → learning hours credited, consistent failure → AI Coach flags → 1-on-1 recommended
- For demo: 5-question quiz stub at end of COPC Fundamentals

### HRIS Integrations (LOCKED — 9 providers)
Darwinbox, BambooHR, ZOHO People, Workday, Keka, GreytHR, Bayzat (UAE), ADP, SAP SuccessFactors
Nightly sync 2:00 AM IST

---

## KPI TEMPLATE LIBRARY SUMMARY

| Methodology | Count | Notes |
|---|---|---|
| Universal | 44 | Designation-specific, applied via Option A rule |
| COPC | 16 | Contact centre KPIs, apply when COPC methodology selected |
| Six Sigma | 11 | Process quality KPIs, apply when Six Sigma methodology selected |

**COPC KPIs cover 4 KRAs:**
1. Customer Satisfaction — CSAT, NPS, FCR, Accuracy rates
2. Service Level & Accessibility — Service Level, AHT, Abandon Rate, ASA
3. Operational Efficiency — Agent Utilisation, Cost per Transaction, Back Office TAT
4. People & Compliance — Attrition, Compliance Score, Training Completion

**Six Sigma KPIs cover 4 KRAs:**
1. Quality & Defects — DPMO, FPY, Defect Detection Rate
2. Efficiency & Time — Cycle Time, PCE
3. Cost — COPQ
4. Customer — Customer Complaints Rate, CSAT (shared with universal)

---

## LMS ARCHITECTURE

**Current (demo):**
- Course Catalog → Enroll → My Learning → Progress buttons → Complete → Certificate issued → Learning Hours KPI updated

**Production (Sprint 10):**
- SCORM 1.2/2004 player (evaluate Rustici SCORM Cloud $99/mo or open source)
- xAPI (Sprint 12)
- Video completion at 90% watched
- Assessment engine with question bank
- PKT scheduler with randomisation

**12 courses seeded:**
COPC Fundamentals (🏢), Understanding KPIs (📊), Customer Service Excellence (🎯),
Six Sigma Green Belt (⚙️), Data-Driven Decisions (📈), Effective 1-on-1s (🗣️),
OKR Implementation (🎯), Balanced Scorecard (⚖️), Workforce Management (👥),
Emotional Intelligence (💚), Quality Auditing for BPO (🔍), HR Analytics (📋)

**Note:** Fix Emojis button in CourseCatalog.tsx — remove before demo (use /lms/fix-emojis endpoint instead)

---

## KNOWN ISSUES / TECH DEBT

- Schedule Adherence duplicate in COPC templates (cannot delete — has kpi_assignments FK)
- auth.ts uses jwt.decode() without strict audience verification — fix before production
- Auth0 M2M client secret needs rotation
- Fix Emojis button in CourseCatalog.tsx — remove before demo
- index.ts sometimes reverts — always use --no-cache and WriteAllText

---

## PENDING ACTIONS

- [ ] Find and share generic competency framework document (Sanmeet)
- [ ] AWS EC2 setup (8-10 May)
- [ ] Deploy demo.kinalys.io
- [ ] Rotate Auth0 M2M client secret
- [ ] Send MSA to Pune lawyer
- [ ] Trademark: UAE, India, WIPO
- [ ] Submit YC application (Fall 2026)
- [ ] Consider migrating to Claude Code for future sessions

---

## HOW TO START A NEW SESSION

Paste this at the start of any new Claude chat or Claude Code session:

"I am building Kinalys, a unified LMS + PMS SaaS. Please read the attached context file KINALYS_CONTEXT_V2.md before we begin. We are currently in Sprint 8, building toward a demo on 21 May 2026. The servers are [running/not running]. Today we need to build [next item from Remaining Sprint 8 list]."


---

## DECISIONS LOCKED — 2 May 2026

### 9-Box Visibility (LOCKED)
Show axes only on employee dashboard — Performance Score (%) + "Potential: Manager Assessed"
Do NOT show box label (e.g. "Star", "Needs Improvement")
Build in Sprint 9

### User Roles — 8 Levels (LOCKED)
| Role | Code | Key Permissions |
|---|---|---|
| Super Admin | super_admin | Full system, billing, white-label config (Phase 2) |
| HR Admin | hr_admin | Users, departments, KPI setup, cycle management, extend windows |
| Executive/CXO | executive | All org data, set Org OKRs |
| Leadership (VP/Director/AVP) | leadership | All assigned verticals, set Business OKRs |
| Manager | manager | All assigned departments/teams, set Department OKRs |
| Assistant Manager | asst_manager | All assigned teams, set Team OKRs |
| Team Lead | team_lead | Their team only, set User OKRs |
| Employee | employee | Own data only, propose self KPIs and OKRs |

Current DB role enum needs: super_admin, leadership, asst_manager added
Current system has: hr_admin, executive, manager, team_lead, employee

### Early Adopter Offer (LOCKED)
- 12 months platform access on 10-month payment (17% effective discount)
- First 20 clients only — cap is firm
- Valid until 31 July 2026
- Frame as: Founding Client Program — never call it a discount
- Mention on demo call, not in outreach email (email has P.S. teaser only)

### Outreach Email Send Date (LOCKED)
- Send: 12 May 2026
- 3-email sequence (templates written in kinalys_outreach_email.md)
- Target: HR Heads / CHROs at BPO, ITeS, Contact Centres, IT Services
- Cities: Pune, Mumbai, Bengaluru, Hyderabad, Chennai, Delhi NCR

### Phase 1 Freeze (LOCKED)
Full scope in kinalys_phase1_freeze.md
Demo-ready: 21 May 2026
Production-ready: 30 June 2026

### LinkedIn Series (LOCKED)
6 posts over 5 weeks — see kinalys_linkedin_series.md
Post 1: Immediately (article ready)
Post 6 (product reveal): 19-20 May 2026

### Logo Brief (LOCKED)
Primary teal: #0D9488
Deep teal: #0F6E56
Brief in kinalys_logo_brief.md — send to designer this week

### Insurance Sector (LOCKED)
No architectural changes needed
Add IRDAI compliance training tracking to Phase 1.5
Add insurance KPI templates (Claims, Policy Renewal, Persistency) to library

### Operational Tool Integrations (LOCKED PRIORITY ORDER)
Tier 1 (Phase 1.5): NICE CXone, Genesys Cloud, Freshdesk, Zoho CRM, Jira
Tier 2 (Phase 2): Salesforce, ServiceNow, Microsoft Dynamics, Amazon Connect, Verint
Tier 3 (Phase 3): Oracle SCM, SAP EWM, Oracle OPERA, Practo

### Documents to Build (after demo)
PRD | Database Model | Addendums | One Page Site | HR Deck | Pitch Deck
All to include product development plan
Build after 21 May demo

### Pricing Add-Ons (LOCKED)
- Competency Intelligence: $499/year (SHRM, Lominger 67, COPC, Custom)
- PKT Engine: $199/month
- COPC Methodology Pack: $299/year
- Operational Integrations: $149/month per integration
- Pricing page redesign needed — include Competency Intelligence with "Coming Soon" note


---

## REAL-TIME KPI BREACH ALERTING — Phase 1.5 Feature (LOCKED)

### The Problem It Solves
Current Kinalys tracks KPI scores after the fact — end of cycle or when actuals are updated. This means a manager only sees a red KPI when it is already red. By then the damage is done — an SLA has been breached, a customer has been let down, a founder has been messaged on LinkedIn.

### The Feature
Real-time alerting when a KPI is trending toward a breach — before it breaches.

**How it works:**
- Each KPI assignment has a target, a green threshold, and an amber threshold
- When an actual value is updated and the score drops below a configurable warning threshold (e.g. 10% above the amber threshold), the system fires an alert
- Alert goes to: the employee (self-awareness), the team lead (immediate visibility), the manager (escalation path)
- Alert channels: in-platform notification, email, and eventually SMS/WhatsApp (Phase 2)
- Alert includes: KPI name, current value, target, threshold breached, recommended action (from AI Coach)

**Example scenario:**
Agent's FCR drops from 85% to 71% mid-cycle. Amber threshold is 70%. System fires alert to team lead: "Priya Sharma's FCR has dropped to 71% — approaching amber threshold of 70%. Recommended action: schedule 1-on-1 and review last 10 FCR failures."

Team lead sees it on Day 8 of the cycle, not Day 30.

**The result:**
Managers catch performance dips before they become customer complaints. Founders never need to be messaged on LinkedIn for a missing product refund.

### Business Value
- Unique differentiator — no mid-market HR platform in India offers real-time KPI breach alerting
- Directly addresses the #1 pain point for BPO and D2C operations: reactive vs proactive management
- Demo moment: show an alert firing in real time during the demo when a KPI actual is updated

### Demo Use Case (use in pitch)
"A customer received an incomplete order. They filed a complaint. 14 days later they had to message the founder on LinkedIn to get a refund. The founder spent 2 hours on a problem that should have been resolved in 20 minutes. Every system between the complaint and the resolution failed. This is not a people problem. It is an architecture problem. Kinalys makes it impossible for that alert to go unseen."

### Build Spec (Phase 1.5 — July 2026)
- DB: kpi_alert_rules table (tenant_id, kpi_name_pattern, warning_threshold_pct, alert_recipients, channels)
- DB: kpi_alerts table (tenant_id, kpi_assignment_id, user_id, alert_type, threshold_breached, fired_at, acknowledged_at)
- Backend: alert evaluation runs on every actual_value update in scorecard route
- Backend: alert delivery via email (Phase 1.5), WhatsApp Business API (Phase 2)
- Frontend: notification bell in topbar with unread count
- Frontend: Alert settings in Organisation settings — configure thresholds per KPI category
- Frontend: Alert history in Exec Dashboard

### Pricing
Included in Unified plan — not a separate add-on. This is a core differentiator, not an upsell.

