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


---

## PHASE 1.5 ADDITIONS (LOCKED)

### Multi-Framework Competency Support
Allow multiple competency frameworks per tenant mapped to specific departments or designations.

Architecture:
- tenant_competency_settings gets department_id and designation_id columns
- Remove unique constraint on tenant_id — replace with unique(tenant_id, department_id, designation_id)
- Priority order: designation-specific → department-specific → org default
- Settings UI becomes a framework mapping table (similar to KPI templates)

Example: BPO client uses Custom Framework org-wide, COPC for Customer Operations dept, Lominger for all Manager designations and above.

Demo talking point (say in demo without building): "You can also assign different frameworks to different departments — your CS team on COPC while your leadership tier is on Lominger."

Build: Phase 1.5 (July-September 2026)

### KPI Breach Alerting (already documented above)
Real-time alerts when KPI drops toward amber/red threshold before it breaches.
Build: Phase 1.5

---

## KINALYS MASTER CONTROL PANEL (Super Admin) — Phase 2 Feature (LOCKED)

### What it is
An internal control panel accessible only to the Kinalys team (Indyaah Techbytes staff) for managing all client tenants from a single interface. Completely separate from the client-facing platform.

### Access
- Separate login — not Auth0 client login
- Kinalys staff only — IP-restricted or VPN-gated
- Full audit trail of every action taken by Kinalys staff on client data
- Two-person approval for destructive actions (data deletion, plan changes)

### Core Capabilities

**Tenant Management**
- View all tenants — name, plan, status, created date, last active
- Activate / deactivate tenants
- View tenant settings without logging in as the client
- Impersonate a tenant (read-only view) for troubleshooting
- Reset tenant data (with two-person approval)

**Subscription and Add-On Management**
- Enable / disable add-ons per tenant: Competency Intelligence, PKT Engine, COPC Pack, Integrations
- Change plan tier: LMS Only / PMS Only / Unified
- Set custom pricing or discount overrides
- View billing status and payment history (Razorpay webhook data)
- Extend trial periods
- Apply founding client program terms

**Support and Troubleshooting**
- View support tickets across all tenants in one queue
- Assign tickets to Kinalys team members
- Read-only access to any tenant's audit log for debugging
- View API error logs per tenant
- Trigger manual HRIS sync for any tenant
- Reset user passwords (triggers Auth0 password reset email)
- View active sessions per tenant

**System Health**
- API health dashboard — uptime, error rates, response times
- Database metrics — table sizes, slow queries, connection pool
- Queue status — HRIS sync jobs, email alerts, scheduled tasks
- AWS infrastructure status

**Analytics (internal)**
- DAU/MAU per tenant
- Feature adoption — which modules are being used
- KPI proposal volumes, scorecard update frequency
- LMS completion rates across all tenants
- AI coaching usage per tenant (Anthropic API cost tracking)

### Architecture
- Separate Next.js application — admin.kinalys.io (internal only)
- Connects to same PostgreSQL DB with a super_admin role
- All actions logged to a separate kinalys_staff_audit_log table
- Never exposed to clients or the public internet

### Build: Phase 2 (October 2026+)
Priority within Phase 2: Build this first — needed before onboarding more than 10 clients simultaneously.


---

## KINALYS MARKETPLACE — Phase 1.5 Feature (LOCKED)

### Concept
A content marketplace embedded within the Kinalys LMS. Training providers upload their content, tag it to specific skills and KPIs, set their own price, and Kinalys adds a 15% platform commission. Clients browse, purchase, and the content automatically appears in their LMS — with skill tagging connecting course completion to KPI and competency scores via the LMS-PMS Bridge.

### Why This Is Strategically Important
- Solves the content gap — Kinalys ships with 12 courses, marketplace gives clients access to thousands
- Network effects — providers bring their client relationships, clients discover new providers
- Revenue diversification — transactional marketplace revenue on top of subscription ARR
- Stickiness — clients who build a content library on Kinalys do not leave
- Unique data story — Kinalys can measure whether performance actually improved after course completion. No other marketplace can do this.

### The Killer Feature — Skill-Tagged Performance Impact
When a provider tags their course to "First Contact Resolution" or "Call Taking Etiquette":
- Client buys the course
- Employee completes it
- LMS-PMS Bridge automatically updates the relevant KPI or competency score
- Manager sees the performance impact of the training investment in real time
- Client can prove ROI on every training purchase

