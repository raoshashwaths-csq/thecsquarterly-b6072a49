## Goal
Seed three editorial dispatches (Reader/free tier) and three linked interactive Codex playbooks (Practitioner+), with a CTA at the foot of each article pointing to its playbook.

## Scope

### 1. Seed migration — `posts` + `playbooks`
One SQL migration inserting:

**Posts** (section = `retention-protocol`, category = `Escalation`, `is_premium=false`, `tier='free'`, series = `the-structural-reckoning`, `series_total=9`):
- IV — `frontline-sovereignty-handling-high-volatility-account-friction` (part 4)
- V — `executive-fortitude-the-cco-churn-protocol` (part 5)
- VI — `upward-alignment-the-mis-sold-contract` (part 6)

Each post gets full `title`, `title_mckinsey`, `title_wodehouse`, `subtitle*`, `excerpt`, `body_mckinsey`, `body_wodehouse`, `sources`. Article IV uses the verbatim body from the PRD. Articles V and VI bodies are authored in the established CSQ two-voice style following the 3-2-1 model and the PRD's section structure (Philosophy → Core Soft Skill → Decision Tree narrative → Operator's Briefing). Hero images: generated via `imagegen` from each `hero_prompt` and uploaded as `cover_image_url`.

**Playbooks** (`included_in_vanguard=true`, `price_cents=0`, `category='Escalation'`, `published=true`):
- `frontline-sovereignty-triage-playbook` — Account Volatility Triage
- `churn-volatility-triage-playbook` — Churn Decision / ICP Save-or-Release
- `upward-alignment-misold-contract-playbook` — Upward Alignment & Mis-Sell

Each `body` carries the structured text (used as fallback render); the interactive UI is driven by the React components below.

### 2. Tier-gate refactor on `/codex/$slug`
Replace the legacy `subscriptionTier === "vanguard"` check with rank-based access: `unlocked = isAdmin || DESIGNATION_RANK[designation] >= DESIGNATION_RANK.practitioner || purchased`. Uses the existing `useSubscriptionTier` hook. Applies to all playbooks (existing six included) per "Update globally".

### 3. Three interactive playbook components
New files under `src/components/playbooks/`:
- `AccountVolatilityTriage.tsx`
- `ChurnVolatilityDecision.tsx`
- `UpwardAlignmentMisSell.tsx`

Each uses local React state for the branching tree: current node, history stack, Back/Reset controls, action-card terminal screens (oxblood-bordered `SectionCard`s), a fillable Executive Briefing template (Article IV) / cost-model worksheet (Article V) / board-risk-report worksheet (Article VI), and a completable Operator's Checklist with localStorage persistence keyed by slug. Uses only semantic tokens (`--accent`, `--secondary-accent`, `border-border`) and existing dashboard primitives (`SectionCard`, `MetricCard` where applicable). No new color tokens.

Register all three in `src/components/playbooks/index.tsx` keyed by slug so `codex.$slug.tsx` picks them up via `PLAYBOOK_COMPONENTS[pb.slug]` (already wired).

### 4. Article → Playbook CTA
New shared component `src/components/site/PlaybookCtaCard.tsx`. Rendered at the bottom of `insights.$slug.tsx` (right after the body, before `DispatchReactionCard` / `RelatedIntelligencePanel`) only when a matching playbook exists.

Lookup: derive `playbookSlug` from a small static map `src/lib/article-playbook-map.ts` (article slug → playbook slug + button label). Uses `useSubscriptionTier` and `useAuth`:
- Practitioner+: link straight to `/codex/$slug`.
- Free/Reader/Visitor: render the same button but on click open a slide-up `Sheet` (shadcn) showing the locked-tier copy + "Unlock with Practitioner" CTA → `/pricing`, plus "Sign in" link when logged out.

Visual: oxblood `bg-accent` flush rectangle CTA, JetBrains Mono uppercase label, eyebrow "Codex Playbook", serif descriptor line. Matches the PRD spec.

### 5. SEO + metadata
Each new playbook route inherits the existing `head()` from `codex.$slug.tsx`. Each article inherits the existing `insights.$slug.tsx` head with og:image from `cover_image_url`. No new routes needed.

## Files

Created:
- `supabase/migrations/<ts>_structural_reckoning_iv_v_vi.sql`
- `src/components/playbooks/AccountVolatilityTriage.tsx`
- `src/components/playbooks/ChurnVolatilityDecision.tsx`
- `src/components/playbooks/UpwardAlignmentMisSell.tsx`
- `src/components/site/PlaybookCtaCard.tsx`
- `src/lib/article-playbook-map.ts`
- 3 hero images via imagegen → uploaded as assets, URLs inlined into migration

Edited:
- `src/components/playbooks/index.tsx` — register 3 new slugs
- `src/routes/codex.$slug.tsx` — swap legacy gate for rank-based check
- `src/routes/insights.$slug.tsx` — mount `<PlaybookCtaCard slug={slug} />` at body foot

No changes to: supabase auto-gen files, RLS (existing post/playbook policies already cover this), tier matrix, header/nav.

## Open assumptions (flag if wrong)
- `series_total = 9` per PRD (existing parts I–III already seeded under same series_slug).
- Practitioner price line in lock panel reads "$39/mo" (current `tiers.ts`), not the PRD's "$49/mo".
- Reader tier = free tier per the existing hook comment; both see the locked panel.

## Verification
- `supabase--linter` after migration.
- Visit `/insights/frontline-sovereignty-...` logged out → CTA opens locked sheet.
- Sign in as practitioner → CTA links to `/codex/frontline-sovereignty-triage-playbook`, interactive tree renders.
- Free user hitting `/codex/...-playbook` directly → BlurredTeaser + Paywall.