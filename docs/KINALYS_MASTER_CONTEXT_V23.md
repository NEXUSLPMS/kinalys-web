# KINALYS — MASTER CONTEXT V23 (OPERATIONAL)
# Version: 23.0 — W6D2 (16 June 2026). Demo-fix workstream COMPLETE; data + display layer verified end-to-end.
# Timezone: All scheduling IST (UTC+5:30). Sanmeet works ~09:00 IST start.
# Demo: 24–30 June 2026 window (in-person, Pune). Go-live: 15 August 2026 (AWS ap-south-1).

> **READ THIS FIRST — document roles (single-source discipline, W6D1 decision):**
> - **PRD v23** (`Kinalys_Master_PRD_v23.md`) = product source of truth — features, decisions log (1–83),
>   standing rules table, Task 0 strip-list, onboarding/measurement/survey specs, build roadmap (§12 + §12.1
>   post-demo backlog).
> - **TRD v1** (`Kinalys_TRD_v1.md`) = technical source of truth — scoring engine, schema, enums, KPI/BSC
>   definitions, API contracts, demo-vs-prod boundary, reseed architecture, tech debt.
> - **THIS FILE (Master Context V23)** = operational layer only — how we work (technical rules, startup, env),
>   where we are right now (current state), the live persona/ID references, and the path to go-live.
>   It does NOT restate decisions, schema, or product spec — those live in PRD/TRD. When they conflict,
>   **PRD/TRD win** for spec; this file wins for "current state" and "how to run things."

---

## 1. IDENTITY & ROLE
- **Company:** Indyaah Techbytes Pvt Ltd, Pune. **Product:** Kinalys (Kinetic Analysis) — B2B HR/performance SaaS.
- **People:** Sanmeet Sahni (CEO), Chaitali Wayakule (CPO). Claude = technical co-founder / lead engineer.
- **ICP:** India BPO/ITeS/GCC, 100–2000 employees; Gulf expansion Year 2.
- **Claude's working style here:** direct, technical, no fluff. State the file path + line numbers before any edit.
  Read the file before editing. Verify on disk before running. One scoring path. Never invent Express patterns.

## 2. CRITICAL TECHNICAL RULES — NEVER VIOLATE
*(Carried from V21 §3, still valid. PRD §15.3 holds the product-process rules 37–43; these are the machine/codebase rules.)*

