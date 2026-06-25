# QA Findings — task_007 (D7: UI Checklist Batch 3 — Navigation/IA, Data Display & Tables)

**task_id**: task_007 · **repo**: kinalys-web · **dimension**: D7 (UI checklist)
**model**: Sonnet 4.6 (intended Opus 4.7 — under-powered for IA judgment; operator proceeded without /model switch; findings are structural/mechanical rather than deep IA judgment, so Sonnet 4.6 is adequate)
**date**: 2026-06-22
**scope**: docs/ui-audit.md Navigation/IA items 87-94 + Data Display & Tables items 95-100; cross-ref task queue resume_point: sidebar IA, table-heavy pages (UserManagement, ExecDashboard, TalentGrid, ClosedFlagsHistory), filtering/sorting, pagination
**findings**: W-015 (S4) · W-016 (S4)
**running totals (kinalys-web) after this task**: 🔴 S1: 0 · 🟠 S2: 3 · 🟡 S3: 5 · 🟢 S4: 8 = **16 findings**

---

## W-015 · 🟢 S4 · No column sorting on any data table — table headers are decorative only (item 95)

**QA dimension**: D7 · **Checklist item**: 95 (Make Data Tables Genuinely Usable)

**What happens**: Every data table in the application has column headers rendered as static `<th>` elements with no `onClick` handler and no sort state. Clicking a column header has no effect. Affected tables:

| Page | Table | Columns that users would expect to sort |
|---|---|---|
| UserManagement.tsx | All employees | Name, Role, Status, Department, Created |
| ExecDashboard.tsx | Team scorecard | Name, Score, RAG, Pending |
| Scorecard.tsx | KPI assignments | KPI name, Target, Actual, Score, Weight |
| HrFlagsInbox.tsx | Active flags | Employee, Type, Severity, Created |
| ClosedFlagsHistory.tsx | Flag history | Employee, Type, Outcome, Closed date |
| COPCScorecard.tsx | KPI performance | KPI, Score, Target, Actual |
| HrDeparturesInbox.tsx | Departure events | Employee, Type, Brief status, Date |

One partial exception: `ExecDashboard.tsx:129` sorts the filtered team array by `calculated_score` descending in code — a fixed sort order with no UI toggle and no indicator that it's sorted.

**Impact**: S4 — tables function correctly; users just cannot reorder data by a different column, which is standard expectation for tabular data, especially for managers/HR reviewing scores and flags. No functional data is hidden; it's a usability gap.

**Suggested fix**: Add a `sortKey`/`sortDir` state pair per table; make `<th>` elements clickable to toggle asc/desc on that column; show a small ▲/▼ indicator on the active sort column. A shared `useSortableTable(data, defaultKey, defaultDir)` hook can be extracted.

---

## W-016 · 🟢 S4 · No pagination — all list views render the full API result set in the DOM (item 97)

**QA dimension**: D7 · **Checklist item**: 97 (Pagination or Infinite Scroll) · Cross-ref: backend **F-064** (unbounded list queries)

**What happens**: All list-fetching pages request and render the complete result set with no pagination, "load more", or virtual scrolling:

| Page | API call | Frontend pagination? |
|---|---|---|
| UserManagement | `getManagedUsers()` | ❌ No — renders `users.map(...)` in full |
| TalentGrid | `getTalentAssessments()` | ❌ No — renders `employees.map(...)` in full |
| ExecDashboard | `getTeamScorecards()` | ❌ No — renders filtered team in full |
| ClosedFlagsHistory | `getClosedFlags()` | ❌ No — renders `flags.map(...)` in full |
| HrFlagsInbox | `getHrFlags()` | ❌ No — renders all flags |
| HrDeparturesInbox | `getDepartures()` | ❌ No — renders all rows |
| KnowledgeBase | `getKbArticles()` | ❌ No — renders all articles |

The API client functions pass no `limit`, `offset`, or `page_size` parameters — the backend returns everything (cross-references backend finding F-064 which flags the unbounded API endpoints). The frontend then renders the entire dataset into the DOM.

At the current demo tenant scale (handful of employees, demo data) this is imperceptible. For a production tenant with 300+ employees the ExecDashboard and UserManagement tables would mount 300+ DOM nodes and re-filter client-side on every keystroke — a performance degradation path.

**Mitigation that exists**: UserManagement offloads filtering to the server (debounced search + 4 filter params in `getManagedUsers()`) — so the initial load is bounded by the server's response. This is the right pattern and partially mitigates the concern. ExecDashboard and ClosedFlagsHistory filter client-side.

**Impact**: S4 at current demo scale; would escalate to S3 at production tenant scale (100+ employees). No data is incorrect; it's a scalability concern.

