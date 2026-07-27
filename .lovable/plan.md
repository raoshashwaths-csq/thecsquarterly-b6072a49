
# Admin Panel Completion — Implementation Plan

Four sessions, built in order. Each session lands independently: new nav entries + panels in `src/routes/admin.tsx`, backed by new server-fn modules. No existing admin section changes.

## Ground rules (applied to every session)
- Every panel reads/writes a real DB table via `createServerFn` + `requireSupabaseAuth` + `has_role('admin')` gate.
- Hardcoded data files (`homepageHeadlines.ts`, `strips.ts`) get migrated **once** into tables, then the source file becomes a thin loader that reads the table at build/runtime. Panels write to the table only.
- New admin nav items appended to the existing `NAV` array — the sidebar/rendering logic is untouched. New `SectionKey` values + `{active === "…"}` render branches only.
- Reuse existing primitives: `DataTable`, `StatCard`, `ExportButton`, dashboard kit (`MetricCard`, `SectionCard`), shadcn Dialog/Select/Input.
- Semantic tokens only; no hex, no new colors.

## Confirmation questions before Session 4
- **4c CSFactors seed** — deferred by default (CSFactors launch still on hold per project memory). Will skip unless you say otherwise.
- **4d Job board** — `admin.control-panel.tsx` already imports `listJobListings/moderateJobListing/seedSampleJobs`, so job listings **are** live and already have a moderation panel in Control Panel. Treating 4d as **already covered** (mirrors the "Reader Signals" precedent). Will note this in the audit-complete summary, not build a duplicate.

---

## SESSION 1 — Lumi Knowledge, Feedback & Job Health

### New nav group: "Intelligence"
Three new nav items: `lumi-knowledge`, `lumi-feedback`, `system-jobs`.

### 1a. Lumi Knowledge Base browser
- New file `src/lib/admin-lumi.functions.ts` — admin-gated CRUD:
  - `listLumiKnowledge({ contentType?, tree?, language?, limit, offset })`
  - `createLumiKnowledge({ content, content_type, tree_relevance[], topic_tags[], language })` — embeds via same `embedText` helper pattern as `lumi-knowledge.functions.ts` (extract to a small shared server-only helper), inserts row.
  - `updateLumiKnowledge(id, patch)` — re-embeds if `content` changed.
  - `deleteLumiKnowledge(id)`
  - `getLumiKnowledgeCounts()` — total + by content_type + by language.
- Panel `LumiKnowledgeAdmin` in `admin.tsx`:
  - Big honest count card at top ("0 records" when empty).
  - Filters: content_type dropdown (5 values), tree_relevance multi-select (from `q-trees.ts`), language.
  - Table: truncated content, type, trees (chips), language, created_at, edit/delete.
  - "Add record" dialog with the schema-constrained fields.

### 1b. Lumi Feedback rollup
- `listLumiFeedback({ limit, negativeOnly?, treeId? })` and `getLumiFeedbackRollup()` in same functions file.
- Panel `LumiFeedbackAdmin`:
  - Aggregate cards: total, % positive, % negative, by tree_id bar breakdown (recharts, already imported in control-panel).
  - Recent negatives table: rating, tree, content snippet, `run_id` link to `/agent/response/$runId` when present.

### 1c. Translation queue status
- `getTranslationQueueStatus()` — group `knowledge_translation_queue` by `status` + `target_language`.
- Embedded card inside `LumiKnowledgeAdmin` (small matrix: language × pending/complete counts).

### 1d. Scheduled Job Health — "System Jobs" panel
- `getScheduledJobHealth()`:
  - Reads `cron.job` (list) joined to latest `cron.job_run_details` per job.
  - Filters to the 5 named jobs from the PRD (allowlist by `jobname`).
  - Returns `{ jobname, schedule, last_run_at, status, return_message }`.
- Panel `SystemJobsAdmin`: read-only table + green/red status chip via `HealthChip`.

---

## SESSION 2 — Content Management Gaps

