# THE CS QUARTERLY — COMPLETE LOVABLE BUILD BIBLE
## Every Prompt, Every Phase, In Build Order
## Last updated: June 2026
> **Status sync (Jun 2026):** 0-A, 0-B, 1-E, 2-A, 2-B, 2-C, 2-E are built. Reader $19 tier insertion is deferred to the Stripe → Paddle migration session.


---

## HOW TO USE THIS FILE

Each section contains either a **full prompt** to paste directly into Lovable,
or a **FILE REFERENCE** pointing to a saved PRD in your outputs folder.

**Status indicators:**
- ✅ BUILT — confirmed live in screenshots
- 🔄 IN PROGRESS — partially built
- 📄 PROMPT READY — paste and build now
- ⬜ NOT STARTED — not yet built

**Before pasting any prompt, always prepend the STANDING RULE below.**

---

---

## THE STANDING RULE
### Add this block to the TOP of every Lovable prompt from now on

```
BEFORE BUILDING ANYTHING IN THIS SESSION:

1. Use only colour values that already exist as CSS variables
   or Tailwind tokens in this codebase. Do not introduce any
   new hex values.

2. Use only route paths that already exist in the router.
   If a new route is needed, derive its path from the existing
   naming convention — do not invent a path.

3. Check whether a component for this feature already exists
   before creating a new one. If it exists, extend it.
   If it does not exist, create it in the correct existing
   folder following the naming convention already in use.

4. After building, verify the feature is reachable from at
   least one existing page before confirming complete.
   A component that exists but has no entry point is not
   complete.

5. Do not modify any component not directly related to
   today's build task.

Confirm you have read these constraints before writing any code.
```

---

---

# PHASE 0 — MAINTENANCE PROMPTS
## Run these before building new features

---

## PROMPT 0-A: WIRING AUDIT ✅ BUILT
### Find every broken link, orphan route, and dead CTA

```
BEFORE BUILDING ANYTHING IN THIS SESSION:
[paste standing rule here]

Perform a full wiring audit of every feature built in the
last 10 sessions. Do not build anything new. Do not modify
any UI. Your only job is to find broken connections and
report them, then fix each one surgically.

────────────────────────────────────────
WHAT TO AUDIT
────────────────────────────────────────

STEP 1 — SIDEBAR NAVIGATION AUDIT

Open the CSFactors sidebar component. For every navigation
item that exists:

  1. Find the onClick or href destination
  2. Verify that route or component actually exists
     in the router/file system
  3. Verify the destination renders something real —
     not an empty div, not a placeholder,
     not a component that immediately returns null
  4. If the destination does not exist or renders
     nothing: FLAG IT

Specific items to verify:
  MAP ENGINE nav item
    → Does clicking it navigate to a real MAP list view?
    → Does that view render actual content or a blank page?

  EBR BUILDER nav item (if it exists)
    → Same check

  ACTION CENTRE / CTA ENGINE nav item (if it exists)
    → Same check

  TRANSLATION (if added to admin sidebar)
    → Same check

  Every other sidebar item already present
    → Verify none are broken from recent builds

STEP 2 — ORPHAN ROUTE AUDIT

Look at every route defined in the router file.
For each route:

  1. Is there at least one link somewhere in the
     application that navigates to it?
  2. If no link exists anywhere — the route is an
     orphan. FLAG IT with the route path.
  3. The diagnostic routes are the highest-risk area —
     verify each diagnostic has at minimum one entry
     point (a card on the diagnostics index page, a link
     from the homepage, or a link from another
     diagnostic's results page)

STEP 3 — CTA BUTTON AUDIT

Find every button or link that is supposed to trigger
navigation or an action but may not be working.
Check specifically:

  Codex playbook pages:
    → Is there a visible CTA to purchase or access
      each playbook?
    → Does clicking it do something (modal, checkout,
      redirect) or does it silently fail?

  Article pages:
    → Is the paywall trigger actually firing at the
      correct scroll depth?
    → Is the upgrade CTA rendered inside the paywall overlay?

  Diagnostic results pages:
    → Is the "UNLOCK BLUEPRINT" button visible and
      functional for non-paid users?
    → Does it route somewhere or open a modal?

  Lumi canvas:
    → Does every tree node actually open a resolution
      path or does anything dead-end?
    → Is the "PUSH TO ACTION CENTRE" button rendering
      on the resolution drawer?

STEP 4 — COMPONENT EXISTS BUT IS NOT RENDERED AUDIT

Search the codebase for components that were created in
recent sessions but are not imported or rendered anywhere.

Search for files in /src/components/ that contain:
  CTACreateModal
  CTADetailDrawer
  MapCreateFlow
  EBRWorkspace
  ChampionDiagnostic (or similar)
  TranslationAdmin (or similar)

For each found component:
  → Is it imported in any page or layout file?
  → If not imported anywhere: FLAG IT

STEP 5 — GENERATE THE AUDIT REPORT

Before fixing anything, output a structured report:

  BROKEN SIDEBAR ITEMS:
    [list each with current destination and problem]

  ORPHAN ROUTES:
    [list each route with no inbound link]

  BROKEN OR MISSING CTAs:
    [list each page and the specific CTA problem]

  BUILT BUT UNRENDERED COMPONENTS:
    [list each component file that exists but is
    not mounted anywhere]

  WORKING CORRECTLY:
    [list what is confirmed working]

────────────────────────────────────────
THEN FIX EACH ISSUE SURGICALLY
────────────────────────────────────────

After the report, fix every flagged issue in this
order of priority:

PRIORITY 1 — Sidebar items that navigate nowhere:
  Wire each sidebar item to its correct existing
  component. If the component exists but is not
  routed, add the route. One fix per sidebar item.

PRIORITY 2 — Orphan diagnostic routes:
  Add each orphaned diagnostic to the diagnostics
  index page as a card. The card should show:
  the diagnostic name, a one-line description,
  and a START button linking to the route.
  Do not rebuild the diagnostic — just add the entry point.

PRIORITY 3 — Built but unrendered components:
  Find the correct page where each component belongs.
  Add a single import and a single JSX line to render
  it conditionally. Do not change the component itself.

PRIORITY 4 — Broken CTAs:
  For each broken CTA, add the minimum code needed to
  make it functional. If a button has no onClick, add one.
  If it routes to a missing page, create a minimal
  placeholder that says the feature is coming.
  Do not leave a silent failure.

────────────────────────────────────────
CONSTRAINTS
────────────────────────────────────────

Do not rebuild any component that already exists.
Do not change any visual design.
Do not add new features.
Do not change any existing route paths.
Fix the wiring only — imports, routes, onClick handlers,
and navigation links.
One surgical change per issue.
After each fix, confirm what file was changed and what
line was added or modified.
```

---

## PROMPT 0-B: TIER-AWARE EXPERIENCE ✅ BUILT
### Homepage and paywall personalised by subscription level

```
BEFORE BUILDING ANYTHING IN THIS SESSION:
[paste standing rule here]

Implement a fully tier-aware user experience across the
entire platform. Right now every visitor sees the same
homepage regardless of whether they are a new visitor,
a free subscriber, or a paying member. This needs to change.

Do not rebuild any existing components. Add conditional
rendering logic on top of what exists. All visual design
must use existing design tokens — do not introduce any
new values.

────────────────────────────────────────
STEP 1 — BUILD THE SUBSCRIPTION AWARENESS HOOK
────────────────────────────────────────

Create /src/hooks/useSubscriptionTier.js

This hook reads from the existing auth and subscription
state (Supabase session + user record) and returns:

  const {
    isLoggedIn,
    tier,           // 'visitor' | 'free' | 'reader' |
                    // 'practitioner' | 'operator' |
                    // 'team' | 'scale' | 'enterprise'
    isTeamLeader,   // boolean from users.is_team_leader
    lumiSessionsUsed,
    lumiSessionsAllowed,
    canAccessCSFactors,    // practitioner+
    canAccessLumi,         // free+ (1/week for free)
    canAccessCommunity,    // reader+
    canAccessTeamFeatures, // team+
    upgradePromptTier,     // next tier up
  } = useSubscriptionTier()

Lumi session limits by tier:
  visitor:      0 sessions
  free:         1 per week
  reader:       20 per month
  practitioner: 50 per month
  operator:     100 per month
  team:         500 per month (shared pool)
  scale:        2000 per month (shared pool)
  enterprise:   5000 per month (shared pool)

────────────────────────────────────────
STEP 2 — HOMEPAGE TRANSFORMATION
────────────────────────────────────────

Import useSubscriptionTier in the homepage component.
Apply the following conditional rendering.
Do not change the design of any existing section —
only change the CONTENT rendered inside each section.

STATE A — VISITOR (not logged in):
  Below headline: add a 3-card strip showing:
    Free access, Reader unlocks, Practitioner unlocks.
    Each card has one CTA.

  After 2nd article: blur remaining content.
  Overlay text: "Create a free account to access the
  full weekly brief and the AI Readiness Diagnostic."
  Two buttons: "CREATE FREE ACCOUNT" and
  "SEE WHAT'S INCLUDED →" (links to existing pricing page)

STATE B — FREE USER:
  Replace generic headline with:
  "Good morning, [first name]. Your free account gives
   you 1 Lumi session this week and the diagnostic score."

  Add a single-line upgrade nudge bar below hero:
  "Unlock the full Codex library, 50 Lumi sessions, and
   your CSFactors dashboard. From $39/month."
  One button: "SEE PLANS →"

  Article paywall overlay (NOT a redirect):
  "You're on the free plan. This article continues.
   Practitioner members get unlimited access plus the
   full Codex library."
  Two buttons: "UPGRADE TO PRACTITIONER" and
  "CONTINUE WITH FREE →" (shows one more paragraph,
  then re-blurs — does NOT give full access)

STATE C — READER ($19):
  Personalised greeting with last article read.
  No upgrade nudge bar.
  Show once per session (check sessionStorage flag):
  "Reader members don't have access to CSFactors.
   If your company already has a CS tool, you may not
   need it. If you don't, Practitioner is $39/month."
  Two buttons: "EXPLORE PRACTITIONER" and
  "REMIND ME LATER" (sets sessionStorage, hides card)

STATE D — PRACTITIONER ($39):
  Hero personalised summary:
  "Welcome back, [name]. You have [N] accounts in
   CSFactors and [N] Lumi sessions remaining this month."

  "YOUR WEEK" section with 3 live items:
    1. Most recent article (with read time)
    2. Lumi sessions remaining
    3. Open CTAs count (if any)

  Codex: all 6 playbooks accessible, no lock icons.
  Upgrade nudge only when within 10 sessions of limit.

STATE E — OPERATOR ($89):
  Same as Practitioner plus:
  "Risk Register: [N] open risks ·
   Next renewal: [account name] in [N] days"
  Show 2 most recently active MAPs and EBRs.

STATE F — TEAM AND ABOVE:
  Team-level summary in hero:
  "[N] open CTAs · [N] accounts in renewal window ·
   Lumi pool: [N]/[total] sessions used"

  If is_team_leader: add admin shortcut bar below hero:
  TEAM PULSE | ASSIGN CTA | EBR BUILDER

────────────────────────────────────────
STEP 3 — REDESIGN THE PAYWALL EXPERIENCE
────────────────────────────────────────

Replace the existing paywall redirect logic with a
PaywallOverlay component. Find the component that
currently handles the paywall and modify it.
Do not create a second paywall system in parallel.

Trigger: same scroll depth as current implementation.
Behaviour: overlay on blurred content — NOT a redirect.

For VISITORS:
  Headline: "This piece continues."
  Subhead: "Create a free account to read the full brief,
  access the AI Readiness Diagnostic, and try Lumi once
  this week."
  CTAs: "CREATE FREE ACCOUNT" (primary) | "SIGN IN" (secondary)

For FREE users:
  Headline: "This is a Practitioner piece."
  Subhead: "Practitioner members get unlimited access to
  every article, the full Codex library (6 playbooks,
  $294 in standalone value), 50 Lumi sessions per month,
  and the CSFactors personal dashboard.
  $39 per month. Cancel any time."
  CTAs: "UPGRADE TO PRACTITIONER" (primary) |
  "CONTINUE READING FOR FREE →" (secondary — shows one
  more paragraph only, not full article)

For READER users hitting CSFactors-gated content:
  Headline: "CSFactors requires Practitioner."
  Subhead: "The Reader plan gives you the full intelligence
  layer. Practitioner adds CSFactors for $20 more per month."
  CTAs: "UPGRADE TO PRACTITIONER ($39/mo)" | "STAY ON READER"

NEVER:
  Hard-redirect to pricing page without context
  Show a generic "Subscribe to read" message
  Block with a modal that has no secondary option

────────────────────────────────────────
STEP 4 — CODEX TIER AWARENESS
────────────────────────────────────────

VISITOR + FREE: All 6 playbooks visible, locked.
  CTA per playbook: "FROM $39/MO — UNLOCK ALL 6"
  Below grid: "Or purchase individually: $49 each"

READER+: All 6 accessible. No locks. No purchase CTAs.
  Banner: "All 6 playbooks included with your plan.
  $294 in standalone value."

────────────────────────────────────────
STEP 5 — LUMI TIER AWARENESS
────────────────────────────────────────

FREE USERS on Lumi canvas — persistent banner at top:
  "FREE PLAN · 1 SESSION THIS WEEK · [USED/AVAILABLE]"

  If session already used this week:
    Banner: "SESSION USED · Resets [day]. Practitioner
    members get 50 per month."
    All tree nodes visible but clicking shows inline:
    "Session limit reached. Upgrade for 50/month."
    CTA on node: "UPGRADE ($39/MO)"

  If session not yet used:
    Banner: "1 FREE SESSION AVAILABLE THIS WEEK"

PRACTITIONER/OPERATOR:
  Session counter in canvas header:
  "[N] OF [LIMIT] SESSIONS USED THIS MONTH"
  Turns amber within 10 sessions of limit.

TEAM/SCALE:
  "[N]/[POOL] TEAM SESSIONS USED"

────────────────────────────────────────
CONSTRAINTS
────────────────────────────────────────

Read all colour values from existing CSS variables.
Read all route paths from existing router configuration.
useSubscriptionTier must read from the same Supabase
session and users table that auth already uses.
All upgrade CTAs must link to the existing pricing page
route — do not hardcode a URL.

Test these journeys before confirming complete:
  □ New visitor lands on homepage — sees visitor state
  □ Free user scrolls to 52% — sees overlay, not redirect
  □ Free user hits Lumi — sees session counter + restriction
  □ Practitioner lands on homepage — sees personalised summary
  □ Free user clicks CONTINUE READING — one paragraph only
  □ Visitor clicks CREATE FREE ACCOUNT — goes to signup
```

---

---

# PHASE 1 — PRE-LAUNCH CRITICAL
## Must exist before the first paying subscriber

---

## PROMPT 1-A: REVENUE FOUNDATION ✅ IN PROGRESS
### Stripe, auth, paywall, pricing page, checkout flow

📄 **FILE:** `/mnt/user-data/outputs/PRD-Phase-1-Revenue-Foundation.md`
Paste the full contents of this file directly into Lovable.

**Status:** Partially built. Auth is live. Payment integration
pending (Stripe rejected — use Paddle/LemonSqueezy first).

**Pre-Lovable actions required:**
- Apply for Paddle at paddle.com (24-48hr approval)
- Apply for Stripe Atlas at stripe.com/atlas ($500)
- Set up Wise Business account

---

## PROMPT 1-B: CONTENT DEPTH ✅ IN PROGRESS
### Article series, Codex library, Value Realization Models

📄 **FILE:** `/mnt/user-data/outputs/PRD-Phase-2-Content-Depth.md`
Paste the full contents of this file directly into Lovable.

