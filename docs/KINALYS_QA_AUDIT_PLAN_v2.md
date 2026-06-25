# KINALYS — POST-DEMO QA AUDIT PLAN & RUNBOOK v2
**Date:** 16 Jun 2026 (W6D2) · Companion to PRD v24 / TRD v2 / Master Context V23
**Execution:** Agentic via the **Claude Code VS Code extension in READ-ONLY/plan mode** (see §3).
**Purpose:** Systematic code-quality review of the Kinalys api + web codebases to identify gaps and loopholes,
then **harden the three source-of-truth docs** (PRD / TRD / Master Context) to reflect the codebase's *actual*
contracts, weak points, and systemic bug classes. The audit's primary deliverable is accurate docs + a tracked
gap register — NOT an immediate fix-list (fixes are scheduled work, driven by the register).

> **Timing (locked):** Executes POST-DEMO, AFTER Task 0 (§0 of PRD). Rationale: (1) the build is frozen pre-demo;
> (2) Task 0 strips demo scaffolding and reshapes the codebase, so auditing before it would partly review
> code about to be deleted; (3) the investor demo is itself a QA input — investor feedback feeds the same pass.
> **Two input streams converge here:** (A) internal codebase audit (what we find), (B) investor feedback
> (gaps/objections/feature questions they raise). Both land in the same findings register (§4).

---

## 1. SCOPE & PRINCIPLES
- **Codebases:** `kinalys-platform/apps/api` (Fastify/TS/Postgres) + `kinalys-web` (React 18/TS).
- **Read-only sweep first.** No code changes during the audit pass — findings only. Fixes are a separate,
  scheduled, post-audit phase so a working state is never destabilised by exploratory edits.
- **Deterministic where possible.** Each dimension has explicit grep/search patterns (model-agnostic — does not
  depend on any specific assistant). The judgment layer (is this a real loophole?) is applied to the search hits.
- **Sequenced after Task 0.** Auditing the post-Task-0 codebase = auditing what actually ships.
- **Output = doc hardening.** Every confirmed finding updates TRD (technical contracts), PRD (gap register +
  backlog), or Master Context (new operational rules), so the docs become the accurate, durable map.
- **Severity rubric:** S1 security/data-leak · S2 data-integrity/correctness · S3 reliability/error-handling ·
  S4 maintainability/consistency · S5 cosmetic/debt.

## 2. AUDIT DIMENSIONS (priority order)
Each dimension lists: what we're hunting, the search patterns to run (on Sanmeet's machine; paste results back),
and what a finding feeds into.

