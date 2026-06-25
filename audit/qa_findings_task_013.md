# QA Findings — task_013 (D2/D9: Frontend Dependency CVEs + Build Security)

**task_id**: task_013 · **repo**: kinalys-web · **dimension**: D2/D9 (deps + build security)
**model**: Opus 4.8 High (intended Opus 4.8 High — correct tier)
**date**: 2026-06-22
**scope**: package.json + package-lock.json dependency CVE audit (xlsx, jspdf, react-scripts/CRA, @anthropic-ai/sdk), build config (source maps, lockfile, SRI), .env/.gitignore hygiene. security-audit.md items 96-98.
**findings**: W-029 (S3) · W-030 (S4)
**running totals (kinalys-web) after this task**: 🔴 S1: 0 · 🟠 S2: 3 · 🟡 S3: 12 · 🟢 S4: 15 = **30 findings**

> **FINAL task in the kinalys-web Pass A queue.** See closing summary at end.

---

## W-029 · 🟡 S3 · `xlsx@0.18.5` ships two known unpatchable CVEs and parses user-uploaded spreadsheets client-side — the exploitable parse path (CVE-2023-30533 prototype pollution) (item 96)

**QA dimension**: D2/D9 · **Checklist item**: 96 (dependency CVE audit) · **Cross-ref**: platform **F-075** (same package, distinct backend instance)

**What happens**: `package-lock.json:17668-17671` confirms `xlsx@0.18.5` is installed. This version carries two published advisories, **neither fixable by an npm upgrade**:

| CVE | Type | Severity | Fixed in |
|---|---|---|---|
| CVE-2023-30533 | Prototype Pollution | High | 0.19.3 — **CDN-only** |
| CVE-2024-22363 | ReDoS (Regular Expression DoS) | High | 0.20.2 — **CDN-only** |

The critical detail: **SheetJS stopped publishing to the npm registry after 0.18.5.** The fixed versions (0.19.3+, 0.20.2+) exist only on the SheetJS CDN (`cdn.sheetjs.com`). So `npm install xlsx` resolves to the **permanently vulnerable** 0.18.5 — there is no `npm update` path. `npm audit` flags this as unresolvable.

**The exploitable surface is the parse path.** xlsx is used in two places:
- **`KpiTemplates.tsx:2`** — `import * as XLSX from 'xlsx'` — parses **user-uploaded spreadsheets** (the KPI template import). `XLSX.read()` on attacker-controlled file content is the prototype-pollution attack vector (CVE-2023-30533).
- **`utils/reportExport.ts:3`** — uses xlsx to *write* export files (lower risk; output path, not parse).

ImportUsers (the bulk user-import wizard) is also a likely xlsx parse consumer. Any flow where a user uploads an `.xlsx` and the client calls `XLSX.read()` on it is exposed: a crafted spreadsheet can pollute `Object.prototype`, potentially leading to client-side property-injection / denial-of-service in the user's browser session.

**Impact**: S3 — client-side prototype pollution is browser-session-scoped (not server RCE), and the upload flows are gated to HR-admin roles (KpiTemplates/ImportUsers are `canSee('kpi')`/`canSee('import')` = `super_admin, hr_admin`). The blast radius is therefore an authenticated HR admin uploading a malicious file (or being tricked into it). But it is a genuine, published, unpatchable CVE on a parse path with attacker-controllable input. Same package and finding-class as platform **F-075**, but a distinct **client-side** instance (the backend parses server-side; this parses in the browser).

