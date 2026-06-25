# QA Findings — task_012 (PRIVACY / Investor-Feedback Frontend Surfaces)

**task_id**: task_012 · **repo**: kinalys-web · **dimension**: PRIVACY/IF
**model**: Opus 4.8 High (intended Opus 4.8 High — correct tier; privacy reasoning)
**date**: 2026-06-22
**scope**: Frontend-checkable investor-feedback items — IF-008 (BriefViewerModal: does the brief UI render PIP/behavioral data?), IF-001/003 (acknowledgement UI: PrivacyAcknowledgementModal, PIP-ack flow, 1-on-1 sign-off), IF-007 (clipboard/XSS on AI-generated content). Backend IF findings (platform F-056 et al.) cross-referenced conceptually; platform code NOT read.
**findings**: W-027 (S3) · W-028 (S4)
**running totals (kinalys-web) after this task**: 🔴 S1: 0 · 🟠 S2: 3 · 🟡 S3: 11 · 🟢 S4: 14 = **28 findings**

---

## W-027 · 🟡 S3 · Role Intelligence Brief viewer renders the AI narrative verbatim with no client-side sensitivity gate; component's stated audience ("successor's manager") is broader than its realized HR-only gating (IF-008)

**QA dimension**: PRIVACY/IF · **Investor item**: IF-008 (data minimization in departure briefs) · **Cross-ref**: platform **F-056** (backend over-includes PIP/behavioral/manager-only data in the brief)

**What the frontend does — the good part**: `BriefViewerModal.tsx` renders **only structured handover fields** — there is no dedicated "PIP History" or "Performance Flags" section in the UI. It displays: `executive_summary` (line 122), `knowledge_areas[]` (130-138), `key_relationships[]` (148-156), `open_threads` (166), `recommended_onboarding_focus` (175), and a provenance footer (181-188). So the frontend does **not independently re-surface** raw disciplinary fields even if they are present in the payload. All fields render as escaped React children (no `dangerouslySetInnerHTML`) — IF-007 XSS PASS.

**The concern**: The viewer **trusts the backend brief payload entirely** and has no client-side redaction or sensitivity awareness. Two specific exposures:

1. **Disciplinary content can bleed through the AI prose.** `executive_summary` and `open_threads` are AI free-text that the backend (per platform F-056 recon) synthesizes from a prompt that includes PIP history, behavioral flags, `final_outcome_notes` (HR disciplinary notes), and `is_manager_only` 1-on-1 notes. The viewer faithfully renders whatever narrative the model produced — so sensitive content can reach the reader **embedded in prose**, even though there is no labelled "PIP" section. The frontend has no way to detect or strip this; the only control point is the backend (F-056).

2. **Audience-intent mismatch.** The component's own header comment states the audience is *"a handover document for the successor's manager"* (BriefViewerModal.tsx:11). But the **realized** UI gating restricts who can open it to HR/exec only:
   - `HrDeparturesInbox.tsx:470` invokes it — `canSee('departures')` = `super_admin, hr_admin, executive` (App.tsx:183)
   - `UserManagement.tsx:491` invokes it — `canSee('users')` = `super_admin, hr_admin` (App.tsx:170)

   So today the brief is **HR-gated, not exposed to arbitrary line managers** — a real mitigating factor; the IF-008 wrong-audience leak is **not currently realized in the frontend**. However, the stated intent ("successor's manager") signals a planned broadening of the audience. If a future "share with incoming manager" feature is wired up before backend F-056 lands, the sensitive-prose exposure becomes a live leak to a non-HR audience.

**Impact**: S3 — conditional/defense-in-depth. Right now the realized audience (HR/exec) is appropriate for a departure brief, so this is not an active breach. It is S3 because: (a) the frontend provides **no defense-in-depth** — it will render whatever the backend sends, so it depends entirely on F-056 being fixed; and (b) the documented intent to widen the audience is a latent risk that must be sequenced *after* F-056. This is the frontend half of an investor-flagged item, so it warrants tracking even though the primary fix is server-side.

**Suggested fix**:
1. Primary fix is backend **F-056** (minimize what the brief harvests/synthesizes) — coordinate; the frontend cannot fix the prose.
2. Defense-in-depth on the frontend: add a confidentiality banner to the modal ("Confidential — HR handover document; contains performance synthesis. Do not redistribute.") so the sensitivity is explicit to the HR viewer.
3. **Do not wire BriefViewerModal to a non-HR ("successor's manager") audience until F-056 is resolved.** Update the component comment to reflect the actual HR-only audience to avoid a future developer broadening it inadvertently.

---

## W-028 · 🟢 S4 · Acknowledgements and sign-offs record a boolean but never surface an evidentiary receipt — the "timestamped, cannot be undone" claim has no visible artifact (IF-001/003)

**QA dimension**: PRIVACY/IF · **Investor items**: IF-001 (acknowledgement capture), IF-003 (employee-file evidence / digital signature)

**What happens**: All three acknowledgement/sign-off flows capture the action but, after completion, display only a boolean confirmation — never the evidentiary record (when, what version, what was captured):

1. **PIP acknowledgement** (App.tsx:560-597): The UI shows the right *intent* copy — *"By acknowledging you confirm you have read and understood this PIP. This action is timestamped and cannot be undone."* (App.tsx:588). On success it flips to *"✅ You have acknowledged this PIP. Your improvement plan is now active."* (App.tsx:595). But: (a) the "timestamped" claim is asserted with **no visible timestamp** shown back to the employee; (b) no PIP **version** concept is sent or displayed (`acknowledgePip(myPip.id, pipAckResponse)` — App.tsx:575 — sends only id + optional response); (c) the employee's own captured response is not echoed back as part of the record; (d) failure uses `alert()` on a critical compliance flow (already **W-012**).

