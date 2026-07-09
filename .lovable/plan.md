
## Goal

Reflect the 25 rewritten dispatches in `CSQ_Full_Article_Repolish.zip` on the live site. No new features, no layout/design/route changes, no CSFactors/Lumi/dashboard touches.

## Discovery results

- **Storage (PRD Check 1):** PATH A — Supabase table `public.posts` (not `articles`).
- **Fields (Check 2):** need name/shape mapping from the PRD's schema to ours:
  - `body` ✓, `excerpt` ✓, `section` ✓, `category` ✓, `tier` ✓, `published_at` ✓
  - `read_time_minutes` → **`read_minutes`**
  - `status: 'published' | 'draft'` → **`published` boolean** (no status column)
  - `strip_placement_note`, `signal_quote` → **do not exist yet** (Step 4 needed)
  - Extras we leave untouched: `title_mckinsey/body_mckinsey`, `title_wodehouse/body_wodehouse`, `series_*`, `sources`, `embedding`, `hero_prompt`, `cover_image_url`, `subtitle`, `is_premium`.
- **Renderer (Check 3):** `src/routes/insights.$slug.tsx` already renders markdown (existing bodies use `##`, `>` blockquotes, `**bold**`). **Step 3 not needed** — I'll verify once during build by loading one refined post.
- **Slugs (Check 4):** 25 posts exist. **14 of the PRD's 25 slugs do not match** current DB slugs and need a mapping table before upsert.

### Slug mapping (PRD slug → existing DB slug)

Exact matches (11): `new-cs-operating-model`, `vendor-consolidation-curve`, `compensating-humans-agentic-stack`, `what-the-machine-cannot-do`, `ai-native-qbr`, `upward-alignment-mis-sold-contract` *(matches `upward-alignment-the-mis-sold-contract`? see ambiguous)*, `end-of-cs-toil`, `high-touch-cs-scaling-liability`, `negotiators-dilemma-renewals`, `how-to-comp-csms-on-upsells`, `nrr-120-expansion-playbook`.

High-confidence remaps:
- `enterprise-accounts-self-serve` → `when-enterprise-accounts-self-serve`
- `executive-fortitude-cco-churn-protocol` → `executive-fortitude-the-cco-churn-protocol`
- `algorithm-renewal-table` → `algorithm-at-the-renewal-table`
- `frontline-sovereignty` → `frontline-sovereignty-handling-high-volatility-account-friction`
- `chargebee-rebuilt-cs-reactive-predictive` → `chargebee-reactive-to-predictive`
- `notion-nrr-plg-expansion` → `notion-105-to-128-nrr`
- `algorithmic-orchestration-new-cs-operating-model` → `ai-orchestration-cs-org`
- `managing-csuite-enterprise-escalations` → `escalation-playbook-c-suite`
- `driving-nrr-down-market` → `driving-nrr-in-a-down-market`
- `pricing-models-ai-agents` → `pricing-models-for-ai-agents`
- `upward-alignment-mis-sold-contract` → `upward-alignment-the-mis-sold-contract`

**Ambiguous — need your call before I upsert:**
1. `structural-reckoning` (PRD: series overview, 14min) → DB has both `structural-reckoning-part-1-the-structural-reckoning` and `structural-reckoning-prologue`. Which is the "series overview"?
2. `structural-reckoning-begins` (PRD: part 1/12, 7min) → the other of the two above?
3. `identifying-churn-risk-before-contract` → closest DB slug is `qualification-bridge-sales-cs`. Same article?
4. `structural-stakeholders-enterprise-accounts` → closest DB slug is `stakeholder-mapping-frameworks`. Same article?

I will not change existing slugs (routes stay intact) — I'll upsert refined content onto the DB slug and keep the PRD slug only as internal reference.

## Implementation

### Step 1 — Schema additions (single migration)
```sql
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS strip_placement_note text,
  ADD COLUMN IF NOT EXISTS signal_quote text;
```
No RLS/policy/GRANT change (existing table).

### Step 2 — Content import script (one-shot, not shipped)
`scripts/import-refined-dispatches.ts` — Node script run locally with the service-role env already used by other maintenance scripts. For each of the 25 articles it:
1. Parses `csq-dispatches-refined.md` into `{prdSlug → body}` by splitting on `^# \d+\. `.
2. Applies the slug map above → `dbSlug`.
3. Builds a row: `title, excerpt, body, section, category, tier, published (= status==='published'), published_at, read_minutes, series_slug/series_title/series_part/series_total (parsed from PRD "series" line when present), signal_quote, strip_placement_note`.
4. `UPDATE posts SET … WHERE slug = dbSlug` for existing rows; `INSERT` only if no row exists for that slug (none expected after mapping).
5. Leaves `title_mckinsey/body_mckinsey/title_wodehouse/body_wodehouse/sources/embedding/hero_prompt/cover_image_url/subtitle/is_premium` untouched — only fields listed in the PRD change.

Body is stored raw (markdown). Existing renderer parses it.

### Step 3 — Draft handling
PRD marks 3 articles `draft`. Set `published = false` and leave `published_at` null. Confirm the public listing query (`listPostsBySection`, insights index, RSS, sitemap) already filters on `published = true` — if any surface doesn't, add that filter in the same session (read-only surfaces only, no design change).

### Step 4 — Verification
- Load one refined post at `/insights/<slug>` and confirm the `> _"..."_` epigraph renders as a blockquote with the gold left border and `##` renders as a section header (no raw markdown visible). If a specific block doesn't render, add the minimal `.article-body` CSS rules from PRD Step 3 to the existing insights stylesheet — no new file, no token changes.
- Spot-check 3 posts across sections (`vanguard`, `retention-protocol`, `outcome-forum`) for body/excerpt/read-time refresh.
- Confirm drafts do not appear on `/insights`, `/vanguard`, `/retention-protocol`, `/outcome-forum`, `/rss.xml`, `/sitemap.xml`.
- Confirm existing routes still resolve and paywall still gates `tier=premium`.

### Files touched
- **New:** one Supabase migration (columns), `scripts/import-refined-dispatches.ts`, `/tmp/repolish/csq-dispatches-refined.md` copied into `scripts/` as the source.
- **Possibly touched (only if a listing query lacks the `published` filter):** the specific loader file, filter clause only.
- **Possibly touched (only if renderer misses blockquote/header styles):** existing insights stylesheet, additive CSS only.
- **Not touched:** routes, components, tokens, CSFactors, Lumi, dashboards, any article not in the 25.

## Open questions (blocking, please answer)

1. Confirm the 4 ambiguous slug mappings above (structural-reckoning ×2, identifying-churn-risk, structural-stakeholders).
2. For the 3 drafts, do you want them created now with `published=false`, or held back entirely until you flip them live?