**Suggested fix**:
1. Migrate to the SheetJS CDN distribution: `npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` (gets the patched version off npm's stale copy).
2. Or replace with a maintained alternative: `exceljs` (actively maintained, on npm) for both parse and write.
3. Coordinate with platform F-075 — the fix decision (CDN vs replacement) should be consistent across both repos.

---

## W-030 · 🟢 S4 · Build/supply-chain hygiene cluster — CRA (react-scripts 5.0.1) is end-of-life, production source maps not disabled, unused `@anthropic-ai/sdk` dependency, and `.env` is committed (items 97, 98)

**QA dimension**: D2/D9 · **Checklist items**: 97 (lockfile/build config), 98 (SRI/source exposure)

**What happens** — four related build/supply-chain hygiene items, none individually high-severity:

**1. react-scripts 5.0.1 / CRA is end-of-life (package-lock.json:14161-14164).** Create React App was officially deprecated in 2025; `react-scripts` receives no further releases. This means:
- No future security patches for the build toolchain.
- `npm audit` reports numerous transitive advisories in the CRA dependency tree (webpack-dev-server, svgo, etc.) — **most are dev/build-time only** and do not ship in the production bundle. (Spot-check: the historically-flagged `nth-check` resolves to the **patched** 2.1.1, and `postcss` to 8.5.10 — both fixed, so the worst transitive offenders are already remediated in this lockfile.)
- The real concern is **structural**: an EOL build tool with no patch path is a Tier-1 readiness liability, not an active runtime exploit.

**2. Production source maps not disabled.** `.env` contains only `REACT_APP_DEMO_MODE=true` — `GENERATE_SOURCEMAP=false` is **not set**. CRA's default is to emit `.map` files into `/build`. A production deployment would therefore ship source maps that let anyone reconstruct the original TypeScript source (component logic, the `canSee()` role matrix, hardcoded thresholds, API shapes) from browser DevTools. Information disclosure — low impact (no secrets in frontend source per task_002), but it hands an attacker the full client logic.

**3. Unused `@anthropic-ai/sdk@0.91.1` dependency.** In `package.json` but imported nowhere in src (confirmed task_002/task_009 — zero imports, tree-shaken from the bundle). It is dead weight in the dependency tree — unnecessary supply-chain surface (a future compromise of that package's npm releases would be in the install tree for no benefit) and install-time bloat. `lucide-react@1.9.0` is similarly unused.

**4. `.env` is committed to git.** `.gitignore` (lines 16-19) ignores `.env.local` / `.env.*.local` but **not** `.env` itself — so `.env` (currently `REACT_APP_DEMO_MODE=true`) is tracked. No secret is exposed today (frontend env vars are public-by-design anyway), but the pattern is risky: when W-025 wires up real config, a developer could add a sensitive value to the committed `.env`.

**Impact**: S4 — collectively a hygiene/hardening cluster. None ships an exploitable runtime vulnerability today (source maps and committed `.env` are info-exposure with no secrets; CRA's shipped transitive vulns are patched in this lockfile; unused deps are tree-shaken). The aggregate matters for Tier-1 / early-adopter readiness, not for the demo.

**Suggested fix**:
1. **Migrate CRA → Vite** (the standard CRA successor). Resolves the EOL toolchain, dramatically speeds builds, and gives a maintained security patch path. This also unblocks easy code-splitting (W-021) and env handling (W-025).
2. Add `GENERATE_SOURCEMAP=false` to `.env.production` (or set `build:` script env) — or, if maps are wanted for error tracking, upload them to the error tracker and exclude from the public bundle.
3. Remove unused deps: `npm uninstall @anthropic-ai/sdk lucide-react`.
4. Add `.env` to `.gitignore` and commit a `.env.example` instead (pairs with the W-025 env-wiring work).

---

## PASS / N/A items

| Item | Status | Notes |
|---|---|---|
| 96. Dependency CVE audit | 🟡 W-029 + 🟢 W-030 | xlsx is the one genuinely exploitable runtime CVE; CRA transitive vulns are dev-time / already patched in lockfile. |
| 97. Lockfile pinning | ✅ PASS | `package-lock.json` present at root, fully resolved with integrity hashes (spot-checked xlsx/jspdf/react-scripts/nth-check/postcss). Reproducible installs. |
| 98. Subresource Integrity (SRI) | N/A | No external `<script>` tags in `public/index.html` (only the Google Fonts CSS `@import` → W-010). No third-party JS to SRI-pin. |
| jspdf@4.2.1 | ✅ PASS | Current major; no high-severity advisory at 4.2.1. Write-only (PDF generation), not a parse surface. |
| jspdf-autotable@5.0.7 | ✅ PASS | Current; no known advisory. |
| Secrets in bundle | ✅ PASS | Confirmed task_002 — `@anthropic-ai/sdk` imported nowhere; no API keys in frontend source. AI calls go via backend. |
| index.html meta | ⚠ MINOR | CRA default `<meta name="description" content="Web site created using create-react-app">` (index.html:10) and `<title>React App</title>` (→ W-018). Cosmetic; bundle with the W-018 title fix. |

---

## Carries / cross-references
- **xlsx fix decision** → coordinate with platform **F-075** (same package).
- **CRA → Vite migration** → unblocks W-021 (code-splitting), W-025 (env handling); a foundational Tier-1 task.
- **`.env` gitignore + `.env.example`** → bundle with W-025 (config env-wiring) and W-002 (DEMO_MODE separation).
- **Source maps** → set `GENERATE_SOURCEMAP=false` as part of the production build hardening.

---

## ═══ CLOSING SUMMARY — kinalys-web Pass A (read-only) COMPLETE ═══

All 13 tasks complete (task_001 Phase 0 + task_002..task_013 Phase 1). **30 findings**, all prefixed **W-**.

**Severity distribution:** 🔴 S1: 0 · 🟠 S2: 3 · 🟡 S3: 12 · 🟢 S4: 15 · 🔵 S5: 0

**The 3 S2 (High) findings — the go-live spine:**
- **W-001** — Stored XSS via unsanitized `renderMarkdown` + `dangerouslySetInnerHTML` in KnowledgeBase (the sole raw-HTML sink).
- **W-002** — Demo scaffolding not gated behind DEMO_MODE/NODE_ENV (the single permitted demo finding; frontend analog of platform F-066).
- **W-003** — `setAuthToken()` never called; real (non-demo) API requests carry no bearer token → app functions only via the demo `X-Demo-User-Id` path.

**Thematic clusters across the S3/S4 findings:**
- **Accessibility** (W-017..W-020): keyboard-inaccessible nav, no semantic landmarks/headings, modal a11y gaps, no focus indicators — the largest single cluster; a11y patterns exist in-page but aren't applied to nav/shell.
- **Performance/scale** (W-013, W-016, W-021..W-024): no code-splitting, no pagination, no client cache, no re-render isolation — all imperceptible at demo scale, all degrade at production tenant scale.
- **Config/build readiness** (W-025, W-026, W-029, W-030): hardcoded localhost API, no env wiring, EOL CRA toolchain, xlsx CVEs.
- **Design-system drift** (W-004, W-007, W-009, W-010): hardcoded thresholds/colors, contrast failures, font loading.
- **Privacy/IF** (W-027, W-028): brief-viewer prose leak (latent, HR-gated, backend-F-056-dependent) + missing acknowledgement receipts.

**Notable systemic strengths** (recorded across tasks): comprehensive design-token system (9 themes), `prefers-reduced-motion` fully honored, consistent disabled-while-pending pattern, strong filtering UX (ExecDashboard/UserManagement), parallelized dashboard load (Promise.allSettled), AI content rendered as escaped text (no XSS beyond W-001), OneOnOne mandatory-section sign-off validation, BriefViewerModal request-lifecycle handling.

**Recommended remediation sequencing:**
1. **Go-live blockers:** W-003 (auth token), W-002 + W-025 (DEMO_MODE/env wiring — same sprint), W-001 (XSS sanitization), W-017/W-018 (keyboard + semantic HTML if a11y is committed).
2. **Pre-prod / Tier-1:** W-009 (contrast), W-011 (error boundaries), W-029 (xlsx CVE), W-030 (CRA→Vite), W-027/W-028 (privacy, with backend F-056).
3. **Post-Task-0 polish:** the remaining S4 cluster (W-006/007/010/012/013/014/015/016/019/020/022/023/024/026).

**Cross-repo coordination items:** W-002↔F-066, W-027↔F-056, W-029↔F-075.

**Audit posture:** READ-ONLY Pass A. No application source edited; all output in `audit/`. `qa_task_queue.json` (kinalys-web authoritative) and `qa_session_log.json` updated through session_013. Original kinalys-platform `qa_task_queue.json` remained FROZEN throughout (never touched). Ready for operator review → Pass B (doc-impact remediation) or platform-repo audit continuation.