2. **1-on-1 sign-off** (OneOnOne.tsx:109-144): Strong validation gate before sign-off (mandatory-section comments + needs_attention reasons — OneOnOne.tsx:113-130) — a genuine positive. Dual sign-off is tracked (`manager_signed_off` / `employee_signed_off`). But the UI displays only **"Done" / "Pending"** badges (OneOnOne.tsx:283-284, 318-319) — no signed-off timestamp, no identity of who signed, no version of the session content that was signed. For a "digital sign-off" feature (the page subtitle markets it as such — OneOnOne.tsx:172) the evidentiary display is a binary flag.

3. **Privacy acknowledgement** (PrivacyAcknowledgementModal — task_008): sends the `currentVersion` (good — version is captured) and the backend records IP/UA. This is the **strongest** of the three on capture, but the UI still shows no post-acknowledgement receipt to the user.

**Why it matters**: IF-003 is about the employee file holding **evidence** of acknowledgement (the digital-signature pattern). The capture appears to happen server-side (timestamps, and version for privacy), but the **frontend never closes the loop** by showing the employee/manager a receipt of what they signed, when, and which version. For a disciplinary PIP especially, the acknowledging employee should be able to see "You acknowledged PIP v2 on 22 Jun 2026 14:30; your response was recorded" — both for trust and for dispute defensibility.

**Impact**: S4 — the underlying capture largely happens (this is a display/UX completeness gap, not a data-loss gap); the privacy modal even captures version correctly. Low severity, but it weakens the evidentiary story that IF-001/003 are specifically about, and the asserted "timestamped" language without a visible artifact is a minor trust/credibility gap.

**Suggested fix**: After each acknowledgement/sign-off, render a small receipt block: *"Acknowledged [version] on [timestamp]"* (and, for PIP, echo the captured response; for 1-on-1, show signer + time). For PIP, introduce/display a version identifier consistent with the privacy-ack pattern. Replace the PIP-ack `alert()` failure with inline error (W-012).

---

## PASS / N/A items

| Item | Status | Notes |
|---|---|---|
| IF-007 — clipboard/XSS on AI content | ✅ PASS | BriefViewerModal renders all AI fields as escaped React children (`{brief.executive_summary}`, `{k.area}`, etc.) — no `dangerouslySetInnerHTML`. AICoaching and Recommendations same (confirmed task_002). The only raw-HTML sink app-wide is KnowledgeBase (W-001), unrelated to AI content. No clipboard auto-copy of sensitive content found. |
| BriefViewerModal — request lifecycle | ✅ PASS (notable) | Uses a `cancelled` flag in the `useEffect` cleanup (BriefViewerModal.tsx:35,41,43,45,49) to guard against setState-after-unmount — the **one** component that handles this correctly (contrast W-024). Good pattern; should be generalized. |
| BriefViewerModal — provenance/disclaimer | ✅ PASS | Footer states *"AI-generated synthesis… Review and verify before acting on it"* (line 188) + model/time/token provenance — appropriate AI-transparency framing. |
| 1-on-1 mandatory-section validation | ✅ PASS | handleSignOff blocks sign-off until mandatory sections have comments and needs_attention ratings have reasons (OneOnOne.tsx:113-130). Strong governance UX. |
| IF-008 — frontend re-surfaces raw PIP/flag fields? | ✅ PASS (mitigated) | The viewer has NO dedicated PIP/flag/disciplinary section; it renders only handover-structured fields. Sensitive content can only appear via AI prose (→ W-027, backend F-056). Realized audience is HR-gated (not line managers). |
| PIP-ack intent copy | ✅ PASS | "timestamped and cannot be undone" + "confirm you have read and understood" — correct consent framing (receipt display gap → W-028). |
| Privacy-ack version capture | ✅ PASS | PrivacyAcknowledgementModal sends `currentVersion`; backend captures IP/UA (per recon). Best-of-three on capture. |

### Cross-references (not re-raised)
- **Backend F-056** (brief over-includes PIP/behavioral/manager-only data) — the root cause behind W-027's prose-leak vector. Frontend cannot fix; must be sequenced before any audience broadening.
- **W-012** — PIP-ack failure uses `alert()` (App.tsx:579); a critical-flow instance of the no-toast finding.
- **W-019** — BriefViewerModal/MarkAsDepartedModal lack focus-trap/Escape/dialog ARIA (a11y).
- **W-024** — request-cancellation gap; BriefViewerModal is the positive exception (cancelled-flag pattern).
- **W-001** — KnowledgeBase is the sole raw-HTML XSS sink; AI-content surfaces are clean.

---

## Carries to other tasks
- **Backend F-056 coordination** → cross-repo remediation tracking (kinalys-platform audit owns the harvest/minimization fix).
- **BriefViewerModal confidentiality banner + audience-comment correction** → bundle with F-056 remediation.
- **Acknowledgement receipts (version/timestamp display) + PIP version concept** → privacy/audit-trail hardening (Tier-1 readiness).

## Next pending
**task_013** (D2/D9 — Frontend dependency CVEs + build security: xlsx@0.18.5 CVE-2023-30533/CVE-2024-22363, react-scripts 5.0.1 unmaintained CRA, jspdf, unused @anthropic-ai/sdk, GENERATE_SOURCEMAP not disabled, lockfile/SRI). `intended_model: Opus 4.8 High` — same tier as the running model; no switch needed. This is the **final task** in the kinalys-web queue.
