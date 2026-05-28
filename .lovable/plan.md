## Goal

Stop estimating Q's compute cost. Capture real tokens/latency/cost on every Q run, then expose live cost metrics in the admin control panel (replacing the "(est.)" heuristics) plus a forward-looking projection tile.

## Part A — Real cost tracking on `q_runs`

### Migration: add telemetry columns

Add to `public.q_runs`:
- `tokens_in integer` (nullable)
- `tokens_out integer` (nullable)
- `latency_ms integer` (nullable)
- `cost_micros bigint` (nullable) — cost in millionths of a USD cent (i.e. 1e-8 USD), keeps integer math precise
- `model text` (nullable) — which model produced the run, for future per-model breakdowns

Backfill stays `NULL` for historical rows; UI treats `NULL` as "pre-telemetry" and falls back to the heuristic with an "est." badge for that subset only.

### Writer changes — `src/lib/q-agent.functions.ts`

Both `askQ` and `runQNode` already call `fetch("https://ai.gateway.lovable.dev/v1/chat/completions", ...)`. Wrap each call:

1. `const t0 = Date.now()` before fetch
2. After fetch, read `json.usage?.prompt_tokens` and `json.usage?.completion_tokens` (OpenAI-compatible response shape that the Lovable Gateway returns)
3. Compute `latency_ms = Date.now() - t0`
4. Compute `cost_micros` using a small `priceFor(model)` table in a new `src/lib/q-pricing.ts`:
   - `google/gemini-2.5-flash`: $0.30 / 1M input, $2.50 / 1M output (list)
   - Apply a configurable gateway multiplier (default 1.6) to approximate Lovable Gateway billing until we have real invoice data
5. For `runQNode`, include these fields in the existing `.insert(...)` on `q_runs`
6. For `askQ`, it currently does NOT persist anything. Add an insert of a thin telemetry row (or, cleaner: a separate `q_chat_runs` table). **Decision:** reuse `q_runs` with `node_id = 'chat:askq'` and `zones = { diagnosis: '', playbook: '', executable: '' }` so all telemetry lives in one place; one row per chat call. This also unifies the monthly cap counting in `q-usage.functions.ts` (chat already calls `assertQUnderCap`, so chat already counts — but currently doesn't write a row, which means the cap is technically off-by-one. Fixing.)

`src/lib/q-pricing.ts` (new):
- `PRICING: Record<string, { inPerM: number; outPerM: number }>`
- `GATEWAY_MULTIPLIER = 1.6`
- `computeCostMicros(model, tokensIn, tokensOut): number`
- `formatUSD(micros): string`

### Reader / aggregation — `src/lib/control-panel.functions.ts`

Update `getAgentObservability`:
- Sum `cost_micros`, `tokens_in`, `tokens_out`, `avg(latency_ms)` from `q_runs` over the selected window
- For rows where telemetry columns are NULL, fall back to the existing heuristic and tag the aggregate response with `{ telemetryCoverage: realRows / totalRows }`
- Replace the three heuristic fields:
  - `totalTokenBurn` → real sum, `estimated: telemetryCoverage < 1`
  - `avgLatencyMs` → real avg over non-null rows
  - `computeProfitMargin` → MRR – (cost over same window annualized), real numbers

## Part B — Projected cost tile in control panel

### New aggregator — `getQCostProjection` in `control-panel.functions.ts`

Compute:
- Run rate: `runs_last_30d` from `q_runs`
- Avg cost per run: `sum(cost_micros) / count(*)` over last 30d (telemetry rows only); if coverage < 50%, fall back to heuristic blended average from the cost model already used in chat
- Projections at 1k / 10k / 100k conversations
- Monthly projection at current run rate: `runs_last_30d * avg_cost_per_run`
- Annualized: `monthly * 12`

### UI — `src/routes/admin.control-panel.tsx` (Diagnostics tab)

Add a new `SectionCard` "Projected Compute Cost" using existing `MetricCard` primitives (dashboard kit — no new tokens):
- **Cost / run** (avg, last 30d) — with coverage % subtitle ("real telemetry on 78% of runs")
- **Monthly run rate** (current) — `runs_last_30d`
- **Projected monthly cost** at current rate
- **Projected ARR cost** (monthly × 12)
- A small inline table: cost @ 1k / 10k / 100k conversations
- Footnote: "Includes Lovable Gateway multiplier (~1.6×). Replace with real invoice data once available." with a link to edit `GATEWAY_MULTIPLIER` (just docs, no UI editor)

Existing "(est.)" suffixes on the diagnostics tiles get removed once `telemetryCoverage === 1`; until then, keep the badge but show the live number alongside.

## Out of scope

- A real billing reconciliation against the Lovable Gateway invoice (no API for that yet).
- Per-user cost breakdown in `listMasterUsers` — easy follow-on, but not in this pass.
- Per-model cost split UI (the column is captured; the chart can come later).

## Verification

After build:
1. Trigger one `runQNode` from a Vanguard account and one `askQ` chat → query `q_runs` and confirm `tokens_in`, `tokens_out`, `latency_ms`, `cost_micros`, `model` are populated.
2. Control panel Diagnostics tab shows a new "Projected Compute Cost" card with non-zero values.
3. The three previously-heuristic tiles ("Total Token Burn", "Avg Latency", "Compute Profit Margin") show real numbers for new runs, with coverage % visible.
4. `psql` spot check: `select count(*) filter (where cost_micros is not null), count(*) from q_runs;` — coverage ratio matches what the UI reports.

## Files touched

- `supabase` migration — add 5 columns to `q_runs`
- `src/lib/q-pricing.ts` — new, pricing table + helpers
- `src/lib/q-agent.functions.ts` — capture telemetry in both `askQ` and `runQNode`
- `src/lib/control-panel.functions.ts` — new `getQCostProjection`, update `getAgentObservability`
- `src/routes/admin.control-panel.tsx` — new Projected Compute Cost card, refine heuristic badges
- `.lovable/plan.md` — refresh
