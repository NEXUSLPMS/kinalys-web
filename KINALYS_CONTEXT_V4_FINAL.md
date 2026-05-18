# KINALYS — CONTEXT FILE V4
# Last updated: 18 May 2026 — Sprint 10 Complete
# Next session: 19 May 2026 — Superman loading animation + Sprint 11 start

---

## PROJECT OVERVIEW
**Product:** Kinalys (Kinetic Analysis) — Performance Management SaaS
**Company:** Indyaah Techbytes Private Limited, Pune, India
**Founders:** Sanmeet Sahni (CEO) + Chaitali Wayakule (CPO)
**GitHub:** github.com/NEXUSLPMS/kinalys-platform (API) + github.com/NEXUSLPMS/kinalys-web (Frontend)
**Mentor Meeting:** Thursday 21 May 2026 — READY
**Investor Demo:** 30 June 2026 — confirmed, live demo on local
**Pre-Seed Ask:** USD 500,000

---

## STARTUP COMMANDS
```powershell
Start-Service postgresql-x64-18
cd C:\Users\sssan\Documents\projects\kinalys-platform\apps\api
npx tsx --no-cache src\index.ts

cd C:\Users\sssan\Documents\kinalys-web
npm start
```
**CRITICAL:** Always use `--no-cache`. Use `[System.IO.File]::WriteAllText` with `New-Object System.Text.UTF8Encoding $false` (no BOM). Backticks in PowerShell strings get stripped — always edit TypeScript files with backtick template literals in VS Code directly.

---

## DATABASE
**Connection:** postgresql://postgres:Kinalys2026@127.0.0.1:5432/kinalys
**Key tenant:** Veridian Solutions: `108810fc-5c75-4c08-ab68-1e6ffd0555b0`

### Review Cycles
| ID | Name | Status | is_current |
|---|---|---|---|
| 0705466e-0ec5-4530-b11f-4a39c86613b5 | Q1 2026 | closed | false |
| 28422b1f-3c3b-48c1-ae91-cfa668127cec | Q2 2026 | active | true |

### Departments
| ID | Name |
|---|---|
| bed479bd-3e3a-4665-8841-ae7073fdc3d5 | Customer Operations |
| ea5ad20d-433b-4514-b6fb-f3cfa9d486d5 | Finance & Accounting |
| eae4ac9b-482e-4efb-9db9-6b66591c64fc | Human Resources |
| d2f9d0cc-bfa5-4507-9db5-2533537d629d | Information Technology |
| c67edf30-9e92-45d1-9804-27cb05427f90 | Quality Assurance |
| 7647d3f9-ccfe-4051-b8d8-0c1cf2c3f7ef | Technical Support |
| 2937c1df-7674-4a02-9886-ba6c69edb9ae | Sales & Business Development |
| bf25cb68-bbe8-4f04-91bf-33275866bf0b | Leadership & Strategy |

---

## DEMO ORG — VERIDIAN SOLUTIONS (33 users)