### D1 — Auth & Tenant Isolation  *(S1 — highest priority; a miss = cross-tenant data leak)*
- **Hunt:** routes missing `preHandler: authenticate`; queries missing `tenant_id` scoping; the `X-Demo-User-Id`
  bypass surface (Task 0 should remove it — verify it's gone); any route trusting client-supplied IDs without
  ownership check.
- **Searches (api):**
  - Routes without auth: `Select-String "fastify\.(get|post|put|delete|patch)\(" -Path src\routes\*.ts` → cross-check each against presence of `preHandler`.
  - Tenant scoping gaps: every `query(` with `FROM <table>` — grep `FROM (kpi_assignments|users|scorecards|employee_flags|review_cycles|kpi_templates)` and verify each has `tenant_id = $` in its WHERE (exception: SYSTEM templates `tenant_id IS NULL`).
  - Demo bypass residue: `Select-String "X-Demo-User-Id|demoUserId|DEMO_PERSONAS" -Path src\**\*.ts` (post-Task-0 expectation: only behind `DEMO_MODE`, or gone).
- **Feeds:** TRD route inventory (auth pattern per route) + PRD gap register (any S1).

### D2 — SQL Safety  *(S1/S2)*
- **Hunt:** string-interpolated SQL (injection); missing `::rag_status` / ENUM casts; numeric used in arithmetic without `Number()` (the pg-string bug class, TRD §2.2 / Decision 69).
- **Searches:**
  - Interpolation: `Select-String 'query\(`[^,]*\$\{' -Path src\**\*.ts` (template-literal `${...}` inside a SQL string = red flag; params should be `$1,$2`).
  - ENUM casts: grep `rag_status =` and `INSERT INTO .* rag_status` → confirm `::rag_status` where written.
  - Numeric coercion: grep arithmetic on DB fields (`\.score \*`, `weight_pct \*`, `/ .*target_value`) → confirm `Number()` wrap.
- **Feeds:** TRD §8 debt (full repo scope of each class) + Master Context rules 24/25 (confirm/extend).

### D3 — Transaction & Error Discipline  *(S3)*
- **Hunt:** multi-statement writes without a transaction; `catch` blocks without `ROLLBACK`; missing `finally`
  connection `release()` (connection-leak); routes with no try/catch (unhandled 500s).
- **Searches:**
  - `Select-String "BEGIN|COMMIT|ROLLBACK|\.release\(\)|connect\(\)" -Path src\routes\*.ts` → map which routes use transactions and whether each has all four.
  - Routes without try/catch: visually scan each route handler.
- **Feeds:** TRD route inventory (transactional? y/n) + PRD gap register.

### D4 — Known Systemic Bug Classes  *(S2 — verify full repo scope)*
These are already documented as recurring (Master Context rules 30/31, TRD §8). The audit confirms the *complete*
scope of each — not "we think a few places" but "confirmed in these exact files/lines."
- **Status-field drift (rule 31):** writes that update one status field but not the consistent set
  (`deleted_at` vs `employment_status`; flag `status` vs `final_outcome`). Search: every `UPDATE .* SET .*status`.
- **Terminal-vs-active filters (rule 30):** every `status NOT IN (...)` / `status IN (...)` on flags → confirm it
  includes `completed_successful` + `completed_unsuccessful` and never relies on dead `'completed'`.
  Search: `Select-String "status (NOT )?IN" -Path src\routes\*.ts`.
- **One-source-per-number (rule 33):** any UI count derived from more than one source. Cross-check tile/count logic.
- **pg-numeric-as-string (D2 overlap).**
- **Feeds:** TRD §8 (each class + confirmed scope) + PRD backlog (the central-constant fixes, e.g. `TERMINAL_FLAG_STATUSES`).

### D5 — Route Inventory Reality Check  *(S4)*
- **Hunt:** does the PRD's claimed route count match reality? Each route's actual method, path, auth, caller pattern, contract.
- **Searches:** enumerate all `fastify.(get|post|put|delete|patch)(` across `src\routes\*.ts`; build the true inventory.
- **Feeds:** TRD authoritative route table (replaces any approximate count in PRD §1).

### D6 — Schema vs Doc Reality  *(S2/S4)*
- **Hunt:** TRD schema claims vs live DB. We already found `scorecards` has `overall_score`/`final_score`
  (not `calculated_score`; the exec dashboard computes live) — there may be more doc/reality drift.
- **Searches:** `\d <table>` for every table the TRD documents; diff against the doc. Confirm enum values
  (`kpi_status`, `rag_status`, flag statuses) against live `\dT+`.
- **Feeds:** TRD schema section (corrected to live reality).

### D7 — Frontend Quality  *(S3/S4/S5)*
- **Hunt:** `window.location.href` (rule 18 violation — must be state-nav); missing loading/error states on async
  calls; the encoding/mojibake debt (rule 34); components reading stale fields; hardcoded thresholds (Decision 82 — must become configurable).
- **Searches (web):**
  - `Select-String "window\.location" -Path src\**\*.tsx` (expect zero).
  - Hardcoded bands: `Select-String ">= 90|>= 75|>= 80|< 75|< 80" -Path src\**\*.tsx` (every hit = a band that must move to configurable tenant setting, Decision 82).
  - Mojibake: `Select-String "Â·|â€|ðŸ" -Path src\**\*.tsx` (encoding cleanup scope).
- **Feeds:** PRD backlog (configurable bands, avatar system, encoding cleanup) + Master Context rules.

### D8 — Investor Feedback Integration  *(variable severity)*
- **Hunt:** N/A — this is the second input stream. After the demo, every investor comment (gap, objection,
  "can it do X", "what about Y") is logged as a finding with severity and routed to the register.
- **Feeds:** PRD (feature decisions / roadmap) + register. Some feedback may reprioritise the whole backlog.

## 3. EXECUTION MODEL — Claude Code (VS Code extension), READ-ONLY/PLAN MODE
The audit runs via the native **Claude Code VS Code extension** as an agentic sweep — the agent reads the repo
directly, runs its own searches, reads file contents in full context, and reads LSP/TypeScript diagnostics.
This is far stronger than manual grep-and-paste: findings are assessed with full file context, and false
positives are filtered in place.

**HARD CONSTRAINT — READ-ONLY / PLAN MODE.** The audit is freeze-safe ONLY if it changes nothing.
- Run Claude Code in **read-only / plan permission mode** for the entire audit. It may READ any file, run
  READ-only shell (grep, `\d`, `git log`), and WRITE only the findings register file (`QA_FINDINGS.md`).
- **It must NEVER edit application code, never run migrations, never commit, never push during the audit.**
- Every dimension prompt ends with: *"Read-only. Do not modify any code. Output findings to QA_FINDINGS.md only."*
- Discovery and doc-hardening are SEPARATE passes (see §3.2) to reinforce this boundary.

### 3.1 Setup (one-time, before first audit session)
- Confirm the **Anthropic "Claude Code"** extension is installed (not a community look-alike), CLI v1.x+;
  `claude --ide` to connect. Reload window if auto-detect fails.
- Create a **`CLAUDE.md`** at each repo root (`kinalys-platform/`, `kinalys-web/`) seeded from the Master Context
  technical rules + TRD contracts, so the agent audits AGAINST known conventions, not blind. Minimum contents:
  - Stack facts: Fastify (NOT Express); custom `query()` wrapper; Auth0 + demo `X-Demo-User-Id`; React 18 state-nav (no `window.location.href`).
  - The systemic bug classes to hunt (Master Context rules 24,25,30,31,33): pg-numeric-as-string, ENUM casts, status-field drift, terminal-vs-active filters, one-source-per-number.
  - Tenant-isolation contract: every query scoped `tenant_id = $` except SYSTEM templates (`tenant_id IS NULL`).
  - The "this is a READ-ONLY audit" instruction.
- (Optional) Give Claude Code psql access (the §Master-Context env vars) so it can close D6 (schema-vs-doc) by
  reading live `\d`/`\dT+` itself.

### 3.2 Per-dimension loop (resumable, multi-session)
For each dimension (order: D1 -> D2 -> D4 -> D3 -> D6 -> D5 -> D7, then D8 continuously):
1. **Prompt Claude Code** with the dimension's hunt + the §2 search patterns as starting points, ending with the
   read-only instruction. Example (D1): *"Audit src/routes/*.ts for auth & tenant isolation. For every Fastify
   route, report: does it have `preHandler: authenticate`? Does every query carry `tenant_id = $` (except SYSTEM
   templates)? Flag any route trusting a client-supplied ID without an ownership check. Read-only — append
   findings to QA_FINDINGS.md with severity S1-S5 and file:line. Do not modify any code."*
2. Claude Code sweeps, reads files, writes findings to `QA_FINDINGS.md` (the register, §4 template).
3. **Review the register together (here in chat)** — confirm real findings vs false positives, set/adjust severity.
4. **Doc-hardening (separate pass, in CHAT):** confirmed findings are folded into TRD v2 (contracts/schema/debt),
   PRD v24 (gap register + backlog + fix-phase), and Master Context (new rules). *Claude Code does discovery;
   doc edits happen in chat — keeps the read-only boundary clean.*
5. Next dimension. Stop/resume at any dimension boundary.

### 3.3 Why this split
Discovery (agentic, in VS Code, read-only) and doc-hardening (judgment, in chat) are deliberately separate:
the agent that can edit code never does so during the audit; the docs — the actual deliverable — are revised
with full back-and-forth review rather than auto-generated. The findings register is the bridge between them.

## 4. FINDINGS REGISTER (template)
Maintained as the audit runs. Each finding:

| ID | Dim | Severity | File:Line(s) | Finding | Doc impact | Fix phase |
| --- | --- | --- | --- | --- | --- | --- |
| F-001 | D1 | S1 | `routes/x.ts:NN` | <what & why it's a risk> | TRD route table; PRD register | Task 0 / Post-Task-0 / Go-live |

Severity S1/S2 findings that are ALSO demo-relevant get flagged for the pre-demo narrow-safety pass (rare).
Everything else is post-demo by definition.

## 5. DELIVERABLES
0. **`CLAUDE.md`** at each repo root — seeded from Master Context rules + TRD contracts; makes the agent audit
   against known conventions. Reusable beyond the audit (it's Claude Code's standing project memory).
1. **`QA_FINDINGS.md`** (in-repo register, §4 template) — the living findings list the agent maintains during
   discovery; the bridge between "found" and "fixed."
2. **Hardened TRD v2** — accurate route inventory (auth + transaction + contract per route), live-verified schema,
   each systemic bug class with confirmed full-repo scope, honest tech-debt register.
3. **Hardened PRD v24** — gap register as structured post-demo backlog (finding → severity → fix phase); investor
   feedback folded into feature decisions / roadmap.
4. **Hardened Master Context V23** — any new operational rules the audit surfaces (extending rules 30-35).

## 6. WHAT THIS AUDIT IS NOT
- Not a pre-demo activity (build is frozen; demo runs localhost).
- Not a fix sprint — finding + documenting now; fixing is separately scheduled.
- Not a rewrite — it maps reality and debt; the post-demo build (PRD §12.1) does the work.
- **Not an agent free-for-all** — Claude Code runs READ-ONLY during the audit: reads code, writes only the
  findings register, never edits app code / migrations / commits. If a fix-drafting phase is wanted later, it's a
  SEPARATE, explicitly-permissioned activity on a non-merged branch — never blended into the audit pass.
