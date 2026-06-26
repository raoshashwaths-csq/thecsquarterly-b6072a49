## Lumi Contextual Bubble & Drawer Action Panel

Adds a cycling speech bubble above the existing global Lumi FAB (`QAgentButton`) and a contextual action grid inside its drawer's empty state. Both read from a single page-keyed registry so future Lumi actions are one-file additions.

### New files

- `src/config/lumiPageActions.ts` — registry per PRD: `LumiAction` type (+ explicit `description` field for cards), `PageContext` union, and the full initial dataset for `dispatch`, `home`, `codex`, `codex-item`, `ai-readiness`, `benchmarks`, `pricing`, `account`, `vanguard`, `series`, `default`.
- `src/hooks/useLumiPageContext.ts` — derives `PageContext` from `useRouterState({ select: s => s.location.pathname })`. Section-detail routes (`/vanguard/...`, `/retention-protocol/...`, `/outcome-forum/...`) map to `dispatch`; series detection is wired as a TODO hook input (`seriesSlug?: string`) so a route can opt-in later without breaking the default.
- `src/components/lumi/LumiBubble.tsx` — fixed-position bubble anchored to FAB. State: `index`, `isExiting`, `isVisible`. Effects: 3s mount delay; 5s interval with 300ms crossfade; scroll listener (hide on upward scroll, show again past 300px downward); session dismiss via `sessionStorage('lumi_bubble_dismissed_session')`; suppress if any Lumi message sent this session (read `sessionStorage('lumi_messaged')`, set by `QAgentButton` on send). Click bubble → `onOpen(prompt)`. Hidden while drawer `open=true` (prop from `QAgentButton`). Respects `prefers-reduced-motion` (static first message, no progress bar). `aria-live="polite"` wrapper updates only on index change.
- `src/components/lumi/LumiActionCard.tsx` — shared card. Renders Tabler icon (`<i className={`ti ${icon}`} />`), label, derived description (uses `action.description` directly from registry), optional tier/new badge, locked overlay (semi-transparent wash + `ti-lock`) when `isLocked`. `role="button"`, keyboard handlers, `aria-disabled` when locked.
- `src/components/lumi/LumiDrawerActions.tsx` — grid (2-col ≥280px drawer, 1-col below) with eyebrow "WHAT CAN I HELP YOU WITH?". Calls `onActionSelect(prompt)` which sets input + auto-submits; locked + free tier → `navigate({ to: '/pricing', search: { highlight: 'vanguard' } })`. Fades out (200ms) when `messagesCount > 0`.

### Edits

- `src/components/site/QAgentButton.tsx`
  - Import `useLumiPageContext`, `LumiBubble`, `LumiDrawerActions`, `lumiPageActions`, `useEntitlements` (for tier).
  - Render `<LumiBubble pageContext={ctx} drawerOpen={open} onOpen={(prompt) => { setQuery(prompt); setOpen(true); /* auto-submit via existing handler */ }} />` as a sibling of the FAB, hidden when `open`.
  - Inside the `<Sheet>` body, when the conversation/answer state is empty (no `answer`, no in-flight query), render `<LumiDrawerActions pageContext={ctx} userTier={tier} onActionSelect={...} />` above the chat input; fade out once a message is sent.
  - On message submit, set `sessionStorage('lumi_messaged','true')` so the bubble suppresses for the rest of the session.
  - No changes to FAB position, drawer header, chat input, streaming, history, focus trap, or z-index. Bubble z-index sits below the Sheet.
- `src/styles.css`
  - Append `@keyframes lumi-bubble-enter` and `.lumi-bubble` / tail (`::before` fill + `::after` border) using `--color-secondary-accent` and `--color-background-secondary`.
  - Append progress-bar utility and `@media (prefers-reduced-motion: reduce)` overrides.
  - All tokens come from existing `:root` — no new colors.

### Out of scope (per PRD "What NOT to change")

- CSFactors `AskLumiDrawer` is untouched — this PRD is the global site Lumi only.
- No edits to existing Lumi conversation, streaming, tone toggle, FAB visual, or auth.

### Verification

- Manual walkthrough of each route in the verification checklist via the preview.
- Playwright snapshot on `/insights/<slug>` confirming bubble appears at 3s, cycles, dismisses on click; drawer opens with the action grid populated; first send hides the grid.
- `tsgo --noEmit`.

### Open questions before build

None blocking — PRD is specific. I'll use `useEntitlements` for the free/vanguard split (matches existing tier checks in the codebase) and the Tabler icon font that's already loaded for `ti-*` classes referenced in the PRD; if it's not currently bundled I'll add the CDN `<link>` in `__root.tsx` head.
