## Why the lists disagree

They're reading the same table (`cs_accounts`, RLS-scoped to you), so the data is consistent. The mismatch is purely a UI cap on the CSFactors home dashboard.

- **Lumi run tagging dropdown** (`src/components/agent/RunAccountTagger.tsx`) calls `listMyAccountsForTagging` → returns up to 200 of your accounts ordered by name. That's why Beetel, Laerdal, sportzinteractive and everything else appear.
- **CSFactors Pulse dashboard** (`src/components/csfactors/pulse/PulseDashboard.tsx`, line ~217) does `liveOrSeed.slice(0, 12)` — it deliberately renders only the top 12 accounts by ARR in the "command center" rows. Anything past row 12 is hidden, which is why your full book never appears on the dashboard.

So nothing is missing in the database — the dashboard is just truncated.

## Plan

Lift the Pulse cap so the dashboard reflects your real portfolio, and keep the widget scannable.

1. **Remove the hard 12-row truncation** in `PulseDashboard.tsx`:
   - Replace `liveOrSeed.slice(0, 12)` with a windowed render: show all live accounts (no slice), but render them inside a vertically scrollable container so the section height stays stable.
   - Keep the `pulseSeedAccounts` (12 fixtures) untouched — those are only used when you have zero real accounts, purely as a demo state.
2. **Add a row count + "View all" affordance** above the list:
   - Eyebrow text: `Portfolio · {N} accounts` so it's obvious how many you have.
   - "View all" link → `/csfactors` accounts grid (which already lists everything).
3. **Sort consistency**: keep the existing sort (ARR desc) so the most material accounts stay at the top of the visible window.
4. **No backend changes** — `listAccounts` already returns the full set; this is presentation-only.

### Files touched
- `src/components/csfactors/pulse/PulseDashboard.tsx` (remove slice, add scroll container + count + link)

### Not changing
- `RunAccountTagger.tsx` and `listMyAccountsForTagging` — they're already correct.
- Seed fixtures, RLS, or any data fetch.

### Verification
- With your live account list (Beetel, Laerdal, sportzinteractive, …) visible on `/csfactors` Pulse, confirm the dashboard now lists the same names that show up in the Lumi run-tag dropdown.
- Empty-state demo (signed-out / no accounts) still shows the 12 seed accounts.
