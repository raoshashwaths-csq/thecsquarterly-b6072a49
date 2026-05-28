# Why nothing appeared to change

The i18n wiring works — `i18n.changeLanguage` fires, the toast confirms, the footer (CTA strip + link columns) does re-render in the chosen language. The problem is what's visible above the fold on `/`:

- **SiteHeader on mobile (400px), logged in**: only icons + `AR` code + avatar are visible. No text token in the header changes.
- **Homepage hero, "The Sections" strip, "Recent Dispatches" heading, AI Readiness card, CSF card, Workspace anchor**: all hardcoded English strings, not wired to `t()`.

So a user on the home page sees a toast and no visible language change until they scroll to the footer. Reads as broken.

# Plan — extend Stage A coverage to the visible home chrome

Scope stays "UI chrome only" (no editorial body copy). Touch only frontend / presentation.

## 1. Add `home` translation keys to all six locale JSONs

Add a `home` namespace block to `src/locales/{en,ar,id,th,vi,tl}/common.json`:

```text
home.eyebrow                # "Weekly Dispatch for the 1% of CS Operators"
home.hero.line1             # "Stop managing accounts."
home.hero.line2             # "Start engineering trajectory."
home.hero.sub               # the 1-paragraph subhead
home.welcomeBack            # "Welcome back —"
home.openAccount            # "open your account →"
home.aiCard.eyebrow         # "AI Readiness · Diagnostic"
home.aiCard.title           # "Benchmark your CS org in 5 minutes"
home.aiCard.body
home.aiCard.cta             # "Take the free diagnostic →"
home.csfCard.eyebrow        # "CSF · Command Centre"
home.csfCard.title          # "Your personal CS dashboard"
home.csfCard.body
home.csfCard.cta            # "Unlock at Operator tier →"
home.workspace.eyebrow      # "Your Workspace"
home.workspace.title        # "Notes · Highlights · Links →"
home.sections.eyebrow       # "The Sections"
home.sections.count         # "{{count}} disciplines"
home.sections.enter         # "Enter section →"
home.sections.items.vanguard.{name,blurb}
home.sections.items.retention.{name,blurb}
home.sections.items.outcome.{name,blurb}
home.sections.items.codex.{name,blurb}
home.sections.items.diagnostic.{name,blurb}
home.thesis.eyebrow         # "The Thesis"
home.recent.title           # "Recent Dispatches"
home.recent.viewAll         # "View all"
home.insightLabel           # "Insight #{{n}}, {{min}} min read"
home.readFull               # "Read the full essay"
```

EN gets the existing copy verbatim. AR / ID / TH / VI / TL get AI-assisted drafts (already agreed workflow). Brand names ("CSF", "CSQ", "Q", section proper nouns like "The CS Vanguard") stay in English per the editorial rules; only the surrounding chrome labels translate.

## 2. Wire `useTranslation` into the homepage

In `src/routes/index.tsx`, swap the hardcoded strings in the hero, the AI Readiness card, the CSF card, the Workspace anchor, the Sections strip, the Thesis sidebar, and the Recent Dispatches strip for `t("home.…")` calls. The `SECTIONS` array's `name` / `blurb` / `hint` move into the JSON; the component reads them via `t()`.

The hint copy stays under `home.sections.items.*.hint` so Q hints translate too.

## 3. Confirm the wiring loop on screen

Once the homepage strings flip, switching to AR will visibly:
- repaint the eyebrow, hero, all three cards, sections strip, and "Recent Dispatches" header in Arabic,
- in addition to the footer (already wired).

No other behavior, business logic, or routing changes — Stage B (URL prefixes, `hreflang`, RTL layout mirroring) remains as previously agreed and is out of scope here.

## Files touched

- `src/locales/{en,ar,id,th,vi,tl}/common.json` — append `home.*` block.
- `src/routes/index.tsx` — add `useTranslation`, replace hardcoded strings with `t()` calls, move `SECTIONS` content into JSON.

Nothing else changes; no new components, no infra changes.
