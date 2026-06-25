# QA Findings — task_008 (D7: UI Checklist Batch 4 — Accessibility & Inclusivity)

**task_id**: task_008 · **repo**: kinalys-web · **dimension**: D7 (UI checklist, a11y)
**model**: Opus 4.8 (intended Opus 4.7 — operator `/model opus`; correct/higher tier for a11y judgment)
**date**: 2026-06-22
**scope**: docs/ui-audit.md items 44-56 (Accessibility & Inclusivity) + a11y carries from task_005 (focus-visible, emoji icons, heading semantics, touch targets, static page title). Ties to IF-010 (voice/TTS) + IF-004 (theming).
**findings**: W-017 (S3) · W-018 (S3) · W-019 (S4) · W-020 (S4)
**running totals (kinalys-web) after this task**: 🔴 S1: 0 · 🟠 S2: 3 · 🟡 S3: 7 · 🟢 S4: 10 = **20 findings**

---

## W-017 · 🟡 S3 · Entire navigation is keyboard-inaccessible — nav items are clickable `<div>`s with no role/tabindex/key handler; no skip link (items 46, 55)

**QA dimension**: D7 · **Checklist items**: 46 (Make Everything Keyboard Navigable), 55 (Skip-To-Content Link)

**What happens**: Every sidebar navigation item is a bare `<div>` with an `onClick` handler and **no** `role="button"`/`role="link"`, **no** `tabIndex`, and **no** `onKeyDown` handler. Examples (App.tsx):
- `<div className="k-nav-item ..." onClick={() => setActiveNav('kb')}>Knowledge Base</div>` (App.tsx:302)
- `<div className="k-nav-item ..." onClick={() => setActiveNav('support')}>Support Tickets</div>` (App.tsx:303)
- Platform section items (App.tsx:314-317), Account Settings (App.tsx:323), and all ~28 nav items across the 5-6 collapsible sections follow this pattern.
- The collapsible **section headers** are also clickable `<div className="k-sidebar-label" onClick={toggleSection(...)}>` (App.tsx:310) — same gap.

Because `<div>` is not in the tab order and has no key handler, a keyboard-only user **cannot reach or activate any navigation item**. With the state-based nav (no router, no URLs — W-006), there is also no address-bar fallback to reach a page. The app is effectively operable by mouse only for navigation.

There is also **no skip-to-content link** (grep: zero `skip`/`#main` anchors), so even if the nav were focusable, a screen-reader/keyboard user would have to tab through all ~28 items on every interaction to reach `.k-main`.

**Impact**: S3 — this is a hard WCAG 2.1 AA failure (SC 2.1.1 Keyboard). It blocks keyboard-only and switch-device users from navigating the product. Not S2 only because the buttons *inside* each page (which use real `<button>` elements) remain operable once a page is rendered, and the demo/early-adopter audience is sighted-mouse users — but it is a go-live blocker for any accessibility commitment (and for public-sector / enterprise procurement that requires VPAT/WCAG conformance).

**Suggested fix**: Convert nav items to `<button>` (or add `role="button"` + `tabIndex={0}` + an `onKeyDown` that fires on Enter/Space). Same for the collapsible section headers (`role="button"` + `aria-expanded`). Add a visually-hidden-until-focused "Skip to main content" link as the first focusable element, targeting the `.k-main` landmark.

---

## W-018 · 🟡 S3 · No semantic landmarks, broken heading hierarchy, and static page title — the app has no document structure for assistive tech (items 49, 26, 56)

**QA dimension**: D7 · **Checklist items**: 49 (Use Proper Semantic HTML), 26 (Fix Semantic Heading Structure), 56 (Fix Page Titles and Language)

**What happens**:

**No landmark elements.** The shell is built entirely from `<div>`s: `.k-shell`, `.k-topbar`, `.k-sidebar`, `.k-main` are all plain divs (App.tsx + kinalys.css). There is no `<header>`, `<nav>`, `<main>`, or `<aside>` anywhere (grep for `<main`/`<nav`/`<header`/`<aside` = zero matches in src). Screen-reader users get no landmark map to jump between regions.

**Broken heading hierarchy.** Across all 31 pages there is exactly **one** real semantic heading — `<h1>Welcome back</h1>` on the home dashboard (App.tsx:72). Every other page renders its title as `<div className="k-page-title">` (a styled div, not a heading — kinalys.css:798). So:
- Most pages have **no `<h1>`** and no heading outline at all.
- The only other `<h1>`/`<h2>`/`<h3>` tags in the codebase are emitted *inside* the KnowledgeBase `renderMarkdown` injected HTML string (KnowledgeBase.tsx:32-34) — which is the unsanitized XSS sink (W-001), not structural page headings.
- PrivacyAcknowledgementModal uses `<h2 className="k-privacy-heading">` (PrivacyAcknowledgementModal.tsx:70) with no preceding `<h1>` in the modal context.

A screen reader's "navigate by heading" feature (a primary SR navigation mode) is therefore unusable — there is no document outline.

