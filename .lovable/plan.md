
# Plan — Semantic search on dispatches (backend only)

The project already has the infrastructure in place: `posts.embedding` is `vector(3072)`, and `public.match_posts(_query vector, _k int, _section text)` returns ranked posts. We will **keep that** and only add the missing pieces.

No UI work except a single admin backfill button. No changes to existing routes, schemas, or components.

## Step-by-step (each step verified before the next)

### Step 1 — Confirm pgvector + column + index (read-only check)
- `pgvector` is already enabled (the column compiles).
- Verify `posts.embedding vector(3072)` exists and that an HNSW/IVF index is present. If no index exists, add one in Step 2; otherwise skip.

### Step 2 — Ensure ANN index (migration, only if missing)
If no index on `posts.embedding`, add:

```sql
CREATE INDEX IF NOT EXISTS posts_embedding_idx
  ON public.posts USING hnsw (embedding vector_cosine_ops);
```

(HNSW matches what Lovable's pgvector guidance recommends and works with 3072-dim Gemini vectors. No schema change to `posts`.)

### Step 3 — `embedPost` server function
New file: `src/lib/embeddings.functions.ts`

- `createServerFn({ method: "POST" })` + `requireSupabaseAuth` + admin role check (`has_role(userId,'admin')`).
- Fetches the post (id, title, subtitle, excerpt, body, category, section) via the admin client loaded inside the handler.
- Builds the text-to-embed (title weighted x2, strip markdown, slice body to ~6000 chars).
- Calls **Lovable AI Gateway** `/v1/embeddings` with `model: "google/gemini-embedding-001"` (3072 dims, matches existing column). Uses `LOVABLE_API_KEY` (already provisioned — no new secret).
- Writes `embedding` back to `public.posts`.

Verification: invoke once for an existing published post via `stack_modern--invoke-server-function`, then `SELECT id, embedding IS NOT NULL FROM posts WHERE id = ...`.

### Step 4 — `searchPostsBySimilarity` server function
Same file. Public-readable (no auth required — it only returns already-public published posts).

- Embeds the query string via Lovable AI Gateway (same model).
- Calls existing `match_posts(_query, _k, _section)` RPC via the server publishable client.
- Returns `{ id, slug, title, similarity }[]`.

Verification: invoke with a sample query, confirm ranked results > 0.

### Step 5 — Auto-embed on publish
`src/lib/posts.functions.ts` already owns post writes. After a successful upsert where the saved row has `published = true`, fire-and-await `embedPost({ postId })` inside the same handler (admin gate already enforced by that fn). Failures are logged but do not roll back the publish.

Verification: edit any published post in /admin, confirm `embedding` column updates (timestamp changes / value present).

### Step 6 — Backfill server function + admin button
- Server fn `backfillEmbeddings` (admin-gated): selects published posts with `embedding IS NULL`, loops with 200ms delay, calls `embedPost` for each, returns `{ embedded, failed }`.
- UI: add one small button + status text to `src/routes/admin.tsx` (or the existing admin content panel — whichever already hosts admin tools). Calls the server fn via `useServerFn` + `useMutation`. No other layout/UI changes.

Verification: click the button on /admin, confirm the count returned and that `SELECT count(*) FROM posts WHERE published AND embedding IS NULL` drops to 0.

## What I will NOT do
- Will not create `vector(1536)` / OpenAI path — your answer was "keep existing 3072 / Gemini".
- Will not add an `OPENAI_API_KEY` secret. Lovable AI Gateway uses the already-provisioned `LOVABLE_API_KEY`.
- Will not modify any existing route, post schema column, post editor UI, or `match_posts` function signature.
- Will not return `embedding` in any standard SELECT — only `match_posts` exposes it (already the case).

## Technical notes
- Files created: `src/lib/embeddings.functions.ts`.
- Files edited: `src/lib/posts.functions.ts` (auto-embed hook), `src/routes/admin.tsx` (one backfill button), possibly one migration (HNSW index, only if missing).
- No edits to `src/integrations/supabase/*`, `routeTree.gen.ts`, `.env`.
- Embedding model: `google/gemini-embedding-001` (3072 dims) via `https://ai.gateway.lovable.dev/v1/embeddings`, header `Authorization: Bearer ${LOVABLE_API_KEY}` (OpenAI-compatible endpoint).
- Admin gating uses existing `has_role(userId, 'admin')` RPC.

I'll stop after each step's verification before moving to the next.