**Status:** 9-article series is live. Codex pages and VRM
grid need to be built.

---

## PROMPT 1-C: AI READINESS DIAGNOSTIC 🔄 PARTIAL
### Lead gen diagnostic — score + Vanguard-gated blueprint

📄 **FILE:** `/mnt/user-data/outputs/PRD-Phase-3-Diagnostic.md`
Paste the full contents of this file directly into Lovable.

**Status:** Landing and survey states built. Results state
with blueprint paywall needs completion.

---

## PROMPT 1-D: LUMI AGENT — PHASES 4–8 ⬜ NOT STARTED
### Lumi canvas, 8 decision trees, retrospective, job board, community

📄 **FILE:** `/mnt/user-data/outputs/PRD-Phases-4-to-8.md`
Paste the full contents of this file directly into Lovable.

**Note:** Build Phase 4 (Lumi canvas) as a standalone
Lovable session before attempting Phases 5–8.

---

## PROMPT 1-E: RENAME Q → LUMI ✅ BUILT
### One-day brand-critical fix

```
BEFORE BUILDING ANYTHING IN THIS SESSION:
[paste standing rule here]

Find and replace every instance of the letter "Q" used
as a product name or agent name throughout the CSFactors
codebase with "Lumi". This includes:

  - The lighthouse icon label anywhere it says "Q"
  - Any button labeled "ASK Q" → change to "ASK LUMI"
  - Any heading or subheading that says "Q" as a product name
  - Any placeholder text that refers to "Q" as the agent
  - The canvas route title if it says "Q"
  - Any metadata or page title tags

Do NOT rename:
  - Any variable named 'q' in JavaScript (query params etc.)
  - Any CSS class names containing 'q'
  - Any third-party library references

This is a text replacement only. Do not change any
layout, styling, or functionality. Confirm every
file changed and every line modified.
```

---

## PROMPT 1-F: HOMEPAGE ANIMATIONS — SET 1 ⬜ NOT STARTED
### Sticky scroll storytelling section (Auxia-style)

```
BEFORE BUILDING ANYTHING IN THIS SESSION:
[paste standing rule here]

Add a reusable sticky scroll storytelling component to
the CS Quarterly homepage. This is a NEW standalone
component that can be dropped into any page.

Homepage only. Do not modify any other pages.

The effect: a tall outer container pins an inner
viewport-height panel to the screen while the user
scrolls. As scroll progress moves through the outer
container, different content stages transition in and out.

────────────────────────────────────────
ARCHITECTURE
────────────────────────────────────────

OUTER CONTAINER:
  position: relative
  height: calc(100vh * number_of_stages + 0.5)
  width: 100%

INNER STICKY PANEL:
  position: sticky
  top: 0
  height: 100vh
  width: 100%
  overflow: hidden

SCROLL TRACKING (useEffect + useRef):
  const handleScroll = () => {
    if (!outerRef.current) return
    const rect = outerRef.current.getBoundingClientRect()
    const totalScrollDistance = rect.height - window.innerHeight
    if (totalScrollDistance <= 0) return
    const scrolled = -rect.top
    const progress = Math.max(0, Math.min(1,
      scrolled / totalScrollDistance
    ))
    const stage = Math.min(
      Math.floor(progress * stages.length),
      stages.length - 1
    )
    setActiveStage(stage)
  }
  window.addEventListener('scroll', handleScroll, { passive: true })

STAGE TRANSITIONS:
  Inactive: opacity 0, translateY 24px, pointer-events none
  Active: opacity 1, translateY 0, transition 0.5s ease
  Right panel: 50ms delay for stagger effect

────────────────────────────────────────
COMPONENT: StickyScrollSection
────────────────────────────────────────

Create at: /src/components/shared/StickyScrollSection.jsx

Props:
  stages: Array of { left: ReactNode, right: ReactNode, label: string }

Layout inside sticky panel:
  Two-column grid: 50/50 split

Progress indicator (right edge):
  Dot per stage, gold when active, border colour inactive
  Stage label in DM Mono above dots (uppercase, 9px)

MOBILE (below 768px):
  Disable sticky effect entirely
  All stages render as normal stacked sections

USAGE ON HOMEPAGE — 3 stages:

Stage 1 — label: "THE CSM"
  Left: Headline "For the practitioner managing thirty accounts."
        Body: description of Practitioner tier
        Gold CTA: "START FREE →"
  Right: CSFactors Pulse screenshot (personal dashboard)

Stage 2 — label: "THE LEADER"
  Left: Headline "For the VP carrying the NRR number."
        Body: description of Operator/Team tier
        Gold CTA: "SEE THE PLATFORM →"
  Right: CSFactors 360 Dashboard screenshot (team view)

Stage 3 — label: "THE ENTERPRISE"
  Left: Headline "For the CCO presenting to the board."
        Body: description of Scale/Enterprise tier
        Gold CTA: "VIEW ENTERPRISE →"
  Right: Risk Register / board export view

────────────────────────────────────────
CONSTRAINTS
────────────────────────────────────────

Homepage only.
Do not use Framer Motion, GSAP, ScrollTrigger, or any
scroll-jacking library.
Use only: window.addEventListener('scroll', ..., { passive: true })
{ passive: true } flag is non-negotiable — prevents jank.
Do not interfere with the existing 52% scroll-depth
paywall trigger on article pages.

Testing:
  □ Stage 1 visible on page load
  □ Stage 2 transitions in smoothly at correct scroll depth
  □ Stage 3 transitions in smoothly at correct scroll depth
  □ After Stage 3, scrolling continues naturally
  □ Progress dots update per stage
  □ Left and right panels stagger by 50ms
  □ Mobile: stages stack normally, no sticky behaviour
  □ No layout shift, no console errors
```

---

## PROMPT 1-G: HOMEPAGE ANIMATIONS — SET 2 ⬜ NOT STARTED
### Sequential card-fill baton-pass animation

```
BEFORE BUILDING ANYTHING IN THIS SESSION:
[paste standing rule here]

Add a sequential scroll-driven fill animation to the
homepage section cards (the grid of cards linking to
Codex, Diagnostic, Agent, Job Board, Community, etc.)

Homepage only. Do not change any card layout, content,
links, or grid structure.

────────────────────────────────────────
THE EFFECT
────────────────────────────────────────

As the user scrolls through the card grid section,
each card fills with the gold accent colour from left
to right, one card at a time in sequence. While one
card is filling, others remain unfilled. Once a card
reaches full fill, the next card begins.

Use TRANSFORM (scaleX/scaleY) for the fill — never
width/height — transform is GPU-accelerated.

────────────────────────────────────────
IMPLEMENTATION
────────────────────────────────────────

Wrap existing card grid in:
  <div class="card-fill-track" ref={trackRef}>

SCROLL TRACKING:
  const overlap = 0.15
  const totalFillProgress = progress * (numCards - overlap * (numCards - 1))

  For each card index i:
    const cardStart = i * (1 - overlap)
    cardFillPercent[i] = Math.max(0, Math.min(1,
      totalFillProgress - cardStart
    )) * 100

FILL LAYER inside each card:
  <div
    style={{
      position: 'absolute', inset: 0,
      transform: `scaleX(${cardFillPercent[i] / 100})`,
      transformOrigin: 'left center',
      transition: 'transform 0.15s linear',
      zIndex: 0,
    }}
  />

Content sits above fill layer (zIndex: 1).

TEXT COLOUR TRANSITION at 50% fill:
  isFilled = cardFillPercent[i] > 50
  text: isFilled ? '#111111' : existing text colour
  transition: 0.3s ease

DESKTOP: fill left to right (scaleX, transformOrigin: 'left center')
MOBILE (below 768px): fill bottom to top (scaleY, transformOrigin: 'bottom center')

RESPECTS prefers-reduced-motion:
  If set: disable fill animation, show all cards normally.

Testing:
  □ Scrolling down fills cards left-to-right in sequence
  □ Scrolling up unfills in reverse
  □ Adjacent cards overlap briefly during handoff
  □ Text colour flips at 50% fill with smooth transition
  □ Card hover lift still works regardless of fill state
  □ Mobile: direction switches to bottom-to-top
  □ prefers-reduced-motion disables cleanly
```

---

## PROMPT 1-H: HOMEPAGE ANIMATIONS — SET 3 ⬜ NOT STARTED
### 7 micro-animations for existing homepage elements

```
BEFORE BUILDING ANYTHING IN THIS SESSION:
[paste standing rule here]

Add these 7 scroll and interaction animations to the
homepage ONLY. Do not modify any other pages. Do not
remove or alter any existing animations. These are
additive refinements only.

All animations use the same IntersectionObserver
pattern already in the codebase. Use { passive: true }
on all scroll listeners. No new npm packages.

────────────────────────────────────────
1. RETENTION LEDGER TICKER — COUNT-UP ON ENTRY
────────────────────────────────────────

When the ticker first enters the viewport (IntersectionObserver,
fires once):
  Animate number from 0 to (target × 1.03) over 900ms
  using cubic-bezier(0.25, 0.46, 0.45, 0.94)
  Then animate from (target × 1.03) to target over 200ms
  using ease-out (the "settle" overshoot effect)

────────────────────────────────────────
2. LIGHTHOUSE ILLUSTRATION — BEAM SWITCH-ON
────────────────────────────────────────

Target: the light cone/beam element of the lighthouse SVG only.
If the SVG is a flat image, skip this animation entirely.

@keyframes beamSwitchOn { to { opacity: 0.85; } }
@keyframes beamPulse { 0%,100% { opacity:0.85; } 50% { opacity:0.55; } }

.lighthouse-beam {
  opacity: 0;
  animation:
    beamSwitchOn 1.2s ease-out 0.4s forwards,
    beamPulse 6s ease-in-out 1.6s infinite;
}

────────────────────────────────────────
3. THREE ARTICLE CARDS — STAGGERED ENTRY
────────────────────────────────────────

These cards already have the .reveal class.
Add stagger modifiers (CSS only, no JS changes):

.reveal-stagger-1 { transition-delay: 0ms; }
.reveal-stagger-2 { transition-delay: 100ms; }
.reveal-stagger-3 { transition-delay: 200ms; }

Apply reveal-stagger-1/2/3 to the three cards respectively
in addition to their existing .reveal class.

Arrow icon hover shift:
.card-arrow { display:inline-block; transition:transform 0.25s cubic-bezier(0.16,1,0.3,1); }
.card:hover .card-arrow { transform:translateX(4px); }

────────────────────────────────────────
4. SOCIAL PROOF STRIP — SCALE-UP ON ENTRY
────────────────────────────────────────

Each label in the "trusted by operators" strip:

.proof-item {
  opacity: 0;
  transform: scale(0.96);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1);
}
.proof-item.visible { opacity:1; transform:scale(1); }

Stagger each item by 60ms via IntersectionObserver. Fires once.

────────────────────────────────────────
5. ENTERPRISE CALLOUT — BORDER GLOW ON HOVER
────────────────────────────────────────

Target: the gold-bordered enterprise callout strip.

.enterprise-callout { transition: border-color 0.4s ease; }
.enterprise-callout::before {
  content:''; position:absolute; inset:-1px;
  background: radial-gradient(circle at 50% 50%, rgba(196,164,90,0.08), transparent 70%);
  opacity:0; transition: opacity 0.4s ease; pointer-events:none;
}
.enterprise-callout:hover { border-color: rgba(196,164,90,0.7); }
.enterprise-callout:hover::before { opacity:1; }

────────────────────────────────────────
6. PRICING TOGGLE — SLIDING PILL
────────────────────────────────────────

Only if a billing toggle exists on the homepage.
Replace simultaneous colour change with a sliding pill:

.toggle-pill {
  position:absolute; width:50%; background: existing gold token;
  transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); z-index:0;
}
When ANNUALLY active: .toggle-pill { transform:translateX(100%); }

────────────────────────────────────────
7. SECTION DIVIDERS — DRAW FROM CENTRE
────────────────────────────────────────

Target: horizontal divider lines between major sections.

.section-divider {
  transform:scaleX(0); transform-origin:center;
  transition:transform 0.8s cubic-bezier(0.16,1,0.3,1);
}
.section-divider.visible { transform:scaleX(1); }

IntersectionObserver threshold 0.5, fires once.

────────────────────────────────────────
CONSTRAINTS
────────────────────────────────────────

Homepage only. No other pages.
Do not duplicate or conflict with existing .reveal styles.
All animations must degrade gracefully if IntersectionObserver
is unavailable — elements default to visible/opacity:1.
Test in both light and dark mode.

Testing:
  □ Numbers count up on scroll, with settle overshoot
  □ Lighthouse beam switches on after headline, pulses forever
  □ Three cards arrive staggered left to right
  □ Card arrows shift right on hover
  □ Social proof items scale in with stagger
  □ Enterprise callout border glows on hover
  □ Section dividers draw from centre on scroll
  □ No layout shift from any animation
```

---

---

# PHASE 2 — VANGUARD EXPANSION
## Weeks 7–14 | Diagnostics 2–4, MAP Engine, EBR Builder, CTA Engine, Job Board

---

## PROMPT 2-A: CHAMPION DEPENDENCY DIAGNOSTIC ✅ BUILT
### Second diagnostic — single-threading exposure score

📄 **FILE:** `/mnt/user-data/outputs/PRD-Champion-Dependency-Diagnostic.md`
Paste the full contents of this file directly into Lovable.

**Key note:** This diagnostic uses the shared `useDiagnosticFlow(config)`
hook. If the hook doesn't exist yet, Lovable will create it.
All future diagnostics reuse this hook.

**After building:**
- Add a card for this diagnostic on the /diagnostics index page
- Add a cross-promotion card on the AI Readiness Diagnostic results page

---

## PROMPT 2-B: TRANSLATION GLOSSARY TABLE ✅ BUILT
### Supabase setup + admin UI — unblocks all MENA/SEA translation

📄 **FILE:** `/mnt/user-data/outputs/Translation-Glossary-Lovable-Prompt.md`
Paste the full contents of this file directly into Lovable.

**Pre-Lovable action:** Run the SQL from Step 1 of the file
directly in the Supabase SQL editor BEFORE opening Lovable.

**After building:**
Export the pending terms file and send to native-speaker
reviewers for Arabic and Bahasa Indonesia.
Cost: $15–30 per language on Upwork/Fiverr.

---

## PROMPT 2-C: MAP ENGINE ✅ BUILT
### Mutual Action Plan — highest-ROI CSFactors PM feature

