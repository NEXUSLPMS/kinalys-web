# QA Findings — task_002 (D1/D2: Frontend Security)

**task_id**: task_002 · **repo**: kinalys-web · **dimension**: D1/D2 (frontend security, OWASP-mapped)
**model**: Opus 4.8 High (matches intended_model)
**date**: 2026-06-22
**scope**: client-side token storage, the `X-Demo-User-Id` shipped risk, secrets in the client bundle (`@anthropic-ai/sdk`), XSS via `dangerouslySetInnerHTML` / unsafe HTML render, AI-generated-content sinks, clipboard/XSS (IF-007). Security-audit.md frontend items 19/46/47/49/68/98.
**findings**: W-001 (S2)
**running totals (kinalys-web) after this task**: 🔴 S1: 0 · 🟠 S2: 1 · 🟡 S3: 0 · 🟢 S4: 0 = **1 finding**

---

## W-001 · 🟠 S2 · Unsanitized markdown→HTML injected via `dangerouslySetInnerHTML` → stored XSS (KnowledgeBase.tsx:30-42, 271)

**OWASP**: A03:2021 Injection (Cross-Site Scripting / stored XSS) · **QA dimension**: D2/D7
**Location**: `src/pages/KnowledgeBase.tsx:30-42` (`renderMarkdown`) → `:271` (`dangerouslySetInnerHTML`)

**What happens**: KB article bodies are rendered through a hand-rolled regex markdown converter and injected as raw HTML:
```tsx
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 …>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // … only ADDS tags for markdown syntax …
    .replace(/\n\n/g, '<br/><br/>')
}
// …
<div dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedArticle.content) }} />
```
The converter **never escapes `<`, `>`, or `&` in the source text** — it only *adds* tags for markdown tokens. Any raw HTML already present in `selectedArticle.content` therefore passes through untouched into the DOM. There is **no sanitizer** anywhere in the repo (grep for `DOMPurify`/`sanitize` = zero hits). So article content containing `<script>…</script>`, `<img src=x onerror=…>`, or `<svg onload=…>` executes in the viewer's browser.

**Impact**: The article body comes from the backend (`GET /kb/articles/:slug`). Knowledge Base is visible to **every role** (`App.tsx` `canSee('kb')` grants all roles). Any actor who can author/seed article content (today seed-driven; the feature clearly intends authored articles — markdown rendering, helpful-voting) can plant a payload that runs in **every** viewer's session: session-riding API calls under the viewer's identity, theft of the in-memory Auth0 token, defacement, or pivoting via the `X-Demo-User-Id` path. This is the classic stored-XSS blast radius.

**Severity rationale (S2, not S1)**: KB content is currently seed/admin-controlled rather than arbitrary end-user input, so it is not anonymously exploitable today — but the sink is completely unsanitized and renders org-wide, and the architecture intends authored articles. A textbook S2 frontend XSS; escalates toward S1 the moment an article-authoring surface accepts untrusted input.

**Suggested fix** (DESCRIBE — not applied):
1. Escape the source text **before** applying the markdown regexes (HTML-encode `& < > "` first), so only the converter's own tags are HTML.
2. Run the final HTML through a vetted sanitizer (DOMPurify) with a strict tag/attribute allowlist before `dangerouslySetInnerHTML`.
3. Prefer a maintained markdown library (e.g. `marked` + DOMPurify, or `react-markdown` which avoids raw-HTML injection entirely) over the hand-rolled regex.
4. If article authoring is admin-only, still sanitize (defense-in-depth) and constrain the allowed tag set.

---

## Checklist coverage & PASS confirmations (security-audit.md frontend items)

| # | Item | Verdict | Basis |
| --- | --- | --- | --- |
| 19 | Store auth tokens safely client-side | **PASS** | `useAuth0().getAccessTokenSilently()` (App.tsx:116) uses Auth0's **default in-memory** token cache (no `cacheLocation:'localstorage'`, no `useRefreshTokens` opting into local storage). The access token is never written to `localStorage`/`sessionStorage`. The token is attached via `setAuthToken()` → axios default `Authorization` header (client.ts:27-29). Only **non-sensitive** values are in `localStorage`: theme prefs (`kinalys-theme*`, KinalysTheme.tsx / AccountSettings.tsx) and the demo id (`kinalys_demo_user_id`, demo-only). ✅ |
| 46 | Eliminate DOM-XSS sinks | **PASS** | No untrusted `location.hash`/`search`/`postMessage` → sink flow. `window.location` uses are `.reload()` / `.origin` (DemoSwitcher.tsx:46, App.tsx logout) — not injection sinks. |
| 47 | Prevent stored XSS | **W-001** | The KB markdown sink is the one stored-XSS exposure. |
| 49 | Audit unsafe-HTML render bypasses | **W-001** | `dangerouslySetInnerHTML` appears **exactly once** (KnowledgeBase.tsx:271). No `innerHTML`/`document.write`/`eval`/`new Function` anywhere (grep-confirmed). Single audited bypass → W-001. |
| 68 | Keep secrets out of client bundle | **PASS** (+ unused-dep note) | `@anthropic-ai/sdk` is in `package.json` but **imported nowhere in `src/`** (grep for `@anthropic-ai/sdk`/`Anthropic`/`apiKey` = zero src hits). No AI key is referenced or bundled client-side — AI calls go through the backend (consistent with the platform's backend-only-AI-key PASS). The IF-007 AI-key-leak fear is **not realized**. The dependency is **unused** (dead bundle weight + supply-chain surface) → handed to task_013. ✅ |
| 98 | Subresource Integrity | **N/A / deploy** | CRA manages its own hashed bundles; no external CDN `<script>` tags in `public/index.html` to add SRI to (verify in task_013). |

## Positive findings
- **AI-generated content is rendered as escaped text, not raw HTML (IF-007 clipboard/XSS PASS).** The AI surfaces — `AICoaching.tsx`, `Recommendations.tsx`, `BriefViewerModal.tsx` — contain **no** `dangerouslySetInnerHTML`/`innerHTML` (the only raw-HTML sink in the whole app is the KB markdown). React's default escaping neutralizes script/markup in AI output. The IF-007 worry about XSS on AI-generated content does not materialize on the render path. ✅
- **Auth token is in-memory (Auth0 default), never persisted to web storage.** ✅
- **Exactly one raw-HTML sink in the entire frontend** — a small, auditable XSS surface (just W-001). ✅

---

## Carries to other tasks
- `@anthropic-ai/sdk` **unused dependency** (no client-side use) → **task_013** (dependency hygiene / bundle weight).
- The `X-Demo-User-Id` interceptor as a *shipped* risk → **task_003** (single DEMO_MODE-separation finding), not re-raised here.
- Whether `setAuthToken(token)` is actually invoked in `loadData` (App.tsx:116 obtains the token but the call to attach it isn't co-located) → **task_004** (functional/auth-wiring check; a non-demo session may rely on it). Not a security finding per se.

## Next pending
**task_003** (ARCH — DEMO_MODE/NODE_ENV separation gap, single S2 finding referencing the inventory). `intended_model: Opus 4.7` — a tier DOWN from the current Opus 4.8 (over-powered, permitted; not a security-critical task). Operator may `/model` down or proceed.