### Full Persona List
| ID | Name | Role | Designation | Dept | Auth0 Sub |
|---|---|---|---|---|---|
| 69797e41 | Neha Joshi | super_admin | Org Admin | Leadership | auth0\|demo_orgadmin_neha |
| dc16d342 | Sanmeet Sahni | hr_admin | Operations Manager | Leadership | auth0\|69ea48a2b060f6c2aea7a435 |
| 1de83431 | Deepa Nair | executive | Chief Executive Officer | Leadership | auth0\|demo_cxo_deepa |
| 6269c1af | Vikram Singh | leadership | Vice President | IT | auth0\|demo_vp_vikram |
| 5501f29a | Rajesh Kumar | manager | Operations Manager | Cust Ops | auth0\|demo_manager_rajesh |
| cbc7594d | Suresh Nair | manager | IT Manager | IT | auth0\|demo_itmanager_suresh |
| 7b9cede9 | Kavya Reddy | manager | Sales Manager | Sales | auth0\|demo_salesmanager_kavya |
| d63c43f5 | Karthik Rajan | manager | Technical Support Manager | Tech Support | auth0\|demo_techsupport_manager |
| a6e2912a | Prakash Shetty | manager | Finance Manager | Finance | auth0\|demo_finance_manager |
| 96b41561 | Arjun Menon | team_lead | Team Lead | Cust Ops | auth0\|demo_teamlead_arjun |
| a2443fd5 | Priya Sharma | individual_contributor | Customer Service Agent | Cust Ops | auth0\|69f05789610c3913468fc371 |
| 5a89cd93 | Mariam Al Hashimi | individual_contributor | Customer Service Agent | Cust Ops | auth0\|69f24c88f167ff1f486db83a |
| 93d72504 | Rajan Pillai | individual_contributor | Customer Service Agent | Cust Ops | auth0\|69f1f6a6454dc896bb79d664 |
| 61096727 | Vikram Nair | individual_contributor | Customer Service Agent | Cust Ops | auth0\|69f0578b5d004ce305af17a9 |
| bb51b6fa | Ahmed Al Mansouri | individual_contributor | Customer Service Agent | Cust Ops | auth0\|69f24c87f167ff1f486db837 |
| c0befc25 | Omar Al Rashid | individual_contributor | Customer Service Agent | Cust Ops | auth0\|69f24c88f167ff1f486db839 |
| 069a0fa6 | Nisha Pillai | individual_contributor | Technical Support Agent | Tech Support | auth0\|demo_techsupport_exec1 |
| 6b559984 | Rohan Verma | individual_contributor | Technical Support Agent | Tech Support | auth0\|demo_techsupport_exec2 |
| ee811f7a | Rahul Mehta | individual_contributor | Technical Support Agent | IT | auth0\|69f05789df93bae8c588e60b |
| 81918669 | Vishal Mehta | individual_contributor | IT Engineer | IT | auth0\|demo_vishal_mehta |
| fe858eb0 | Suresh Iyer | individual_contributor | IT Engineer | IT | auth0\|demo_suresh_iyer |
| 3187dd6c | Anita Desai | individual_contributor | QA Analyst | IT | auth0\|69f0578b5d004ce305af17a8 |
| 16fad8c6 | Khalid Al Neyadi | individual_contributor | QA Executive | Quality | auth0\|69f24c8983cf2519894102a3 |
| 6a1dada9 | Pooja Iyer | individual_contributor | HR Executive | HR | auth0\|demo_hrexec_pooja |
| 0a663770 | Amit Shah | individual_contributor | HR Executive | HR | auth0\|demo_hrexec_amit |
| f500b1ef | Sneha Sharma | individual_contributor | HR Executive | HR | auth0\|69f1f6a644de395ba3e713e3 |
| 04306f70 | John Smith | hr_admin | HR Admin | HR | auth0\|69ef9ea7610c3913468f387f |
| 712c9b7d | Aryan Kapoor | individual_contributor | Sales Executive | Sales | auth0\|demo_salesexec_aryan |
| 1f08aa68 | Divya Menon | individual_contributor | Sales Executive | Sales | auth0\|demo_salesexec_divya |
| cfef3b05 | Fatima Al Zaabi | individual_contributor | Sales Executive | Sales | auth0\|69f24c873b60e77dd9275f37 |
| 01f6c19a | Lakshmi Nair | individual_contributor | Sales Executive | Sales | auth0\|69f1f6a544de395ba3e713e1 |
| a4d3410c | Meera Pillai | individual_contributor | Sales Executive | Sales | auth0\|69f0578c5d004ce305af17ac |
| 996cf7e8 | Tanvi Joshi | individual_contributor | Finance Analyst | Finance | auth0\|demo_finance_exec1 |

### Demo Switcher Personas (featured in DemoSwitcher.tsx)
Leadership: Neha Joshi, Sanmeet Sahni, Deepa Nair, Vikram Singh
Management: Rajesh Kumar, Suresh Nair, Kavya Reddy, Arjun Menon
Employees: Priya Sharma, Mariam Al Hashimi, Rahul Mehta, Vishal Mehta, Suresh Iyer, Pooja Iyer, Aryan Kapoor

---

## DEMO SWITCHER
- localStorage key: `kinalys_demo_user_id` — stores user ID
- Axios interceptor sends `X-Demo-User-Id` header
- `auth.ts` swaps auth0_sub when `DEMO_MODE=true` in root `.env`
- Location: `C:\Users\sssan\Documents\kinalys-web\src\components\DemoSwitcher.tsx`
- Switching reloads the page

---

## SPRINT 10 — COMPLETED TODAY ✅

### Role-Based Nav Visibility
- `canSee(feature)` function in App.tsx
- Platform section: super_admin only — HR Admin Management, Audit Log, Add-on Management, Org Setup
- Management section: hr_admin/super_admin — Org, Import, BSC, OKR, Talent, Users, KPI Templates, Flags Inbox
- Performance section: role-gated — Exec Dashboard (leadership+), Predictive (manager+), all others (all roles)
- Welcome message shows correct role label per persona

### HR Admin Governance
- Max 2 active HR Admins — enforced at API level
- Only super_admin can assign/remove hr_admin role
- Page: `src/pages/HrAdminManagement.tsx`
- Route: `GET /users/hr-admins`