```
BEFORE BUILDING ANYTHING IN THIS SESSION:
[paste standing rule here]

Build the Mutual Action Plan (MAP) Engine for CSFactors.
A new collaborative project management feature that allows
CSMs to create structured milestone plans for customer
accounts, share them with customer contacts as live
documents, and track progress connected to the account's
health score.

Add "MAP ENGINE" to the CSFactors sidebar navigation.
Do not modify any existing routes or components.

────────────────────────────────────────
1. SUPABASE SCHEMA
────────────────────────────────────────

CREATE TABLE IF NOT EXISTS maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  account_id uuid REFERENCES accounts(id),
  account_name text,
  csm_id uuid REFERENCES users(id),
  csm_name text,
  status text DEFAULT 'active' CHECK (
    status IN ('draft', 'active', 'completed', 'archived')
  ),
  contract_start_date date,
  target_value_date date,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  completed_at timestamp,
  benchmark_ttv_days integer,
  actual_ttv_days integer,
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  share_enabled boolean DEFAULT false,
  customer_email text,
  last_customer_view timestamp,
  lumi_generated boolean DEFAULT false,
  account_tier text,
  account_industry text
);

CREATE TABLE IF NOT EXISTS map_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid REFERENCES maps(id) ON DELETE CASCADE,
  title text NOT NULL,
  phase_order integer NOT NULL,
  is_value_milestone boolean DEFAULT false,
  color text DEFAULT '#C4A45A'
);

CREATE TABLE IF NOT EXISTS map_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid REFERENCES maps(id) ON DELETE CASCADE,
  phase_id uuid REFERENCES map_phases(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  milestone_order integer NOT NULL,
  owner text CHECK (owner IN ('csm', 'customer', 'shared')) DEFAULT 'shared',
  assigned_to text,
  status text DEFAULT 'not_started' CHECK (
    status IN ('not_started', 'in_progress', 'completed', 'blocked')
  ),
  due_days_from_start integer,
  completed_at timestamp,
  health_score_impact integer DEFAULT 0,
  completion_note text,
  blocked_reason text
);

CREATE TABLE IF NOT EXISTS map_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid REFERENCES maps(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES map_milestones(id),
  author_type text CHECK (author_type IN ('csm', 'customer')),
  author_name text,
  content text NOT NULL,
  created_at timestamp DEFAULT now()
);

────────────────────────────────────────
2. DEFAULT PHASE TEMPLATES (hardcoded)
────────────────────────────────────────

const DEFAULT_PHASES = [
  {
    title: "KICKOFF", color: "#C4A45A", is_value_milestone: false,
    default_milestones: [
      { title: "Kickoff call completed", owner: "shared", due_days: 3 },
      { title: "Success plan agreed", owner: "csm", due_days: 5 },
      { title: "Admin access provisioned", owner: "customer", due_days: 5 },
      { title: "Core team introduced", owner: "customer", due_days: 7 },
    ]
  },
  {
    title: "CONFIGURATION", color: "#5A7DC4", is_value_milestone: false,
    default_milestones: [
      { title: "Platform configured", owner: "csm", due_days: 14 },
      { title: "Data import completed", owner: "shared", due_days: 14 },
      { title: "Integrations connected", owner: "shared", due_days: 21 },
      { title: "Configuration signed off", owner: "customer", due_days: 21 },
    ]
  },
  {
    title: "TRAINING", color: "#8A5AC4", is_value_milestone: false,
    default_milestones: [
      { title: "Admin training delivered", owner: "csm", due_days: 21 },
      { title: "End user training delivered", owner: "csm", due_days: 28 },
      { title: "Training completion confirmed", owner: "customer", due_days: 30 },
    ]
  },
  {
    title: "FIRST VALUE MOMENT", color: "#4A9B6F", is_value_milestone: true,
    default_milestones: [
      { title: "First meaningful output generated", owner: "customer", due_days: 35 },
      { title: "Value confirmed by sponsor", owner: "customer", due_days: 38 },
      { title: "ROI baseline documented", owner: "csm", due_days: 40 },
    ]
  },
  {
    title: "ADOPTION", color: "#C4914A", is_value_milestone: false,
    default_milestones: [
      { title: "DAU/licensed ratio >70%", owner: "csm", due_days: 60 },
      { title: "Second use case activated", owner: "shared", due_days: 60 },
      { title: "Executive sponsor engaged", owner: "csm", due_days: 45 },
    ]
  },
  {
    title: "HANDOFF TO BAU", color: "#6BAD8E", is_value_milestone: false,
    default_milestones: [
      { title: "Ongoing cadence established", owner: "shared", due_days: 75 },
      { title: "Escalation path documented", owner: "csm", due_days: 75 },
      { title: "Success metrics agreed (next 90 days)", owner: "shared", due_days: 80 },
    ]
  }
]

────────────────────────────────────────
3. PAGES AND ROUTES
────────────────────────────────────────

/app/maps          → MAP index (list of all MAPs)
/app/maps/new      → Create new MAP (2-step flow)
/app/maps/[id]     → Individual MAP workspace (internal)
/app/maps/[id]/share → Customer-facing live view (PUBLIC)

MAP INDEX PAGE:
  Metric strip: ACTIVE MAPS | ON TRACK | AT RISK | AWAITING CUSTOMER
  Filter: Status, Account (search), At risk toggle
  Table columns: ACCOUNT | MAP TITLE | PHASE | PROGRESS | TTV CLOCK | CUSTOMER ACCESS | HEALTH IMPACT | ···
  "NEW MAP +" gold button top right

  TTV CLOCK display:
    On track: "DAY [N] OF [BENCHMARK]" — green
    Within 10% of benchmark: amber
    Exceeded: "[N] DAYS OVER" — red

CREATE MAP — STEP 1:
  Fields: MAP TITLE*, ACCOUNT* (search with ARR + health preview),
  CONTRACT START DATE*, TARGET VALUE DATE, CUSTOMER EMAIL
  Benchmark TTV: auto-populated read-only field from Retention Ledger
  gold-btn "CONTINUE →"

CREATE MAP — STEP 2:
  Lumi pre-population banner (gold, lighthouse icon):
  "Lumi has pre-populated this plan based on [account]'s
   tier, industry, and benchmark TTV."

  Editable phase list using DEFAULT_PHASES
  Each phase: drag-reorder, edit title, add/delete milestones
  Each milestone: edit title, click owner to cycle CSM→CUSTOMER→SHARED,
                  edit due date, delete
  Due dates auto-calculated from contract_start_date + due_days

  gold-btn "CREATE MAP →"
  → Insert maps + map_phases + map_milestones to Supabase
  → Redirect to /app/maps/[new_id]

MAP WORKSPACE (/app/maps/[id]):
  Two-column: MAP BOARD (65%) | SIDEBAR (35%)

  TTV PROGRESS BAR (full width, prominent):
    Fill = (days_elapsed / benchmark_ttv_days) × 100%
    Phase dots below bar

  PHASE COLUMNS (horizontal scroll):
    Each column: phase header with colour, milestone count
    Milestone cards: status symbol, title, owner badge, due date,
                    health pts badge, COMPLETE button on hover
    Add milestone button at column bottom

  COMPLETE MILESTONE MODAL:
    Milestone title, completion note textarea
    If health_score_impact > 0: gold banner showing points to be added
    If last milestone in is_value_milestone phase: green banner
      "TTV clock stops at Day [N]. Benchmark was [N] days."
    gold-btn "MARK COMPLETE →"
    → Set status=completed, completed_at=now()
    → Update accounts.health_score += health_score_impact
    → If value milestone phase complete: set maps.actual_ttv_days
    → Add Reckoning Ledger entry

  SIDEBAR sections:
    MAP DETAILS (account link, dates, progress, health impact remaining)
    CUSTOMER SHARE LINK (toggle, URL, copy button, email button, last viewed)
    LUMI INSIGHT (contextual button → Onboarding Crisis tree pre-filled)
    ACTIVITY (chronological milestone completions and comments)

CUSTOMER SHARE VIEW (/app/maps/[id]/share):
  PUBLIC — no login required
  Validate share_token parameter
  UPDATE maps SET last_customer_view=now() on valid access

  Light mode only. White background. Professional document feel.
  Header: CS Quarterly lighthouse mark, map title, "Shared by [csm_name]"
  Progress summary card with current phase
  Vertical milestone list (not columns — better for mobile)
  Milestone status symbols: ✓ completed, ○ not started, ◑ in progress, ⚠ blocked
  Customer-owned milestones: "(Your action)" label
  Per-milestone comment input for customer → saves to map_comments

PULSE DASHBOARD INTEGRATION:
  Add "ACTIVE MAP" column to portfolio overview table
  Shows current phase badge for accounts with active MAPs
  Clicking badge: opens /app/maps/[id]
  No active MAP: shows "+" ghost-btn → /app/maps/new pre-filled

Testing:
  □ /app/maps index loads with metric strip
  □ Account search works, benchmark TTV auto-populates
  □ DEFAULT_PHASES render with correct milestones and due dates
  □ Phases and milestones are editable
  □ Map saves to Supabase (all 3 tables populated)
  □ TTV progress bar fills correctly
  □ Milestone complete modal updates Supabase
  □ Health score updates on milestone completion
  □ Reckoning Ledger entry created
  □ Value milestone completion logs actual_ttv_days
  □ Share link toggle works
  □ /app/maps/[id]/share validates token
  □ Customer comment saves to map_comments
  □ last_customer_view updates on share page load
  □ Pulse table shows MAP phase badge
  □ MAP ENGINE in CSFactors sidebar — navigates correctly
```

---

## PROMPT 2-D: EBR BUILDER ⬜ NOT STARTED
### AI-powered Executive Business Review generator

```
BEFORE BUILDING ANYTHING IN THIS SESSION:
[paste standing rule here]

Build the EBR Builder for CSFactors. This is an AI-powered
Executive Business Review generator that constructs a
structured account review from live CSFactors data, uses
Lumi to write narrative sections, and produces a shareable
customer-facing document and downloadable PDF.

Add "EBR BUILDER" to the CSFactors sidebar between
"MAP ENGINE" and "WORKSPACE". Do not modify any existing
routes or components.

────────────────────────────────────────
1. SUPABASE SCHEMA
────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ebrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  account_id uuid REFERENCES accounts(id),
  account_name text,
  csm_id uuid REFERENCES users(id),
  csm_name text,
  review_period_label text,
  review_period_start date,
  review_period_end date,
  status text DEFAULT 'draft' CHECK (
    status IN ('draft', 'ready', 'delivered', 'archived')
  ),
  lumi_generated boolean DEFAULT false,
  lumi_generated_at timestamp,
  last_edited_at timestamp DEFAULT now(),
  data_snapshot jsonb DEFAULT '{}',
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  share_enabled boolean DEFAULT false,
  customer_email text,
  delivered_at timestamp,
  last_customer_view timestamp,
  customer_comments jsonb DEFAULT '[]',
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ebr_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ebr_id uuid REFERENCES ebrs(id) ON DELETE CASCADE,
  section_key text NOT NULL CHECK (
    section_key IN (
      'headline_metric', 'value_delivered', 'benchmark_context',
      'what_changed', 'what_did_not_go_as_planned',
      'risks_and_open_items', 'recommendations', 'mutual_commitments'
    )
  ),
  section_order integer NOT NULL,
  lumi_draft text,
  edited_content text,
  is_edited boolean DEFAULT false,
  data_sources jsonb DEFAULT '[]',
  UNIQUE(ebr_id, section_key)
);

CREATE TABLE IF NOT EXISTS ebr_commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ebr_id uuid REFERENCES ebrs(id) ON DELETE CASCADE,
  commitment_text text NOT NULL,
  owner text CHECK (owner IN ('csm', 'customer', 'shared')) DEFAULT 'shared',
  due_date date,
  status text DEFAULT 'pending' CHECK (
    status IN ('pending', 'completed', 'carried_over')
  ),
  commitment_order integer,
  carried_from_ebr_id uuid REFERENCES ebrs(id)
);

────────────────────────────────────────
2. SECTION DEFINITIONS (hardcoded)
────────────────────────────────────────

const EBR_SECTIONS = [
  {
    key: 'headline_metric', title: 'THE HEADLINE',
    lumi_instruction: 'Write ONE sentence stating the most important
      metric for this account this period. Lead with the number.
      Include benchmark context in brackets. Max 25 words. No preamble.'
  },
  {
    key: 'value_delivered', title: 'WHAT WE DELIVERED',
    lumi_instruction: 'Write 3-4 bullet points. Each must contain a
      specific metric or outcome. Pull from: completed MAP milestones,
      health score changes, completed CTAs marked resolved. Every bullet
      must have a number in it.'
  },
  {
    key: 'benchmark_context', title: 'WHERE YOU STAND',
    lumi_instruction: 'Write 2 paragraphs. P1: how account NRR, health
      score, and TTV compare to Retention Ledger benchmark for their
      segment. Use precise percentile language. P2: strongest metric vs
      peers and the one metric with most improvement opportunity.'
  },
  {
    key: 'what_changed', title: 'WHAT CHANGED',
    lumi_instruction: 'Write 3 items using: [What changed] → [Because of]
      → [So that]. Pull from: Reckoning Ledger events, MAP phase
      completions, health score movements. Do not list routine activities.'
  },
  {
    key: 'what_did_not_go_as_planned', title: 'WHAT DID NOT GO AS PLANNED',
    lumi_instruction: 'Write 1-2 items max. For each: state what did not
      happen, current status in past tense, what changed to prevent
      recurrence. If nothing went wrong: "No material gaps this period."
      Never use apologetic language.'
  },
  {
    key: 'risks_and_open_items', title: 'RISKS AND OPEN ITEMS',
    lumi_instruction: 'List open CTAs with high or critical priority.
      For each: the risk, ARR at stake, resolution timeline. Max 4 items.
      If no open risks: "No material risks currently open."'
  },
  {
    key: 'recommendations', title: 'WHAT WE RECOMMEND',
    lumi_instruction: 'Write exactly 3 recommendations. Each: [Action]
      owned by [person] by [specific date] expected outcome [metric].
      Make each specific enough to put in a calendar invite.'
  },
  {
    key: 'mutual_commitments', title: 'WHAT WE ARE COMMITTING TO',
    lumi_instruction: 'Generate 3-4 commitments from the recommendations.
      Split clearly between CSM-owned and customer-owned. Each must have
      a specific deliverable and date.'
  }
]

────────────────────────────────────────
3. DATA SNAPSHOT FUNCTION
────────────────────────────────────────

Build buildDataSnapshot(account_id, period_start, period_end):
  Query: accounts (health_score, nrr, grr, arr, tier, industry)
  Query: maps WHERE account_id — current phase, milestones completed
  Query: map_milestones WHERE completed_at in period
  Query: ctas WHERE account_id — open high/critical + completed in period

Benchmark calculation:
  const benchmarks = {
    smb:        { nrr_p50: 102, nrr_p75: 108, nrr_p25: 95 },
    mid_market: { nrr_p50: 108, nrr_p75: 115, nrr_p25: 100 },
    enterprise: { nrr_p50: 112, nrr_p75: 122, nrr_p25: 105 }
  }

Store as JSON in ebrs.data_snapshot. EBR is a fixed record
even if live data changes after generation.

────────────────────────────────────────
4. LUMI GENERATION — SUPABASE EDGE FUNCTION
────────────────────────────────────────

Create: /functions/generate-ebr
Called after data snapshot is built.

For each of the 8 sections, call Anthropic API with:
  Model: claude-sonnet-4-6
  Max tokens: 1000

System prompt for all calls:
"You are The Chief of Staff — the operational intelligence
engine of The CS Quarterly, generating an Executive Business Review.

VOICE: Precise, benchmark-grounded, direct. No hedging. No consultant
language. Every statement either contains a number or is directly
actionable.

ACCOUNT CONTEXT:
Account: [account_name] | Tier: [account_tier] | Industry: [account_industry]
Review period: [review_period_label] | ARR: [arr]

DATA:
NRR: [nrr]% | Health score: [health_score] | GRR: [grr]%

MAP PROGRESS:
[map_title]: [phase] — [N] milestones completed this period
[List of completed milestone titles]

OPEN RISKS: [List of open high/critical CTAs]

BENCHMARK CONTEXT:
[tier] [industry] NRR benchmark: [N]% | Percentile: [N]th
TTV benchmark: [N] days | Actual TTV: [actual_ttv_days] days

SECTION: [section_key]
INSTRUCTION: [EBR_SECTIONS[section_key].lumi_instruction]

OUTPUT: Write only the section content. No headers, no labels,
no preamble. Just the content as it will appear in the EBR."

Run 8 calls sequentially. On each success:
  INSERT into ebr_sections (ebr_id, section_key, section_order, lumi_draft)

On all complete:
  UPDATE ebrs SET lumi_generated=true, lumi_generated_at=now(), status='draft'

────────────────────────────────────────
5. PAGES AND ROUTES
────────────────────────────────────────

/app/ebrs           → EBR index
/app/ebrs/new       → Create EBR
/app/ebrs/[id]      → EBR workspace (internal editor)
/app/ebrs/[id]/share → Customer-facing view (PUBLIC)

EBR INDEX:
  Metric strip: TOTAL EBRS | THIS QUARTER | DRAFTS | CUSTOMER VIEWS
  Table: ACCOUNT | PERIOD | STATUS | GENERATED BY | CUSTOMER ACCESS | ···
  Status badges: DRAFT | READY | DELIVERED | ARCHIVED
  "GENERATED BY: ◆ LUMI" if lumi_generated=true

CREATE EBR (/app/ebrs/new):
  Fields: ACCOUNT* (search with last EBR date shown),
  REVIEW PERIOD LABEL*, START DATE*, END DATE*, CUSTOMER EMAIL
  Quick-select row: Q1 2026 | Q2 2026 | Q3 2026 | Q4 2026

  Data availability preview card after account selected:
    Checklist with ✓ green or ⚠ amber for each data source
    (health score, NRR, active MAP, completed milestones, open CTAs, benchmarks)

  gold-btn "GENERATE WITH LUMI →"
    1. Create ebrs record
    2. Call buildDataSnapshot()
    3. Call /functions/generate-ebr
    4. Show generation progress (cycling text):
       "Analysing account performance..."
       "Benchmarking against Retention Ledger..."
       "Writing value delivered section..."
       "Identifying risks and open items..."
       "Generating recommendations..."
       "Building mutual commitments..."
       "Finalising your EBR..."
    5. On complete: redirect to /app/ebrs/[id]

EBR WORKSPACE (/app/ebrs/[id]):
  Two-column: EBR PREVIEW (65%) | CONTROLS SIDEBAR (35%)

  EBR PREVIEW — document-style render of all 8 sections:
    Gold horizontal rule at top (4px gradient)
    "EXECUTIVE BUSINESS REVIEW" label
    Account name (large, serif)
    Review period + prepared by

    For each section:
      Section header row: title + "LUMI DRAFT" or "EDITED" badge + "EDIT ✎" on hover
      Content typography:
        headline_metric: large italic serif, centred
        value_delivered, recommendations: bulleted list
        benchmark_context, what_changed: paragraphs
        risks_and_open_items: bordered rows with coloured left border

      EDIT MODE (on EDIT click):
        textarea with lumi_draft visible below in grey for reference
        gold-btn "SAVE EDIT" → UPDATE ebr_sections SET edited_content, is_edited=true
        ghost-btn "REVERT TO LUMI DRAFT" → clears edited_content, is_edited=false

    MUTUAL COMMITMENTS section:
      Commitment cards from ebr_commitments table
      Owner badges: CSM (blue) | CUSTOMER (green) | SHARED (gold)
      "✓ DONE" button per commitment
      "ADD COMMITMENT +" ghost-btn

  CONTROLS SIDEBAR:
    STATUS: [DRAFT] [READY] [DELIVERED] pill buttons
    CUSTOMER SHARE: toggle + URL + COPY button + SEND BY EMAIL
    REGENERATE SECTION: dropdown + "REGENERATE" ghost-btn
      (re-calls edge function for one section only)
    CARRY FORWARD: from previous EBR — checkboxes on pending commitments
    EXPORT: "DOWNLOAD AS PDF →" uses window.print() with print CSS
             "COPY AS PLAIN TEXT →"

    PDF print CSS:
      background white, text #1A1A1A
      Playfair Display headings, Libre Baskerville body
      Gold rule as section dividers
      Account name + period as header every page
      "The CS Quarterly · CSFactors" as footer every page
      No sidebar content in print, no buttons/badges

CUSTOMER VIEW (/app/ebrs/[id]/share):
  PUBLIC — validate share_token
  UPDATE ebrs SET last_customer_view=now()
  Light mode only. White background.

  Header: CS Quarterly lighthouse mark, "EXECUTIVE BUSINESS REVIEW",
  account name, period, "Prepared by [csm_name]"
  All 8 sections rendered (edited_content fallback to lumi_draft)
  Mutual commitments prominent below content:
    Customer-owned: background tint + "(Your commitment)"
    CSM-owned: "(Our commitment)"
  Customer comment input: appends to ebrs.customer_comments jsonb array

INTEGRATIONS:
  Account detail page: add "NEW EBR →" button and "EBRS ([N])" tab
  MAP sidebar: "INCLUDE IN NEXT EBR" section explaining the connection
  Pulse table: "LAST EBR" column — shows "OVERDUE" in red if >90 days

Testing:
  □ Account search shows last EBR date
  □ Data availability checklist accurate
  □ Generation progress cycles all 7 steps
  □ All 8 sections render with Lumi content
  □ EDIT mode opens textarea with original visible
  □ SAVE EDIT updates Supabase
  □ REVERT clears edited_content
  □ EDITED / LUMI DRAFT badges correct
  □ REGENERATE SECTION works for individual sections
  □ Commitment cards render and complete correctly
  □ Carry forward from previous EBR works
  □ Share link enables customer access
  □ /app/ebrs/[id]/share validates token correctly
  □ PDF print CSS applies (no sidebar, white background)
  □ "LAST EBR" column in Pulse shows OVERDUE correctly
  □ EBR BUILDER in sidebar navigates correctly
```

