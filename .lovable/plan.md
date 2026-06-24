## Goal

1. Extend the Lumi canvas from 8 → 21 decision trees per the Build Bible (Prompts 3-A and 3-B), fully functional like T1–T8.
2. Replace the current horizontal "Suggested Vectors" scroll strip with a **vertical list of tree headings** inside the Lumi drawer surfaces (site `QAgentButton` sheet + CSFactors `AskLumiDrawer`).
3. Keep all existing canvas / wheel / drawer / API behaviour untouched for T1–T8.

## What gets added (data)

`src/lib/q-trees.ts` — add 13 new tree objects to `TREES` and their L2/L3 nodes to `NODES`. Each tree follows the exact existing shape (root L1 → 3× L2 → 9× L3 terminals with `promptTemplate`, `contextFields`, `benchmarks`, `position`). Also add a `category` field to `Tree` so the canvas can colour-code:

```
category: "ops"        // blue   #5A7DC4  — Trees 9–13   (CSM daily)
category: "shared"     // green  #4A9B6F  — Trees 14–17  (shared)
category: "leadership" // purple #8A5AC4  — Trees 18–21  (VP/Director)
category: "core"       // gold   (existing T1–T8 unchanged)
```

New trees and their L1 parent node labels (verbatim from the bible):

```
T9   adoptionRescue          → "LOW ADOPTION"
T10  expectationReset        → "BROKEN PROMISE"
T11  commercialConversation  → "COMMERCIAL PRESSURE"
T12  stakeholderConflict     → "INTERNAL CUSTOMER CONFLICT"
T13  sentimentRecovery       → "NEGATIVE SENTIMENT"
T14  onboardingCrisis        → "ONBOARDING STUCK"
T15  executiveAccess         → "NEED EXEC ACCESS"
T16  productGap              → "PRODUCT GAP"
T17  winBack                 → "CHURNED ACCOUNT"
T18  teamPerformance         → "TEAM PERFORMANCE"
T19  leadershipComm          → "LEADERSHIP COMMUNICATION"
T20  orgDesign               → "ORG DESIGN"
T21  salesAlignment          → "SALES ALIGNMENT"
```

Each tree gets 3 L2 branches (e.g. for T9: "Feature dark", "Stakeholder drift", "Time-to-value slipping") and 3 L3 terminals per branch with the same prompt voice and `contextFields` pattern (`ARR_FIELD`, `TIMING_FIELD`, `CONTEXT_FIELD`) used by T1–T8.

## What gets changed (canvas)

`src/routes/agent.framework.tsx`:

- Tree picker rail: keep the existing grid component, but render trees grouped by category with a subtle colour dot and category label. No layout rewrite.
- `TreeWheel` and `TreeStack`: pass the tree's category-colour through as a CSS var so node strokes/dots pick up the gold/blue/green/purple family. Existing 8 trees keep gold.
- Legend block under the wheel: lists the 4 colour families with descriptions from the bible.
- System-prompt builder in `src/lib/q-agent.functions.ts` (and the CSFactors equivalent if it composes prompts): when the active tree's category is `ops`, append the bible's "Focus on practical, immediate, tactically executable guidance…" block; when `leadership`, append the "USER SENIORITY CONTEXT…" block. No change for `core`/`shared`.

## What gets changed (drawer "vectors" UI)

`src/components/site/QAgentButton.tsx` lines 311–330 currently render `SUGGESTED_VECTORS` as `flex gap-2 overflow-x-auto … snap-x` — that is the horizontal scroll the user is rejecting. Replace with a **vertical vector list of tree headings**:

```
Suggested Vectors
─────────────────────────
T1  · ESCALATION              Manage an Escalation        →
T2  · CHAMPION CHANGE         Handle Champion Change      →
T3  · UPSELL QUALIFICATION    Qualify an Upsell           →
…
T21 · SALES ALIGNMENT         Sales alignment             →
```

- One row per tree, vertical stack, scrollable inside the sheet (`max-h` + `overflow-y-auto`).
- Each row: category colour dot, mono eyebrow, display title, chevron.
- Clicking a row navigates to `/agent/framework?tree=T{n}` and closes the sheet. (The framework route already reads `activeTree` from state — we'll add a `?tree=` URL param read on mount.)
- `SUGGESTED_VECTORS` in `q-vectors.ts` is no longer needed by the drawer; leave the file in place (still referenced elsewhere indirectly? — none found) but the import is removed from `QAgentButton.tsx`.

`src/components/csfactors/AskLumiDrawer.tsx`:

- Add the same vertical vector list above the conversation area when there are no messages yet (empty state), keeping the existing briefing card path untouched when a briefing is supplied.
- Clicking a row deep-links to `/agent/framework?tree=Tx` and closes the drawer — consistent with single-agent rule.

## Wiring + safety

- `src/lib/discovery.functions.ts` already loops `for (const t of TREES)` and uses generic fields — automatically picks up the 13 new trees, no change needed.
- `src/routes/admin.tsx` already maps `TREES` to a generic table — picks up new rows.
- `scripts/check-wiring.ts` and `scripts/check-timeline-kinds.ts` are untouched — no new routes, no new event kinds.
- Tier limits, Lumi session counters, banner: unchanged. New trees consume the same Lumi session pool.

## Technical details

- New constant: `CATEGORY_COLOR: Record<TreeCategory, { dot: string; ring: string; label: string }>` in `q-trees.ts`, referenced from the picker rail, legend, and both drawers' vector list.
- `q-agent.functions.ts` prompt builder: read `tree.category` from the resolved terminal node's `treeId`; concat the corresponding system-prompt rider before the existing instructions.
- `agent.framework.tsx`: parse `?tree=Tx` once on mount via `useSearch` / `useRouterState`; if valid TreeId, set `activeTree`.
- All new prompt templates follow the existing 1–2 sentence voice ("Build the operator response: …").

## Out of scope

- No change to the canvas wheel geometry beyond colour theming.
- No change to AskLumi conversation logic, ElevenLabs STT, or session counters.
- No new routes, no new DB tables, no migrations.