**Suggested fix**: For the highest-priority tables (UserManagement, ExecDashboard), add `page`/`limit` to the API calls and `<Pagination />` controls in the UI. For ClosedFlagsHistory (read-only audit view), "load more" or virtual scrolling is sufficient. ExecDashboard already filters by cycle (bounding the scope) — lower urgency here.

---

## PASS / N/A checklist items (items 87-100)

| Item | Status | Notes |
|---|---|---|
| 87. Navigation structure | ✅ PASS | 5-6 collapsible sections, role-gated (`canSee()`), sentence-case labels, clear active state (left-border + background). Scales well to 28+ items via collapsing. Mobile nav gap → W-008 (already recorded). |
| 88. Command palette | N/A | Not present; enhancement only for current stage. |
| 89. Active location indicators | ✅ PASS | `.k-nav-item.active` driven by `activeNav === 'xxx'` comparisons; teal left-border + brand-faint background. Active item is clearly highlighted. No `aria-current` attribute (→ carry task_008). |
| 90. Breadcrumbs | N/A | State-based nav is one level deep; all views are peers under the shell. Breadcrumbs would be redundant. |
| 91. In-app search | ✅ PASS | UserManagement: debounced server-side search (300ms timer, `useCallback` dependency, 4 filter controls). ExecDashboard: client-side search + dept/designation/band/RAG/pending filters + active filter count badge + `clearFilters()`. ClosedFlagsHistory: multi-select type + outcome + name search. Solid filtering across the three main list views. |
| 92. Scroll/back behavior | ⚠ N/A | State-based nav (no router) means no back/forward and no scroll position restoration. Intentional architecture (W-006 already recorded). Scroll resets to top on any nav change. |
| 93. Keyboard shortcuts | N/A | Not present; standard for a B2B SaaS in early stage. |
| 94. Reduce friction in key flows | ✅ PASS | ImportUsers wizard (4 steps); Scorecard inline actual-value editing (per-KPI save, no form reload); ExecDashboard drill-down to member KPI detail without full page nav. Main friction is deep-linking absence (W-006) and mobile nav (W-008). |
| 95. Data tables | 🟡 W-015 | Correct markup, row hover, mobile scroll. Column sorting absent. |
| 96. Filtering/sorting | ✅ PASS | Server-side search (UserManagement), client-side multi-filter (ExecDashboard, ClosedFlagsHistory), active filter count, clear-all. Filter state not URL-reflected but intentional (no router). Good. |
| 97. Pagination / infinite scroll | 🟡 W-016 | No pagination on any list view. |
| 98. Charts / data viz | ✅ PASS | `StatRing` SVG gauge (ExecDashboard, Scorecard); 9-box talent grid (TalentGrid). Custom SVG rendering without a charting library. Null/no-score handled (→ `'Not Scored'` fallback). No hover tooltips on chart data points (minor gap). |
| 99. Bulk selection/actions | N/A | No bulk selection. Per-row action buttons throughout. Enhancement for production phase. |
| 100. Data export/sharing | ✅ PASS | ClosedFlagsHistory: CSV export (`a.download = 'flag-history-...'`) + Print Report (HTML blob in new tab, respects current filters). A solid export pattern to extend to other views. |

### Additional observations (non-findings)

- **Hardcoded status hex colors** in UserManagement.tsx:39-42 (`#6B21A8`/`#92400E`/`#9F1239` for probation/notice/suspended) and SupportTickets.tsx:33 — same token-bypass class as W-007 (already recorded). Additional evidence for W-007, not a new finding.
- **ExecDashboard active filter count badge** — a nice UX touch that shows users how many filters are active.
- **ClosedFlagsHistory CSV export + Print Report** — the best data export pattern in the codebase; extend to UserManagement and ExecDashboard.
- **No `aria-current` on active nav items** — the `.active` CSS class conveys active state visually but lacks `aria-current="page"` for screen readers. → carry task_008.

---

## Carries to other tasks
- **`aria-current` missing on active nav items** → task_008 (a11y)
- **Chart/table accessibility** (no caption, `<thead>` vs role="columnheader", no scope attributes on `<th>`) → task_008
- **Filter state URL persistence** → N/A given no router; would require architectural change beyond current scope
- **Bulk actions and additional export views** → Post-Task-0 enhancement, not audited this phase

## Next pending
**task_008** (D7 — UI checklist batch 4, items 84-100 a11y: keyboard nav, focus management, ARIA, semantic HTML, alt text, color-only status, modals, reduced-motion). `intended_model: Opus 4.7` — the operator may `/model opus` before **"resume the audit"**.