---

## PROMPT 2-E: CTA ENGINE ✅ BUILT
### Native action management with team assignment and board view

```
BEFORE BUILDING ANYTHING IN THIS SESSION:
[paste standing rule here]

Add a CTA Engine to CSFactors. This allows CSMs to raise
CTAs against accounts, and team leaders to assign CTAs
to their team. Surfaces throughout the existing dashboard
without replacing any current views.

Add "ACTION CENTRE" to the CSFactors sidebar between
Pulse and Accounts. Do not modify any existing routes
or components.

────────────────────────────────────────
1. SUPABASE SCHEMA
────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ctas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cta_type text NOT NULL CHECK (cta_type IN (
    'call','email','meeting','task','escalation','renewal','expansion','other'
  )),
  priority text DEFAULT 'medium' CHECK (
    priority IN ('critical','high','medium','low')
  ),
  status text DEFAULT 'open' CHECK (
    status IN ('open','in_progress','completed','dismissed')
  ),
  account_id uuid REFERENCES accounts(id) NULL,
  account_name text,
  created_by uuid REFERENCES users(id) NOT NULL,
  created_by_name text,
  assigned_to uuid REFERENCES users(id) NULL,
  assigned_to_name text,
  team_wide boolean DEFAULT false,
  due_date timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  completed_at timestamp,
  source text DEFAULT 'manual' CHECK (
    source IN ('manual','lumi','renewal_war_room','expansion_engine','health_alert')
  ),
  source_ref text,
  completion_note text,
  outcome text CHECK (
    outcome IN ('resolved','escalated','deferred','no_action_needed')
  )
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_team_leader boolean DEFAULT false;

────────────────────────────────────────
2. TYPE AND PRIORITY CONFIG (hardcoded)
────────────────────────────────────────

const CTA_CONFIG = {
  call:       { label:"CALL",       icon:"◉", color:"#5A7DC4" },
  email:      { label:"EMAIL",      icon:"◈", color:"#8A8278" },
  meeting:    { label:"MEETING",    icon:"◆", color:"#4A9B6F" },
  task:       { label:"TASK",       icon:"◇", color:"#C4A45A" },
  escalation: { label:"ESCALATION", icon:"▲", color:"#C45A5A" },
  renewal:    { label:"RENEWAL",    icon:"↻", color:"#C4914A" },
  expansion:  { label:"EXPANSION",  icon:"↗", color:"#6BAD8E" },
  other:      { label:"ACTION",     icon:"◌", color:"#8A8278" }
}

const PRIORITY_CONFIG = {
  critical: { label:"CRITICAL", color:"#C45A5A", dot:"●" },
  high:     { label:"HIGH",     color:"#C4914A", dot:"●" },
  medium:   { label:"MEDIUM",   color:"#C4A45A", dot:"●" },
  low:      { label:"LOW",      color:"#4A4540", dot:"●" }
}

────────────────────────────────────────
3. THREE SURFACES WHERE CTAs APPEAR
────────────────────────────────────────

SURFACE A — Pulse Dashboard "ACTION CENTRE" panel:
  New panel below existing Pulse content.
  Header: "ACTION CENTRE" + "[N] OPEN" badge + "NEW CTA +" ghost-btn
  List of up to 8 open CTAs per row:
    [type icon] [title] [account name or "PORTFOLIO-WIDE"]
    [priority dot] [assignee initials circle 20px]
    [due date — red if overdue, amber if today]
    ["✓" complete button → Quick Complete modal]
  Row click → CTA Detail Drawer
  "VIEW ALL [N] OPEN ACTIONS →" if >8 → navigates to /ctas

SURFACE B — Account detail page "CTAs" tab:
  Tab badge: count of open CTAs for this account
  Header: "ACCOUNT ACTIONS" + "RAISE CTA FOR THIS ACCOUNT +" ghost-btn
  Filter pills: ALL | OPEN | IN PROGRESS | COMPLETED | DISMISSED
  Table: TYPE | TITLE | PRIORITY | ASSIGNED TO | DUE DATE | SOURCE | STATUS | ACTIONS
  Actions per row: COMPLETE | REASSIGN | EDIT

SURFACE C — /ctas (full Action Centre page):
  Add to sidebar as "ACTION CENTRE"
  Metric strip: OPEN | OVERDUE | DUE TODAY | COMPLETED THIS WEEK
  View toggle: LIST VIEW | BOARD VIEW
  
  LIST VIEW:
    Filter bar: STATUS | PRIORITY | TYPE | ASSIGNED TO | ACCOUNT | DUE
    "NEW CTA +" gold-btn top right
    Sortable table with same columns as Surface B
    Bulk selection: checkboxes + bulk action bar (ASSIGN TO, MARK COMPLETE,
    CHANGE PRIORITY, DISMISS with confirmation)

  BOARD VIEW:
    4 columns: OPEN | IN PROGRESS | COMPLETED | DISMISSED
    CTA cards with: border-left 3px priority colour, type icon+label,
    priority dot, title (2 lines max), account name, assignee, due date,
    "COMPLETE ✓" ghost-btn
    Drag using HTML5 draggable: updates status in Supabase on drop
    Dragging to COMPLETED → opens Quick Complete modal first

────────────────────────────────────────
4. MODALS
────────────────────────────────────────

CTA CREATE MODAL (slide-in from right, 400px, full height):
  Triggered by all "NEW CTA +" buttons throughout the platform.
  Fields: TITLE*, TYPE* (icon grid 2×4), PRIORITY* (4 buttons),
  ACCOUNT (search-as-you-type with "PORTFOLIO-WIDE" toggle),
  ASSIGN TO (team member dropdown, "ASSIGN TO ME" quick-select,
  "LEAVE UNASSIGNED"), DUE DATE (date+time + quick-select:
  TODAY|TOMORROW|+3 DAYS|+1 WEEK), DESCRIPTION (optional textarea)

  gold-btn "RAISE ACTION →":
    Validate required fields
    INSERT into ctas table
    Show success toast: "Action raised" + link to new CTA
    Close panel

CTA DETAIL DRAWER (slide-in from right, 400px):
  Full CTA details: type+title header, account (clickable link),
  assignee, due date, source badge (with link if lumi/war_room source),
  created by + timestamp, description (editable inline), activity log

  Footer:
    If open/in_progress: "MARK AS COMPLETE →" | "IN PROGRESS" | "DISMISS"
    If completed: shows note + outcome + "REOPEN" ghost-btn

QUICK COMPLETE MODAL (centred, 440px wide):
  Outcome selector: RESOLVED | ESCALATED | DEFERRED | NO ACTION NEEDED
  Completion note textarea (optional)
  gold-btn "COMPLETE →"
    SET status=completed, outcome, completion_note, completed_at=now()

TEAM ASSIGNMENT MODAL (team leader only, is_team_leader=true):
  Full team member list with: name, avatar initials, "OPEN CTAs: [N]"
  "ASSIGN TO MULTIPLE" toggle (creates one CTA per member)
  "TEAM-WIDE (VISIBLE TO ALL)" checkbox: sets team_wide=true, assigned_to=null

────────────────────────────────────────
5. PULSE TABLE INTEGRATION
────────────────────────────────────────

Update the existing "NEXT BEST ACTION" column in the
portfolio overview table to pull from the ctas table:

  SELECT * FROM ctas
  WHERE account_id = $1
    AND status IN ('open', 'in_progress')
  ORDER BY
    CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2
    WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END,
    due_date ASC NULLS LAST
  LIMIT 1

Render as clickable chip: [type icon] [title truncated to 20 chars]
If no open CTA for account: show "+" → opens Create modal pre-filled

────────────────────────────────────────
6. LUMI INTEGRATION
────────────────────────────────────────

On the Lumi resolution drawer, add "PUSH TO ACTION CENTRE"
button alongside existing "COPY SCRIPT" button.

onClick: Create 3 CTA records from the Zone 3 action sequence:
  cta_type: 'task', priority: 'high', source: 'lumi'
  assigned_to: current user
  Due dates: Step 1 = now+2h, Step 2 = now+8h, Step 3 = now+24h
  account_id: if there's a relevant account in context

Button changes to "✓ PUSHED" for 3 seconds after click.
Show toast: "3 actions pushed to your Action Centre"

────────────────────────────────────────
7. NOTIFICATIONS (in-app toasts only)
────────────────────────────────────────

"New action assigned to you: [title]" — on assigned_to change
"Action overdue: [title]" — on page load if due_date < now()
  (once per session — store dismissed IDs in sessionStorage)
"Team action needs attention: [title]" — for team leaders
  when team-wide CTA open >48hrs with no status update

Testing:
  □ "NEW CTA +" opens create panel from Pulse, Account, /ctas
  □ CTA creates correctly in Supabase
  □ Portfolio-wide CTA shows "PORTFOLIO-WIDE" badge
  □ Team leader sees full team list in assignment modal
  □ CSM can only assign to self or leave unassigned
  □ Pulse Action Centre shows up to 8 open CTAs
  □ "VIEW ALL" navigates to /ctas
  □ List view sorts and filters work
  □ Board drag-to-complete opens Quick Complete modal
  □ Status changes update all UI surfaces
  □ "NEXT BEST ACTION" column pulls from ctas table
  □ Lumi "PUSH TO ACTION CENTRE" creates 3 records
  □ Sidebar badge shows correct open CTA count
  □ Sidebar badge turns red when any CTA is overdue
```

---

---

# PHASE 3 — ENTERPRISE READY
## Weeks 15–24 | Full PM suite, Expansion Engine, Bridge features, Lumi 9–21

---

## PROMPT 3-A: LUMI TREES 9–13 (CSM DAILY OPS) ⬜ NOT STARTED
### 5 new trees — Adoption Rescue, Expectation Reset, Commercial Conv, Conflict, Sentiment

