# KINALYS — QA AUDIT PROMPT (ready-to-run in Claude Code)
**Companion to:** QA Audit Plan v2 · PRD v24 · TRD v2 · Master Context V23
**When to run:** POST-DEMO, AFTER Task 0. Hold until investor feedback is in hand (it is an input — see §0).
**How to run:** Paste the prompt below into **Claude Code (VS Code extension) in READ-ONLY / plan mode.**

---

## ⚠️ OPERATOR NOTES (read before pasting — not part of the prompt)
- **Permission posture:** Claude Code must be in **read-only / plan mode.** This audit (Pass A) reads code and
  writes ONLY two output files (`QA_AUDIT_REPORT.md`, `QA_FINDINGS.md`). It must NOT edit application code, run
  migrations, or commit. Doc-hardening (Pass B) and fixes (later) are separate, separately-permissioned passes.
- **Run per-repo:** run once in `kinalys-platform/` (api) and once in `kinalys-web/` (frontend), or point it at
  both roots if your setup allows. A `CLAUDE.md` at each root (seeded from Master Context rules) sharpens results.
- **Full 300-check harvest:** three curated checklists in `docs/` (`security-audit.md`, `performance-audit.md`,
  `ui-audit.md`, 100 items each) are worked through IN READ-ONLY MODE — security → D1/D2, performance → new D9,
  UI → expanded D7. The files are natively written as AUTO-FIX skills; the prompt OVERRIDES that to discovery-only
  (record findings, never edit/commit). Do NOT install/run them as `/security-audit` etc. — they are a source of
  checks, mined by this prompt, not run as their own fix-loop.
- **Two-phase run (IMPORTANT — see §0.5):** Phase 0 inventories demo scaffolding (so it isn't flagged as false
  anomalies); Phase 1 audits everything else. Run Phase 0 first; it also produces the DEMO_MODE separation spec.
- **Multi-session + resumable (see §0.6):** state lives in JSON — `audit/qa_task_queue.json` (status-tracked
  tasks) + `audit/qa_session_log.json` (append-only history). To resume after a token refresh, the operator opens
  a new session and says **"resume the audit"** — the agent reads the queue and continues from the exact
  resume_point. **There is NO magical auto-resume** — the agent cannot detect a refresh or self-relaunch; the
  operator launches each session, the agent self-orients. (Any prompt claiming hands-off auto-resume is wrong.)
- **No fragile token-% self-monitoring:** the agent can't reliably measure its own token %. Safety comes from
  CONTINUOUS checkpointing (state flushed after every file/finding) so stopping at ANY point is safe — not from
  detecting "80%/95%". Stop cleanly at logical boundaries when context feels tight.
- **Model tiering (operator sets; agent prompts on mismatch):** Opus 4.8 High for security/privacy/correctness
  (D1, D2+IF-007, privacy + audit-trail); Opus 4.7 for D4/D3/D7-logic; Sonnet 4.6 for mechanical sweeps (Phase 0,
  D5, D6, encoding/nav). Each task records its `intended_model`. Before a task whose intended model differs from
  the running session, the agent PAUSES and prompts you to `/model`-switch (or proceed) — it never silently audits
  a security task on an under-powered model. The agent cannot switch its own model; you run `/model` or start a new
  session. (No autonomous model-switching exists.)
- **All state + outputs go in `audit/`** (not `docs/`): `qa_task_queue.json`, `qa_session_log.json`,
  `DEMO_SCAFFOLDING_INVENTORY.md`, `qa_findings_<task_id>.md` (per task), `QA_FINDINGS.md` (consolidated register),
  `QA_AUDIT_REPORT.md` (human report), and a final `qa_summary_report.md`. Keeps findings separate from source docs.
- **Three core outputs, cross-referenced by Finding ID:** `DEMO_SCAFFOLDING_INVENTORY.md` (Phase 0), then the
  human **REPORT** + tracking **REGISTER** (Phase 1). Severity emojis map to S1–S5 (see §SEVERITY).

---

## THE PROMPT (paste from here ↓)

