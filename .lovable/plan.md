# Plan — Add Engagement Features to the Build Bible (planning only)

Append a new top-level section to `docs/CS-Quarterly-Build-Bible.md`, just above the final "IMMEDIATE NEXT 5" block, capturing the 19 engagement features from `csq_engagement_features.html`. **No code, components, routes, tables, or migrations.** Status for every entry: `⬜ NOT STARTED`.

## Section structure

`## Reader Engagement Features (Planned)` with a short preamble noting source (uploaded brief), the indispensability levels (Useful → Trusted → Habitual → Irreplaceable), the design principle ("Lumi must always have something to say first"), and that memory is the moat.

Then 5 sub-sections matching the brief's tabs. Each feature gets a compact card: **Name**, one-liner, badges (category / impact / retention), 2–3 sentence description, "Why it matters" line, tier gating, and a `Status` row.

### 1. Lumi as companion
- Lumi Debrief — post-read conversation trigger (High / Retention; scroll ≥90%; free 1/mo, Vanguard unlimited)
- Lumi Memory — per-reader profile via semantic recall; viewable/editable in account (GDPR); Vanguard only
- Tuesday Morning Brief — n8n cron at publish; 3-sentence personalised signpost; Vanguard only
- Lumi Framework Extractor — one-click structured template from any dispatch
- Lumi Situation Room — describe live problem → matched dispatches + Socratic coaching; saved as Situation Log
- Lumi Weekly Check-In — Monday 3-question reset → personalised focus brief

### 2. Reading experience (editorial)
- In-line annotation — highlight / note / Ask Lumi anchored to passage
- Audio mode — Analytical vs Witty Lumi narration
- 5-minute brief vs full dispatch toggle (Lumi-generated brief uses 3-2-1)
- Live benchmark callouts — inline chips reading `benchmark_aggregates`
- Board-ready PDF export — branded masthead, live chip snapshot

### 3. Personalisation
- Operator profile onboarding — 5 conversational questions (role, ACV band, ARR, challenges, segment)
- Personalised reading path — top 3 dispatches by relevance
- Your benchmark position — private NRR/payback vs ACV-band cohort with Lumi interpretation

### 4. Community & social
- Dispatch reactions — single structured signal (4 options incl. "I disagree")
- Operator Debate — Lumi-facilitated 3-round Socratic argument on contested dispatches
- The Operator Index — anonymised weekly Operator Pulse from check-in data

### 5. Depth features
- Deep Research mode — 5-part structured research brief
- Archive Intelligence — natural-language Q&A across the full archive
- Lumi Draft — convert insight into message / email / Slack post

## Tier-gating summary table
Small table mapping each feature to: Free / Practitioner / Operator / Vanguard, per the brief (Memory + Tuesday Brief Vanguard-only; Debrief tiered; rest mostly Practitioner+).

## Indispensability ladder + build sequence
Reproduce the four levels (Useful → Trusted → Habitual → Irreplaceable) and the brief's recommended sequence: Memory + Onboarding first → Debrief + Situation Room → Annotation + Audio → Tuesday Brief + Weekly Check-In → Operator Index + Debate → Deep Research + Draft + Archive Intelligence.

## Backlog index entry
Add one row to the Standing Rule status table at the end of the bible:
`| 5-A Reader Engagement Suite | ⬜ NOT STARTED | This document — Reader Engagement Features section |`

## Out of scope
No new files, components, routes, tables, server functions, env vars, migrations, or memory updates. Single file edit: `docs/CS-Quarterly-Build-Bible.md`.