No other marketplace — Udemy, Coursera, LinkedIn Learning — connects course completion to live performance data. Kinalys does.

### New User Role — content_provider
A separate login type for training providers. Not a tenant. Not an employee. A provider account with:
- Provider registration and verification by Kinalys team
- Content upload dashboard — SCORM, Tin Can (xAPI), video, PDF, assessment
- Course builder with title, description, skill tags, KPI tags, pricing
- Sales dashboard — units sold, revenue earned, payout status
- Payout via Razorpay bank transfer (after 15% Kinalys commission deduction)
- Content moderation queue — Kinalys reviews before publishing

### Client SCORM / Tin Can / xAPI Upload
Clients can upload their own existing training content:
- SCORM 1.2 and SCORM 2004
- Tin Can / xAPI
- Video (MP4)
- PDF
- Assessment (custom question bank)
Uploaded content appears in their private LMS catalog — not visible to other tenants. Free to upload, counts toward their LMS plan. Skill tagging and LMS-PMS Bridge apply to client-uploaded content too.

### DB Changes Required (Sprint 9)
- marketplace_providers table (id, name, email, verified, payout_details, created_at)
- marketplace_courses table (provider_id, title, description, price, commission_pct, skill_tags, kpi_tags, content_type, scorm_url, status)
- marketplace_purchases table (tenant_id, user_id, course_id, amount_paid, commission_earned, purchased_at)
- marketplace_payouts table (provider_id, amount, status, paid_at)
- lms_courses gets content_type column: scorm / tincan / xapi / video / pdf / assessment
- lms_courses gets scorm_package_url column for uploaded packages
- lms_courses gets is_marketplace BOOLEAN and provider_id FK

### Pricing and Commission
- Training providers set their own price (minimum $10 per course)
- Kinalys takes 15% commission on every sale
- Monthly payout to providers via Razorpay
- Client-uploaded content: free (included in LMS plan)
- Marketplace content: pay-per-course or bundle pricing

### Provider Recruitment Strategy
Before Sprint 9 build starts — recruit 10-15 founding providers from Sanmeet's personal network:
- COPC consultants and trainers (Pune, Mumbai, Bengaluru)
- Soft skills and communication training firms
- Six Sigma and quality management trainers
- Compliance and regulatory training providers
- Contact centre operations specialists
Offer founding providers: zero commission for first 6 months, featured placement, input on marketplace features.

### Tax and Legal Notes
- GST applies on marketplace commission income — consult CA before go-live
- TDS obligations on provider payouts — structure through Razorpay
- Provider agreement required — terms of service, content standards, IP ownership declaration
- Content moderation policy required — quality standards, prohibited content

### Build: Sprint 9 — Phase 1.5 (August-September 2026)
Dependencies: SCORM player (Sprint 9), Razorpay live billing (Sprint 9), provider onboarding infrastructure

### Demo Talking Point (use from June demo onwards)
"Beyond the platform, we are building a marketplace where training providers can upload COPC-certified content, soft skills modules, compliance training — tag it to a specific skill or KPI — and Kinalys connects the purchase directly to performance improvement. You will be able to prove, for the first time, that your training budget moved the needle."


---

## PRICING MODEL v2 — LOCKED (Updated May 2026)

### Subscription Tiers

| Plan | Users | LMS Only | PMS Only | Unified |
|---|---|---|---|---|
| Hatchling | Up to 50 | $149/mo | $149/mo | $249/mo |
| Starter | Up to 100 | $299/mo | $299/mo | $499/mo |
| Growth | Up to 200 | $499/mo | $499/mo | $799/mo |
| Scale | Up to 300 | $699/mo | $699/mo | $1,099/mo |
| Enterprise | 700+ | Custom | Custom | Custom |

**Overage:** $3 per user per month above tier limit
**Hatchling restriction:** No custom HRIS integrations — standard 9 connectors only

### Upgrade Sweet Spot Logic (LOCKED)
- Alert at 80% of plan user limit → notify org admin + Kinalys team
- Alert when overage kicks in → show cost vs next plan
- Alert when overage cost exceeds next plan price difference → "You are paying more in overage than the next plan costs"

