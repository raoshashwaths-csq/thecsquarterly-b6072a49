# Q — Operational Canvas

Build a guided decision-graph tool for Vanguard subscribers. Free users keep the current Q sheet (1 trial question). Paid users get a full-page canvas at `/agent/framework` where they navigate an 8-tree graph; the terminal node fires an AI call with a pre-structured prompt and renders the response in a fixed 3-zone layout.

## 1. Entry points & gating

- **Floating Q. button** (unchanged) opens the existing sheet.
- Inside the sheet, add a new CTA: **"Open the Canvas →"**.
  - Logged-out / free → routes to `/pricing` with a `?from=q-canvas` highlight on Vanguard.
  - Vanguard subscriber → routes to `/agent/framework`.
- `/agent/framework` is gated by a Vanguard role check (server-side via `requireSupabaseAuth` + `has_role`). Non-subscribers see a paywall card with one screenshot of the canvas and a CTA.

## 2. Routes

```
src/routes/
  agent.framework.tsx       # canvas shell + tree picker + node graph
  agent.response.$runId.tsx # 3-zone response view (deep-linkable, saved per user)
```

Each gets its own `head()` metadata. No nav link in the header — Q is reached only via the floating button.

## 3. Data layer — `src/lib/q-trees.ts`

Single source of truth, typed exactly as the spec:

```ts
export type TreeId = 'T1'|'T2'|'T3'|'T4'|'T5'|'T6'|'T7'|'T8'
export interface TreeNode {
  id: string
  treeId: TreeId
  label: string
  level: 1 | 2 | 3
  parentId?: string
  isTerminal: boolean
  // terminal-only:
  promptTemplate?: string       // injected into the AI call
  benchmarks?: string[]         // benchmark IDs pulled from a small benchmarks map
  position: { x: number; y: number }  // % of canvas
}
export const trees: TreeNode[] = [ /* 8 trees, levels 1-3 */ ]
```

Eight trees (Level 1 labels): **Escalation, Champion Change, Upsell Qualification, Renewal Risk, QBR Prep, Career & Alignment, Onboarding Stall, Exec Misalignment.** Each Level 1 → 2–4 Level 2 branches → 2–3 Level 3 terminal nodes. ~60–80 nodes total. Authored as static data; no DB tables in this phase.

## 4. Canvas UI — `agent.framework.tsx`

Layout (desktop ≥1024px):

```text
┌─────────────────────────────────────────────────────────┐
│  Eyebrow: OPERATOR CANVAS · Q.                          │
│  H1: What decision are you running today?               │
├─────────────────────────────────────────────────────────┤
│  Tree picker rail (8 cards, horizontal scroll on mobile)│
├─────────────────────────────────────────────────────────┤
│                                                         │
│           SVG node graph (selected tree)                │
│  ● Level 1 ── ● Level 2 ── ◉ Level 3 (terminal)         │
│                                                         │
│  Hairlines connect parent→child. Hover lifts node.      │
│  Click L2 expands its L3 children.                      │
│  Click terminal (◉) → opens RunDrawer.                  │
└─────────────────────────────────────────────────────────┘
```

- SVG-rendered nodes positioned by `position` percentages, so it scales responsively. Mobile collapses to a stacked accordion (L1 → L2 → L3 list).
- Selected path is highlighted (accent stroke + breadcrumb above the graph: `Escalation › Product Failure › Core Platform Downtime`).
- Respect `prefers-reduced-motion`; use the existing `Reveal` + cinematic easing tokens.

## 5. Run drawer — terminal click

Right-side `Sheet` (reuse existing primitive). Contents:

1. **Breadcrumb** of the selected path.
2. **Context form** — 3–5 short, structured fields, not a free prompt. Examples for the Escalation tree:
   - Account ARR (range select)
   - Time since escalation opened (select)
   - Exec involved (yes/no)
   - Free-text: 1 sentence of context (max 240 chars)
3. **Witty mode** toggle (carried from current sheet).
4. **Run Q** button → calls `runQNode` server fn.

## 6. Prompt-injection contract — `src/lib/q-agent.functions.ts`

New server fn `runQNode`:

```ts
runQNode({
  data: {
    nodeId: string,
    context: Record<string, string>,
    witty: boolean,
  }
}) → { runId, zones: { diagnosis, playbook, executable } }
```

Handler:
- Look up `TreeNode` by `nodeId`; reject if not terminal.
- Verify Vanguard role (via `requireSupabaseAuth` + `has_role`).
- Build the system prompt from the existing two-voice strings (McKinsey / Wodehouse).
- Build the user prompt by interpolating `node.promptTemplate` with `context` + benchmark hints, then append a **strict response contract** instructing the model to return three labeled zones separated by `---ZONE---` markers:
  1. `DIAGNOSIS` (3 bullets, what's actually happening)
  2. `PLAYBOOK` (numbered steps, benchmark-anchored)
  3. `EXECUTABLE` (one artifact: email draft, talk-track, or checklist — copy-pasteable)
- Call Lovable AI Gateway (`google/gemini-2.5-flash` for speed; `gemini-2.5-pro` toggle later).
- Parse the three zones; if parsing fails, fall back to a single Diagnosis zone with the raw text + a "regenerate" hint.
- Persist `{ runId, userId, nodeId, context, zones, createdAt }` to a new `q_runs` table for deep-linking and history.

## 7. Response view — `agent.response.$runId.tsx`

Fixed 3-zone layout, always:

```text
┌─ Zone 1 · DIAGNOSIS ──────────────────┐
│  3 sharp bullets                      │
├─ Zone 2 · PLAYBOOK ───────────────────┤
│  Numbered steps, benchmark callouts   │
├─ Zone 3 · EXECUTABLE ─────────────────┤
│  Copy-to-clipboard artifact card      │
└───────────────────────────────────────┘
```

- Eyebrow shows the breadcrumb + run timestamp.
- "Run again" + "New decision" buttons at the bottom.
- Same route renders both fresh runs and revisits (loader fetches by `runId`, RLS-scoped to user).

## 8. Database (one migration)

```sql
create table public.q_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null,
  context jsonb not null default '{}'::jsonb,
  zones jsonb not null,
  witty boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.q_runs enable row level security;
create policy "users read own runs" on public.q_runs for select using (auth.uid() = user_id);
create policy "users insert own runs" on public.q_runs for insert with check (auth.uid() = user_id);
```

No new role table — relies on existing `user_roles` + `has_role('vanguard')`. If that role doesn't exist yet, a tiny seed migration adds it to the `app_role` enum.

## 9. Out of scope this phase

- Logic-tree authoring UI (admin will edit `src/lib/q-trees.ts` directly for now).
- Retrospective drawer (PRD v3 §4) — separate later phase.
- Streaming responses — first version returns the full payload, then renders.
- Job board recruiter logins — already on the checklist, untouched.

## 10. Build order (next turn, after approval)

1. Migration for `q_runs` + `vanguard` role.
2. `src/lib/q-trees.ts` with all 8 trees authored.
3. `runQNode` server fn + role gate.
4. `agent.framework.tsx` canvas + RunDrawer.
5. `agent.response.$runId.tsx` 3-zone view.
6. Hook the "Open the Canvas" CTA into the existing Q sheet.
7. Add `og`/`head` metadata for both routes; verify `prefers-reduced-motion` and mobile accordion fallback.

Estimated 1 large build turn for steps 1–4, a second turn for 5–7 + QA.