**Static page title.** `public/index.html` still ships the CRA default `<title>React App</title>` (recorded as a carry in task_005). Because nav is state-based (no router), the title **never updates** as the user moves between the 31 views — every browser tab/bookmark/history entry reads "React App". (`<html lang="en">` IS present in the CRA template — the language attribute passes.)

**Impact**: S3 — compounds W-017. Even a screen-reader user who could navigate would find no landmarks, no heading outline, and an unchanging meaningless page title. WCAG SC 1.3.1 (Info and Relationships), 2.4.2 (Page Titled), 2.4.6 (Headings and Labels).

**Suggested fix**: Replace the shell divs with `<header className="k-topbar">`, `<nav className="k-sidebar">`, `<main className="k-main">`. Render each page's `.k-page-title` as `<h1 className="k-page-title">`. Update `document.title` on `activeNav` change (a small `useEffect` mapping `activeNav` → a human title). Fix `<title>` in index.html to "Kinalys".

---

## W-019 · 🟢 S4 · Modals are not accessible — no focus trap or Escape, missing dialog ARIA on two of three modals, and a broken `aria-labelledby` reference on the third (item 53)

**QA dimension**: D7 · **Checklist item**: 53 (Build Fully Accessible Modals)

**What happens**: The app has three modal surfaces with inconsistent and incomplete a11y:

| Modal | `role="dialog"` / `aria-modal` | Focus trap | Escape to close | Notes |
|---|---|---|---|---|
| PrivacyAcknowledgementModal | ✅ (line 80) | ❌ none | ❌ (intentional — blocking) | `aria-labelledby="privacy-title"` **but no element has `id="privacy-title"`** — the heading is `<h2 className="k-privacy-heading">` with no id (line 70). The label reference is dangling → SR announces no accessible name. `autoFocus` on the button (line 97) ✅, `role="alert"` on error (line 87) ✅. |
| MarkAsDepartedModal | ❌ none | ❌ none | ❌ none | Rendered as a plain overlay `<div>`; background remains in the accessibility tree and is not `inert`/`aria-hidden`. |
| BriefViewerModal | ❌ none | ❌ none | ❌ none | Same — overlay div, no dialog semantics, no focus management. |
| Edit-employee modal (inline in UserManagement.tsx:387) | ❌ none | ❌ none | ❌ none | Inline `position:fixed` overlay div, no dialog role. |

Common failures: focus is never moved into the modal on open (except Privacy's `autoFocus`), focus is not trapped (Tab escapes to the background content behind the overlay), focus is not restored to the trigger on close, Escape does not dismiss, and the background is not hidden from screen readers.

**Impact**: S4 — modals function for mouse/sighted users and the blocking Privacy modal's single-button design limits the blast radius; the broken `aria-labelledby` is a real but contained SR defect. Escalates in importance alongside W-017/W-018 if accessibility conformance is committed. WCAG SC 2.4.3 (Focus Order), 4.1.2 (Name, Role, Value).

**Suggested fix**: Extract a shared `<Modal>` that: sets `role="dialog" aria-modal="true"` + `aria-labelledby` pointing at a real heading `id`; moves focus to the first focusable element on open; traps Tab/Shift+Tab within the dialog; restores focus to the trigger on close; closes on Escape (for non-blocking modals); and marks background content `inert`. Fix the dangling `id="privacy-title"` immediately (add `id="privacy-title"` to the Privacy heading) as a one-line fix.

---

## W-020 · 🟢 S4 · No visible keyboard focus indicator on interactive elements, and emoji icons lack `aria-hidden`/labels (items 47, 50, 9)

**QA dimension**: D7 · **Checklist items**: 47 (Add Clear Visible Focus Indicators), 50 (Meaningful Image Alt Text / icon labelling), 9 (Iconography)

**What happens**:

**Focus indicators.** The only element with a defined focus style is `.k-input` (`:focus` → border-color + `--k-shadow-focus`, kinalys.css:982-985). There is **no `:focus-visible` rule** anywhere in the stylesheet (grep: zero `focus-visible`), and `.k-nav-item` / `.k-btn` / clickable divs have no `:focus` style. Browsers' default outline is the only fallback — and on the clickable `<div>` nav items (which aren't focusable at all, W-017) there is nothing. A keyboard user who tabs through the in-page `<button>`s sees, at best, the inconsistent UA default outline; on themed dark backgrounds the default outline is often invisible. WCAG SC 2.4.7 (Focus Visible).

**Emoji-as-icon without labelling.** Interactive controls use raw emoji as their only icon/label in several places, with no `aria-hidden` (so SRs read the emoji name) or no accessible text:
- 🔔 notification bell button (App.tsx:407) — icon-only button, no `aria-label`
- ✖ close button (App.tsx:425) — announced as "heavy multiplication x"
- ⚙️ Account Settings (App.tsx:324), ✏️ Edit / 🗙 Remove buttons (UserManagement.tsx:360,367) — emoji prefix announced verbatim
- Section collapse carets ▶/▼ (App.tsx:311) — decorative, should be `aria-hidden`