### Add-Ons (unchanged)
- Competency Intelligence: $499/year
- PKT Engine: $199/month
- COPC Pack: $299/year
- Integrations: $149/month each
- Marketplace: 15% commission

### Founding Client Program (updated)
Lock in Starter pricing regardless of growth tier, for 24 months. First 20 clients only. Valid until 31 July 2026.

### Auto-Upgrade Alert System (Phase 1.5 — Sprint 9)
**Trigger 1:** Organisation reaches 80% of plan user limit → alert fires to org admin (in-app + email) + internal Kinalys alert
**Trigger 2:** Organisation exceeds plan limit → overage alert with cost comparison to next plan
**Trigger 3:** Overage cost exceeds next plan price difference → automatic upgrade recommendation with savings calculation
**Kinalys Master Control Panel (Phase 2):** Dashboard showing all orgs approaching thresholds, colour coded green/amber/red, one-click upgrade nudge, MRR impact projection


---

## FINAL PRE-DEMO 30-DAY PLAN (Locked — May 2026)

### Build Phase — 15 Days (Days 1-15)

| Priority | Feature | Time |
|---|---|---|
| 1 | PKT Engine — question bank, randomised test, score to scorecard | 2 days |
| 2 | COPC Report View — E/S/U classification, COPC Index, trend | 1 day |
| 3 | Six Sigma Report View — DPMO, sigma level, yield, benchmarks | 1 day |
| 4 | Demo User Switching — HR Admin / Manager / Employee without logout | 1 day |
| 5 | Onboarding Wizard + methodology selector per department | 1.5 days |
| 6 | Unified Exec Dashboard with methodology filter | 1 day |
| 7 | AI Coach Polish — structured 3-part response | half day |
| 8 | Manager Breach Alerts — bell fires for manager too | half day |
| 9 | Seed Demo Data — curated perfect demo state | half day |
| 10 | AWS EC2 Deployment — demo.kinalys.io, RDS, SSL, nginx, PM2 | 2 days |
| 11 | Demo Rehearsal Script — written 8-minute narrative | half day |
| 12 | LinkedIn Posts 3-5 | 1 day |

### Business Development Phase — 15 Days (Days 16-30)

**Days 16-18 — Client Acquisition Push**
- Send outreach email sequence to warm list of HR Heads and CHROs
- Personal WhatsApp to 10 direct contacts in BPO and ITeS
- Follow up on all May outreach responses
- Target: 3 demo calls booked with real prospects
- One signed founding client before demo day changes the investor conversation

**Days 19-21 — Marketplace Provider Recruitment**
- Identify 10 COPC consultants, soft skills trainers, compliance providers in Pune/Mumbai/Bengaluru
- Personal outreach — WhatsApp or phone, not email
- Pitch: Zero commission 6 months, featured placement, access to all BPO clients
- Target: 5 verbal commitments before demo day
- Investor answer ready: "We have X providers committed to marketplace at launch"

**Days 22-24 — Demo Hardening**
- Three full end-to-end demo runs as if investor is watching
- Fix every rough moment, slow transition, or confusing click
- Test on different device and different network
- Prepare answers to 10 hardest investor questions
- Seed perfect demo data — every number tells a story

**Days 25-26 — LinkedIn Posts 3-5 + Post 6 Reveal**
- Post 3: The cost of the invisible manager — 1-on-1s that never happen
- Post 4: Why your best performers leave before you notice — the 9-Box story
- Post 5: The training ROI question nobody can answer — yet
- Post 6: The reveal — Kinalys, what it is, what it does, book a demo

**Days 27-28 — Investor Preparation**
- Update pitch deck with traction from outreach
- Prepare one-page term sheet summary
- Prepare answers: Why now? Why you? Why this market? What if competitor copies?
- Prepare data room: company docs, IP assignment, financials, cap table

**Days 29-30 — Rest**
- Day 29: Full rest. No laptop.
- Day 30: Light demo script review. One slow walkthrough. Early night.
- Demo day: Walk in as the founder who built a full platform in 5 months with IP protected, investor documents ready, and real client conversations in progress.

### The One Thing That Matters Most
Get one client on a call. Not necessarily signed — just on a call. "I have three demos booked with CHROs at BPO companies this week" is worth more than any feature built.

