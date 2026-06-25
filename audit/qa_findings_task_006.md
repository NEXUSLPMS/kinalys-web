# QA Findings — task_006 (D7: UI Checklist Batch 2 — Motion, Forms, Feedback/System States)

**task_id**: task_006 · **repo**: kinalys-web · **dimension**: D7 (UI checklist)
**model**: Sonnet 4.6 (correct tier — mechanical checklist sweep)
**date**: 2026-06-22
**scope**: docs/ui-audit.md items 34-83 (assessed with priority on items 57-66 motion/micro-interactions, 67-76 forms/inputs, 77-86 feedback/system states); items 34-43 performance + 44-56 accessibility deferred per task subdivision
**findings**: W-011 (S3) · W-012 (S4) · W-013 (S4) · W-014 (S4)
**running totals (kinalys-web) after this task**: 🔴 S1: 0 · 🟠 S2: 3 · 🟡 S3: 5 · 🟢 S4: 6 = **14 findings**

---

## W-011 · 🟡 S3 · No error boundaries anywhere in the app — component crashes produce blank views (item 79)

**QA dimension**: D7 · **Checklist item**: 79 (Graceful Error Boundaries)

**What happens**: A repo-wide grep for `ErrorBoundary`, `componentDidCatch`, and `error-boundary` returns **zero results** across all 47 source files. There is no React error boundary anywhere in the application.

If any component throws an unhandled runtime exception — for example, accessing a property on an unexpected `null` API response, a divide-by-zero in a score computation, or a render-time null dereference on any of the 246 `as any` values — React unmounts the **entire component tree** below the nearest error boundary. With no boundaries in place, the nearest boundary is React's root itself, which means **the entire app goes blank**.