The `StatRing` SVG correctly uses `aria-hidden="true"` (StatRing.tsx:47) — the right pattern, just not applied to emoji icons.

**Color-coded status — mostly OK.** RAG/status indicators are generally accompanied by a **text label** (e.g., status badges render `user.employment_status.replace(...)` as visible text — UserManagement.tsx:340; score bands render "High Performance"/"Needs Improvement" text — ExecDashboard). So item 54 (Don't Rely on Color Alone) is largely PASS for status, with the caveat that small RAG count dots and chart segments lean on color; noted as PARTIAL, not a finding.

**Impact**: S4 — polish/inclusivity gaps. Keyboard users lose track of focus position; SR users hear noisy emoji announcements on icon-only controls. No functional blocking.

**Suggested fix**: Add a global `:focus-visible { outline: 2px solid var(--k-border-focus); outline-offset: 2px }` (theme-aware) and remove reliance on UA defaults. Add `aria-hidden="true"` to decorative emoji and `aria-label` to icon-only buttons (🔔 → `aria-label="Notifications"`, ✖ → `aria-label="Close"`). For emoji that prefix a text label (✏️ Edit), wrap the emoji in `<span aria-hidden="true">`.

---

## PASS / N/A checklist items (items 44-56)

| Item | Status | Notes |
|---|---|---|
| 44. Load critical content first | ✅ PASS | Auth gate renders branded loading then the shell; per-page data fetches are scoped. (Perceived-perf skeletons → W-013.) |
| 45. Full accessibility audit | — | This task IS that audit (read-only); findings W-017..W-020 + carries are the prioritized output. |
| 46. Keyboard navigable | 🟡 W-017 | Clickable-div nav, no skip link. In-page `<button>`s are real and focusable (partial mitigation). |
| 47. Visible focus indicators | 🟢 W-020 | Only `.k-input` has a focus style; no `:focus-visible`. |
| 48. Accessible forms | ⚠ PARTIAL | Inputs use `.k-input` with visible labels rendered as styled `<div>`s **not** `<label htmlFor>` — no programmatic label association (e.g., UserManagement edit modal labels at :396,405,415 are divs). Form structure is visually clear but not SR-associated. Folds into the W-018 semantic-HTML theme; logged as PARTIAL. |
| 49. Semantic HTML | 🟡 W-018 | No landmarks; divs throughout. |
| 50. Image alt text | 🟢 W-020 | No `<img>` content images in src (icons are emoji/SVG). Emoji icons unlabelled → W-020. StatRing SVG correctly `aria-hidden`. |
| 51. Reduced motion | ✅ PASS | `@media (prefers-reduced-motion: reduce)` sets all animations/transitions to 0.01ms (confirmed task_005/006). Strong PASS. |
| 52. Announce dynamic changes | ⚠ PARTIAL | `role="alert"` on the Privacy modal error (PrivacyAcknowledgementModal.tsx:87) ✅. No `aria-live` region for the toast-less inline `setError()`/`setSuccess()` messages elsewhere, alert dropdown, or async load completions. Ties to W-012 (no toast/announce system). |
| 53. Accessible modals | 🟢 W-019 | Focus trap/Escape absent; dialog ARIA inconsistent; broken `aria-labelledby`. |
| 54. Don't rely on color alone | ✅ PASS (mostly) | Status badges and score bands carry text labels alongside color; small RAG dots/chart segments lean on color (minor). Not a finding. |
| 55. Skip-to-content link | 🟡 W-017 | Absent. |
| 56. Page titles & language | 🟡 W-018 | Static `<title>React App</title>`, never updated (state-based nav). `<html lang="en">` present (passes). |

### Keyboard PASS spots (genuine positives)
- Inline-edit inputs implement Enter-to-save / Escape-to-cancel `onKeyDown` handlers: Scorecard actual-value (Scorecard.tsx:375), BalancedScorecard label/weight (BalancedScorecard.tsx:258,292), AICoaching message send (AICoaching.tsx:291). This is the correct keyboard pattern — it just isn't applied to the navigation.
- PrivacyAcknowledgementModal uses `role="dialog"`, `aria-modal`, `role="alert"`, and `autoFocus` — the most a11y-aware component in the app (just with the dangling label id).
- StatRing SVG `aria-hidden="true"` — correct decorative-graphic handling.

---

## Carries to other tasks
- **`<label htmlFor>` association across all forms** (item 48 PARTIAL) → bundle with W-018 remediation (semantic HTML pass)
- **`aria-current="page"` on active nav items** (carry from task_007) → fold into W-017 remediation
- **`aria-live` region for inline status messages** (item 52) → ties to W-012 toast/announce system
- **Touch target sizes ≥44px** (carry from task_005, item 14) → responsive/mobile remediation (also gated by W-008 mobile-nav absence)

## Next pending
**task_009** (D9 — Performance checklist frontend subset, items 1-46: re-render control, code-splitting, list virtualization, heavy deps in initial bundle). `intended_model: Sonnet 4.6` — a tier DOWN from running Opus 4.8; the operator may `/model` down before **"resume the audit"**, or proceed.