```
BEFORE BUILDING ANYTHING IN THIS SESSION:
[paste standing rule here]

Extend the existing Lumi Chief of Staff canvas from 8 to
13 decision trees. Add exactly 5 new tree data objects to
the existing TREES constant. Do not modify the canvas
component, node graph, drawer, API integration, or any
existing tree.

The 5 new trees use colour #5A7DC4 (blue family) to
indicate CSM daily operations category.

Add to the canvas legend:
  ● Blue nodes: CSM Daily Operations (Trees 9–13)

Tree IDs and parent node labels to add:

  adoptionRescue      → "LOW ADOPTION"
  expectationReset    → "BROKEN PROMISE"
  commercialConversation → "COMMERCIAL PRESSURE"
  stakeholderConflict → "INTERNAL CUSTOMER CONFLICT"
  sentimentRecovery   → "NEGATIVE SENTIMENT"

Each tree follows the exact same data structure as the
existing 8 trees: parent node → Level 2 branches →
Level 3 branches → terminal resolution output.

For the canvas layout: redistribute all 13 nodes into
a clean radial arrangement at the default zoom level
(0.75×) without node overlap. Either:
  - Keep original 8 in inner ring, 5 new in outer ring
  - Or reorganise all 13 into a 3×5 grid or even radial

Use the same Anthropic API system prompt builder but add:
  Blue nodes trigger system prompt instruction:
  "Focus on practical, immediate, tactically executable
   guidance. The user is a CSM dealing with a day-to-day
   account situation, not a leadership decision."
```

---

## PROMPT 3-B: LUMI TREES 14–21 (SHARED + VP LEVEL) ⬜ NOT STARTED

```
BEFORE BUILDING ANYTHING IN THIS SESSION:
[paste standing rule here]

Extend the Lumi canvas from 13 to 21 decision trees.
Add 8 new tree data objects to the existing TREES constant.
Do not modify canvas, graph, drawer, or existing trees.

Trees 14–17 (colour #4A9B6F — green family — shared CSM/VP):
  onboardingCrisis  → "ONBOARDING STUCK"
  executiveAccess   → "NEED EXEC ACCESS"
  productGap        → "PRODUCT GAP"
  winBack           → "CHURNED ACCOUNT"

Trees 18–21 (colour #8A5AC4 — purple family — VP/Director):
  teamPerformance   → "TEAM PERFORMANCE"
  leadershipComm    → "LEADERSHIP COMMUNICATION"
  orgDesign         → "ORG DESIGN"
  salesAlignment    → "SALES ALIGNMENT"

Add to canvas legend:
  ● Green nodes: Shared Scenarios (Trees 14–17)
  ● Purple nodes: Leadership & Strategic (Trees 18–21)

Update the Lumi system prompt builder: add one context block
for purple nodes (18–21):
  "USER SENIORITY CONTEXT: This user is in a leadership role.
   Responses should be strategic and systemic, not tactical.
   Reference organisational dynamics, board-level implications,
   and team-level consequences. Tone: peer-level, direct,
   assumes CS leadership experience."

Redistribute all 21 nodes into the cleanest possible layout
at 0.75× zoom. Suggested: two-ring radial (8 original gold
in inner ring, 13 new in outer ring by colour group).
```

---

## PROMPT 3-C: WHATSAPP INTEGRATION ⬜ NOT STARTED
### CSFactors via WhatsApp — renewals, CTAs, health updates, Lumi

```
BEFORE BUILDING ANYTHING IN THIS SESSION:
[paste standing rule here]

Build the WhatsApp Business API integration for CSFactors
using n8n Cloud as the orchestration layer. This connects
CSFactors account data and actions to WhatsApp, allowing
CSMs to receive alerts, raise CTAs, update health scores,
and query Lumi — all from WhatsApp.

This is a backend integration + n8n workflow configuration.
The Lovable task is to:
  1. Add the opt-in UI to the onboarding/account settings flow
  2. Add Supabase schema for WhatsApp preferences
  3. Add a "WhatsApp" section to the account settings page
  4. Add the "PUSH TO ACTION CENTRE" flow that can receive
     data from external webhooks
  5. Add outbound notification triggers to existing features

────────────────────────────────────────
1. SUPABASE SCHEMA
────────────────────────────────────────

ALTER TABLE users ADD COLUMN IF NOT EXISTS
  whatsapp_number text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  whatsapp_opted_in boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  whatsapp_opted_in_at timestamp;

CREATE TABLE IF NOT EXISTS whatsapp_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  notification_type text NOT NULL CHECK (
    notification_type IN (
      'renewal_alert', 'health_drop', 'burning_three',
      'cta_overdue', 'cta_assigned', 'champion_departure',
      'expansion_signal', 'community_new_thread', 'lumi_response'
    )
  ),
  account_id uuid REFERENCES accounts(id),
  account_name text,
  message_content text,
  sent_at timestamp DEFAULT now(),
  delivery_status text DEFAULT 'pending' CHECK (
    delivery_status IN ('pending','sent','delivered','failed','read')
  ),
  whatsapp_message_id text
);

────────────────────────────────────────
2. WHATSAPP OPT-IN UI
────────────────────────────────────────

Add a "WHATSAPP ALERTS" section to the existing account
settings or profile page:

  "GET CSFACTORS ALERTS ON WHATSAPP"
  Toggle switch (currently off by default)

  When toggled on:
    Phone number input field appears
    Placeholder: "+971 50 000 0000"
    "(Include country code)"
    gold-btn "ENABLE WHATSAPP ALERTS →"
      → Validates phone number format
      → UPDATE users SET whatsapp_number, whatsapp_opted_in=true,
        whatsapp_opted_in_at=now()
      → Show confirmation: "WhatsApp alerts enabled.
        You'll receive renewal reminders, health alerts,
        and CTA notifications."

  Opt-out: "DISABLE WHATSAPP ALERTS" ghost-btn
    → UPDATE users SET whatsapp_opted_in=false

  Alert preferences (shown when opted in):
    Toggle per notification type:
      ✓ Renewal alerts (90, 60, 30 days)
      ✓ Health score drops
      ✓ New Burning Three entries
      ✓ Overdue CTAs
      ✓ New CTA assignments
      ○ Community new thread (opt-in, off by default)

  Note: "Available for Practitioner and above"
  If user is free tier: show but disabled with upgrade prompt

────────────────────────────────────────
3. OUTBOUND NOTIFICATION TRIGGERS
────────────────────────────────────────

Add trigger calls to the following existing features.
Each trigger: check user.whatsapp_opted_in before firing.
If true: INSERT into whatsapp_notifications table.
The n8n workflow polls this table and sends via API.

TRIGGER A — Renewal War Room activation (90 days):
  When a MAP or account renewal date is 90 days away:
  INSERT into whatsapp_notifications:
    type: 'renewal_alert'
    message_content: "⚡ Renewal approaching: [account_name]
    ARR: [arr] · Renewing in 90 days
    Health: [health_score] · [View in CSFactors]"

TRIGGER B — Health score drop alert:
  When health_score drops more than 10 points in 7 days:
  INSERT into whatsapp_notifications:
    type: 'health_drop'
    message_content: "⚠️ Health alert: [account_name]
    Score: [old] → [new] (↓[delta] pts)
    [View Account] [Raise CTA] [Ask Lumi]"

TRIGGER C — CTA assigned:
  When ctas.assigned_to changes to a user:
  INSERT into whatsapp_notifications:
    type: 'cta_assigned'
    message_content: "New action assigned to you:
    [cta_title] · [account_name]
    Due: [due_date] · Priority: [priority]
    [View] [Mark Complete]"

TRIGGER D — CTA overdue:
  On daily check (via n8n schedule): any open CTA past due_date:
  INSERT into whatsapp_notifications:
    type: 'cta_overdue'
    message_content: "⏰ Overdue: [cta_title]
    Account: [account_name]
    Was due: [due_date]
    [View] [Mark Complete] [Snooze]"

TRIGGER E — New Burning Three entry:
  When an account enters the Burning Three calculation:
  INSERT into whatsapp_notifications:
    type: 'burning_three'
    message_content: "🔥 New escalation: [account_name]
    Added to Burning Three
    [N] days to renewal · ARR: [arr]
    [Open Account] [Raise CTA]"

────────────────────────────────────────
4. INBOUND COMMAND WEBHOOK ENDPOINT
────────────────────────────────────────

Create a Supabase Edge Function at:
/functions/whatsapp-inbound

This receives POST requests from n8n (which receives
WhatsApp messages from the Meta Cloud API).

The function parses command text and routes to the
correct Supabase action:

COMMAND PARSER (parse the WhatsApp message text):

  "Health [account]: [score]"
    → FUZZY MATCH account name against accounts table
    → UPDATE accounts SET health_score=[score]
    → Return: "✓ Health updated: [account_name] → [score]"

  "CTA: [title]"
    → INSERT into ctas: title=[title], assigned_to=sender,
      priority='high', source='whatsapp'
    → Return: "✓ CTA raised: [title]"

  "Stage [account]: [stage]"
    → UPDATE accounts SET account_stage=[stage]
    → Return: "✓ Stage updated: [account_name] → [stage]"

  "Risk [account]: [critical|high|medium|low]"
    → UPDATE ctas or accounts risk field
    → Return: "✓ Risk level updated"

  "Note [account]: [text]"
    → INSERT into reckoning_ledger or activity feed
    → Return: "✓ Note added to [account_name]"

  "Team summary" or "Summary"
    → Query: open CTAs, burning three, upcoming renewals
    → Return formatted summary message

  "Lumi: [natural language query]"
    → Call Anthropic API with Lumi system prompt
      + the natural language as the user message
    → Return Lumi's Zone 2 + Zone 3 content as WhatsApp message
      (Zone 1 observation + action steps only — no full HTML)

For unrecognised commands:
  Return: "Commands: Health [account]: [score] |
  CTA: [title] | Stage [account]: [stage] |
  Note [account]: [text] | Summary | Lumi: [question]"

────────────────────────────────────────
5. LUMI VIA WHATSAPP
────────────────────────────────────────

The "Lumi: [query]" command is the most important inbound flow.

The Anthropic API call uses a simplified version of the
Lumi system prompt (without canvas context but with the same
benchmark-grounded, 40-year veteran voice):

System: "You are Lumi, The CS Quarterly's operational advisor.
The user is a CS professional sending you a quick query via
WhatsApp. Respond with:
1. One-line observation (italic if possible)
2. The core diagnostic (2-3 sentences)
3. The next 3 actions (numbered, specific, time-bound)
Keep total response under 300 words. Use WhatsApp formatting:
*bold* for key terms, no markdown headers."

Store the query and response in whatsapp_notifications table
for audit purposes.

────────────────────────────────────────
6. ACCOUNT SETTINGS GATING
────────────────────────────────────────

WhatsApp features are available to Practitioner and above.
If user is on Free or Reader tier: show the WhatsApp settings
section but with a lock overlay:
  "WhatsApp integration requires Practitioner or above."
  "From $39/month." + "UPGRADE" button

────────────────────────────────────────
N8N WORKFLOW NOTES (for your reference — configure in n8n)
────────────────────────────────────────

These 4 n8n workflows handle the actual WhatsApp API calls.
Build them in n8n Cloud, not in Lovable:

  Workflow 1 — OUTBOUND ALERTS:
    Schedule: every 5 minutes
    Query: SELECT * FROM whatsapp_notifications WHERE delivery_status='pending'
    For each: POST to Meta WhatsApp Cloud API
    UPDATE delivery_status='sent'

  Workflow 2 — INBOUND COMMANDS:
    Trigger: Meta WhatsApp Cloud API webhook
    Action: POST to /functions/whatsapp-inbound

  Workflow 3 — RENEWAL CALENDAR:
    Schedule: daily at 8am
    Query: accounts with renewal dates 90/60/30 days out
    For each: INSERT into whatsapp_notifications if opted in

  Workflow 4 — DAILY OVERDUE CHECK:
    Schedule: daily at 9am
    Query: open CTAs past due_date
    For each: INSERT into whatsapp_notifications if opted in

Testing:
  □ WhatsApp opt-in UI appears in account settings
  □ Phone number saves to Supabase on enable
  □ Opt-out clears whatsapp_opted_in flag
  □ Alert preferences toggle and save
  □ Free/Reader users see upgrade prompt
  □ Renewal trigger creates whatsapp_notifications row
  □ Health drop trigger fires on 10+ point drop
  □ CTA assigned trigger fires on assignment
  □ Inbound webhook parses "Health Northbridge: 58" correctly
  □ Inbound "CTA: [title]" creates CTA in Supabase
  □ Inbound "Lumi: [query]" calls Anthropic and returns response
  □ Unrecognised command returns help text
```

---

## PROMPT 3-D: ADMIN CONTROL PANEL ⬜ NOT STARTED
### 11-module admin dashboard

📄 **FILE:** `/mnt/user-data/outputs/PRD-Admin-Control-Panel.md`
Paste the full contents of this file directly into Lovable.

---

## PROMPT 3-E: EXPANSION ENGINE ⬜ NOT STARTED
### Turns the static Expansion Playbook into live per-account scoring
### Depends on: MAP Engine (2-C) being live

> ⚠️ **DECISION REQUIRED BEFORE BUILDING ELA MOTION**
> Q4 from the PRD is unresolved: ELA sub-status tracking.
> **Option A (recommended for now):** single `play_initiated` flag + notes field in MAP Engine. Ship this.
> **Option B (Phase 10):** dedicated `ela_phase` sub-status (Q-3/Q-2/Q-1/Close Window) with
> automatic checklist swapping. Scope this later when Scale/Enterprise accounts need it.
> Build Option A. Mark Option B as a Phase 10 item.