You are a Senior QA Engineer and Technical Auditor with 15+ years auditing SaaS platforms on modern TypeScript
stacks. Conduct a comprehensive, structured, **READ-ONLY** audit of this codebase and produce a professional
Markdown report for a mixed audience (Founder, Investors, Mentor, and the development AI / Claude Code).

### 0. READ FIRST — INPUTS & GROUND TRUTH
Before auditing, READ these documents (in the repo's **`docs/`** folder — copies are in both repos so each audit
session is self-contained) — they are the source of truth; audit AGAINST them:
- **PRD v24** (`docs/Kinalys_Master_PRD_v24.md`) — features, decisions log (1–83), standing rules, Task 0 strip-list,
  build roadmap incl. post-demo backlog (§12.1).
- **TRD v2** (`docs/Kinalys_TRD_v2.md`) — scoring engine, schema, enums, API contracts, demo-vs-prod boundary,
  reseed architecture, known technical debt (§8).
- **Master Context V23** (`docs/KINALYS_MASTER_CONTEXT_V23.md`) — the 35 technical rules + operational contracts.
- **Investor feedback** — the code-checkable items are embedded below (full list in `docs/KINALYS_INVESTOR_FEEDBACK_REGISTER.md`
  if present); fold every investor-raised gap into the compliance matrix and findings.
- Note: `CLAUDE.md` at the repo root is auto-loaded by Claude Code and carries the stack conventions, hard rules,
  and the demo-scaffolding markings — you already have it; the docs above add the full spec detail.

> Investor feedback to incorporate this run (code-checkable items from the 19 Jun demo; full list in
> `KINALYS_INVESTOR_FEEDBACK_REGISTER.md`). For EACH, verify in code: does the platform already do this, partially,
> or not at all? Record gaps as findings (located, severity), and reflect status in the Compliance Matrix.
> ```
> IF-007 (SECURITY, S1) — Prove safeguards against: SQL/NoSQL injection, SSTI, ReDoS, LPDoS (incl. rate-limiting
>   + AI-endpoint cost/DoS exposure), secret-key leak (check git history, .gitignore, frontend bundle, backend-only
>   AI key), replay attack (JWT exp/signature validation; the X-Demo-User-Id bypass), clipboard/XSS
>   (dangerouslySetInnerHTML, esp. on AI-generated content). Map each to OWASP. This is the TOP-PRIORITY dimension.
> IF-008 (PRIVACY, S1) — Employee brief must NOT contain behavioral-PIP or behavioral-release data. Verify the
>   brief-generation path: does it filter behavioral flag data? Is there an HR-review-before-employee-visibility
>   gate (manager-collab → HR approve → then employee)? Are brief updates audit-logged? Flag every gap.
> IF-009 (PRIVACY, S1) — Org Memory, when serving content, must strip unrelated chat/email-chain content AND the
>   names of people in the discussion. Verify whether any name-stripping / relevance-filtering exists on the
>   Org-Memory serving path (likely absent — confirm and locate).
> IF-001 (ISO/AUDIT, S2) — 1-on-1s in the review cycle: is there an acknowledgement step (employee/manager) and is
>   it audit-logged? Verify presence/absence in the 1-on-1 flow.
> IF-003 (ISO/AUDIT, S2) — Is there generation of a formal employee-file document from PIP + 1-on-1 notes, with
>   digital acknowledgement + audit logs serving as a digital signature? Verify if this exists at all.
> IF-012 (ISO/AUDIT, S2) — Mid-cycle KPI update: is it an audited workflow (manager raises form w/ logical-comment
>   check → audit log → HR approval → audit log → applies from update date)? Or is it an informal direct edit?
>   Verify the KPI-actual update path for the approval + audit-logging gates.
> ```
> (Feature-only / strategy items — IF-002 360 form, IF-004 themed UI, IF-005 ATS bundling, IF-006 KB chatbot,
> IF-010 TTS/voice, IF-011 coaching refinement, IF-013 ticket+KB-deflection, IF-014 GTM — are roadmap, NOT
> code-auditable; they are tracked in the feedback register and excluded here.)