1. **Framework is Fastify, NOT Express.** `fastify.get/post/put/delete`, `{ preHandler: authenticate }`. Never Express.
2. **Always `--no-cache`** with tsx: `npx tsx --no-cache src\index.ts`.
3. **No-BOM UTF-8** for PowerShell file writes: `New-Object System.Text.UTF8Encoding $false`.
4. **Backticks in PowerShell strings get stripped** — never write TS with backtick template literals via PowerShell. Use VS Code edits or download-and-replace.
5. **Always give full path** with the `code` command.
6. **Never use `-i`** in PowerShell `-match` (case-insensitive by default).
7. **Caller-info pattern** — no `getCallerInfo()` helper. Every route extracts caller inline (demo `X-Demo-User-Id` OR Auth0 JWT).
8. **Demo mode** — `X-Demo-User-Id` header via frontend Axios interceptor, read as `(request as any).demoUserId`. All routes support demo + Auth0. (Post-demo: gated behind `DEMO_MODE`; prod ignores the header — PRD D80.)
9. **Multi-statement write routes use transactions** (connect → BEGIN → COMMIT → ROLLBACK on catch → release in finally).
10. **Large file rewrites** — write to `/home/claude/`, present for download, replace on disk. Download-and-replace preferred for files with backtick template literals (rule 4).
11. **API port 3000. Frontend dev 3001.**
12. **Hard-restart after backend service/route changes** (Ctrl+C, `npx tsx --no-cache src\index.ts`). A verified edit that "doesn't show up" is almost always a missed restart or a non-refetching frontend — confirm with a direct `Invoke-RestMethod` before suspecting code.
13. **VS Code TS server caches imports.** Restart TS Server after new client.ts exports or new component import/prop. Editor squiggle ≠ broken browser build.
14. **Paste-corruption risk in PowerShell.** Console-log text leaks into pasted blocks. Verify every paste; prefer full-file overwrite for big changes.
15. **AI calls take 15–30s** (brief generation, recommendations) — synchronous with themed loading. Expected UX.
16. **PSQL client-encoding mismatch on Windows** — set `$env:PGCLIENTENCODING = "UTF8"` before migrations with non-ASCII. Re-set every session.
17. **PSQL helper vars (`$psql`, `$db`, `$tid`) do NOT persist between sessions.** Re-export every session; echo `$psql` to confirm before querying. Empty echo = wrong prompt (API/frontend terminal or `kinalys=#` shell) — open a fresh PowerShell tab.
18. **Frontend nav is state-based, NOT routed** (`activeNav` useState + ternary). Never `window.location.href`. Navigate via threaded callback → `setActiveNav('target')`.
19. **PowerShell mangles UTF-8 on OUTPUT** — `Get-Content`/echo shows mojibake (`Ïƒ`, `â€"`, `ðŸ"´`) as a display artifact. Byte-check before assuming corruption. On full-file overwrite of a mojibake-showing file, write the CORRECT chars, not the mojibake.
20. **NEVER paste JSX/TS into the PowerShell prompt.** Code edits go in VS Code. PowerShell only runs `Get-Content`/`Select-String` verification + `code <path>`. Arrows like `->` in edit descriptions are prose.
21. **Line numbers drift when lines are added.** Re-verify with `Select-String`/`$lines[N..M]` before trusting a cited number. Use `"${i}: $_"` (the colon after a bare `$i` breaks parsing). Downloaded-and-replaced files can shift ±1 line.
22. **`lms_learning_paths` has NO unique constraint on (tenant_id, name).** Use INSERT…SELECT…WHERE NOT EXISTS for idempotent seeding.
23. **APPEND a route at the END of the export**, before the export's closing `}`. Confirm last lines: `})` (route close) then `}` (export close).
24. **`kpi_assignments.rag_status` is a Postgres ENUM** (`green`/`amber`/`red`). UPDATE/INSERT needs explicit cast `::rag_status`.
25. **Postgres numeric columns serialize to JSON STRINGS via node-postgres.** Coerce with `Number()` at the data boundary. (This was the W5D7 inverted-KPI floor bug — see TRD §2.2 / PRD Decision 69.)
26. **RAG filter ≠ band filter** (ExecDashboard tiles vs Performance Distribution rows). Correct behaviour; cosmetic relabel post-demo.
27. **`kpi_assignments` cycle column is `review_cycle_id`, NOT `cycle_id`.**
28. **`employee_flags`:** `employee_id` (NOT user_id), `flagged_by` (NOT created_by). Status CHECK-constrained.
29. **`role_intelligence_briefs` FK is `employee_id`**; `ready` = `generated_at NOT NULL AND generation_error NULL` (no `brief_status` col on this table).
30. **TERMINAL vs ACTIVE flag statuses — SYSTEMIC.** Any status filter MUST include `completed_successful` + `completed_unsuccessful`; `'completed'` is a dead value. (Post-demo: central `TERMINAL_FLAG_STATUSES` — TRD §8.)
31. **Status fields drift out of sync (SYSTEMIC).** Writes update one field, not the set (`deleted_at` vs `employment_status`; flag `status` vs `final_outcome`). UI logic keys off ONE field (decision 58). Fix at the write path post-demo.
32. **`conversation_done` is RELEASE-terminal, NEVER a PIP state.** Guard both /flags/pending and /flags/counts or it double-counts.
33. **Flag tile counts: one source per number.** Active tiles count off the loaded /flags/pending list; only Closed tiles read /flags/counts.
34. **ASCII-safe source.** JSX text → HTML entities (`&middot;`, `&mdash;`); JS string/template literals → unicode escapes (`\u00b7`, `\u2014`); emoji in JSX as `{'\u2705'}`. A JSX-text `\u` escape renders literally — entities only in JSX text, escapes only inside quotes. (Repo-wide UTF-8 cleanup is post-demo — TRD §8.)
35. **>10 lines changed → full-file overwrite.** ≤10 lines in one place → targeted edit; >10 or scattered sites → full overwrite to avoid paste/diff corruption.