### Demo Day Talking Points — Methodology Integration
- "In three clicks, your CS team is on COPC, your ops team is on Six Sigma, and your product team is on OKR. No configuration, no consultant, no implementation fee."
- "Your quality manager currently builds the COPC report manually in Excel every month. Kinalys generates it live."
- "Your CEO sees one dashboard. CS in COPC. Operations in Six Sigma. Product in OKR. One platform, all frameworks, zero manual consolidation."
- "Beyond the platform, we are building a marketplace where training providers upload COPC-certified content tagged to a KPI — and Kinalys proves whether performance improved after completion."


---

## PRICING — CURRENCY STRATEGY (Locked)

### Display Strategy
- **India clients:** INR primary, USD secondary
- **UAE / International clients:** EUR primary, USD secondary  
- **Investor pitch deck:** USD only (investor convention)
- **Billing:** Razorpay for INR domestic, Stripe for USD/EUR international

### INR Pricing (India — primary market)

| Plan | Users | LMS Only | PMS Only | Unified |
|---|---|---|---|---|
| Hatchling | Up to 50 | ₹12,499/mo | ₹12,499/mo | ₹20,999/mo |
| Starter | Up to 100 | ₹24,999/mo | ₹24,999/mo | ₹41,999/mo |
| Growth | Up to 200 | ₹41,999/mo | ₹41,999/mo | ₹66,999/mo |
| Scale | Up to 300 | ₹58,999/mo | ₹58,999/mo | ₹92,999/mo |
| Enterprise | 700+ | Custom | Custom | Custom |

**Overage:** ₹250 per user per month

### EUR Pricing (UAE / International)

| Plan | Users | LMS Only | PMS Only | Unified |
|---|---|---|---|---|
| Hatchling | Up to 50 | €139/mo | €139/mo | €229/mo |
| Starter | Up to 100 | €279/mo | €279/mo | €459/mo |
| Growth | Up to 200 | €459/mo | €459/mo | €735/mo |
| Scale | Up to 300 | €649/mo | €649/mo | €1,015/mo |
| Enterprise | 700+ | Custom | Custom | Custom |

**Overage:** €2.75 per user per month

### USD Pricing (Investor deck / US reference)

| Plan | Users | LMS Only | PMS Only | Unified |
|---|---|---|---|---|
| Hatchling | Up to 50 | $149/mo | $149/mo | $249/mo |
| Starter | Up to 100 | $299/mo | $299/mo | $499/mo |
| Growth | Up to 200 | $499/mo | $499/mo | $799/mo |
| Scale | Up to 300 | $699/mo | $699/mo | $1,099/mo |
| Enterprise | 700+ | Custom | Custom | Custom |

**Overage:** $3 per user per month

### Add-Ons — INR
- Competency Intelligence: ₹41,999/year
- PKT Engine: ₹16,999/month
- COPC Pack: ₹24,999/year
- Integrations: ₹12,499/month each
- Marketplace: 15% commission

### Founding Client Program
Lock in Starter pricing for 24 months regardless of growth tier.
First 20 clients only. Valid until 31 July 2026.
INR: ₹41,999/mo Unified locked for 24 months
USD: $499/mo Unified locked for 24 months


---

## PRICING — MULTI-CURRENCY (Locked May 2026)

### Exchange Rates Used
- 1 USD = ₹95.85 INR
- 1 USD = €0.92 EUR (1 EUR ≈ $1.08)

### Unified Plan Pricing — All Currencies

| Plan | Users | USD/mo | INR/mo | EUR/mo |
|---|---|---|---|---|
| Hatchling | Up to 50 | $249 | ₹23,999 | €229 |
| Starter | Up to 100 | $499 | ₹47,999 | €459 |
| Growth | Up to 200 | $799 | ₹76,999 | €739 |
| Scale | Up to 300 | $1,099 | ₹1,04,999 | €1,019 |
| Enterprise | 700+ | Custom | Custom | Custom |

### Overage
- USD: $3/user/month
- INR: ₹299/user/month
- EUR: €2.75/user/month

### Currency Display Rules
- Pitch deck: USD only (investor convention)
- HR deck India: INR primary, USD secondary
- HR deck UAE/International: EUR primary, USD secondary
- Website pricing page: INR primary with USD/EUR toggle
- Razorpay billing: INR for Indian clients
- Stripe: USD/EUR for international clients

