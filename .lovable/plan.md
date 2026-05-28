# CSFactors: Q Agent + Dashboard Polish

Five additions to `/csfactors`, all frontend + one new server function. No schema changes.

## 1. Q Agent on the CSFactors dashboard

Add a floating Q launcher (reusing `QMark` brand) in the bottom-right of `/csfactors`, opening a chat drawer scoped to the signed-in user's portfolio.

**Server side** — new `src/lib/csfactors-q.functions.ts`:
- `askCSFactorsQ` (`createServerFn` + `requireSupabaseAuth`)
- Loads the caller's `cs_accounts` rows + related `cs_stakeholders`, `cs_contracts`, `cs_qbrs`, `cs_touchpoints` (whatever tables back the drawer today — will confirm during build by reading `csfactors.functions.ts`).
- Compacts them into a JSON "portfolio context" (cap ~40KB; trim long notes).
- Calls Lovable AI Gateway (`google/gemini-3-flash-preview`) via the shared `ai-gateway.server` helper with a system prompt: "You are Q, the analyst for The CS Quarterly's CSFactors command center. Answer only from the provided portfolio JSON. Cite account names verbatim. If the data does not contain the answer, say so."
- Streams via `toUIMessageStreamResponse` to a `/api/csfactors-q` route (so we can use `useChat`).

**Client side** — `src/components/csfactors/QAgentDrawer.tsx`:
- Sheet from the right (reuse `Sheet`), header with `QMark`, suggested-question chips derived from a logic tree (below), `useChat` transport pointed at `/api/csfactors-q`.
- Floating trigger button bottom-right; hidden when drawer is open.

## 2. Logic tree of starter questions

Mirror the original Q tree pattern (`src/lib/q-trees.ts`). Add `src/lib/csfactors-q-tree.ts` with grouped prompts the user clicks to seed the chat:

- **Stakeholders** — "Who is the primary stakeholder at {account}?", "Which accounts have no exec sponsor mapped?"
- **QBRs** — "Which QBRs were conducted last quarter?", "Which accounts are overdue for a QBR?"
- **Sentiment** — "What's the sentiment trend across my book?", "Which Critical accounts moved from Positive in the last 30 days?"
- **Leadership connects** — "When was the last leadership connect for {account}?", "Which accounts haven't had a leadership touch in 60+ days?"
- **Renewals** — "What's at risk in the next 90 days?", "Top 3 renewals by ARR this quarter."

Chips render inside the drawer's empty state and inject text into the composer.

## 3. Light/dark theme toggle in the CSFactors top bar

Add the existing `ThemeToggle` (already in `src/components/site/ThemeToggle.tsx`) to the `/csfactors` header row, immediately left of `ImportCsvDialog` / `AddAccountDialog`. No new component needed.

## 4. Expand-on-hover for NPS + Sentiment cards

Modify `AnalyticsHeader.tsx`:
- Wrap each metric block in a `HoverCard` (already in `src/components/ui/hover-card.tsx`).
- Hover content: enlarged chart + breakdown (NPS: promoters/passives/detractors counts and trailing trend bars from `RhythmBars`; Sentiment: per-bucket account list with `HealthChip`).
- Trigger keeps the compact card; content is `w-[480px]` with `align="start"`.

## 5. Fullscreen view for Master Account Matrix

In `csfactors.tsx`'s `SectionCard` for the matrix:
- Add a small icon button (`Maximize2` from lucide) in the section header's right slot.
- Clicking opens a `Dialog` with `max-w-[98vw] h-[95vh]` rendering the same `<AccountsGrid />` with all 32 columns and the full row set. ESC / X to close.
- State is local (`const [fullscreen, setFullscreen] = useState(false)`).

## Files

**New**
- `src/lib/csfactors-q.functions.ts` — `askCSFactorsQ` server fn (portfolio context + Lovable AI)
- `src/lib/csfactors-q-tree.ts` — starter-question groups
- `src/routes/api/csfactors-q.ts` — streaming chat route (POST)
- `src/components/csfactors/QAgentDrawer.tsx` — sheet + `useChat` + chip tree

**Edited**
- `src/routes/csfactors.tsx` — mount drawer, add theme toggle + fullscreen state + matrix dialog
- `src/components/csfactors/AnalyticsHeader.tsx` — wrap NPS + sentiment in `HoverCard`
- `src/components/csfactors/SectionCard.tsx` *(if it supports an actions slot; otherwise add inline trigger above the grid)*

## Notes / assumptions

- Q runs auth-gated (matches the security fix from earlier — no anonymous trial here).
- No new DB tables; chat history is in-memory for the session (matches "no persistence" — confirm if you want threads later).
- Reuses existing design tokens (`--accent`, `--secondary-accent`, emerald/destructive). No new colors.
- Mono labels + `QMark` for brand consistency.

Confirm and I'll build it.