### Predictive Performance Analysis
- Routes: `GET /predictive/team`, `GET /predictive/me`
- File: `apps/api/src/routes/predictive.ts`
- Frontend: `src/pages/PredictiveAnalysis.tsx`
- Department filter + trend filter (ALL/IMPROVING/DECLINING/ALERT)
- Summary cards update with active filter
- Employee drill-down side panel: performance story, score breakdown, decision support
- Manager excluded from own team table

### Employee Flags System
- Table: `employee_flags` with pip_start_date, pip_end_date, pip_duration_days
- Status flow: pending_hr → hr_reviewing → conversation_done → pip_active → completed/closed/withdrawn
- Routes: POST /flags, GET /flags/employee/:id, GET /flags/pending, PUT /flags/:id/confirm, POST /flags/:id/delegate
- File: `apps/api/src/routes/flags.ts`
- HR Flags Inbox: `src/pages/HrFlagsInbox.tsx`
- Delegation: HR Admin can delegate to HR Executive with mandatory TAT and notes
- PIP visible to employee after HR confirms · Release NEVER visible to employee
- One active PIP per employee enforced

### AI Course Recommendations
- Route: `GET /recommendations/my`, `GET /recommendations/team/:userId`
- File: `apps/api/src/routes/recommendations.ts`
- Model: `claude-sonnet-4-6` — initialized lazily inside route
- Sector-agnostic prompt — no BPO-specific language
- Internal LMS search using tags && array overlap
- If internal match: gap analysis only, no marketplace
- If no internal match: gap analysis + generic course topic suggestion for HR procurement
- Marketplace label: "HR PROCUREMENT SUGGESTION — NOT IN YOUR LMS"
- Frontend: `src/pages/Recommendations.tsx`
- Loading takes ~60 seconds — QUIRKY LOADING ANIMATION PLANNED (Superman flying) — build tomorrow

### Exec Dashboard Fixes
- Summary cards now update with active filters (uses `filtered` not `team`)
- Designation filter: multi-select pill dropdown with checkboxes
- Department filter: single select (one dept at a time)
- Removed click-to-filter from summary cards — display only

### Designations Seeded
All 33 personas now have proper designations. Welcome message shows:
`[Role Label] · [Tenant Name] · [Designation]`

### LMS Course Tags Updated
12 system default courses tagged for KPI matching:
- COPC Fundamentals: fcr, aht, csat, schedule_adherence, compliance
- Customer Service Excellence: csat, fcr, customer_satisfaction
- Six Sigma Green Belt: dpmo, fpy, process_compliance, cycle_time
- Quality Auditing for BPO: compliance, process_compliance
- Balanced Scorecard: bsc, revenue, nps, client_retention, budget
- OKR Implementation: okr, objectives, key_results
- HR Analytics: hr_metrics, attrition, hiring, satisfaction
- Effective 1-on-1: coaching, management, performance, feedback

---

## INVESTOR DEMO FLOW (30 June 2026)
4-persona story, ~10 minutes, all USPs visible:

1. **Deepa Nair (CXO)** — Exec Dashboard → dept filter → sees Customer Ops amber → 2 min
2. **Rajesh Kumar (Manager)** — Predictive Analysis → Mariam drill-down → Flag for PIP with dates and KPI targets → 3 min
3. **Sanmeet Sahni (HR Admin)** — Flags Inbox → review → delegate with TAT → 2 min
4. **Mariam Al Hashimi (Employee)** — Welcome screen → AI Recommendations (Superman loading ~60s) → courses appear → enroll → 3 min

**Risk mitigation:** Pre-load Mariam's recommendations tab before switching. Test full flow morning of 30 June.

---

## 40-DAY BUILD PLAN (19 May — 30 June 2026)

| Week | Dates | Focus |
|---|---|---|
| Week 1 | 19-23 May | Mentor feedback + Superman animation + Sprint 11 foundation |
| Week 2-3 | 26 May - 6 Jun | Future Leaders Track + Adaptive Learning |
| Week 4-5 | 9-20 Jun | PIP Module Stages 1-6 |
| Week 6 | 23-27 Jun | Demo polish, QA, rehearsal |
| Demo | 30 Jun | Live investor demo |

### Week 1 Priorities (tomorrow onwards)
1. Superman/quirky loading animation for AI Recommendations — first thing tomorrow
2. Import validation — designation required field, fail row with clear error
3. LMS enrollment seeding — demo personas need real learning hours
4. Manager accountability score in Exec Dashboard (team aggregate view)
5. Incorporate Thursday mentor feedback

### Sprint 11 — Future Leaders Track
- Nomination flow (manager or HR nominates)
- 6-month milestone structure with monthly modules
- Project submission in platform + manager approval gate
- Progress timeline: employee, manager, HR views
- Completion: Future Leader badge on talent profile