```
BEFORE BUILDING ANYTHING IN THIS SESSION:
[paste standing rule here]

Build the Expansion Engine for CSFactors. This turns the
Revenue Expansion Master Playbook into a live per-account
scoring system. It surfaces expansion-ready accounts in
Pulse, injects execution task sequences into MAP Engine
when a motion goes Green, and tracks outcomes against
NRR in the Retention Ledger.

Build in 3 phases. Do NOT build all 3 in one session.
Read the full spec, then start Phase 1 only.

Dependencies:
  - maps table (MAP Engine) must exist in Supabase
  - accounts table must exist
  - ctas table (CTA Engine) must exist
  - users table with is_team_leader must exist

────────────────────────────────────────
PHASE 1 (THIS SESSION): DATA MODEL + MOTION READINESS ENGINE + PULSE BADGES
────────────────────────────────────────

1. SUPABASE SCHEMA — NEW TABLES

CREATE TABLE IF NOT EXISTS feature_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text NOT NULL UNIQUE,
  tier text CHECK (tier IN ('core', 'pro', 'enterprise')) DEFAULT 'core',
  weight integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

-- Seed with 10 example features (admin can edit/add more):
INSERT INTO feature_registry (feature_name, tier) VALUES
  ('Report Export', 'core'),
  ('Shared Workspace', 'core'),
  ('Custom Dashboard', 'pro'),
  ('API Integration', 'pro'),
  ('Admin Console', 'pro'),
  ('Advanced Analytics', 'pro'),
  ('Multi-team Access', 'enterprise'),
  ('SSO Login', 'enterprise'),
  ('Bulk Import', 'core'),
  ('Scheduled Reports', 'pro')
ON CONFLICT (feature_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS account_feature_adoption (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  feature_id uuid REFERENCES feature_registry(id),
  is_adopted boolean DEFAULT false,
  last_updated_by uuid REFERENCES users(id),
  last_updated_at timestamp DEFAULT now(),
  UNIQUE(account_id, feature_id)
);

CREATE TABLE IF NOT EXISTS account_stage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  previous_stage text,
  new_stage text NOT NULL,
  changed_by uuid REFERENCES users(id),
  changed_at timestamp DEFAULT now(),
  notes text
);

CREATE TABLE IF NOT EXISTS expansion_motion_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  motion text NOT NULL CHECK (
    motion IN ('seat_expansion', 'cross_sell', 'platform_uptier', 'ela')
  ),
  status text DEFAULT 'red' CHECK (status IN ('red', 'amber', 'green')),
  status_reason text,
  conditions_met integer DEFAULT 0,
  conditions_total integer DEFAULT 0,
  last_evaluated_at timestamp DEFAULT now(),
  triggered_at timestamp,
  play_initiated boolean DEFAULT false,
  play_initiated_at timestamp,
  outcome text CHECK (
    outcome IN ('not_started', 'in_progress', 'won', 'lost', 'deferred')
  ) DEFAULT 'not_started',
  outcome_value numeric,
  outcome_recorded_at timestamp,
  UNIQUE(account_id, motion)
);

CREATE TABLE IF NOT EXISTS motion_play_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  motion text NOT NULL CHECK (
    motion IN ('seat_expansion', 'cross_sell', 'platform_uptier', 'ela')
  ),
  step_order integer NOT NULL,
  step_title text NOT NULL,
  step_description text,
  default_owner text CHECK (default_owner IN ('csm', 'customer', 'shared')),
  due_days_from_start integer
);

-- Seed play templates:
INSERT INTO motion_play_templates
  (motion, step_order, step_title, step_description, default_owner, due_days_from_start)
VALUES
  -- Seat Expansion
  ('seat_expansion',1,'Confirm DAU/licensed ratio','Verify ratio is above 0.7 and shadow users identified','csm',3),
  ('seat_expansion',2,'Identify shadow users','Document names of unlicensed users accessing via licensed seats','csm',7),
  ('seat_expansion',3,'Build seat expansion proposal','Prepare commercial proposal with ROI model','csm',14),
  ('seat_expansion',4,'Present to champion','Run expansion conversation with champion','csm',21),
  ('seat_expansion',5,'Executive sign-off','Obtain budget authority confirmation','customer',35),
  -- Cross-Sell
  ('cross_sell',1,'Confirm Second Value documentation','Ensure both workflow records are complete','csm',3),
  ('cross_sell',2,'Map cross-sell use case','Identify which additional product/module fits customer need','csm',7),
  ('cross_sell',3,'Build value case for new module','Connect new module to documented Second Value outcomes','csm',14),
  ('cross_sell',4,'Schedule cross-sell discovery call','Run needs discovery with expanded stakeholder group','shared',21),
  ('cross_sell',5,'Submit commercial proposal','Send pricing and contract addendum','csm',35),
  -- Platform Up-tier
  ('platform_uptier',1,'Document tier limit hits','Confirm 3+ tier limit events in last 90 days','csm',3),
  ('platform_uptier',2,'Prepare tier comparison','Build before/after view of current vs next tier','csm',7),
  ('platform_uptier',3,'Calculate ROI of upgrade','Model cost vs value at next tier for their usage pattern','csm',14),
  ('platform_uptier',4,'Up-tier conversation with champion','Run the upgrade conversation using value model','csm',21),
  -- ELA (Option A: single flag + notes — Option B deferred to Phase 10)
  ('ela',1,'Confirm ELA eligibility','Verify 200+ seats, 3+ departments, C-suite relationship','csm',7),
  ('ela',2,'Executive alignment meeting','Q-3: align on strategic value with C-suite contact','csm',30),
  ('ela',3,'Legal and procurement intro','Q-2: introduce procurement team to vendor contacts','shared',90),
  ('ela',4,'Commercial negotiation','Q-1: finalise ELA terms with legal and finance','shared',150),
  ('ela',5,'ELA close and transition','Sign ELA, transition account to enterprise model','shared',180)
ON CONFLICT DO NOTHING;

2. ACCOUNT TABLE ADDITIONS:

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS
  account_stage text DEFAULT 'onboarding'
  CHECK (account_stage IN ('onboarding','value_realization','optimization','advocacy'));

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS
  second_value_flag boolean DEFAULT false;

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS
  second_value_workflow_count integer DEFAULT 0;

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS
  threading_score integer DEFAULT 0;

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS
  dau_licensed_ratio float DEFAULT 0;

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS
  shadow_user_count integer DEFAULT 0;

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS
  tier_limit_hits integer DEFAULT 0;

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS
  dept_count integer DEFAULT 1;

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS
  seat_count integer DEFAULT 0;

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS
  feature_adoption_pct float DEFAULT 0;

3. MOTION READINESS ENGINE (Supabase Edge Function):

Create: /functions/evaluate-expansion-motions

This function evaluates all 4 motions for a given account
and upserts into expansion_motion_status.

Call it whenever: account_stage changes, second_value_flag
changes, feature_adoption_pct changes, threading_score
changes, any account attribute changes.

Also call on a scheduled basis (daily) for all accounts.

MOTION RULES (implement exactly as written):

SEAT EXPANSION:
  Conditions:
    A. account_stage IN ('optimization', 'advocacy')       [1 point]
    B. dau_licensed_ratio >= 0.7                           [1 point]
    C. shadow_user_count >= 2                              [1 point]
    D. feature_adoption_pct >= 50                          [1 point]
  Rules:
    ALL 4 met → Green
    3 of 4 met → Amber, reason states the 1 missing
    < 3 met → Red

CROSS-SELL:
  Hard gate: second_value_flag MUST be true.
  If second_value_flag == false:
    → Red regardless of all other conditions
    → reason: "Blocked by Second Value gate —
       [second_value_workflow_count] of 2 workflows documented"
  If second_value_flag == true, check:
    A. account_stage IN ('optimization', 'advocacy')       [1 point]
    B. feature_adoption_pct >= 60                          [1 point]
    C. threading_score >= 3                                [1 point]
  Rules:
    All 3 met + second_value_flag == true → Green
    2 of 3 met + second_value_flag == true → Amber
    < 2 met → Red

PLATFORM UP-TIER:
  Conditions:
    A. tier_limit_hits >= 3 (rolling 90-day)               [1 point]
    B. feature_adoption_pct >= 65                          [1 point]
    C. account_stage IN ('optimization', 'advocacy')       [1 point]
  Rules:
    All 3 met → Green
    2 of 3 → Amber
    < 2 → Red

ELA:
  Conditions:
    A. seat_count >= 200                                   [1 point]
    B. dept_count >= 3                                     [1 point]
    C. threading_score >= 5                                [1 point]
    D. account_stage == 'advocacy'                         [1 point]
  Rules:
    All 4 met → Green
    3 of 4 → Amber
    < 3 → Red

For each motion, store:
  status, status_reason (specific blocking condition),
  conditions_met, conditions_total, last_evaluated_at

4. PULSE EXPANSION SIGNAL BADGES (read-only, Phase 1):

On each account card in the existing Pulse portfolio table,
add a new "EXPANSION" cell showing 4 small status indicators,
one per motion:

  [SE] [CS] [UT] [EL]
  Each indicator: 8px circle, coloured:
    Green: motion status == 'green'
    Amber: motion status == 'amber'
    Red: motion status == 'red' — de-emphasised, 30% opacity

On hover over any indicator: show tooltip with:
  Motion name + status + status_reason

"Sort by Expansion Readiness" filter option in Pulse:
  Sorts accounts by count of Green motions DESC

5. ACCOUNT_STAGE INLINE EDIT:

The account_stage field must be editable inline from
two places (do not build a separate page for this):

  A. Pulse portfolio table: add a small stage badge
     per account row. Clicking opens a 4-option dropdown:
     ONBOARDING | VALUE REALIZATION | OPTIMIZATION | ADVOCACY
     On change:
       UPDATE accounts SET account_stage = selected
       INSERT into account_stage_log:
         { account_id, previous_stage, new_stage,
           changed_by: current_user, changed_at: now() }
       Re-call evaluate-expansion-motions edge function

  B. Account detail page header: same inline dropdown

  SUGGESTED STAGE NUDGE:
  If (dau_licensed_ratio > 0.5 AND feature_adoption_pct > 40
  AND account_stage == 'onboarding'):
    Show subtle banner on the account:
    "This account may be ready to advance to Value Realization
     — review and update stage?"
    [UPDATE STAGE] button → opens stage dropdown
    [DISMISS] → hides for 7 days (sessionStorage)
  Never auto-update the stage. CSM must confirm.

6. FEATURE CHECKLIST UI (on Account detail → Expansion tab):

Under a new "EXPANSION" tab on the account detail page:

  "FEATURE ADOPTION" section (collapsible):
    Header: "FEATURE ADOPTION — [feature_adoption_pct]%"
    Shows all features from feature_registry as checkboxes
    Each checkbox: feature_name + tier badge
    Checked = adopted, unchecked = not adopted

    On checkbox toggle:
      UPSERT account_feature_adoption SET is_adopted = toggled
      Recalculate feature_adoption_pct:
        (count adopted features) / (total features in registry) × 100
      UPDATE accounts SET feature_adoption_pct = new_value
      Re-call evaluate-expansion-motions

  Below the checklist: progress bar showing adoption %
  "LAST UPDATED: [timestamp]" DM Mono 8px

────────────────────────────────────────
PHASE 2 (NEXT SESSION): EXPANSION TAB + START PLAY → MAP ENGINE
────────────────────────────────────────

After Phase 1 is live and tested, build this in a new session.

EXPANSION TAB on Account detail page (extends what was
built in Phase 1):

Full motion matrix view for this account:
  4 rows (one per motion), each showing:
    Motion name | Status badge | Status reason |
    Conditions met (e.g., "3/4") | "START PLAY" button

  START PLAY button: only visible when status == 'green'
  On click:
    1. Check if play_initiated == true:
       If yes: show "Play already in progress — view tasks?"
       → link to MAP Engine filtered for this account + motion tag
       If no: open Start Play modal

  START PLAY MODAL:
    Motion name + account name
    Step preview (from motion_play_templates for this motion):
      Shows all steps with titles, owners, due dates
    Outreach hook preview:
      Pre-written outreach message with [Account Name],
      [Champion], [ARR] variables filled from account data
      Editable before injecting
    gold-btn "SEND TO MAP ENGINE →"
      ON CLICK:
        1. INSERT into maps:
           title: "Expansion: [motion_name] — [account_name]"
           account_id, csm_id, source: 'expansion_engine'
           status: 'active'
        2. INSERT into map_phases (one phase):
           title: motion_name, color: motion's colour
        3. INSERT into map_milestones for each template step:
           title, description, owner, due_days_from_start
        4. UPDATE expansion_motion_status:
           play_initiated = true, play_initiated_at = now()
        5. Navigate to /app/maps/[new_map_id]

  SECOND VALUE LINKER (Cross-Sell motion only):
    When cross_sell motion is Red due to second_value_flag:
    Show a "DOCUMENT SECOND VALUE" section:
      Current count: "[second_value_workflow_count] of 2
      workflow records documented"
      Two form fields (one per workflow):
        Workflow name, Outcome metric, Date documented
      gold-btn "SAVE WORKFLOW RECORD"
        → UPDATE accounts SET second_value_workflow_count
        → If count >= 2: UPDATE second_value_flag = true
        → Re-evaluate motions
    Admin can view portfolio-wide report of accounts at "1 of 2"

────────────────────────────────────────
PHASE 3 (SEPARATE SESSION): RETENTION LEDGER + EXPANSION PERFORMANCE
────────────────────────────────────────

BUILD AFTER Phase 2 is live and first Plays have been initiated.

GAP CLOSER WIDGET in Pulse (new panel):
  Shows only accounts that are exactly 1 condition away
  from Green on any motion. If no accounts qualify: hide
  the widget entirely (do not show "0 accounts").

  Widget format:
  "◆ EXPANSION GAPS — [N] accounts within reach"

  Each row:
    [Account name] [Motion] [The one blocking condition]
    [Micro-CTA linking directly to the field to update]

  Sort by commercial impact:
    Cross-Sell and Up-tier rows appear first
  Team leaders: see full team portfolio
  CSMs: see only their own book

  Trigger logic for "1 condition away":
    Evaluate conditions_total - conditions_met == 1
    AND status != 'green'

EXPANSION PERFORMANCE view (new report alongside
Retention Ledger):

  When expansion_motion_status.outcome = 'won':
    Log outcome_value (ARR delta) to account
    Roll up into Expansion Performance view:

  View shows per motion:
    Green statuses reached this period: [N]
    Plays started: [N]
    Won: [N]
    Average ARR delta: $[X]
    Projected NRR impact range: [from playbook] vs [actual %]

  Filterable by: time period, motion type, CSM/team

────────────────────────────────────────
MOTION COLOURS (use existing design token variables):
────────────────────────────────────────

  seat_expansion: use existing blue token
  cross_sell:     use existing gold token
  platform_uptier: use existing amber token
  ela:            use existing purple token

────────────────────────────────────────
TESTING CHECKLIST — PHASE 1
────────────────────────────────────────

□ feature_registry table seeded with 10 features
□ Account stage dropdown editable inline on Pulse row
□ Account stage change logged in account_stage_log
□ Suggested stage nudge appears when heuristics met
□ Suggested stage nudge does NOT auto-update
□ Feature checklist renders on Account → Expansion tab
□ Checking a feature updates account_feature_adoption
□ feature_adoption_pct recalculates on checklist change
□ evaluate-expansion-motions runs on any attribute change
□ Cross-Sell stays Red when second_value_flag == false
□ Status reasons are specific (not generic "conditions not met")
□ Pulse shows 4 motion indicator dots per account row
□ Red indicators are 30% opacity (de-emphasised)
□ Hover on indicator shows tooltip with reason
□ "Sort by Expansion Readiness" sort option works
□ No existing Pulse functionality broken

TESTING CHECKLIST — PHASE 2

□ Expansion tab shows full 4-motion matrix for account
□ "START PLAY" only visible when status == green
□ Clicking START PLAY when already initiated shows
  "Play in progress" message with MAP link
□ Start Play modal shows step preview and outreach hook
□ Outreach hook variables filled from account data
□ "SEND TO MAP ENGINE" creates MAP + phases + milestones
□ expansion_motion_status.play_initiated updates to true
□ Navigation to new MAP happens automatically
□ Second Value Linker appears for Cross-Sell Red motion
□ Saving 2 workflow records sets second_value_flag = true
□ Motion re-evaluates immediately after flag change

TESTING CHECKLIST — PHASE 3

□ Gap Closer widget hidden when no accounts are 1-away
□ Gap Closer shows correct "1 blocking condition" per row
□ Micro-CTAs deep-link to the correct field
□ Expansion Performance view shows Won outcome data
□ ARR delta logged correctly on outcome = 'won'
□ projected-vs-actual NRR comparison renders correctly

────────────────────────────────────────
⚠️ DEFERRED TO PHASE 10
────────────────────────────────────────

These two items are NOT part of this build:

1. FEATURE ADOPTION EVENT PIPELINE (Option B):
   Automated usage event ingestion from product telemetry
   into Supabase. Replaces manual feature checklist.
   Build when usage event pipeline is scoped.

2. ELA SUB-STATUS PHASES (Option B):
   Dedicated ela_phase field (Q-3/Q-2/Q-1/Close Window)
   with automatic MAP Engine checklist swapping per phase.
   Build when Scale/Enterprise accounts need it.
   Current Option A (single play_initiated flag + MAP notes)
   is sufficient for the first 6 months.
```

---

---

# PHASE 4 — PLATFORM MATURITY
## Weeks 25–36 | Translation, voice, learning, automation

---

## PROMPT 4-A: TRANSLATION EDGE FUNCTION ⬜ NOT STARTED
### Claude-powered article translation with glossary injection

