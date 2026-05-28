## Fixes for homepage, CSFactors logo, back buttons, and Q dock placement

### 1. Homepage (`src/routes/index.tsx`)
- **Move Workspace anchor**: remove the standalone Workspace link from the top-left of the hero (lines ~63–80). Re-render it directly *below* the CSF Command Centre card (after the `<Link to="/csfactors">` block, ~line 121), full-width to match, so the visual stack is: hero copy → newsletter → CSF Command Centre → Workspace anchor.
- **Hide newsletter for logged-in users**: pull `useAuth()` into `HomePage`. Render `<NewsletterInline source="home-hero" />` only when `!user`. For signed-in users, replace it with a one-line greeting + link to `/account` (e.g. "Welcome back — open your account →") to keep the slot from collapsing visually.

### 2. CSFactors logo & sizing (`src/components/csfactors/CSFactorsSidebar.tsx` + `src/routes/csfactors.tsx` mobile header)
- Replace the small `<QMark className="h-6 w-6" />` + plain "CSFactors" wordmark with a proper executive lockup:
  - A solid accent square containing the mono `CSF` glyph (matching the CSF tile already used on the homepage card) at `h-7 w-7`, followed by the wordmark `CSFactors.` set in `font-display text-base tracking-tight` with the trailing period in `text-accent`.
  - Collapsed state: just the CSF tile centered.
- Mirror the same lockup in the mobile sticky header in `csfactors.tsx` (currently `<QMark className="h-5 w-5" /> CSFactors`).
- Net result: the page brand mark is unmistakably "CSFactors" — not the generic Q mark — and large enough to read at a glance on both desktop and mobile.

### 3. Back buttons on CSFactors surfaces
Add a consistent `← Back to Command Centre` control to every CSFactors sub-surface so users always have a one-click exit:
- `src/routes/csfactors.$accountId.tsx` — back to `/csfactors`.
- `src/routes/account.analytics.index.tsx`, `account.analytics.nrr-waterfall.tsx`, `account.analytics.retention-funnel.tsx`, `account.analytics.stakeholder-radar.tsx`, `account.analytics.team-leaderboard.tsx` — back to `/csfactors`.
- `src/routes/ai-readiness.tsx`, `calculator.tsx`, `benchmarks.tsx`, `directory.tsx`, `teams.tsx` — when entered from the CSFactors sidebar, render the same back affordance at the top of the page.
- Implementation: small shared component `src/components/csfactors/BackToCommand.tsx` rendering a mono uppercase `← Back to CSFactors` link with hairline border-bottom hover. Place it as the first child inside each route's main container (above the page header), so it's visible on both desktop and mobile without conflicting with the existing mobile sticky bar.

### 4. Q dialogue placement (`src/routes/csfactors.tsx` + `src/components/csfactors/QAgentDrawer.tsx`)
- The bottom-fixed `QAgentDock` is what the user keeps seeing pinned to the bottom. Remove the `<QAgentDock>` render from `csfactors.tsx` and stop using `fixed bottom-0 inset-x-0` for the dock.
- Replace it with an **inline Ask Q panel** placed in the page flow, directly under the header actions (next to Import / Add Account) on desktop, and as a card at the top of the content stack on mobile. The panel contains:
  - The QMark + "Ask Q" label + input + sample prompt chips (reuse the existing chips array).
  - On submit, same `handleDockSubmit` / `handleChip` logic — no behavior regression.
- Also add a compact **Ask Q** button in the page header actions row that opens the full `QAgentDrawer` (right-side Sheet) for longer conversations.
- Confirm the global `<QAgentButton />` in `__root.tsx` is hidden on `/csfactors` (per workspace knowledge) — if it currently renders there, add a `pathname.startsWith("/csfactors")` guard so the only Q surface on CSFactors is the new inline panel + drawer trigger.

### Technical notes
- No schema/server changes; pure presentation/routing edits.
- `useAuth` is already exported from `src/hooks/useAuth.ts`; safe to import in `index.tsx`.
- Reuse existing tokens (`bg-accent`, `text-accent-foreground`, `border-border`, `font-mono uppercase tracking-[0.2em] text-xs`) — no new colors.
- Keep mobile (`< 768px`) parity: back button visible above header, inline Ask Q stacks above the metric grid, new CSFactors lockup in the sticky top bar.
