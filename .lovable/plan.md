## Scope

Refine the existing enablement layer (bulb FAB + Playbook drawer + Quick Tour). No new features, no backend changes.

## 1. Move the bulb FAB

`src/components/enablement/PlaybookBadge.tsx`

- Reposition from bottom-right to **top-right**, anchored just below the sticky site header so it never overlaps:
  - global header (`/`, content routes): `top-20 right-6`
  - CSFactors / calculator (no global header, has its own sticky bar): `top-4 right-6`
- **Hide on mobile** (the Q button owns the bottom-right on small screens). Use `hidden md:inline-flex` so the bulb only appears ≥ md. Drop all the bottom-/right- stacking logic that was working around the Q button.
- Keep the glassmorphism styling, ping ring, and accent lightbulb icon. Tone the ping down slightly so it doesn't fight the header.

## 2. Per-page Quick Tour

`src/hooks/useTour.ts`

Today `TOUR_STEPS` is a flat 5-step array spanning Home → CSFactors and auto-navigates between routes. Replace with a **route-keyed map**:

```ts
const TOUR_STEPS_BY_ROUTE: Record<string, TourStep[]> = {
  "/": [...home steps...],
  "/csfactors": [...command-centre steps...],
  "/csfactors/$account": [...drilldown steps...],
  "/calculator": [...roi steps...],
  "/benchmarks": [...],
  "/ai-readiness": [...],
  "/retention-protocol": [...],
};
```

- `useTour()` picks the step list for the current `pathname` (longest-prefix match, same helper shape as `tipsForPath`).
- `start()` runs only the current page's steps. Remove the cross-route `navigate()` effect — the tour never leaves the page the user opened it on.
- Expose `hasTour: boolean` so `PlaybookDrawer` can disable / hide the "Take a Quick Tour" button on pages without registered steps (instead of opening a tour that immediately ends).
- `tourCompleted` flag becomes per-route: store a `Set<string>` of completed route keys in `STORAGE_KEYS.tourCompleted` (extend `storage.ts` with `readSet`/`writeSet` reuse) so each page can be re-prompted independently.

## 3. Author per-page tour steps

Add concise (2–4 step) tours for each surface, anchored to existing or newly added `data-tour` attributes. Each step gets a short title + body in the existing voice.

- **/** (Home): `workspace-icon`, `csf-box`, `ask-q-home` (already partly wired).
- **/csfactors** (Command Centre): `analytics-dropdown`, `standalone-modules`, `burning-three`, `ask-q`.
- **/csfactors/$accountId**: `stakeholder-map`, `contract-vault`, `back-to-command`.
- **/calculator**: `inputs-panel`, `analytics-package`, `scenario-toggle`.
- **/benchmarks**: `cohort-filter`, `nrr-chart`.
- **/ai-readiness**: `band-summary`, `start-survey`.
- **/retention-protocol**: `playbook-list`.

For any target that doesn't yet exist in the route's JSX, add a `data-tour="…"` attribute to the appropriate existing element. No new components, just attributes.

## 4. Tip alignment audit

`src/lib/enablement/tips.ts` is already per-route via longest-prefix `match`. Verify and tidy:

- Confirm every route above has a matching `TIP_GROUPS` entry; add empty-but-labelled groups for `/benchmarks`, `/ai-readiness`, `/retention-protocol` if missing (they exist — re-check copy for the 3-2-1 voice).
- Make sure no tip references a surface outside its own route (e.g. the Home tip about Workspace stays on `/`, not on `/csfactors`).
- `PlaybookBadge` already hides on `/login`, `/checkout`, `/api`, `/email`, `/lovable`, `/unsubscribe` — leave that list intact.

## 5. Drawer tweaks

`src/components/enablement/PlaybookDrawer.tsx`

- Read `hasTour` from `useTour()` (passed in as a prop from `PlaybookBadge`, same wiring as `onStartTour`). If false, render the "Take a Quick Tour" button as disabled with tooltip "No tour for this page yet" — keeps the surface honest.
- No other changes.

## Technical notes

- All work is in: `PlaybookBadge.tsx`, `PlaybookDrawer.tsx`, `useTour.ts`, `tips.ts`, `storage.ts`, plus `data-tour` attribute additions in route files.
- No new dependencies, no schema changes, no server functions.
- Dashboard kit / Q surfaces / header rules untouched.
- After edits, sanity check on `/csfactors` (current route) at 1252px desktop and at 375px mobile to confirm the bulb is gone on mobile and doesn't overlap the sticky CSFactors header on desktop.