```
BEFORE BUILDING ANYTHING IN THIS SESSION:
[paste standing rule here]

PREREQUISITE: The translation_glossary and article_translations
tables must already exist in Supabase (from the Translation
Glossary prompt). Do not rebuild those tables.

Build the translation edge function and the language switcher UI.

────────────────────────────────────────
1. SUPABASE EDGE FUNCTION
────────────────────────────────────────

Create: /functions/translate-content

Receives: { articleId, targetLanguage, forceRegenerate }

Steps:
  1. Fetch article content from articles table
  2. Hash content: const hash = await hashContent(content)
  3. Check if translation exists and is current:
     SELECT * FROM article_translations
     WHERE article_id=$1 AND language_code=$2
     If exists and hash matches and status='current': return cached
     If forceRegenerate=false and content unchanged: return cached

  4. Fetch glossary:
     SELECT term, protection_type, fixed_translations, notes
     FROM translation_glossary
     WHERE protection_type='never_translate'
       OR fixed_translations->>$language IS NOT NULL

  5. Build system prompt:
     "You are a senior business translator specialising in B2B SaaS
     and customer success content.

     LANGUAGE: [target language name]
     REGISTER: [formal business register for this market]

     VOICE PRESERVATION — CRITICAL:
     The source content has a specific editorial voice: opinionated,
     benchmark-grounded, contrarian, written by a senior practitioner.
     This voice MUST survive translation. Do not soften assertions
     into hedged statements. Do not convert direct address into
     distant formal register if the source is direct. Match the
     confidence level of the original.

     NEVER TRANSLATE (keep exactly as written):
     [list from glossary where protection_type='never_translate']

     FIXED TRANSLATIONS (use these exact terms every time):
     [JSON of term:translation pairs for this language]

     FORMATTING: Preserve all markdown. Translate text only.
     OUTPUT: Translated content only. No preamble. No notes."

  6. Call Anthropic API:
     Model: claude-sonnet-4-6
     Max tokens: 8000
     Translate: title, subtitle, and content in separate calls

  7. UPSERT into article_translations:
     { article_id, language_code, translated_title,
       translated_subtitle, translated_content,
       source_content_hash: hash, status: 'pending_review',
       translated_at: now() }

LANGUAGE CONFIGS:
  ar: { name: 'Arabic', register: 'Modern Standard Arabic, formal
    business register, as used in Gulf Business magazine' }
  id: { name: 'Bahasa Indonesia', register: 'formal business
    Indonesian, as used in DealStreetAsia' }
  vi: { name: 'Vietnamese', register: 'formal business Vietnamese' }
  th: { name: 'Thai', register: 'formal business Thai' }

────────────────────────────────────────
2. LANGUAGE SWITCHER UI
────────────────────────────────────────

Create: /src/contexts/LanguageContext.jsx

  const LanguageContext = createContext()
  export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(
      localStorage.getItem('csq_lang') || 'en'
    )
    const setLang = (lang) => {
      setLanguage(lang)
      localStorage.setItem('csq_lang', lang)
      // If logged in: UPDATE users SET preferred_language=lang
    }
    return (
      <LanguageContext.Provider value={{ language, setLang }}>
        {children}
      </LanguageContext.Provider>
    )
  }

Add language switcher to the site header (top navigation):
  5 flag/label pills: EN | عر | ID | VI | TH
  Active: gold background
  Inactive: transparent, border colour
  DM Mono 9px uppercase

────────────────────────────────────────
3. ARTICLE PAGE INTEGRATION
────────────────────────────────────────

In the article page component:
  const { language } = useLanguage()

  const content = language === 'en'
    ? article          // original English content
    : article.translations?.[language] || article  // fallback to EN

  If translation status is 'pending' or 'stale':
    Show small banner at top of article:
    "Translation in review — showing English version"
    (Do not block the article — fall back gracefully)

────────────────────────────────────────
4. ADMIN TRANSLATION QUEUE
────────────────────────────────────────

In the existing admin panel translation page (already built):
  Add "TRIGGER TRANSLATION" button per article
  Shows translation status per language: PENDING | CURRENT | STALE | ERROR
  "MARK AS REVIEWED" button: UPDATE status='current'

Testing:
  □ Edge function returns translated content for a test article
  □ Never-translate terms appear unchanged in Arabic output
  □ Fixed translations (NRR, ARR, QBR) use correct terms
  □ Language switcher persists across page navigation
  □ Article page falls back to English if no translation exists
  □ pending_review status shows "Translation in review" banner
  □ Admin can trigger translation and mark as reviewed
```

---

## PROMPT 4-B: LUMI MULTILINGUAL VOICE I/O ⬜ NOT STARTED
### Voice input in Arabic, Bahasa, Vietnamese, Thai + voice output

```
BEFORE BUILDING ANYTHING IN THIS SESSION:
[paste standing rule here]

Extend Lumi's existing voice input from English-only to
multilingual. Do not modify the node graph, decision trees,
or resolution drawer. This is an extension of the existing
voice input feature and the system prompt builder only.

────────────────────────────────────────
1. LANGUAGE-AWARE SPEECH RECOGNITION
────────────────────────────────────────

Map app language codes to SpeechRecognition locales:

  const SPEECH_LOCALES = {
    en: 'en-US',
    ar: 'ar-AE',
    id: 'id-ID',
    vi: 'vi-VN',
    th: 'th-TH',
  }

Find the existing SpeechRecognition initialisation and
make recognition.lang dynamic:

  recognition.lang = SPEECH_LOCALES[currentLanguage]

Re-initialise when language changes (no page reload required).

────────────────────────────────────────
2. VOICE INPUT UI INDICATOR
────────────────────────────────────────

When mic is active, show current listening language:
  [pulsing mic icon] "LISTENING — ARABIC" (or current language)
  DM Mono 9px uppercase, existing gold colour token

────────────────────────────────────────
3. TRANSCRIPT HANDLING
────────────────────────────────────────

The transcribed text (already in user's language) goes
directly into the existing Lumi query flow.
Do NOT translate the transcript to English first.

Pass to the agent edge function:
  {
    treeId: "...",
    nodePath: [...],
    voiceContext: transcribedText,  // raw, user's language
    language: currentLanguage
  }

────────────────────────────────────────
4. UPDATE LUMI SYSTEM PROMPT BUILDER
────────────────────────────────────────

In the existing system prompt construction function,
add a language directive block when language !== 'en':

  const languageDirective = language !== 'en' ? `
OUTPUT LANGUAGE: [language name]
REGISTER: [business register for this language]

Generate your ENTIRE response — Zone 1, Zone 2, and Zone 3 —
in [language name]. Maintain the same directness, confidence,
and editorial voice as the English version of The Chief of Staff.
Do not hedge statements that would be direct in English.

NEVER TRANSLATE THESE TERMS (keep in English):
[pull from translation_glossary where protection_type='never_translate']

FIXED TRANSLATIONS for this language:
[pull from translation_glossary fixed_translations for this lang code]
  ` : ''

────────────────────────────────────────
5. VOICE OUTPUT — READ ALOUD BUTTON
────────────────────────────────────────

Add "READ ALOUD" button to the Resolution Drawer,
next to the existing "COPY SCRIPT" button.

  function speakResponse(text, language) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = SPEECH_LOCALES[language]
    utterance.rate = 0.95
    const voices = speechSynthesis.getVoices()
    const match = voices.find(v => v.lang.startsWith(language))
    if (match) utterance.voice = match
    speechSynthesis.speak(utterance)
  }

While speaking: button shows "■ STOP" → clicking cancels.
When not speaking: shows "READ ALOUD"

────────────────────────────────────────
6. GRACEFUL DEGRADATION
────────────────────────────────────────

If SpeechRecognition doesn't support the selected language:
  try { recognition.start() }
  catch {
    Show inline message below mic button:
    "Voice input is not available for [Language] on this browser.
     You can type your context instead."
    Replace mic button with text input for the voiceContext field.
  }

Testing:
  □ Voice input works in English (existing — unchanged)
  □ Switching to Arabic updates recognition.lang to ar-AE
  □ Listening indicator shows correct language label
  □ Arabic voice transcript sent as voiceContext directly
  □ Lumi response generates entirely in Arabic
  □ Glossary terms stay in English within Arabic response
  □ READ ALOUD button speaks in correct language
  □ Language switching mid-session works without reload
  □ Fallback text input appears if SpeechRecognition fails
```

---

---

# QUICK REFERENCE — BUILD STATUS SUMMARY

| Prompt | Status | File/Location |
|--------|--------|---------------|
| 0-A Wiring Audit | ⬜ NOT STARTED | This document |
| 0-B Tier-Aware Experience | ⬜ NOT STARTED | This document |
| 1-A Revenue Foundation | 🔄 IN PROGRESS | PRD-Phase-1-Revenue-Foundation.md |
| 1-B Content Depth | 🔄 IN PROGRESS | PRD-Phase-2-Content-Depth.md |
| 1-C AI Readiness Diagnostic | 🔄 PARTIAL | PRD-Phase-3-Diagnostic.md |
| 1-D Lumi Agent (Phases 4–8) | ⬜ NOT STARTED | PRD-Phases-4-to-8.md |
| 1-E Rename Q → Lumi | ⬜ NOT STARTED | This document |
| 1-F Sticky Scroll Animation | ⬜ NOT STARTED | This document |
| 1-G Card Fill Animation | ⬜ NOT STARTED | This document |
| 1-H Homepage Micro-Animations | ⬜ NOT STARTED | This document |
| 2-A Champion Diagnostic | ✅ BUILT | PRD-Champion-Dependency-Diagnostic.md |
| 2-B Translation Glossary | ✅ BUILT | Translation-Glossary-Lovable-Prompt.md |
| 2-C MAP Engine | ✅ BUILT | This document |
| 2-D EBR Builder | ⬜ NOT STARTED | This document |
| 2-E CTA Engine | ✅ BUILT | This document |
| 3-A Lumi Trees 9–13 | ⬜ NOT STARTED | This document |
| 3-B Lumi Trees 14–21 | ⬜ NOT STARTED | This document |
| 3-C WhatsApp Integration | ⬜ NOT STARTED | This document |
| 3-D Admin Control Panel | ⬜ NOT STARTED | PRD-Admin-Control-Panel.md |
| 4-A Translation Edge Function | ⬜ NOT STARTED | This document |
| 4-B Lumi Multilingual Voice | ⬜ NOT STARTED | This document |
| 5-A Reader Engagement Suite | ⬜ NOT STARTED | This document — Reader Engagement Features section |

---

## Reader Engagement Features (Planned)

> Source: uploaded brief `csq_engagement_features.html` (June 2026). Status for every feature below: **⬜ NOT STARTED**. This section is a planning record only — no code, components, routes, tables, or migrations are implied by inclusion here.

**Design principle.** Lumi must always have something to say first. Every surface assumes Lumi opens the loop; the reader closes it.

**Indispensability ladder.**
1. **Useful** (baseline, day one) — answers a question better than a generic chatbot.
2. **Trusted** — reader returns because Lumi's read of their situation is consistently right.
3. **Habitual** — Lumi is on the reader's weekly calendar (Monday check-in, Tuesday brief).
4. **Irreplaceable** — Lumi's memory of the reader cannot be reconstructed elsewhere. **The memory architecture is the moat.**

**The one feature that will kill all the others if it is bad: Lumi Memory.** Quality of recall, recency weighting, and the reader's ability to view/edit/delete must ship before any feature that depends on it.

---

### 1. Lumi as companion

#### Lumi Debrief — post-read conversation trigger
- **Badges:** Lumi · High impact · Retention
- **One-liner.** After a reader finishes a dispatch, Lumi appears and asks one question about what they just read.
- **Description.** Trigger fires at scroll depth ≥ 90%. A Lumi card slides in from the bottom with a single, context-aware prompt (e.g., "You just read about NRR architecture. What's the one account this applies to right now?"). The reader's response is saved to their workspace automatically.
- **Why it matters.** Converts passive reading into an active commitment moment at peak attention; the saved response seeds Lumi Memory.
- **Tier gating.** Free: 1 debrief / month. Practitioner+: unlimited.
- **Status.** ⬜ NOT STARTED

#### Lumi Memory — builds a model of each reader over time
- **Badges:** Lumi · High impact · Retention
- **One-liner.** Lumi remembers what you've read, what you've asked, and what situations you're navigating — and brings that context to every new conversation.
- **Description.** Per-reader profile that accumulates dispatches read, frameworks engaged with in debriefs, declared professional challenges, and check-in answers. Retrieved via semantic similarity search before each Lumi response. Reader can view, edit, and delete their memory from account settings (GDPR).
- **Why it matters.** This is the moat. Without memory, every other Lumi feature is a generic chatbot.
- **Tier gating.** Practitioner+ (per seat, not pooled across team seats).
- **Status.** ⬜ NOT STARTED

#### Tuesday Morning Brief — Lumi's weekly personalised dispatch summary
- **Badges:** Lumi · High impact · Retention
- **One-liner.** Every Tuesday at 8am, Lumi sends each reader a personalised 3-sentence brief connecting the new dispatch to their specific professional context.
- **Description.** Generated by n8n cron at dispatch publish time, per-user via Lumi API call. Delivered via email (beehiiv) and in-app notification. Max 3 sentences — not a summary, a personalised signpost into the new dispatch.
- **Why it matters.** Anchors Lumi to a weekly habit slot.
- **Tier gating.** Operator+ (per-user generation cost; system push, does not count against Lumi cap).
- **Status.** ⬜ NOT STARTED

#### Lumi Framework Extractor — pull the model from any dispatch
- **Badges:** Lumi · Medium impact
- **One-liner.** One click on any dispatch surfaces the underlying decision framework as a structured, reusable template the reader can save to their workspace.
- **Description.** "Extract framework" button on every dispatch. Lumi returns a clean, structured template: decision criteria, steps, input variables, output format. Saved to the reader's workspace as a reusable artifact.
- **Why it matters.** Turns editorial into operational tooling.
- **Tier gating.** Practitioner+.
- **Status.** ⬜ NOT STARTED

#### Lumi Situation Room — bring your live problem, Lumi finds the dispatch
- **Badges:** Lumi · High impact · Retention
- **One-liner.** Reader describes their current situation and Lumi surfaces the exact past dispatches, frameworks, and benchmarks that apply — then coaches them through it.
- **Description.** Conversation mode: Lumi asks follow-up questions to narrow the situation, retrieves matching archive content, and walks the reader through a Socratic next step. Saved to workspace as a "Situation log."
- **Why it matters.** Highest-emotion entry point; reader arrives with an active problem.
- **Tier gating.** Practitioner+ (Operator+ for unlimited).
- **Status.** ⬜ NOT STARTED

#### Lumi Weekly Check-In — Monday morning context reset
- **Badges:** Lumi · Medium impact · Retention
- **One-liner.** Every Monday, Lumi asks 3 questions about the week ahead and prepares a personalised focus brief based on the answers.
- **Description.** Monday 8am push: biggest account risk this week, closest renewal, one thing to improve. 90-second flow. Lumi returns a focus brief and feeds the answers into the Operator Index aggregate.
- **Why it matters.** Pairs with Tuesday Brief to occupy two named slots on the reader's week.
- **Tier gating.** Practitioner+.
- **Status.** ⬜ NOT STARTED

---

### 2. Reading experience (editorial)

#### In-line annotation — highlight, note, ask Lumi about any sentence
- **Badges:** Editorial · Lumi · High impact
- **One-liner.** Select any text in a dispatch to highlight it, add a note, or open a Lumi conversation about that exact passage.
- **Description.** Selecting text reveals a mini toolbar: Highlight (saves to workspace in gold), Note (private annotation), Ask Lumi (opens a thread anchored to that passage). All annotations are searchable from the reader's workspace.
- **Why it matters.** Annotation is the strongest engagement mechanic in serious editorial products — every highlight is a micro-commitment that compounds into retention.
- **Tier gating.** Free: highlight + note. Practitioner+: Ask Lumi.
- **Status.** ⬜ NOT STARTED

#### Audio mode — Lumi reads the dispatch in Analytical or Witty voice
- **Badges:** Editorial · Lumi · Medium impact
- **One-liner.** Every dispatch has a "Listen" button. Lumi narrates it in the selected voice mode.
- **Description.** Analytical = measured, structured cadence (commute / desk). Witty = conversational, faster tempo (background). Mirrors the existing two-voice editorial system.
- **Why it matters.** Adds a commute/transit consumption context; audio listeners retain measurably better.
- **Tier gating.** Practitioner+.
- **Status.** ⬜ NOT STARTED

