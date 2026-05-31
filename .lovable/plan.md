# Sequential Build Plan — Reskin First, Then Pulse, Then Lumi Rebrand

Three phases, executed in order. Stop after each phase so you can review before spending more credits.

---

## Phase 1 — Global reskin (palette + fonts) [PRIORITY]

Smallest possible diff that re-skins the entire app to the mockup design language. Touches tokens only; no component logic changes.

**Files edited**
- `src/styles.css` — replace palette + radius tokens.
- `src/routes/__root.tsx` — add Inter Tight `<link>` next to existing font links.

**Token changes in `src/styles.css`** (all `oklch()`):

Light (Swan Wing):
- `--background` `#F5F0E9` · `--foreground` `#112250`
- `--card` `#FBF7F1` · `--card-foreground` `#112250`
- `--popover` `#FBF7F1`
- `--primary` `#112250` (Royal Blue) · `--primary-foreground` `#F5F0E9`
- `--secondary` `#D9CBC2` (Shellstone) · `--secondary-foreground` `#112250`
- `--muted` `#D9CBC2` · `--muted-foreground` `#3C507D` (Sapphire)
- `--accent` `#E0C58F` (Quicksand) · `--accent-foreground` `#112250`
- `--secondary-accent` `#3C507D`
- `--border` Royal Blue @ 18% · `--rule` same · `--input` same
- `--ring` Quicksand
- Paper grain opacity → `0.04`

Dark (Royal Blue):
- `--background` `#112250` · `--foreground` `#F5F0E9`
- `--card` `#1A2D63` · `--popover` `#1A2D63`
- `--primary` `#E0C58F` · `--primary-foreground` `#112250`
- `--secondary` `#3C507D` · `--muted` `#3C507D` · `--muted-foreground` Quicksand @ 70%
- `--accent` `#E0C58F` · `--secondary-accent` `#3C507D`
- `--border` muted gold @ 22%
- Paper grain disabled

Other tokens:
- `--radius` → `0` (flat). Keep `rounded-sm` utility for tags/badges.
- Remove or zero out card box-shadow tokens; rely on hairlines.

**Typography**
- Keep Newsreader + Source Serif 4 as-is (already match mockup serif voice).
- Add Inter Tight `<link>` in `__root.tsx`; expose as `--font-ui`.
- Bump default mono tracking to `[0.28em]` via existing eyebrow utilities (single CSS edit, no per-component changes).

**Verification**
- Visual sweep `/`, `/insights`, `/csfactors`, `/account/executive/analytics` in both modes.
- Confirm no hardcoded hex/`text-white`/`bg-black` regressions (token sweep only — components inherit).
- Build passes.

**Stop point.** Review before approving Phase 2.

---

## Phase 2 — CSFactors Pulse rebuild

Rebuild `/csfactors` to match `csq-mockup-pulse-dark.png`. Reuses Phase 1 tokens. No DB changes.

**Files created**
- `src/components/csfactors/pulse/PulseDashboard.tsx`
- `src/components/csfactors/pulse/PulseHeader.tsx`
- `src/components/csfactors/pulse/RiskHeatmap.tsx` (5×5, hairline cells, Quicksand dots sized by ARR, mobile horizontal scroll)
- `src/components/csfactors/pulse/ReckoningLedger.tsx` (vertical timeline, hairline rail, mono timestamps)
- `src/lib/mocks/pulseSeed.ts` (~12 fixture accounts when real list is empty)

**Files edited**
- `src/routes/csfactors.tsx` — swap main column to `<PulseDashboard />`. Keep sidebar shell, mobile drawer, entitlement guard, Q drawer trigger.
- `src/components/csfactors/BurningThree.tsx` — headline restyle only: `The burning three.` serif + italic Quicksand period.
- `src/components/dashboard/MetricCard.tsx` — drop radius, tighten to single hairline.

**Composition (top → bottom)**
1. Editorial header (eyebrow · serif H1 with italic accent · date stamp · My/Whole team toggle).
2. KPI ribbon — 4 `MetricCard`s (Portfolio ARR, ARR at Risk, QBR Compliance %, NRR 90d). Same aggregations already used in `/account/executive/analytics`.
3. Burning Three (restyled headline only).
4. Impact × Likelihood heatmap → clicking a cell opens existing `AccountDrawer`.
5. Reckoning Ledger (derived client-side from accounts: renewals due, QBR overdue, NPS drops). Rows link to `/csfactors/$accountId`.
6. Existing `AccountsGrid` wrapped in `SectionCard` ("Accounts at risk" eyebrow).

**Removed from current `/csfactors`**: standalone `CommandCentre` block (absorbed into Burning Three + Ledger), ad-hoc filter chips above the grid.

**Verification**
- Pulse renders in light + dark at 400px and ≥1280px.
- Heatmap horizontal-scrolls on mobile (`min-w-[520px]`).
- AccountDrawer still opens from grid and heatmap.
- Burning Three server fn still wired.

**Stop point.** Review before approving Phase 3.

---

## Phase 3 — Q → Lumi rebrand

Brand mark swap + naming sweep. No DB column/table renames, no server runtime changes.

**Brand mark**
- Copy `user-uploads://IMG_20260531_020324.png` → `src/assets/lumi-mark.png`.
- New `src/components/site/LumiMark.tsx` (lighthouse + optional "Lumi." wordmark, period in `text-accent`). Props: `size`, `withWordmark`, `monogram`.
- `QMark.tsx` becomes a one-line re-export of `LumiMark`, then deleted once all imports are migrated in the same pass.

**Renamed files** (file move + identifier rename + import sweep)
- `QAgentButton.tsx` → `LumiButton.tsx` (label "Ask Lumi")
- `QAgentDrawer.tsx` → `LumiDrawer.tsx` (drawer title "Lumi", "Lumi is thinking…")
- `AskQInline.tsx` → `AskLumiInline.tsx`
- `QFilterContext.tsx` → `LumiFilterContext.tsx`
- `QHint.tsx` → `LumiHint.tsx`
- `QErrorBoundary.tsx` → `LumiErrorBoundary.tsx`
- `q-agent.functions.ts`, `q-gallery.functions.ts`, `q-usage.functions.ts`, `q-pricing.ts`, `q-trees.ts`, `q-vectors.ts`, `csfactors-q.functions.ts`, `csfactors-q-tree.ts` → `lumi-*` equivalents
- `routes/q.response.$runId.tsx` → `routes/lumi.response.$runId.tsx`

**Copy edits**
- Header, sidebar, tooltips, ARIA labels, marketing copy on `/`, `/pricing`, `/about`, retention-protocol/codex blurbs — "Q" → "Lumi".
- `BurningThree.tsx` — "Powered by Q" → "Powered by Lumi".

**Memory update**
- `mem://index.md` Core rule: "agent is always called Lumi"; mark path → `src/assets/lumi-mark.png`; component → `<LumiMark />`.

**Not changed**
- DB tables/columns, Supabase functions, secret names (`ELEVENLABS_API_KEY` stays).
- Two-surface isolation (site Lumi vs CSFactors Lumi) preserved verbatim.

**Verification**
- `rg -i 'QMark|QAgent|QFilter|q-agent|"Q\."'` returns zero non-comment hits (allow-list: `Q4`, query var `q`, URL params).
- Typecheck passes.
- Visual sweep: brand mark renders in header, FAB, drawer, footer.

---

## Out of scope (still deferred)

Article reader drop-cap, Workspace slash-menu, Lumi drawer chat redesign with embedded cards, Stakeholder Canvas page, 360 lens visual rework beyond token inheritance.
