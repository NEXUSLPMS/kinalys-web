# QA Findings — task_011 (D5/D6: PRD/TRD Compliance + Config/DevOps + Encoding Debt)

**task_id**: task_011 · **repo**: kinalys-web · **dimension**: D5/D6 (compliance, config)
**model**: Sonnet 4.6 (intended Sonnet 4.6 — correct tier)
**date**: 2026-06-22
**scope**: Frontend PRD/TRD compliance (Decision 82, module coverage matrix), hardcoded config (API_URL, Auth0 audience), encoding debt (mojibake in client.ts). Note: docs/ folder in kinalys-web is EMPTY — no PRD/TRD copies; PRD coverage matrix cannot be assessed from this repo without reaching into kinalys-platform (out of scope). Coverage matrix → N/A with reason below.
**findings**: W-025 (S3) · W-026 (S4)
**running totals (kinalys-web) after this task**: 🔴 S1: 0 · 🟠 S2: 3 · 🟡 S3: 10 · 🟢 S4: 13 = **26 findings**

---

## W-025 · 🟡 S3 · Hardcoded `API_URL` and Auth0 audience in source — any production deployment requires source edits (D6 config)

**QA dimension**: D5/D6 · **Config items**: deployment-config, environment separation

**What happens**:

**`API_URL = 'http://localhost:3000'`** (client.ts:8) — the backend base URL is a hardcoded string constant in the source file, not an environment variable. CRA exposes `process.env.REACT_APP_*` variables to the frontend at build time; none are defined for the API endpoint. A production build of kinalys-web currently sends every API request to `localhost:3000`, which would fail entirely in any browser that is not running the API server locally.

**Auth0 audience `'https://api.kinalys.io'`** (App.tsx:116) — the Auth0 authorization audience is also a hardcoded string literal in `getAccessTokenSilently({ authorizationParams: { audience: 'https://api.kinalys.io' } })`. This is the production audience value. It is neither a `REACT_APP_*` env var nor a runtime config. Staging environments that might use a different audience (e.g., `https://api-staging.kinalys.io`) would need source changes.

**The `.env` file** contains only `REACT_APP_DEMO_MODE=true` — and that variable is never read in any src file (confirmed task_003 grep: zero `process.env` references). So the env system exists but is unused for the two most critical config values.

**Impact**: S3 — go-live deployment blocker. `http://localhost:3000` in a production build means the entire API layer is broken outside a developer machine. This is not exploitable by an external attacker but it is a hard blocker for any deployment. The Auth0 audience hardcode is lower severity (the production audience value is correct), but it prevents clean environment separation (dev/staging/prod audience variants).

**Suggested fix**:
1. Add `REACT_APP_API_URL=http://localhost:3000` to `.env` (for local dev).
2. Add `REACT_APP_API_URL=https://api.kinalys.io` (or the prod URL) to `.env.production`.
3. Change client.ts:8 to `const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'`.
4. Similarly: `REACT_APP_AUTH0_AUDIENCE` env var → read in App.tsx getAccessTokenSilently call.
5. Add `.env.example` (non-secret, checked in) documenting all `REACT_APP_*` vars needed.

---

## W-026 · 🟢 S4 · Mojibake encoding debt in client.ts — box-drawing characters stored as corrupted UTF-8 sequences (D6 encoding)

**QA dimension**: D6 · **Encoding items**: source file encoding consistency

**What happens**: Three comment lines in `src/api/client.ts` contain corrupted Unicode:
- Line 3: `// â"€â"€â"€...` (should be `// ────...`)
- Line 6: `// â"€â"€â"€...` (should be `// ────...`)
- Line 35: `// â"€â"€ API functions â"€â"€...` (should be `// ── API functions ──...`)

The U+2500 BOX DRAWINGS LIGHT HORIZONTAL character (`─`, UTF-8: `0xE2 0x94 0x80`) is being interpreted as three separate Latin-1 characters (`â`, `"`, `€`) — the classic UTF-8-read-as-Latin-1 mojibake pattern. This means the file was at some point edited in an editor configured for Latin-1/ISO-8859-1 (or a terminal/copy-paste path that garbled the encoding), and the garbled bytes were saved back.