#### 5-minute brief vs full dispatch toggle
- **Badges:** Editorial · Lumi · Medium impact
- **One-liner.** Reader selects "5-minute brief" or "Full dispatch" at the top of every article — Lumi generates the brief version on demand.
- **Description.** Brief renders the 3-2-1 model (3 facts, 2 insights, 1 actionable) extracted from the full article. Entry point, not substitute — the brief is wired to surface the full dispatch CTA in context.
- **Why it matters.** Respecting reader time without reducing content is a quality signal.
- **Tier gating.** Free.
- **Status.** ⬜ NOT STARTED

#### Live benchmark callouts — inline benchmark data inside dispatch prose
- **Badges:** Editorial · High impact
- **One-liner.** When a dispatch references an NRR or payback figure, it renders as a live data chip — the current benchmark from the aggregate table, not a static number.
- **Description.** Benchmark references in prose render as interactive chips reading `benchmark_aggregates`. Hover reveals current median, percentile distribution, sample size, last updated.
- **Why it matters.** Makes The CS Quarterly feel like a financial terminal — editorial credibility compounds when numbers are not frozen at publication date.
- **Tier gating.** Free (chip render); Practitioner+ (drill-down).
- **Status.** ⬜ NOT STARTED

#### Board-ready PDF export — one click to a formatted PDF of any dispatch
- **Badges:** Editorial · Medium impact
- **One-liner.** Any dispatch or extracted framework can be exported as a clean, branded PDF suitable for sharing in a board deck or team meeting.
- **Description.** Branded masthead, dispatch title and date, serif layout matching the site, live benchmark chips rendered as static snapshots with timestamp.
- **Why it matters.** Turns the reader into a distributor inside their own org.
- **Tier gating.** Practitioner+.
- **Status.** ⬜ NOT STARTED

---

### 3. Personalisation

#### Operator profile — onboarding that makes Lumi immediately smarter
- **Badges:** Personalisation · Lumi · High impact
- **One-liner.** A 5-question onboarding flow on signup that tells Lumi who you are, what you manage, and what you're trying to fix.
- **Description.** Conversational UI (not a form): role, ACV band, company ARR range, biggest current challenge (multi-select: churn risk / expansion motion / stakeholder coverage / forecasting), segment. Output seeds Lumi Memory before the first Lumi response.
- **Why it matters.** First 90 seconds set the perception of personalisation; without this, Lumi feels generic.
- **Tier gating.** All tiers.
- **Status.** ⬜ NOT STARTED

#### Personalised reading path — Lumi curates your next 3 dispatches
- **Badges:** Personalisation · Lumi · Medium impact
- **One-liner.** Based on your profile and reading history, Lumi surfaces the 3 past dispatches most relevant to your current situation — not chronologically, but by relevance.
- **Description.** Homepage "Your reading path" section below the latest dispatch. Selection refreshes weekly off check-in answers and recent debriefs.
- **Why it matters.** Solves archive discovery without forcing the reader to search.
- **Tier gating.** Practitioner+.
- **Status.** ⬜ NOT STARTED

#### Your benchmark position — how you compare to your ACV-band cohort
- **Badges:** Personalisation · Lumi · High impact
- **One-liner.** Readers enter their own NRR and payback figures and see exactly where they sit on the benchmark distribution — with Lumi interpreting what it means.
- **Description.** Private input (not submitted to the benchmark pool). Renders the reader's position against P25 / median / P75 for their ACV band. Lumi adds an interpretation paragraph and links to the relevant dispatches/frameworks.
- **Why it matters.** Most emotionally resonant feature in the platform — every CS leader wants to know where they stand and won't ask their VP.
- **Tier gating.** Practitioner+.
- **Status.** ⬜ NOT STARTED

---

### 4. Community & social

#### Dispatch reactions — one signal per reader per article
- **Badges:** Social · Medium impact
- **One-liner.** Not likes. One question at the end of every dispatch with 4 structured options.
- **Description.** "What does this change for you?" — options: "Changed how I'll approach an account this week" / "Gave me language I didn't have" / "Confirmed something I already believed" / "I disagree." Results aggregate into a reader-intelligence dashboard for editorial.
- **Why it matters.** Reactions at peak attention. The "I disagree" path is the most valuable — it turns objection into the next dispatch.
- **Tier gating.** All tiers.
- **Status.** ⬜ NOT STARTED

#### Operator Debate — Lumi facilitates a structured argument between two reader positions
- **Badges:** Social · Lumi · Lower priority
- **One-liner.** On contentious dispatches, two readers can enter opposing positions and Lumi runs a structured Socratic debate between them — visible to all subscribers.
- **Description.** Editorial marks a dispatch as "contested." Readers opt in with their position; Lumi pairs opposing positions and facilitates a 3-round Socratic exchange. Outcome published as a community artifact.
- **Why it matters.** Highest-signal community surface without creating a comments section.
- **Tier gating.** Practitioner+ to participate; Free to read.
- **Status.** ⬜ NOT STARTED

#### The Operator Index — anonymous peer benchmarking across the subscriber base
- **Badges:** Social · High impact
- **One-liner.** Anonymised aggregate view of what the subscriber base is worried about, working on, and seeing in their accounts — updated weekly from check-in data.
- **Description.** Aggregated, anonymised "Operator Pulse" card on the homepage, refreshed weekly off Monday check-in answers (e.g., "This week, 43% of operators cited renewal risk as their top concern").
- **Why it matters.** "You are not alone in this" without naming anyone — collective intelligence is more trusted than named opinions.
- **Tier gating.** Free (read); Practitioner+ contributes data.
- **Status.** ⬜ NOT STARTED

---

### 5. Depth features

#### Deep Research mode — Lumi as a research co-pilot for any CS topic
- **Badges:** Lumi · Depth · High impact
- **One-liner.** A reader gives Lumi a topic or problem and Lumi produces a structured 5-part research brief.
- **Description.** Output sections: (1) current thinking, (2) operator data, (3) competing frameworks, (4) Quarterly coverage, (5) recommended next action. Saved to workspace.
- **Why it matters.** Moves Lumi from chatbot to analyst.
- **Tier gating.** Operator+ (heavy token).
- **Status.** ⬜ NOT STARTED

#### Archive Intelligence — ask the entire archive a question
- **Badges:** Lumi · Editorial · High impact
- **One-liner.** Natural-language Q&A across the full Quarterly archive with citations to specific dispatches and passages.
- **Description.** Retrieval-augmented search over all dispatches, codex entries, and frameworks. Every Lumi answer cites the source dispatches with deep links.
- **Why it matters.** Turns the archive from a chronological list into a queryable knowledge base.
- **Tier gating.** Practitioner+.
- **Status.** ⬜ NOT STARTED

#### Lumi Draft — turn any dispatch insight into a message, email, or Slack post
- **Badges:** Lumi · High impact
- **One-liner.** Convert a dispatch insight (or framework) into a draft message, email, or Slack post in the reader's voice.
- **Description.** One click on any insight produces a draft tuned to the reader's role and operator profile. Reader edits in-place, copies, or exports.
- **Why it matters.** Closes the loop from reading to action inside the reader's actual workflow.
- **Tier gating.** Practitioner+.
- **Status.** ⬜ NOT STARTED

---

### Tier-gating summary

Canonical tiers per `src/lib/tiers.ts`: Reader (free, 1 Lumi/week) · Practitioner ($39, 50/mo) · Operator ($89, 100/mo) · Team ($599, 500 pool) · Scale ($1,499, 2,000 pool) · Enterprise ($3,500, 5,000 pool) · Strategic Partner (unlimited). The legacy "Vanguard" label is retired — use Practitioner+ / Operator+ instead.

| Feature | Reader | Practitioner | Operator | Team / Scale / Ent (per seat) | Strategic |
|---|---|---|---|---|---|
| Lumi Debrief | 1 / month* | unlimited | unlimited | unlimited | unlimited |
| Lumi Memory | — | ✅ | ✅ | ✅ (per seat, not pooled) | ✅ |
| Tuesday Morning Brief | — | — | ✅ | ✅ | ✅ |
| Lumi Framework Extractor | — | ✅ (1 cap unit) | ✅ | ✅ | ✅ |
| Lumi Situation Room | — | 5 / month | within 100 cap | within pool | unlimited |
| Lumi Weekly Check-In | — | ✅ (uncounted) | ✅ | ✅ | ✅ |
| Inline annotation | highlight + note† | + Ask Lumi | + Ask Lumi | + Ask Lumi | + Ask Lumi |
| Audio mode | — | 4 dispatches / mo | unlimited | unlimited | unlimited |
| 5-min brief toggle | ✅ (pre-rendered) | ✅ | ✅ | ✅ | ✅ |
| Live benchmark callouts | render | + drill-down | + drill-down | + drill-down | + drill-down |
| Board-ready PDF (per dispatch) | — | ✅ | ✅ | ✅ | ✅ |
| Operator profile onboarding | ✅ (on sign-up) | ✅ | ✅ | ✅ | ✅ |
| Personalised reading path | — | ✅ | ✅ | ✅ | ✅ |
| Your benchmark position | — | ✅ | ✅ | ✅ | ✅ |
| Dispatch reactions | ✅ | ✅ | ✅ | ✅ | ✅ |
| Operator Debate | read | participate | participate | participate | participate |
| Operator Index | read | read + contribute | read + contribute | read + contribute | read + contribute |
| Deep Research mode | — | — | ✅ (5 cap units) | ✅ (soft per-seat cap) | ✅ |
| Archive Intelligence | — | ✅ | ✅ | ✅ | ✅ |
| Lumi Draft | — | ✅ | ✅ | ✅ | ✅ |

\* Lumi Debrief on Reader competes with Reader's 1-session/week ceiling — Debrief is the canonical use of the weekly session, not an additional grant.
† Reader annotation requires a minimal per-user annotation store; if a Reader workspace is not in scope, move annotation to Practitioner+.

#### Lumi-cap accounting

| Feature | Counts against Lumi cap? | Notes |
|---|---|---|
| Lumi Debrief | Yes | Free Debrief = Reader's weekly session. |
| Tuesday Brief | No (system push) | Editorial cost, not user cap. |
| Weekly Check-In | No | 3 short Q/A; absorbed. |
| Framework Extractor | Yes | 1 unit per extract. |
| Situation Room | Yes | 1 unit per opened room (multi-turn within). |
| Archive Intelligence | Yes | RAG-heavy; consider per-query budget. |
| Deep Research | Yes (heavy) | 5 units, or a separate "Research credit." |
| Lumi Draft | Yes | 1 per draft. |
| 5-min Brief Toggle | No | Pre-rendered at publish time; not a per-user call. |
| Ask Lumi on annotation | Yes | 1 per thread. |
| Personalised Reading Path | No | Weekly batch. |
| Your Benchmark Position | No | One-shot interpretation cached on submission. |

---

### Recommended build sequence

1. **Foundation (the moat).** Operator profile onboarding → Lumi Memory (view/edit/delete).
2. **Habitual loops.** Lumi Debrief → Lumi Situation Room.
3. **Editorial layer.** In-line annotation → Audio mode → 5-min brief toggle → Live benchmark callouts.
4. **Weekly rhythm.** Tuesday Morning Brief → Lumi Weekly Check-In.
5. **Community surfaces.** Dispatch reactions → Operator Index → Operator Debate.
6. **Depth.** Lumi Framework Extractor → Lumi Draft → Archive Intelligence → Deep Research mode → Your benchmark position → Personalised reading path → Board-ready PDF.

Do not build features in level N until level N−1 is shipped and instrumented.

---

### Edge cases & open questions

1. **Anonymous / logged-out visitors.** Which engagement features render at all? Default: 5-min brief, dispatch reactions, and live benchmark callout chips render publicly; all Lumi surfaces, annotation, and Operator Profile require sign-in.
2. **Trial / lapsed subscribers.** Does Lumi Memory persist or freeze on downgrade? Recommendation: freeze + read-only access for 30 days, then archive (recoverable on re-subscribe within 12 months).
3. **Team seat downgrade.** Memory artifact ownership when a seat is removed from a Team/Scale/Enterprise pool — Memory is per-seat. Recommendation: export-on-removal, then delete.
4. **GDPR delete.** Cascading delete from Memory into Operator Index aggregate — anonymisation must survive deletion (no re-identifiable joins back to deleted user_id).
5. **Admin / impersonation.** Admins viewing as a reader must NOT write to that reader's Memory or Check-In history. Read-only impersonation flag required.
6. **Pooled Lumi exhaustion.** Team / Scale / Enterprise pool drained mid-month: degrade order — Deep Research → Situation Room → Draft → Debrief. Tuesday Brief and Weekly Check-In never gated by pool (system / lightweight).
7. **Free reader hitting weekly cap mid-Debrief.** Render upgrade nudge with the Debrief preview, do not hard-cut the conversation mid-turn.
8. **Audio mode × multilingual voices.** The Analytical/Witty toggle interacts with the multilingual voice matrix (mem://product/prd-v3 §Lumi Multilingual). Define explicit matrix per supported language; fall back to English Analytical when a tone is unavailable in the chosen language.
9. **Operator Debate moderation.** Free readers see Practitioner+ authored debate artifacts — abuse / takedown path is undefined. Need editorial moderation queue before launch.
10. **Editorial overrides.** Every engagement feature must be toggleable per-dispatch (e.g. suppress Debrief on light essays, suppress Extractor on opinion pieces).
11. **Lumi Memory dependency chain.** Tuesday Brief, Situation Room, Personalised Reading Path, Benchmark interpretation, and Lumi Draft all degrade to "generic" without Memory. Never gate Memory higher than the lowest-gated dependent (currently Practitioner+ Framework Extractor / Annotation Ask Lumi). Already satisfied by the corrected matrix above.
12. **Naming overlap.** "Board-ready PDF (per dispatch)" at Practitioner+ vs. Scale tier's "Quarterly branded benchmark PDF" — different artifacts. Pricing page copy must rename one (suggested: "Dispatch PDF export" vs. "Quarterly benchmark report") before either ships.
13. **Operator Index aggregate.** Reader cannot contribute (Weekly Check-In is Practitioner+), so the aggregate represents the paid base only. Document this explicitly on the Index surface — not the full readership.
14. **Operator Profile for visitors.** Cannot have a profile pre-auth. Capture intent anonymously (cookie / localStorage) on first visit and bind on sign-up; otherwise trigger profile flow on Reader sign-up.
15. **Audio mode TTS cost.** Pre-render once per voice per dispatch at publish time; do not regenerate per listener. Caches on CDN.
16. **Deep Research on pooled tiers.** Single seat can drain a Team pool. Enforce a per-seat soft cap (e.g. Team: 50 research units / seat / month) on top of the shared pool.

---


## IMMEDIATE NEXT 5 (paste these in order)

```
1. PROMPT 0-A — Wiring Audit
   Find what's broken before building more.

2. PROMPT 0-B — Tier-Aware Experience
   Homepage and paywall personalisation.

3. PROMPT 2-D — EBR Builder
   The VP CS conversion feature.
   Depends on MAP Engine being live.

4. PROMPT 2-E — CTA Engine
   Team tier retention anchor.

5. PROMPT 3-C — WhatsApp Integration
   MENA/SEA competitive differentiator.
   Do not start until CTA Engine is live
   (WhatsApp CTA raise depends on ctas table).
```

---

*CS Quarterly Build Bible — compiled June 2026*
*All prompts use the Standing Rule as their opening block.*
*Update status indicators as features ship.*
