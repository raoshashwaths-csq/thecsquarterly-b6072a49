## Goal

Collapse two floating surfaces (Q + Playbook bulb) into one. Everything the bulb did — Take a Tour, Quick Tips, Feature Glossary — lives inside the Q drawer. The Universal/Workspace scope toggle inside Q goes away.

## What changes

### 1. `src/components/site/QAgentButton.tsx` — restructure the drawer

Remove:

- `scope` state and the Universal/Workspace pill toggle.
- `searchUserWorkspace` import + `runWorkspace` binding.
- The workspace `prefix` branching in `handleAsk`.

Keep `globalSearch` as the single search path. Workspace remains reachable via /account/workspace.

Add a slim action row directly under the Ask button, above "Suggested Vectors":

```
[ Tour this page ]   [ Quick Tips ]   [ Glossary ]
```

Three ghost buttons, font-mono uppercase tracking — matching existing eyebrow typography. Icons: `Compass`, `Sparkles`, `BookOpen`. Only one inline panel open at a time. When open, the panel replaces the Suggested Vectors / live search area visually so the drawer stays uncluttered.

- **Tour this page** → calls `tour.start()` and closes the Q sheet so popovers anchor cleanly. Disabled with "No tour here yet" when `!hasTour`.
- **Quick Tips** → toggles an inline collapsible rendering the route-aware tips list with dismiss checkboxes.
- **Glossary** → toggles an inline collapsible rendering the existing `<FeatureGlossary />` component.

Wire `useTour()` + `<PlaybookTour />` inside `QAgentButton` so the tour overlay still renders after the drawer closes.

### 2. Extract `<RouteTipsList />` → `src/components/enablement/RouteTipsList.tsx`

Lifts the Quick Tips body (route tips + dismiss checkboxes + showAll/restore) out of `PlaybookDrawer` so Q renders it without nesting a Sheet. Props: `onNavigate?: () => void` so a tip CTA closes the Q drawer.

### 3. `src/routes/__root.tsx`

Remove `import { PlaybookBadge }` and the `<PlaybookBadge />` JSX line.

### 4. Leave on disk (unreferenced)

`PlaybookBadge.tsx` and `PlaybookDrawer.tsx` stay in the repo but are no longer mounted. Avoids touching unrelated code; we can delete in a later cleanup.

## Final Q drawer layout

```
Header (Operator Agent · Beta)
  Meet Q. headline
  [ Tour page ] [ Quick Tips ] [ Glossary ]   ← new action row

[ Search input + voice ]
[ Ask Q. button ]

Q replies          (after asking)

— if a panel is open, render here (replaces block below) —

Suggested Vectors   (default)
Live search results (when typing)

Sign-in / Vanguard CTA
```

## Out of scope

- CSFactors Q drawer (`QAgentDrawer.tsx`) — already separate, bulb already hidden there.
- No changes to tour, glossary, or tips content.
- No changes to `useTour` logic.