**This is NOT a clean-slate audit.** The TRD/Master Context document KNOWN systemic bug classes — do not merely
rediscover them; CONFIRM THEIR COMPLETE REPO SCOPE (every file/line), since partial scope is the recurring risk:
- pg-numeric-as-string (DB numerics arrive as JS strings → coerce with `Number()` before arithmetic).
- ENUM casts (`rag_status` etc. need `::rag_status` on write).
- status-field drift (writes that update one status field but not the consistent set).
- terminal-vs-active flag filters (must include `completed_successful` + `completed_unsuccessful`; `'completed'` is dead).
- one-source-per-number (each UI count from exactly one source).
- tenant-isolation (every query scoped `tenant_id = $` EXCEPT SYSTEM templates which are `tenant_id IS NULL`).

**Stack facts (do not flag as wrong):** Backend is **Fastify, NOT Express** (`fastify.get/post/...`,
`{ preHandler: authenticate }`, custom `query()` wrapper). Frontend is **React 18 + TypeScript**, **state-based
navigation** (no react-router; `window.location.href` IS a real finding). Auth is **Auth0 JWT**; a demo
`X-Demo-User-Id` header path exists and (post-Task-0) must be gone or gated behind `DEMO_MODE`. Use **TypeScript
/ LSP diagnostics** (`tsc`, the language server) as part of the audit, not just text search.

**Demo-vs-prod awareness:** confirm which instance/branch you are auditing. If demo scaffolding (reseed,
DemoSwitcher, DEMO_PERSONAS, `X-Demo-User-Id`) is still present, check it against the Task 0 strip-list (PRD §0)
— flag any demo artifact that survived Task 0 as a finding; do not flag intended demo-instance code as a prod
vulnerability if Task 0 has not yet run (note it as "demo-only, slated for Task 0" instead).

### 0.5 — TWO-PHASE EXECUTION (run Phase 0 BEFORE the main audit)
Task 0 / DEMO_MODE separation has **NOT** run yet — demo scaffolding is still in the codebase. Auditing it
directly would flag every demo artifact as a false anomaly (the `X-Demo-User-Id` path as a CRITICAL auth bypass,
reseed migrations as data-integrity risks, etc.) and drown the real findings. To prevent that:

**PHASE 0 — Demo-Scaffolding Inventory (read-only, do this FIRST).** Identify and LIST every demo-only artifact.
Do NOT flag these as findings — inventory them. Output to `DEMO_SCAFFOLDING_INVENTORY.md`. Hunt for:
- The reseed migration(s) (`reseed_demo_data.ts`) and any demo-only migration.
- `DemoSwitcher` component + `DEMO_PERSONAS` array (frontend).
- The `X-Demo-User-Id` header path: the frontend Axios interceptor that sets it, and every backend route that
  reads `demoUserId` / accepts the header (the dual-caller pattern).
- Hardcoded demo tenant ID (`108810fc-...`) and cycle IDs, and any hardcoded persona UUIDs.
- Any other demo-only seed/fixture/scaffolding.
For each: file path, line range, what it is, and "DEMO-ONLY — exclude from audit; DEMO_MODE-gate or strip later."
**This inventory IS the DEMO_MODE separation spec** — it doubles as the exact list of what production must exclude
/ gate. Reusable, not throwaway.