### Migration (single migration, both tables + seed)
```text
public.homepage_headlines
  day_index int PK (0..6)         -- Sun..Sat
  phrases  text[] not null
  line1    text not null
  line2    text not null
  full_text text not null

public.comic_strips
  id text PK
  title, tag, hover_text
  sort_order int
  panels jsonb not null            -- [{image_url, alt, bubblesBakedIn, dialogue[]}]
  created_at/updated_at
```
- GRANT SELECT to anon (public read for homepage/strip route), full to authenticated + service_role. RLS: SELECT public; write via admin-only server fns.
- Seed statements insert current 7 headlines from `homepageHeadlines.ts` and current strips from `strips.ts`.

### Wiring
- `homepageHeadlines.ts` — kept as **types + fallback**; add `getHeadlinesFromDB()` server fn used by the root loader that already computes `dayIndex`.
- `strips.ts` — same treatment; `/strip` route loader hydrates from `listComicStrips()`.

### Panels
- `HomepageHeadlinesAdmin`: 7-row editable list. Per row: phrases array editor (add/remove/reorder buttons), auto-derived `fullText` (read-only, computed from phrases join or override toggle), `line1`/`line2` inputs. Save patches one day at a time.
- `ComicStripsAdmin`: list ordered by `sort_order`, per-strip dialog with panel editor (image URL/upload via existing Supabase Storage patterns if bucket exists; else URL only for now — will call out), reorder up/down, delete.

Server fns in new `src/lib/admin-content.functions.ts`.

---

## SESSION 3 — Workspace, Team & Survey Visibility

### 3a. Teams & Workspaces panel
- New `listTeamsAdmin()` + `getTeamDetail(teamId)` in `src/lib/admin-teams.functions.ts`:
  - Teams table joined to team_members, subscriptions (plan tier via `designation`), and count of sequences from `reading_sequences`.
- Panel `TeamsAdmin`: list (name, member count, tier), row expands to member list + sequence count.

### 3b. Retention Ledger Survey submissions
- `listSurveySubmissions({ limit, offset })` and `getSurveyAggregates()` in `src/lib/admin-survey.functions.ts`.
  - Aggregates: per-metric mean/median from `dimension_scores` + count per tier.
- Panel `BenchmarkSurveyAdmin`:
  - Submissions table (name, email, company, title, segment, hcm_status, score, tier, date).
  - Aggregate cards using `MetricCard`.
  - Reuse existing `ExportButton` with `dataset: "survey_responses"` (already supported).

---

## SESSION 4 — Remaining Gaps

### 4a. Workspace Items / Annotations viewer
- `listWorkspaceItemsAdmin({ userId?, limit })` and `listAnnotationsAdmin({ userId?, limit })` in `src/lib/admin-workspace.functions.ts`.
- Combined panel `WorkspaceInspectorAdmin`: user search input → two tables (items, annotations).

### 4b. FAQ Feedback aggregate
- `getFaqFeedbackRollup()`: group `faq_feedback` by `(section_slug, item_slug)`, sum vote, order by lowest net score.
- Panel `FaqFeedbackAdmin`: single sortable table.

### 4c. CSFactors seed data — **deferred** (see confirmation note).
### 4d. Job board — **already covered in Control Panel** (see confirmation note).

---

## Technical details

- Auth: every new server fn uses `.middleware([requireSupabaseAuth])` + `has_role(userId, 'admin')` check; throws `Forbidden` otherwise.
- Migrations: two migrations total across the plan — one in Session 1 is not needed (all tables exist), one in Session 2 (headlines + strips tables + seed).
- No changes to `src/integrations/supabase/*` (auto-gen).
- Every new panel file: same visual language as existing sections (mono eyebrows, `border-border`, `font-display`).

## Testing checklist (mirrors PRD)
- Nav has 6 new entries after Session 1+2+3+4a/b.
- Knowledge count reads "0" honestly when empty.
- Job health reflects real `cron.job_run_details` (verified against one job manually).
- Headlines/strips migration lossless — 7 headlines + all current strips present post-seed.
- Existing admin sections unmodified — checked by diffing `NAV` and existing `{active === …}` branches.