### Sprint 12 — Adaptive Learning
- Layer 1: Learning path per role/methodology/KPI each cycle
- Layer 2: Micro-module auto-assigned on Amber KPI breach
- Layer 3: KPI delta tracking post-completion
- HR Learning ROI dashboard

### Sprint 13-14 — PIP Module (Stages 1-3)
- Structured PIP form with KPI selector from employee live KPIs
- HR approval with revision-send-back
- Employee acknowledgement — mandatory, timestamped
- PIP tag on profile after HR confirms

### Sprint 15-16 — PIP Module (Stages 4-6)
- Periodic check-ins: Exceeding Target / On Track / Needs Attention / Not Improving / Regressed
- Auto-escalation after 2 consecutive Not Improving/Regressed
- End-date notifications: 7 days, 24 hours, on day
- Final outcome: Successful / Extended / Unsuccessful
- HRIS evidence package export

---

## PIP MODULE — DESIGNED, NOT YET BUILT (Sprint 13-16)
Full PRD: `Kinalys_PIP_Module_PRD.docx`
Flow diagram: shown in conversation 18 May 2026

### Status Flow
pending_hr_approval → hr_revision_requested → pending_employee_acknowledgement → pip_active → completed_successful / extended / completed_unsuccessful / withdrawn

### Check-in Nomenclature
Exceeding Target · On Track · Needs Attention · Not Improving · Regressed

### New Tables Needed
- Additions to employee_flags: pip_form_data JSONB, employee_acknowledged_at, employee_response, final_outcome, final_outcome_notes
- New table: pip_checkins (id, flag_id, checked_in_by, check_in_date, status, notes, kpi_updates)

---

## PRICING MODEL (LOCKED)

| Plan | Users | USD/mo | INR/mo | EUR/mo |
|---|---|---|---|---|
| Hatchling | Up to 50 | $249 | ₹23,999 | €229 |
| Starter | Up to 100 | $499 | ₹47,999 | €459 |
| Growth | Up to 200 | $799 | ₹76,999 | €739 |
| Scale | Up to 300 | $1,099 | ₹1,04,999 | €1,019 |
| Enterprise | 700+ | Custom | Custom | Custom |

**Overage:** $3 / ₹299 / €2.75 per user/month

### Add-ons (available on all plans)
| Add-on | USD/mo | INR/mo | EUR/mo |
|---|---|---|---|
| Competency Framework | $350 | ₹33,599 | €324 |
| Advanced & Predictive Analytics | $150 | ₹14,399 | €139 |
| Development Paths (FLT + MRT) | $99 | ₹9,499 | €89 |
| PKT Engine | $49 | ₹4,699 | €45 |
| Custom HRIS Integration | $149+/mo | ₹14,299+/mo | €139+/mo |

**Standard in all plans:** KPI Management (COPC/Six Sigma/BSC/OKR), Scorecard, AI Coaching, LMS, OKR Framework, 1-on-1s, Talent Grid, 9 HRIS Connectors, Reports, Knowledge Base, Support

---

## FILE LOCATIONS
| What | Path |
|---|---|
| API entry | C:\Users\sssan\Documents\projects\kinalys-platform\apps\api\src\index.ts |
| Predictive route | apps\api\src\routes\predictive.ts |
| Flags route | apps\api\src\routes\flags.ts |
| Recommendations route | apps\api\src\routes\recommendations.ts |
| Web pages | C:\Users\sssan\Documents\kinalys-web\src\pages\ |
| API client | src\api\client.ts |
| Demo switcher | src\components\DemoSwitcher.tsx |
| Main app | src\App.tsx |
| Root .env | C:\Users\sssan\Documents\projects\kinalys-platform\.env |

---

## KNOWN ISSUES / PENDING
1. AI Recommendations loading takes ~60 seconds — Superman animation tomorrow
2. Customer Complaints Rate for Vishal maps to customer service courses (IT context mismatch) — refine KPI_TAG_MAP post-Thursday
3. Mariam has a completed PIP in the database (status: completed) — clean for next test
4. ESLint warnings: isLeadership, isManager, isAdminOnly unused in App.tsx — cleanup Sprint 11
5. Import validation: designation required — Sprint 11
6. LMS enrollment hours: demo personas showing 0 — seed Sprint 11
7. Manager accountability score in Exec Dashboard — Sprint 11
8. HRIS integration for release process — post-seed, chargeable per client

---

## WHAT NOT TO BUILD BEFORE 30 JUNE
- Management Readiness Track full build (show as PRD/design only)
- HRIS custom integrations
- Mobile app
- Multi-tenant admin console
- Billing integration