**Impact**: S4 — cosmetic only; TypeScript and the browser ignore comments entirely. There is no runtime effect. However, it signals inconsistent editor/encoding configuration in the dev environment, which could cause problems if it spreads to string literals or template literals in the future. It also impedes readability for developers who see noise in a key file.

**Suggested fix**: Open `client.ts` in VS Code (which will detect UTF-8), find-and-replace `â"€` with `─` on lines 3, 6, and 35, and save. Add `"files.encoding": "utf8"` to the project's `.vscode/settings.json` (or an `.editorconfig` with `charset = utf-8`) to prevent recurrence.

---

## PASS / N/A items

| Item | Status | Notes |
|---|---|---|
| PRD module coverage matrix | N/A — CANNOT ASSESS | `docs/` folder in kinalys-web is empty (no PRD/TRD copies). Audit rule: do not reach into kinalys-platform. Based on the 31 page imports and canSee() matrix in App.tsx, the frontend appears to cover all major PRD modules (Scorecard, KPIs, OKR, BSC, COPC/SixSigma, Talent Grid, HR Flags, Departures, One-on-One, AI Coaching, KB, Learning/Certs, Recommendations, Predictive, PKT Engine, Competency, Org/User Management, Audit Log, Add-ons, Support, HR Admin, PIP Checkins, Account Settings). Cannot verify completeness or fidelity against PRD without the PRD document. Cross-reference in kinalys-platform audit (that repo has docs/). |
| Decision 82 — tenant-configurable RAG bands | → W-004 | Already recorded task_004. Frontend hardcodes ≥90/≥80/≥75/<70 thresholds across 36 places in 10 files. Not re-raised; cross-ref W-004. |
| `REACT_APP_DEMO_MODE` env var | ⚠ Exists-but-unused | `.env` sets `REACT_APP_DEMO_MODE=true` but zero src files read `process.env.REACT_APP_DEMO_MODE`. Flag is set as if gating was planned but not implemented — additional evidence for W-002. Not a new finding. |
| `package-lock.json` lockfile | ✅ PASS | Exists at repo root (confirmed task_009). Pinned installs. |
| `.env` not in `.gitignore` | ⚠ MINOR | `.env` contains only `REACT_APP_DEMO_MODE=true` (no secrets). However, if env vars are added in future (API keys, client secrets), the file could accidentally commit secrets. Standard practice is to `.gitignore` `.env.local`/`.env.production` and only commit `.env.example`. Not a current finding (no secrets present), but noted for when W-025 is remediated. |
| CRA source maps in production | → task_013 | `GENERATE_SOURCEMAP` not set to `false` in `.env`; CRA default ships `.map` files to production. Security/info-disclosure concern assessed in task_013 (deps/build security). |
| `window.location.reload()` usage | → W-006 | Already recorded (CourseCatalog.tsx). Cross-ref only. |
| State-based nav vs TRD intent | N/A | No TRD copy available in this repo to verify documented intent. The no-router design is a stated stack fact (CLAUDE.md: "state-based navigation, no router — intentional"). |

---

## Summary of config gap cluster
These three items form a related cluster that should be remediated together:

| Issue | ID | Fix vehicle |
|---|---|---|
| API_URL hardcoded to localhost | W-025 | `.env` + `REACT_APP_API_URL` env var |
| Auth0 audience hardcoded | W-025 | `.env` + `REACT_APP_AUTH0_AUDIENCE` env var |
| DEMO_MODE env var set but not read | W-002 (additional evidence) | Read `REACT_APP_DEMO_MODE` in DemoSwitcher/App.tsx to gate demo surfaces |

All three are naturally resolved in the same sprint: "wire up the env system" as part of the DEMO_MODE separation work (W-002 fix).

---

## Carries to other tasks
- **PRD coverage matrix** → cannot assess in this repo; flag for cross-reference when reviewing kinalys-platform audit findings (that audit covers PRD compliance from the backend perspective).
- **Source maps in production** → task_013.
- **`.env` gitignore hygiene** → task_013 (build/DevOps).

## Next pending
**task_012** (PRIVACY/IF — frontend investor-feedback surfaces: BriefViewerModal IF-008 data display, PrivacyAcknowledgementModal + PIP-ack UI IF-001/003, OneOnOne sign-off, AI content render). `intended_model: Opus 4.8 High` — a tier UP from running Sonnet 4.6; operator must `/model opus` before **"resume the audit"** for this task.