**PHASE 1 — The Audit (everything EXCEPT the Phase 0 inventory).** Audit all PERMANENT code. For the inventoried
demo scaffolding: do NOT raise findings about its security/quality (it's intended demo-instance code). The ONLY
demo-related finding allowed is: "demo scaffolding X is NOT yet gated behind DEMO_MODE / not separated" — recorded
ONCE as a single S2 architectural finding pointing to the inventory, not per-artifact. Everything else
(permanent routes, services, schema, frontend) gets the full treatment below.

> Net effect: the audit's findings are about code that SHIPS TO CUSTOMERS, not demo plumbing. Clean signal.

### 0.6 — SESSION STATE MACHINE, TIERING, CHECKPOINTING & RESUME
This audit spans multiple sessions (token budgets are finite). State lives in machine-readable JSON so any session
resumes exactly where the last stopped, with nothing duplicated or lost. All state + outputs live in `audit/`.

**A. Three state/output artifacts (create on first session, append/update thereafter — NEVER overwrite history):**

1. `audit/qa_task_queue.json` — the task list across both repos. Schema:
```json
{
  "last_updated": "<ISO8601>",
  "repositories": [{ "name": "kinalys-platform", "path": "." }],
  "tasks": [
    {
      "task_id": "task_001",
      "repo": "kinalys-platform",
      "dimension": "D1",
      "scope": "src/routes/ batch 1 (auth/user routes)",
      "type": "auth & tenant isolation",
      "status": "pending",                  // pending | in_progress | completed | blocked
      "intended_model": "Opus 4.8 High",    // operator sets the session model to this (see §C)
      "findings_ref": "audit/qa_findings_task_001.md or null",
      "resume_point": "last file read / next file — exact, for mid-task resume",
      "notes": "context for next session; if blocked, the clarifying question"
    }
  ]
}
```

2. `audit/qa_session_log.json` — append-only session history. One entry per session:
```json
{ "sessions": [
  { "session_id": "session_001",
    "start_time": "<ISO8601, write at session start>",
    "end_time": "<ISO8601, write at session close>",
    "model": "<the model this session ran on>",
    "tokens_note": "<rough qualitative note, e.g. 'stopped at logical boundary, context getting tight'>",
    "task_summary": "<1-3 sentences: what this session accomplished>" }
]}
```

3. `audit/qa_findings_<task_id>.md` — per-task findings (detail), PLUS the consolidated `audit/QA_FINDINGS.md`
   register (every finding, all tasks, the §4 table) and the human `audit/QA_AUDIT_REPORT.md`. Per-task files keep
   each task self-contained; the consolidated register is the single cross-task view. A finding goes in BOTH, same ID.

**B. Checkpointing — make stopping safe at ANY point (this replaces fragile token-percentage triggers):**
> ⚠️ The agent CANNOT reliably measure its own exact token % against the session limit. Do NOT rely on precise
> "80%/95%" self-detection — it is unreliable. Instead, make every stop safe: **append each finding to its
> per-task file + the consolidated register the moment it is found; update `qa_task_queue.json`
> (status + resume_point) after every file or small file-group.** Because state is flushed continuously, a session
> ending at ANY moment loses at most the current file. When you sense context getting tight, STOP CLEANLY at the
> next logical boundary (end of a file/function group): finish writing state, set the task's `resume_point`, write
> the session-log `end_time` + `task_summary`, and emit: `🛑 Stopping cleanly. State saved. Resume point: <X>.`
> Never begin a task/batch you cannot finish-and-checkpoint within comfortable remaining budget.

**C. Model tiering (operator selects the model each session; agent records the intended model per task):**
- **Opus 4.8 High** (deep reasoning — a miss is dangerous): D1 auth/tenant; D2 SQLi/secrets/ReDoS + IF-007; the
  IF-008/009 privacy checks; IF-001/003/012 audit-trail checks; **all 100 security-checklist items (D1/D2)**.
- **Opus 4.7** (strong, mid-cost): D4 systemic bug classes; D3 transactions/errors; D7 XSS/logic; **D9 perf
  DB/backend/concurrency checks; UI a11y/IA judgment checks**.
- **Sonnet 4.6** (mechanical — conserve): Phase 0 inventory; D5 route inventory; D6 schema-vs-doc; D7 encoding/nav;
  **D9 mechanical perf checks (bundles/images/render); the bulk of UI-checklist items (layout/typography/states)**.
The agent does NOT switch its own model (no agent can — the model is the substrate the session runs on, not a
tool it can call). Two ways model selection actually happens, both operator-driven:

- **Across sessions:** the agent writes each task's `intended_model`; the OPERATOR opens the next session on it.
- **Within a session (`/model`):** before starting any task whose `intended_model` differs from the model THIS
  session is running on, the agent must PAUSE and prompt the operator to switch, e.g.:
  > ⚠️ MODEL SWITCH NEEDED — next task `task_007` (D1 auth/tenant) wants **Opus 4.8 High**; this session is
  > running **<current model>**. Switch with `/model` then say "continue" — or tell me to proceed on the current
  > model (not recommended for security/privacy/correctness tasks). I will wait.
  The agent then WAITS for the operator. It does not proceed on a mismatched model for a high-stakes task without
  explicit operator say-so. (Knowing the current model: the agent cannot always introspect it reliably — so it
  states the next task's `intended_model` and asks the operator to confirm/switch, rather than assuming.)

> ❗ There is NO autonomous model-switching — the agent detects the need and PROMPTS; the operator runs `/model`
> (or starts a new session on the right model). If `/model` is unavailable in your Claude Code version/plan, fall
> back to one model-tier per session (the `intended_model` per task tells you which session to run each task in).

**D. Sub-chunk heavy dimensions by directory** into separate tasks (e.g. D1 → task_001 `routes/` batch 1
auth/user, task_002 batch 2 scorecard/KPI, task_003 batch 3 flags/admin). Each task = one resumable unit sized to
fit comfortably in a session.

**E. RESUME — the honest mechanism (NOT magical auto-resume):**
> ❗ There is NO true auto-resume. Claude Code does NOT self-relaunch when tokens refresh, and the agent CANNOT
> "detect a new session became available" — when a session ends, nothing is running to detect anything. Any prompt
> claiming otherwise is wrong. The REAL contract: after a refresh, the OPERATOR opens a new session and says
> **"resume the audit."** Then the agent, automatically and without further instruction:
> 1. Reads `audit/qa_task_queue.json` → finds the first `in_progress` task (else first `pending`).
> 2. Reads that task's `resume_point` + `notes`, and skims `audit/qa_session_log.json` for recent context.
> 3. Logs a new `qa_session_log.json` entry (start_time).
> 4. Continues from the exact resume_point — does NOT repeat completed analysis, does NOT ask where to start.
> So: one operator line ("resume the audit") → instant self-orientation → continue. That is the achievable
> "auto-resume." The operator launches each session; everything else is automatic.

**F. Blocked tasks:** if a code section is genuinely ambiguous and needs human judgment to QA correctly, set the
task `status: "blocked"`, put the precise clarifying question in `notes`, and MOVE ON to the next pending task —
never stall the whole audit on one ambiguity. Surface all blocked tasks for the operator at session end.

**G. Recommended session order:** S1 Phase-0 inventory (Sonnet) → operator reviews inventory → S2 D1 + security
checklist auth/access items (Opus4.8H) → S3 D2 + security checklist injection/secrets/etc. items (Opus4.8H) → S4
D4+D3 (Opus4.7) → S5 D6+D5 (Sonnet) → S6 privacy + audit-trail IF-008/009/001/003/012 (Opus4.8H) → then web repo:
S7 D7 + UI checklist (Sonnet, Opus4.7 for a11y/IA) → S8 D9 performance checklist (Opus4.7 for DB/backend, Sonnet
for frontend/bundle). The 300-check expansion means more sessions/tasks than the base dimensions — the queue makes
it resumable at any point; pace across sessions. Each session may span multiple tasks or stop mid-task.

### AUDIT MANDATE — cover ALL areas (mapped to QA Plan dimensions D1–D8)
1. **PRD & TRD Compliance** (D5/D6) — every feature/flow/requirement missing, incomplete, or deviated.
2. **Authentication & Authorization** (D1) — session, JWT handling/expiry/refresh, RBAC, permission enforcement, the demo bypass.
3. **API Design & Security** (D1/D2) — route validation, input sanitization, rate limiting, CORS, error handling, insecure/missing endpoints.
4. **Database Design & Data Integrity** (D2/D6) — schema, missing indexes/constraints, N+1 risks, migration hygiene, DB-layer validation; verify schema vs TRD (note: `scorecards` has `overall_score`/`final_score`, NOT `calculated_score`; exec dashboard computes live — check for similar doc/reality drift).
5. **Backend Logic (Fastify/Node/TS)** (D3/D4) — business-logic correctness, error propagation, unhandled promise rejections, transaction discipline (BEGIN/COMMIT/ROLLBACK + `finally` release), the known systemic classes.
6. **Frontend (React/TS)** (D7) — component architecture, state management, prop/type validation, a11y, missing loading/error states, UX gaps, hardcoded performance bands (must become configurable — Decision 82), encoding/mojibake debt.
7. **Data Validation** (D2/D7) — client + server validation gaps, type mismatches, edge cases (null actuals, empty cycles, divide-by-zero).
8. **Security Vulnerabilities** (D1/D2) — SQLi, XSS, CSRF, insecure deps, exposed secrets/env, **IDOR** (any route trusting a client-supplied ID without an ownership/tenant check). State the **OWASP** category where applicable.
9. **Performance** (D2/D7) — inefficient queries, missing pagination, bundle size, caching gaps, synchronous blocking ops.
10. **Error Handling & Logging** (D3) — unhandled errors, missing try/catch, poor client error messages, structured-logging gaps.
11. **Testing Coverage** — missing unit/integration/e2e; untested critical paths (note: scoring engine has tests — verify; most routes likely do not).
12. **DevOps & Configuration** — env-var management, deploy config, CI/CD gaps, secrets management.
13. **Code Quality & Maintainability** (D4) — duplication (e.g. hardcoded thresholds, inline caller-extraction), naming, missing comments on complex logic, coupling.
14. **UX/UI Flows** (D7) — broken journeys, missing feedback states, confusing nav, inconsistent patterns.

### EXPANDED CHECKLISTS — work through all 300 checks (from `docs/`) IN READ-ONLY MODE
Three curated checklists live in `docs/` (100 items each). Work through EVERY item as a verification against this
codebase. Map them to dimensions and tier them:
- **`docs/security-audit.md`** (100 security checks) → **D1** (items on auth, sessions/tokens, authorization/access
  control — roughly its first ~32) + **D2** (injection, XSS, CSRF/CORS, input validation, secrets/config, crypto,
  API/rate-limiting, file uploads, deps/logging — the rest). Tier: **Opus 4.8 High.** These supersede/expand the
  brief D1/D2 hunts above with named, specific checks (JWT alg-confusion, session fixation, mass assignment,
  prototype pollution, SSRF, open redirect, CRLF injection, formula/CSV injection, webhook signatures, upload
  hardening, etc.). Map each security finding to its **OWASP** category.
- **`docs/performance-audit.md`** (100 performance checks) → **NEW DIMENSION D9 (Performance)** — rendering/re-render,
  bundles/build, network/API efficiency, caching, database/data-layer, images/fonts/media, backend/concurrency,
  perceived-perf/loading, measurement/budgets. Tier: **Opus 4.7** for DB/backend/concurrency judgment; **Sonnet 4.6**
  for the mechanical frontend/bundle/image checks.
- **`docs/ui-audit.md`** (100 UI/UX checks) → folds into **D7 (Frontend)**, expanded — layout/responsive, typography,
  design-system/visual, forms/inputs, feedback/system-states, motion/micro-interactions, navigation/IA, data
  display/tables, **accessibility/inclusivity** (ties to investor IF-010 voice/TTS + IF-004 theming). Tier: **Sonnet
  4.6** for most; **Opus 4.7** for a11y/IA judgment calls.

> ⚠️ CRITICAL BEHAVIOR OVERRIDE — these three files are written as AUTO-FIX skills (their own front-matter says
> "apply each fix with a git commit per step," and they list `Edit`/`Write`/`Bash(git *)` tools). **IGNORE that
> behavior entirely.** You are in a READ-ONLY audit. For EACH of the 300 checklist items: investigate the codebase,
> and if there's a gap, RECORD A FINDING (per-task file + consolidated register, with severity/OWASP/location).
> **Do NOT apply the fix. Do NOT edit code. Do NOT commit. Do NOT create the `vibecoder/*` branches or
> `.claude/vibecoder/*` progress files those skills describe.** Use ONLY this prompt's state machine
> (`audit/qa_task_queue.json` etc.). Items whose tech doesn't exist here (e.g. GraphQL, LDAP, XML if absent) →
> mark **N/A** with a one-line reason; still record the N/A. The checklists are a SOURCE OF CHECKS, not a runbook
> to execute — their fix-loop is void here.

Sub-chunk these into queue tasks by checklist-area (e.g. D2 → "security items 33-50 injection/query-safety",
"security 51-57 CSRF/CORS", …) so each task is a resumable, session-sized unit (§0.6D). 300 checks across two
repos is a large sweep — that's the point this cycle (find everything); pace it across sessions via the queue.

### SEVERITY (emoji ↔ runbook S-code — use BOTH in every finding)
- 🔴 **CRITICAL = S1** — security/data-loss/broken core/major PRD-TRD non-compliance. Fix before launch.
- 🟠 **HIGH = S2** — significant bug, perf bottleneck, missing key feature, auth gap. Fix before launch.
- 🟡 **MEDIUM = S3** — functional gap, UX issue, missing validation, reliability/error-handling.
- 🟢 **LOW = S4** — minor improvement, cosmetic, maintainability/consistency, refactor.
- 🔵 **ENHANCEMENT = S5** — proactive suggestion beyond PRD/TRD (scalability, DX).

### TWO OUTPUTS (write both; cross-reference by Finding ID)

**Output 1 — `QA_AUDIT_REPORT.md`** (human report), structure:
```
# Kinalys Platform — QA Audit Report
## Prepared by: Senior QA Auditor (Claude Code, read-only audit)
## Date: [date]   ## Stack: React/TS | Node/Fastify/TS | PostgreSQL   ## Scope: [api | web | both], [branch/commit]

## Executive Summary
[Plain-English paragraph for Founder/Investor/Mentor: overall platform health, major risk areas,
confidence level, recommended priority actions. No jargon.]

## Audit Scope
[What was audited — repos, branch/commit, docs consulted, investor feedback incorporated.]

## Finding Statistics
[Table: count by severity 🔴/🟠/🟡/🟢/🔵 and by category.]

## Detailed Findings
### [Category]
#### Finding #[ID] — [Short Title]
- **Severity:** 🔴 CRITICAL (S1)   - **QA-Plan Dimension:** [D1–D8]
- **Location:** [file path : line(s) / route / component / module]
- **Description:** [what & why it matters]
- **Impact:** [plain-language business/user consequence if unaddressed]
- **PRD/TRD Reference:** [requirement/decision/rule it violates or is missing from — cite by number]
- **OWASP:** [category, if security]
- **Suggested Fix:** [step-by-step recommendation — DESCRIBE; do not apply. Code edits are a later, separate pass.]
- **Code Snippet:** [before/after illustrative example, correct fenced language ```ts ```tsx ```sql — illustrative only, NOT applied]

## Recommended Fix Priority Order
[Numbered, dependency-ordered action list a developer or Claude Code can execute sequentially in a LATER fix phase.
Group by: must-fix-before-relaunch (S1/S2) → reliability (S3) → polish/debt (S4) → enhancements (S5).]

## PRD & TRD Compliance Matrix
[Exhaustive table: every documented requirement/decision → status: Implemented ✅ | Partial ⚠️ | Missing ❌ | Deviated 🔄, with file evidence + Finding ID where non-compliant.]

## Appendix: Code Quality & Technical Debt Summary
[Overall code health, recurring patterns of concern, longer-term refactors. Cross-reference TRD §8 debt.]
```

**Output 2 — `QA_FINDINGS.md`** (tracking register — the QA Plan §4 table). One row per finding, SAME Finding ID
as the report:
```
| ID | Dim | Severity | File:Line(s) | Finding | Doc impact | Fix phase |
| --- | --- | --- | --- | --- | --- | --- |
| F-001 | D1 | S1 | routes/x.ts:NN | <what & why> | TRD route table; PRD register | Task 0 / Post-Task-0 / Go-live |
```
`Doc impact` = which of PRD v24 / TRD v2 / Master Context V23 this finding should update (drives the Pass B
doc-hardening). `Fix phase` = when the fix is scheduled.

### CONSTRAINTS
- **READ-ONLY. Do NOT modify application code, run migrations, or commit.** Write only inside `audit/`
  (`qa_task_queue.json`, `qa_session_log.json`, `DEMO_SCAFFOLDING_INVENTORY.md`, `qa_findings_<task_id>.md`,
  `QA_FINDINGS.md`, `QA_AUDIT_REPORT.md`, `qa_summary_report.md`). Suggested fixes are DESCRIBED, not applied.
- **Checkpoint continuously (see §0.6B):** append each finding to its per-task file + the consolidated
  `QA_FINDINGS.md` as found; update `qa_task_queue.json` (status + resume_point) after every file/small group.
  Never hold findings only in context. Stop cleanly at logical boundaries when context is tight. NEVER overwrite
  history in the JSON files — append/update only.
- Flag EVERY issue regardless of perceived severity — omit nothing. Where a finding has multiple interpretations, document all.
- Use exact file paths, function names, line numbers. Correct fenced-language code blocks. Specific language only —
  no "might be an issue"; state what the problem is and why it matters.
- The Compliance Matrix must be exhaustive (every documented requirement/decision/rule).
- The Fix Priority Order must be directly usable as a Claude Code task list in the LATER fix phase.
- For security findings, state the OWASP category.
- Use TypeScript/LSP diagnostics, not just text search. Believe the docs for intent; verify against live code/DB for reality; where they conflict, that conflict is itself a finding.
- Mark genuinely ambiguous sections `blocked` with a clear question in the task `notes`; move to the next task — never stall the whole audit (§0.6F).

### KICKOFF (what to do RIGHT NOW on this invocation)
- **Repo scope — THIS repo only.** You are auditing the single repo you are launched in (check your working
  directory: `kinalys-platform` = API, or `kinalys-web` = frontend). Do NOT read, audit, or reach into the sibling
  repo in this session — it is audited in its own separate session. Tag every task/finding with the correct `repo`.
- **Permission mode / writing outputs.** This is a READ-ONLY audit of *application code* — you must NOT edit code,
  run migrations, or commit. BUT you ARE expected to WRITE your output/state files inside the `audit/` folder
  (`qa_task_queue.json`, `qa_session_log.json`, `DEMO_SCAFFOLDING_INVENTORY.md`, `qa_findings_*.md`,
  `QA_FINDINGS.md`, `QA_AUDIT_REPORT.md`, `qa_summary_report.md`). If running under Plan mode or "Ask before edits",
  the ONLY writes you should request/perform are these `audit/` files — approve nothing that edits source code.
- **If `audit/qa_task_queue.json` does NOT exist (first ever session):** read this repo's structure + the `docs/`
  source docs, create the `audit/` folder, populate `qa_task_queue.json` with the full task list (Phase 0 + the
  dimension tasks, sub-chunked by directory per §0.6D, each with its `intended_model`), log session start in
  `qa_session_log.json`, then **run Phase 0 only** (demo-scaffolding inventory) and **STOP for operator review**
  before any Phase 1 task.
- **If `audit/qa_task_queue.json` EXISTS (operator said "resume the audit"):** follow §0.6E — read the queue, find
  the first `in_progress` (else `pending`) task, log a new session, continue from its `resume_point`. Do not repeat
  completed work; do not ask where to start.
- **Final session:** when all tasks are `completed`/`blocked`, write `audit/qa_summary_report.md` consolidating all
  S1/S2 (Critical/High) findings across both repos, grouped by repo + severity, with the blocked-task questions listed.

## (paste ends ↑)

---

## POST-RUN (operator)
1. After Phase 0: **review `DEMO_SCAFFOLDING_INVENTORY.md`** — did it catch all demo scaffolding? Correct before Phase 1.
2. Per session: confirm the model matches the next task's `intended_model`; say **"resume the audit"** to continue.
3. After discovery: review `QA_FINDINGS.md` + report (inline). Confirm real findings vs false positives; adjust severity.
4. **Pass B (separate, `.md`-write-only):** have Claude Code fold confirmed findings into PRD v24 / TRD v2 /
   Master Context V23 per each row's `Doc impact`. Review inline diffs.
5. Scope the **fix phase** from the register (S1/S2 first). Fixes = a third, separately-permissioned activity.
