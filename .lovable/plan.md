## CSFactors Command Centre overhaul

A focused build to make CSFactors a true command center: one persistent nav surface (desktop sidebar + mobile drawer), homepage prominence for Workspace + CSF, and a bottom-anchored Q that actually drives the dashboard via filter chips.

---

### 1. Unified CSFactors sidebar (desktop)

Rewrite `src/components/csfactors/CSFactorsSidebar.tsx` using shadcn's `Sidebar` primitives so we get proper collapse + active-state styling for free.

Structure (top → bottom):

```text
CSFactors · Command Center
─────────────────────────────
PULSE                         (top-level link → /csfactors)
ACCOUNTS                      (link → /csfactors#accounts)
RENEWALS                      (link → /csfactors#renewals)

▾ ANALYTICS                   (collapsible group, defaultOpen)
   Executive Portfolio        → /account/analytics
   Retention Analysis         → /account/analytics/nrr-waterfall
   Account Health Matrix      → /account/analytics/stakeholder-radar
   Churn Risk & Expansion     → /account/analytics/retention-funnel

STANDALONE
   AI Readiness Diagnostic    → /ai-readiness
   ROI Calculator             → /calculator
   NRR Benchmarks             → /benchmarks
   Workspace                  → opens slide-in pane (see §1b)
   Teams                      → /teams
─────────────────────────────
← The CS Quarterly
```

Notes:

- Reuse existing routes; don't create new dashboard pages — the 4 analytics routes already exist.
- Active state via `useRouterState`, matched on pathname (+ hash for in-page anchors).
- Collapse toggle persists in `localStorage` (`csf.sidebar.collapsed`).
- Apply the `tailwind4-sidebar-width-fix` (`w-[var(--sidebar-width)]`) so content doesn't slide under the panel.

### 1b. Workspace slide-in pane

New `src/components/csfactors/WorkspacePane.tsx` (shadcn `Sheet`, side="right"):

- Search bar (filters across notes / highlights / urls).
- Three sections: Notes, Highlights, URLs (data sourced from existing `workspace.functions.ts`; URLs render as `<a target="_blank" rel="noopener">`).
- Triggered from the sidebar "Workspace" item AND from a top-left anchor on the homepage (§2).

### 1c. Mobile drawer

Replace the current scrollable top-tab strip in `src/routes/csfactors.tsx` with a mobile header:

- Sticky top bar: hamburger (left) · `<QMark/> CSFactors` (center) · ThemeToggle (right).
- Hamburger opens a left `Sheet` rendering the same nav tree (Analytics accordion + standalone modules).
- All items are min 44px tall, full-width tap targets.
- Hidden on `md:` and up; desktop sidebar takes over.

---

### 2. Homepage prominence (`src/routes/index.tsx`)

- **Workspace anchor (top-left):** New inline pill in the hero, above the H1, left-aligned: filled `bg-accent text-accent-foreground` square icon + label "Workspace", plus a redirect arrow → `/account/workspace`. Persistent only on `/` (not added to global header — header rules in workspace knowledge stay intact).
- **CSF Command Centre card:** Promote the existing CSFactors entry block. Apply:
  - Distinct fill: `bg-card` with `border-l-4 border-accent` (left-accent stripe).
  - Bold display headline, mono eyebrow "CSF · Command Centre", 3 inline status chips (Total ARR, At-Risk ARR, QBR %) pulled from a lightweight server-fn call (or static labels with "Sign in to load" for logged-out).
  - CTA button → `/csfactors`.
- **Mobile flow:** Wrap hero anchor + CSF card in `flex flex-col gap-6` on mobile; remove any `whitespace-nowrap` causing overflow. Verify at 375px.  
Include short description " Your Personal CS dashboard - portfolio analytics , health, renewals and opportunities" and "Unlock at Operator Tier "

---

### 3. Bottom-anchored Ask Q on CSFactors

- **Remove:** the `AnalyticsHeader` "Rewrite with Q" / contextual header bar from `csfactors.tsx` (keep the NPS/sentiment data display, drop the Q input bar inside it if present).
- **Replace:** the existing floating `QAgentLauncher` is already bottom-right — re-style to match the homepage Q (`QAgentButton`) pattern: a centered, bottom-docked pill with rolling placeholder text, mic button, and a row of clickable prompt chips above it. Anchor with `fixed bottom-4 inset-x-0 mx-auto max-w-2xl z-40`.
- **Prompt chips** (always visible above the dock, dismissible):
  - "Slice NRR by Enterprise segment"
  - "Show low-health accounts"
  - "Filter high-risk cohorts"
  - "QBRs overdue this quarter"

#### Prompt-driven filter state

New lightweight context `src/components/csfactors/QFilterContext.tsx`:

```ts
type QFilter =
  | { kind: "segment"; value: "Enterprise" | "Mid-Market" | "SMB" }
  | { kind: "health"; value: "low" | "high" }
  | { kind: "risk"; value: "high" }
  | { kind: "qbr"; value: "overdue" };
```

- `QAgentDrawer` (or new bottom dock) parses the prompt → sets a filter via the context (no LLM call for the chip cases; just keyword matching). Free-text prompts still hit `askQ` for the answer panel.
- `csfactors.tsx` reads the filter and:
  - Filters `accounts` array before passing to `BurningThree`, `AnalyticsHeader`, MetricGrid, `AccountsGrid`.
  - Renders a clearable badge bar above Burning Three: `Active filter: Enterprise Segment  [×]`.

---

### Files touched

**Edit**

- `src/components/csfactors/CSFactorsSidebar.tsx` — rewrite with shadcn Sidebar + Analytics accordion + standalone modules.
- `src/routes/csfactors.tsx` — mobile header w/ hamburger Sheet, filter badge, bottom-docked Q, wire QFilterContext, remove Rewrite-with-Q header.
- `src/routes/index.tsx` — Workspace anchor + elevated CSF card.
- `src/components/csfactors/QAgentDrawer.tsx` — convert `QAgentLauncher` to centered bottom dock with chips, hook into filter context.
- `src/components/csfactors/AnalyticsHeader.tsx` — strip any "Rewrite with Q" input if present (verify).

**Create**

- `src/components/csfactors/QFilterContext.tsx` — provider + `useQFilter()` hook + chip parser.
- `src/components/csfactors/WorkspacePane.tsx` — right-side Sheet workspace browser.
- `src/components/csfactors/MobileNavDrawer.tsx` — mobile hamburger Sheet (shares NAV constant with sidebar).

**No changes**

- Route files for analytics dashboards (already shipped).
- Global `SiteHeader` (workspace knowledge: no new header items).
- Database / server functions.

---

### Out of scope

- New analytics dashboards (the four already exist at `/account/analytics/*`).
- Actual LLM-powered filter inference beyond keyword matching on the 4 sample chips (free-text still uses existing `askQ`).
- Touching the global site Q on non-CSFactors pages.

### Verification

- Manual: 375px / 768px / 1280px viewports — sidebar collapses correctly, no horizontal scroll on `/csfactors` or `/`, filter chips update the matrix + metrics + badge appears/clears.
- Build passes (harness runs typecheck).