Affected failure modes:
- Null/undefined data from API (especially with `as any` typed responses — W-005 — where TypeScript can't warn)
- Unexpected API shape changes (new field, renamed field)
- Runtime arithmetic errors on numeric API values (`Number()` coercions on non-numeric strings)
- Any page-level state mutation that produces an invalid render

**Impact**: S3 — no data loss, but a component crash in any of the 31 pages would blank the entire authenticated view with no recovery path, forcing a full page reload. Given the W-005 pervasive-`any` surface, the probability of encountering this is higher than in a well-typed codebase.

**Suggested fix**: Wrap each major page/section with an `ErrorBoundary` component that renders a friendly fallback ("Something went wrong — try refreshing") and logs the error. At minimum, wrap `.k-main` in App.tsx with a top-level boundary. Preferably, add per-page boundaries so a crash in one page doesn't affect others.

---

## W-012 · 🟢 S4 · `alert()` for UX feedback (4 sites) + silent `console.error`-only failures (3 sites) — no toast/notification system (items 77-78)

**QA dimension**: D7 · **Checklist items**: 77 (Toast Notification System), 78 (Loading/Empty/Error/Success States)

**What happens**:

**Native `alert()` usage — 4 sites:**
| Location | Trigger | Message |
|---|---|---|
| App.tsx:471 | Demo breach success | `alert(\`✅ ${result.message}\`)` |
| App.tsx:473 | Demo breach error | `alert('Error: ' + err.response?.data?.error)` |
| App.tsx:579 | PIP ack failure | `alert(err.response?.data?.message \|\| 'Failed to acknowledge PIP.')` |
| KnowledgeBase.tsx:119 | Seed articles | `alert(result.message)` |

`window.alert()` blocks all UI, cannot be themed, does not match the design system, shows OS-native chrome, and is unusable on mobile. The PIP acknowledgement failure (App.tsx:579) is on a critical user flow (employee must acknowledge a disciplinary document) — a failed ack on this screen should display an accessible, inline error, not a blocking browser dialog.

**Silent `console.error`-only failures — 3 sites:**
| Location | Scenario |
|---|---|
| AICoaching.tsx:102-103 | AI coaching API call fails → user sees nothing |
| OKR.tsx:112 | Key-results load fails → user sees nothing |
| BalancedScorecard.tsx:81 | Metrics load fails → user sees nothing |

In all three cases the catch block only calls `console.error()` — no `setError()` state update, no user-visible message. The user sees a blank or partially-loaded page with no explanation and no recovery path.

**No toast/notification system**: The app has no consistent mechanism for transient feedback. SupportTickets.tsx uses `setSuccess()` inline state (the right pattern) and ImportUsers.tsx uses `setError()` inline — these are good but inconsistent. A centralized toast would make these uniform.

**Suggested fix**: Replace `alert()` calls with inline state messages (`setError()` / `setSuccess()`) styled with the `--k-danger-*` / `--k-success-*` token family. Add visible error state to the three silent-failure catch blocks. A lightweight toast context (or a simple positioned div with auto-dismiss) would unify feedback.

---

## W-013 · 🟢 S4 · No loading skeleton screens — all loading states are plain text, abrupt swap to content (items 35, 63)

**QA dimension**: D7 · **Checklist items**: 35 (Content-Aware Loading Skeletons), 63 (Smooth Loading-to-Content Transition)

**What happens**: Every page in the app uses the same loading pattern — a `loading` boolean that renders a plain text indicator while data is fetched:
- HrDeparturesInbox.tsx:250-255: `<td colSpan={7} style={{...}}>Loading departures…</td>` (text in a table row)
- COPCReport.tsx, ExecDashboard.tsx, Scorecard.tsx etc.: similar text-based loading indicators
- App.tsx:782-787: Auth loading screen shows "KINALYS" wordmark on dark background (branded, but no progress signal)
- BriefViewerModal.tsx:98: has a spinner inside the modal (1 exception)

**No page uses a skeleton** — a placeholder that mirrors the approximate shape of the incoming content. When data arrives, the transition is an abrupt swap (text → content), which causes visual pop-in and makes perceived loading time feel longer.

The animated gamification elements (XP bar `transition: width 800ms ease-out`, progress ring `k-ring-in` keyframe, confetti pieces) show the codebase is capable of animation — the pattern just isn't applied to loading states.

**Impact**: S4 — the app functions correctly; this is a perceived-performance and polish gap rather than a functional issue.

**Suggested fix**: For the highest-traffic loading states (Scorecard, ExecDashboard, TalentGrid), replace the text placeholder with CSS skeleton shimmer boxes that approximate the card/table shape. A simple approach: a reusable `<Skeleton width height />` component with a `@keyframes` shimmer animation, conditionally rendered while `loading === true`. The loading-to-content transition should use a brief `opacity` fade rather than an instant swap.

---

## W-014 · 🟢 S4 · Form validation is on-submit only — no per-field inline validation, no character counter, no required-field markers (items 67, 75, 76)

**QA dimension**: D7 · **Checklist items**: 67 (Real-Time Inline Validation), 75 (Input Hints/Affordances), 76 (Form Submission Feedback)

**What happens**: The clearest example is SupportTickets.tsx (the most form-heavy non-admin page):
- `validateForm()` (line 71-77) is called inside `submitTicket()` on submit
- On failure, the error string is set via `setError(validationError)` and shown **at the top of the form**, above all fields — not adjacent to the offending field
- No per-field validation on blur; a user does not discover their description is too short until they attempt to submit
- No real-time character counter during typing (the 300-char minimum is only revealed as an error on submit, not as a live `{form.description.length}/300` counter)
- No visual required-field indicators (asterisk, "required" label)

The same pattern appears in other forms:
- ImportUsers.tsx: error at the top of the page; no field-level validation
- OneOnOne.tsx:458: `disabled={saving || !canSave}` (good disabled pattern) but the user doesn't know why the button is disabled or what `canSave` requires
- HrFlagsInbox.tsx: `disabled={!isGenuineComment(flagComment)}` with no hint of what constitutes a "genuine comment"

**What IS done well**: The `disabled={loading/submitting/saving}` anti-double-submit pattern is consistently applied across ~20 components — a solid baseline. ImportUsers has a proper 4-step wizard with visual step indicator (item 72 — PASS). The submit button in SupportTickets is `disabled={submitting}` (PASS).

**Impact**: S4 — forms function correctly on the happy path; the degradation is that invalid form submissions generate confusing top-of-form error messages and character limits are invisible until violated.

**Suggested fix**: 
- Add `onBlur` validation handlers that set per-field error state and render the message adjacent to the field
- Show a live `{n}/{min}` character counter on description/notes fields during typing
- Mark required fields with an asterisk in the label
- For `isGenuineComment`-gated buttons, add helper text below the textarea explaining what is required

---

## PASS / N/A checklist items (items 34-86, this batch)

| Items | Category | Status | Notes |
|---|---|---|---|
| 34-43 | Performance: images/skeletons/virtualization/re-renders/caching/optimistic/debounce/critical-path/third-party | → task_009 | Deferred — performance-specific tasks; code-splitting/bundle already flagged (task_004 carry). |
| 44-56 | Accessibility: a11y audit/keyboard/focus/forms/semantic HTML/alt/reduced-motion/announcements/modals/color/skip/titles | → task_008 | Deferred — entire task_008 is dedicated to a11y. Carries from task_005 surface here (emoji icons, heading semantics, focus-visible, touch targets, page title). |
| 57. Micro-interactions | Motion | ✅ PASS | Button hover (brightness/glow), card hover (shadow elevation), nav-item hover/active — consistent and well-timed. |
| 58. Animation timing | Motion | ✅ PASS | Three timing tokens defined: `--k-transition: 150ms`, `--k-transition-md: 200ms`, `--k-transition-slow: 300ms`. Applied consistently. |
| 59. Page transitions | Motion | N/A | State-based nav (no router) — no route-level transitions possible. State swap is instant but architecture is intentional. |
| 60. Animate value/state changes | Motion | ⚠ PARTIAL | XP bar `transition: width 800ms ease-out` ✅; progress ring `k-ring-in` keyframe ✅; confetti pieces ✅. Stat card numbers are instant (no count-up). |
| 61. Hover/focus feedback | Motion | ⚠ PARTIAL | Hover: PASS (cursor, color, shadow). Focus-visible: GAP (→ task_008). |
| 62. Scroll-triggered animations | Motion | N/A | Content within `.k-main` scrolls independently per page; no long marketing-style pages. |
| 63. Loading-to-content | Motion | 🟡 W-013 | Abrupt swap — no skeleton or crossfade. |
| 64. Drag-and-drop | Motion | N/A | No drag-and-drop UI in the app. |
| 65. Mobile gestures | Motion | N/A | Desktop-primary B2B SaaS. |
| 66. Success moments | Motion | ⚠ PARTIAL | Confetti animation (`k-confetti-fall`) defined in CSS and used for gamification moments. ImportUsers shows a `complete` step. No generic success animation on most actions. |
| 67. Inline validation | Forms | 🟡 W-014 | On-submit only; no per-field blur validation. |
| 68. Clear error messages | Forms | ✅ PASS | SupportTickets error messages are specific ("Description must be at least 300 characters (currently 47)"). ImportUsers surfaces server error text. No "Invalid input" opaque messages found. |
| 69. Input field states | Forms | ✅ PASS | `k-input` class has focus state via `--k-border-focus` + `--k-shadow-focus`. All inputs use `k-input` or themed equivalents. |
| 70. Input masking | Forms | N/A | No phone/card/date structured inputs requiring masking in the current feature set. |
| 71. Form autosave | Forms | N/A | Forms are transactional (create ticket, import, flag). No long-lived draft forms present. Scorecard actual-value save is explicit per-field button (appropriate). |
| 72. Multi-step forms | Forms | ✅ PASS | ImportUsers: 4-step wizard (upload→validate→confirm→complete) with visual step indicator (step circles with checkmarks). Validates before advancing. |
| 73. Select/dropdown | Forms | ✅ PASS | Native `<select>` elements used throughout. Given current feature scope, sufficient; custom combobox/searchable dropdowns not required by any current form. |
| 74. Password fields | Forms | N/A | No password fields — Auth0 handles authentication entirely outside the app. |
| 75. Input hints | Forms | 🟡 W-014 | No required-field markers; no character counters; helper text limited. |
| 76. Submission feedback | Forms | ⚠ PARTIAL | `disabled={submitting}` consistently applied ✅. Success after submit: SupportTickets shows inline `setSuccess()` ✅; some pages rely on alert() (W-012). |
| 77. Toast notifications | Feedback | 🟡 W-012 | No toast system. Feedback is inconsistent (inline state ✅ in some; alert() ❌ in others). |
| 78. Four states (load/empty/error/success) | Feedback | ⚠ PARTIAL | Loading: text only (W-013). Empty: UserManagement ✅ (line 374), HrDeparturesInbox ✅ (line 305), alerts dropdown ✅ (App.tsx:429) — others N/A. Error: some pages use `setError()` ✅; 3 pages use `console.error()` only (W-012). Success: varies. |
| 79. Error boundaries | Feedback | 🔴 W-011 | Zero error boundaries. |
| 80. Destructive confirmations | Feedback | ⚠ PARTIAL | MarkAsDepartedModal (modal with confirm) ✅. HrFlagsInbox: `disabled={!isGenuineComment(hrComment)}` gates the action. No explicit confirm dialog for soft-delete in UserManagement (button triggers directly). |
| 81. Undo | Feedback | N/A | Not implemented; undo is a significant architectural feature not present. |
| 82. Offline/network errors | Feedback | N/A | No offline detection. Standard Axios error propagation. |
| 83. Progress for long operations | Feedback | ⚠ PARTIAL | ImportUsers step-based progress ✅. AICoaching generation: button shows `loading` boolean state but no "Generating…" progress text. BriefViewerModal shows loading state while fetching brief. |

---

## Carries to other tasks

- **Items 34-43 (performance)** → task_009 (code-splitting, re-renders, virtualization, bundle)
- **Items 44-56 (a11y)** → task_008 (keyboard nav, focus-visible, semantic HTML, ARIA, modals, alt text, page title)
- **Destructive action gaps** (UserManagement soft-delete, no explicit confirm) → task_008/task_012
- **Scorecard.tsx:513 silent `.catch(() => {})` with empty handler** → W-012 class (swallowed error)
- **No toast system** → cross-cutting; each alert() site is a separate remediation when toast is added

## Next pending
**task_007** (D7 — UI checklist batch 3, items ~67-83: navigation/IA, data tables, density, overflow, pagination UI). `intended_model: Opus 4.7` — a tier UP from Sonnet 4.6; the operator may `/model opus` for the IA judgment calls, or proceed on Sonnet 4.6.
