# QA Findings — task_003 (ARCH: DEMO_MODE / NODE_ENV Separation Gap)

**task_id**: task_003 · **repo**: kinalys-web · **dimension**: ARCH (demo-vs-prod boundary)
**model**: Opus 4.8 (intended Opus 4.7 — over-powered, permitted; single non-security-critical architectural finding)
**date**: 2026-06-22
**scope rule (prompt §0.5)**: Exactly ONE S2 architectural finding is permitted for the demo scaffolding — recorded once, pointing at `audit/DEMO_SCAFFOLDING_INVENTORY.md`. No per-artifact demo findings.
**findings**: W-002 (S2)
**running totals (kinalys-web) after this task**: 🔴 S1: 0 · 🟠 S2: 2 · 🟡 S3: 0 · 🟢 S4: 0 = **2 findings**

---

## W-002 · 🟠 S2 · Frontend demo scaffolding is not gated behind `DEMO_MODE`/`NODE_ENV` — nothing is environment-gated (architectural)

**OWASP**: A05:2021 Security Misconfiguration · **QA dimension**: D1/D7 (demo-vs-prod boundary)
**Locations** (the demo surface, per `DEMO_SCAFFOLDING_INVENTORY.md`): `DemoSwitcher.tsx` (whole component + `DEMO_PERSONAS`) · mounted `App.tsx:775` · `client.ts:19-26` (X-Demo-User-Id interceptor) · `App.tsx:458-480` (Fire Breach Alert card) · `TalentGrid.tsx` + `KnowledgeBase.tsx` (seed buttons)

**Decision context**: PRD Task 0 / DEMO_MODE separation has not run. The matching operational rule is that a production build must strip or gate demo scaffolding, and the production frontend must never attach `X-Demo-User-Id`. This finding measures the current build against that target.

### The core defect: zero environment gating

A repo-wide grep across `src/` for `process.env`, `NODE_ENV`, `isDev`, and `DEMO_MODE` returns **zero hits**. **Nothing in the frontend is environment-aware.** Every demo artifact therefore renders/activates in **any** build, including a production bundle:

| Demo surface | Location | Gated? |
| --- | --- | --- |
| `<DemoSwitcher />` persona-switcher (impersonate any of 17 personas) | `App.tsx:775` (mount) + `DemoSwitcher.tsx` | ❌ No — comment says "Always show in development" but there is no check |
| `X-Demo-User-Id` axios interceptor (attaches impersonation header to every request) | `client.ts:19-26` | ❌ No — fires whenever the localStorage key is set |
| "🔔 Fire Breach Alert" demo card on the home dashboard (mutates live KPI/alert state) | `App.tsx:458-480` | ❌ No — rendered unconditionally on the authenticated home page |
| "Seed Demo Scores" / "Seed Articles" buttons | `TalentGrid.tsx`, `KnowledgeBase.tsx` | ❌ No |

### Why this is S2 (architectural, not a per-artifact bug)

The demo scaffolding itself is intended demo-instance code (inventoried, not individually flagged). The finding is that **the build has no demo-vs-prod boundary at all**: there is no single env flag, no conditional mount, no build-time exclusion. Consequences if shipped as-is:
1. **Impersonation UI in production.** `DemoSwitcher` lets a user set any persona's `user_id`; combined with the ungated `X-Demo-User-Id` interceptor and the backend's demo path, this is a client-driven identity override. (The backend gates its read behind `DEMO_MODE` — platform F-066 — but the frontend should not ship the mechanism at all.)
2. **A live-mutation "Fire Breach Alert" button on every user's dashboard** — end users would see and could trigger demo state changes.
3. **Bundle exposure** — `DEMO_PERSONAS` (17 real names + UUIDs) ships to every client.

This is the frontend analog of platform finding **F-066**; both must be resolved together as the DEMO_MODE-separation work.

### Suggested fix (DESCRIBE — not applied)
1. Introduce a single build-time flag (`process.env.REACT_APP_DEMO_MODE === 'true'`, default false in prod). Gate **all** of: the `<DemoSwitcher/>` mount, the `DemoSwitcher` module, the `X-Demo-User-Id` interceptor, the Fire-Breach-Alert card, and the seed buttons behind it — so a production build tree-shakes them out entirely.
2. Production bundle must never attach `X-Demo-User-Id` (mirror the backend "prod ignores the header" rule).
3. Move `DEMO_PERSONAS` into the demo-gated module so it is excluded from prod bundles.
4. Track against PRD Task 0 strip-list; pair with platform F-066.

### Cross-references
- `audit/DEMO_SCAFFOLDING_INVENTORY.md` — the authoritative artifact list this finding governs; doubles as the frontend separation spec (§F = what prod must strip/gate).
- Platform **F-066** (kinalys-platform) — the backend half of the same boundary (referenced for context; platform code not read this session).
- **W-001** — independent (KB XSS); not part of the demo boundary.

---

## Scope confirmation (no per-artifact findings raised)
Per prompt §0.5, the demo scaffolding inventoried in Phase 0 is **not** flagged per-artifact. task_003 produced exactly one finding (W-002), the architectural separation gap. All specific demo artifacts remain catalogued in `DEMO_SCAFFOLDING_INVENTORY.md`.

## Next pending
**task_004** (D7 — frontend architecture & correctness: component architecture, state-based navigation, `window.location` usage, prop/type validation, loading/error states, Decision-82 hardcoded performance bands). `intended_model: Opus 4.7` — a tier DOWN from the current Opus 4.8 (over-powered, permitted). Operator may `/model` down or proceed.