> **Process rules 37–43 live in PRD §15.3** (one scoring path; coerce pg numerics; tag demo artifacts; confirm-on-disk; bands have one source; active-scope for org views; strong explicit seeds). Not duplicated here.

## 3. STARTUP & ENV (re-run every session)
```powershell
Start-Service postgresql-x64-18

# API (port 3000)
cd C:\Users\sssan\Documents\projects\kinalys-platform\apps\api
npx tsx --no-cache src\index.ts

# Frontend (port 3001)
cd C:\Users\sssan\Documents\kinalys-web
npm start
```
```powershell
# PSQL helpers — RE-SET EVERY SESSION; confirm $psql echoes before querying
$env:PGPASSWORD = "Kinalys2026"
$env:PGCLIENTENCODING = "UTF8"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$db   = @("-h","127.0.0.1","-U","postgres","-d","kinalys")
$tid  = "108810fc-5c75-4c08-ab68-1e6ffd0555b0"
# Usage:  & $psql @db -c "SELECT ..."   |   Clean pull: & $psql @db -t -A -c "SELECT ..."
# Single-quote $tid inside SQL (bare interpolation -> "trailing junk after numeric literal").
```
```powershell
# Direct API call (bypass frontend)
$headers = @{ "X-Demo-User-Id" = "<user-uuid>" }
Invoke-RestMethod -Uri "http://127.0.0.1:3000/flags/pending" -Headers $headers -Method GET | ConvertTo-Json -Depth 4
```

**Reseed (demo-only):** from `apps\api`: `npx tsx --no-cache src\migrations\reseed_demo_data.ts` (dry-run default; `--execute` writes). Snapshot before `--execute`.

## 4. PATHS & REPOS
- **API:** `C:\Users\sssan\Documents\projects\kinalys-platform\apps\api` (note `projects\`). Dotenv: `...\kinalys-platform\.env`.
- **Frontend:** `C:\Users\sssan\Documents\kinalys-web` (edit `src`).
- **GitHub org NEXUSLPMS:** `kinalys-platform` (API), `kinalys-web` (frontend).
- **Demo tenant** "Veridian Solutions": `108810fc-5c75-4c08-ab68-1e6ffd0555b0`.
- **Cycles:** Q1 `0705466e-0ec5-4530-b11f-4a39c86613b5` (Jan) · Q2 `28422b1f-3c3b-48c1-ae91-cfa668127cec` (Apr) · Q3 `85e04121-97a8-499a-bdc6-7ab1171f70be` (Jul, is_current).

## 5. LIVE PERSONA REFERENCES (demo instance)
**Drilled (hand-calibrated narratives, WS2 — verified):**
| Persona | UUID | Story | Q1/Q2/Q3 overall |
| --- | --- | --- | --- |
| Mariam Al Hashimi | `5a89cd93-91d5-4d40-98ff-bc9ad165142f` | Masked-red: AHT cratering (200/180, red) behind 3 greens | 86.6 / 83 / 77.6 |
| Rajan Pillai | `93d72504-7837-48e7-9eba-4d6fdf55e735` | Declining → PIP candidate (COPC) | gentle decline |
| Vikram Singh | `6269c1af-b768-40f8-a463-0930b7c6c0c2` | Stable top of cohort (IT/Six Sigma, DPMO amber) | stable ~93.6 |
| Suresh Iyer | `fe858eb0-6b4f-4032-b816-e87ac7eaacff` | Release narrative (cratering → departed). **employment_status = departed** | 43.5 (excluded from active org view) |
| Fatima Al Zaabi | `cfef3b05-8415-4e02-b9a5-c144fcb0e761` | Declining sales / predictive-catch (BSC) | 91.6 / 81.1 / 73.9 |

**DemoSwitcher roster** (`kinalys-web/src/components/DemoSwitcher.tsx`, ASCII-safe, emoji dropped): 17 active personas across Leadership / Management / Employees, incl. Neha Joshi (super_admin), Sanmeet Sahni (hr_admin), Deepa Nair (executive/CXO), Vikram Singh, Rajesh Kumar, Kavya Reddy (managers), Aryan Kapoor + Fatima Al Zaabi (Sales/BSC), Mariam, Rajan, Priya (COPC), Khalid (QA), Mohammed Al Rashid (Finance/BSC), etc. **Suresh Iyer NOT in switcher** (departed; demoed as history via manager view).

> Full org distribution, departed list, and persona partition: PRD Decision 83 / TRD §7.

## 6. CURRENT STATE (W6D2 — demo-fix workstream COMPLETE)
All committed/pushed. Latest: platform `d5b2da1`, web (exec bands + natural-units) `f09d1ad`.

**Done & verified this sprint (W5D7–W6D2):**
- **Scoring engine** permanent (`services/scoring.ts`): single `scoreKpi` path, Option-2 RAG, pg-numeric coercion, Six Sigma sigma bands. 34/34 tests. (TRD §2)
- **BSC templates** corrected + **promoted to SYSTEM master catalog** (tenant_id NULL); 216 assignments re-pointed; `unit`+`direction` cols added. (PRD D78, TRD §4.1)
- **Demo data reseed** complete: CSAT fixed ("of 4.2" not "of 90"), natural-unit actuals (₹/count/%), drilled narratives calibrated, population reshaped all 3 cycles, **per-cycle jitter drift** fixed (no more identical quarters). Assertions green: **active distribution 5 High / 27 Medium / 7 NI (of 39)**.
- **Scorecard display** (`Scorecard.tsx`): `fmtKpiValue` natural units (₹4.75L, "95 of 100"); overall + bars use stored engine score (not actual/target recompute). Backend route joins template for `metric_type`/`unit`. (TRD §2.2)
- **Exec dashboard** (`ExecDashboard.tsx`): bands aligned to scoring thresholds 90/75; departed excluded; shows 5/27/7 active — consistent with scorecards + reseed.
- **DemoSwitcher** repositioned + ASCII-safe; Fatima added.
- **UI spot-check** done: Aryan (strong BSC ✓), Fatima (declining ✓), Mariam (masked-red AHT bar red ✓), Mohammed (3-cycle trend now varies ✓), exec dashboard (5/27/7 ✓).
- **Docs:** PRD v23 + TRD v1 updated with Decisions 80–83, Rules 41–43, post-demo backlog (§12.1).

**Open (non-blocking):**
- Logo swap — awaiting designer white-text/transparent asset (App.tsx header ~L207, loading ~L144, login ~L64).
- Optional sibling-page polish: COPCScorecard uses engine score correctly (raw display acceptable, no currency KPIs) — left as-is.

## 7. PATH TO GO-LIVE
| Window | Dates | Work |
| --- | --- | --- |
| Pre-demo polish | 17–22 Jun | Logo, final demo run-throughs, demo script (1 A4, 5 beats), night-before SQL reset checklist |
| AWS deployment | ~22–29 Jun | EC2 + RDS + Nginx + PM2 + SSL + S3 + CloudWatch · ap-south-1 · no new builds in window |
| **Investor demo** | **24–30 Jun** | In-person Pune · $1M pre-seed ask · live URL + local backup · 5-beat narrative |
| Client demos | Jul 2026 | First enterprise demos (India BPO/ITeS ICP) |
| **TASK 0** | Post-demo, FIRST | **Strip all temporary demo fixes** (PRD §0) — blocks all other post-demo work |
| Post-demo build | Jul–Aug | Per PRD §12.1: DEMO_MODE separation, configurable per-dept bands (D82/D83), avatar system (D81), integration-first onboarding (D73/D74), pulse survey (D76), employee self-service trend, Org Memory T2-3, OKR cascade, export layer, encoding cleanup |
| **Go-Live** | **15 Aug 2026** | Production on AWS · real users · first paying tenants |
| GCC expansion | Year 2 | UAE/KSA/Qatar · ADGM · Hub71 |

## 8. DEMO-DAY HYGIENE
- **Night-before SQL reset** before each live run (reset flag statuses for lifecycle demos; confirm Q3 is_current; confirm distribution 5/27/7).
- **Hard-restart API** after any backend change (rule 12). Confirm with direct `Invoke-RestMethod`.
- **Live URL + local backup** both ready; rehearse the fallback.
- Demo cast/arc locked. Persona switch via DemoSwitcher (centered teal-header pill).

---
*V23 supersedes V21/V22 for operational context. For product spec, decisions, schema, and technical reference, see **PRD v23** and **TRD v1** — those are authoritative and not restated here.*
