import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

export type Post = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  body: string;
  title_mckinsey: string | null;
  body_mckinsey: string | null;
  title_wodehouse: string | null;
  body_wodehouse: string | null;
  category: string;
  section: string;
  author: string;
  read_minutes: number;
  hero_prompt: string | null;
  cover_image_url: string | null;
  is_premium: boolean;
  tier: string;
  published: boolean;
  published_at: string;
  series_slug: string | null;
  series_title: string | null;
  series_part: number | null;
  series_total: number | null;
  sources: string | null;
  locked?: boolean;
};

const SELECT_COLS =
  "id, slug, title, subtitle, excerpt, body, title_mckinsey, body_mckinsey, title_wodehouse, body_wodehouse, category, section, author, read_minutes, hero_prompt, cover_image_url, is_premium, tier, published, published_at, series_slug, series_title, series_part, series_total, sources";


// Strip premium body content from a post for callers without entitlement.
const PREVIEW_CHARS = 1200;
function gatePremiumBody<T extends Partial<Post>>(post: T, entitled: boolean): T {
  // Treat ALL Vanguard-section posts as paid, plus any post explicitly flagged is_premium.
  const needsGate = post?.is_premium === true || post?.section === "vanguard";
  if (!needsGate || entitled) return { ...post, locked: false };
  return {
    ...post,
    body: (post.body ?? "").slice(0, PREVIEW_CHARS),
    body_mckinsey: post.body_mckinsey ? post.body_mckinsey.slice(0, PREVIEW_CHARS) : post.body_mckinsey,
    body_wodehouse: post.body_wodehouse ? post.body_wodehouse.slice(0, PREVIEW_CHARS) : post.body_wodehouse,
    locked: true,
  };
}

// Non-throwing token check for optional auth on public reads.
async function getOptionalUserId(): Promise<string | null> {
  const req = getRequest();
  const auth = req?.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  if (!token) return null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const sb = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

async function isVanguardEntitled(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const { data: roles } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId);
  if ((roles ?? []).some((r) => r.role === "admin")) return true;
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return !!sub;
}

export const listPosts = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getOptionalUserId();
  const entitled = await isVanguardEntitled(userId);
  let query = supabaseAdmin
    .from("posts")
    .select(SELECT_COLS)
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (!entitled) {
    query = query.lte("published_at", new Date().toISOString());
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => gatePremiumBody(p as Post, entitled)) as Post[];
});

export const listPostsBySection = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ section: z.string().min(1).max(40) }).parse(input),
  )
  .handler(async ({ data }) => {
    const userId = await getOptionalUserId();
    const entitled = await isVanguardEntitled(userId);
    let query = supabaseAdmin
      .from("posts")
      .select(SELECT_COLS)
      .eq("section", data.section)
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (!entitled) {
      query = query.lte("published_at", new Date().toISOString());
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []).map((p) => gatePremiumBody(p as Post, entitled)) as Post[];
  });

export const getPost = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const userId = await getOptionalUserId();
    const entitled = await isVanguardEntitled(userId);
    let query = supabaseAdmin.from("posts").select(SELECT_COLS).eq("slug", data.slug);
    if (!entitled) {
      // Non-entitled (anon or free) callers only see published posts whose
      // publication date has arrived. Admins/subscribers can preview drafts.
      query = query.eq("published", true).lte("published_at", new Date().toISOString());
    }
    const { data: post, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    if (!post) return null;
    return gatePremiumBody(post as Post, entitled) as Post;
  });

export const listSeriesParts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ series_slug: z.string().min(1).max(80) }).parse(input),
  )
  .handler(async ({ data }) => {
    // Return ALL parts (including unpublished/future) — admin client bypasses RLS.
    // The UI uses published_at + published flags to mark which are locked vs available.
    const { data: rows, error } = await supabaseAdmin
      .from("posts")
      .select("slug, title, series_part, series_total, series_title, published, published_at, tier, is_premium")
      .eq("series_slug", data.series_slug)
      .order("series_part", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---- Related intelligence (public, read-only) ----
import { TREES, type TreeId, type TreeCategory } from "@/lib/q-trees";

const CATEGORY_TO_TREE_CAT: Record<string, TreeCategory> = {
  "Stakeholder Management": "shared",
  "Escalation": "core",
  "Sales Qualification": "ops",
  "Negotiation": "ops",
  "AI in CS": "leadership",
};

const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","with","by","is","are","was","were","be","been","being","this","that","these","those","it","its","as","at","from","into","about","your","you","we","our","their","they","not","no","yes","how","why","what","when","where","who","which",
]);

function tokenize(s: string): Set<string> {
  return new Set(
    (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

type RelatedPick = { slug: string; title: string };
type RelatedTreePick = { id: TreeId; title: string };

export const getRelatedIntelligence = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: current, error: e0 } = await supabaseAdmin
      .from("posts")
      .select("id, slug, title, excerpt, category, section, published_at")
      .eq("slug", data.slug)
      .maybeSingle();
    if (e0) throw new Error(e0.message);
    if (!current) {
      return { playbook: null, tree: null, foundational: null } as {
        playbook: RelatedPick | null;
        tree: RelatedTreePick | null;
        foundational: RelatedPick | null;
      };
    }

    const articleTokens = tokenize(`${current.title} ${current.excerpt}`);

    // 1. Codex playbook — best codex post by category match then jaccard.
    const { data: codexRows } = await supabaseAdmin
      .from("posts")
      .select("slug, title, excerpt, category")
      .eq("section", "codex")
      .eq("published", true)
      .lte("published_at", new Date().toISOString())
      .neq("slug", current.slug);
    let playbook: RelatedPick | null = null;
    if (codexRows && codexRows.length > 0) {
      const scored = codexRows.map((p) => {
        const sameCat = p.category === current.category ? 0.25 : 0;
        return { p, score: sameCat + jaccard(articleTokens, tokenize(`${p.title} ${p.excerpt}`)) };
      });
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0];
      if (best && best.score > 0) playbook = { slug: best.p.slug, title: best.p.title };
    }

    // 2. Lumi tree — static category map then jaccard against tree title+blurb.
    const treeCat = CATEGORY_TO_TREE_CAT[current.category];
    const candidateTrees = treeCat ? TREES.filter((t) => t.category === treeCat) : TREES;
    const treePool = candidateTrees.length > 0 ? candidateTrees : TREES;
    const treeScored = treePool.map((t) => ({
      t,
      score: jaccard(articleTokens, tokenize(`${t.title} ${t.blurb}`)),
    }));
    treeScored.sort((a, b) => b.score - a.score);
    const bestTree = treeScored[0];
    const tree: RelatedTreePick | null = bestTree
      ? { id: bestTree.t.id, title: bestTree.t.title }
      : null;

    // 3. Foundational article — earliest in same section+category, fallback to section.
    let foundational: RelatedPick | null = null;
    const { data: foundCatRow } = await supabaseAdmin
      .from("posts")
      .select("slug, title")
      .eq("section", current.section)
      .eq("category", current.category)
      .eq("published", true)
      .neq("slug", current.slug)
      .order("published_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (foundCatRow) {
      foundational = { slug: foundCatRow.slug, title: foundCatRow.title };
    } else {
      const { data: foundSecRow } = await supabaseAdmin
        .from("posts")
        .select("slug, title")
        .eq("section", current.section)
        .eq("published", true)
        .neq("slug", current.slug)
        .order("published_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (foundSecRow) foundational = { slug: foundSecRow.slug, title: foundSecRow.title };
    }

    return { playbook, tree, foundational };
  });


// ----- Admin -----
const PostSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(1).max(300),
  subtitle: z.string().trim().max(500).optional().nullable(),
  excerpt: z.string().trim().min(1).max(800),
  body: z.string().trim().min(1).max(120000),
  title_mckinsey: z.string().trim().max(300).optional().nullable(),
  body_mckinsey: z.string().trim().max(120000).optional().nullable(),
  title_wodehouse: z.string().trim().max(300).optional().nullable(),
  body_wodehouse: z.string().trim().max(120000).optional().nullable(),
  category: z.string().trim().min(1).max(80),
  section: z.enum(["vanguard", "retention-protocol", "outcome-forum", "codex"]),
  author: z.string().trim().min(1).max(120).default("The Editors"),
  read_minutes: z.number().int().min(1).max(120).default(7),
  tier: z.enum(["free", "premium"]).default("free"),
  published: z.boolean().default(true),
  published_at: z.string().trim().max(40).optional().nullable(),
  cover_image_url: z.string().trim().max(500).optional().nullable(),
  series_slug: z.string().trim().max(80).regex(/^[a-z0-9-]+$/).optional().nullable(),
  series_title: z.string().trim().max(200).optional().nullable(),
  series_part: z.number().int().min(1).max(99).optional().nullable(),
  series_total: z.number().int().min(1).max(99).optional().nullable(),
  sources: z.string().trim().max(8000).optional().nullable(),
});


export const upsertPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PostSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");

    const { published_at, ...rest } = data;
    const payload: Record<string, unknown> = { ...rest, is_premium: data.tier === "premium" };
    if (published_at && published_at.trim()) payload.published_at = published_at;
    const { data: saved, error } = await supabaseAdmin
      .from("posts")
      .upsert(payload as never, { onConflict: "slug" })
      .select("id, published")
      .single();
    if (error) throw new Error(error.message);

    // Auto-embed published posts. Best-effort: never fail the publish.
    if (saved?.published && saved?.id) {
      try {
        const { embedPostInternal } = await import("./embeddings.functions");
        await embedPostInternal(saved.id);
      } catch (e) {
        console.error("[upsertPost] embedding failed:", (e as Error).message);
      }
    }
    return { ok: true };
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from("posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const PlaybookSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(1).max(300),
  summary: z.string().trim().min(1).max(800),
  body: z.string().trim().min(0).max(120000).default(""),
  category: z.string().trim().min(1).max(80).default("Framework"),
  price_cents: z.number().int().min(0).max(99900).default(4900),
  pages: z.number().int().min(1).max(500).default(12),
  included_in_vanguard: z.boolean().default(true),
  published: z.boolean().default(true),
  cover_image_url: z.string().trim().max(500).optional().nullable(),
});

export const upsertPlaybook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PlaybookSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from("playbooks").upsert(data, { onConflict: "slug" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePlaybook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from("playbooks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAllPostsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { data, error } = await supabaseAdmin
      .from("posts").select(SELECT_COLS).order("published_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Post[];
  });

export const listAllPlaybooksAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { data, error } = await supabaseAdmin
      .from("playbooks").select("*").order("published_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ───────────────────────────────────────────────────────────────────────────
// Lumi-seeded editorial feed
//
// For signed-in users with Lumi Memory, rank the recent post list by semantic
// similarity to their stored context (memories + profile challenges + persona).
// Lazy-embeds any unembedded recent posts so the index self-heals over time.
// Falls back to pure recency when memory is empty, embedding fails, or the
// caller is below Practitioner.
// ───────────────────────────────────────────────────────────────────────────

const SEED_EMBED_MODEL = "openai/text-embedding-3-small";
const SEED_EMBED_DIM = 1536;

async function embedSeedText(text: string): Promise<number[] | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;
  const input = text.trim().slice(0, 4000);
  if (!input) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({ model: SEED_EMBED_MODEL, input, dimensions: SEED_EMBED_DIM }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
    const v = json.data?.[0]?.embedding;
    return Array.isArray(v) && v.length === SEED_EMBED_DIM ? v : null;
  } catch {
    return null;
  }
}

async function lazyBackfillPostEmbeddings(limit = 12): Promise<void> {
  const { data: rows } = await supabaseAdmin
    .from("posts")
    .select("id, title, excerpt, body")
    .eq("published", true)
    .is("embedding", null)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (!rows?.length) return;
  for (const r of rows) {
    const text = [r.title, r.excerpt, (r.body ?? "").slice(0, 800)]
      .filter(Boolean)
      .join("\n\n");
    const vec = await embedSeedText(text);
    if (!vec) continue;
    await supabaseAdmin
      .from("posts")
      .update({ embedding: vec as never })
      .eq("id", r.id);
  }
}

export const getLumiSeededFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ limit: z.number().int().min(1).max(20).default(8) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const limit = data.limit;

    // 1. Pull user context: memories + profile signals
    const [{ data: memories }, { data: profile }] = await Promise.all([
      supabaseAdmin
        .from("lumi_memory")
        .select("content, memory_type, last_seen_at, created_at")
        .eq("user_id", userId)
        .in("memory_type", ["situation", "preference", "account", "framework"])
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(12),
      supabaseAdmin
        .from("profiles")
        .select("persona, challenges, difficult_account")
        .eq("id", userId)
        .maybeSingle(),
    ]);

    const memText = (memories ?? []).map((m) => m.content).join("\n");
    const profileText = [
      profile?.persona,
      Array.isArray(profile?.challenges) ? (profile?.challenges as string[]).join(", ") : null,
      (profile as { difficult_account?: string } | null)?.difficult_account,
    ]
      .filter(Boolean)
      .join("\n");
    const queryText = [memText, profileText].filter(Boolean).join("\n").trim();

    // Entitlement check (uses existing helper)
    const entitled = await isVanguardEntitled(userId);

    if (!queryText) {
      // No context → plain recency
      const { data: rows } = await supabaseAdmin
        .from("posts")
        .select(SELECT_COLS)
        .eq("published", true)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(limit);
      return {
        source: "recency" as const,
        posts: (rows ?? []).map((p) => ({
          ...gatePremiumBody(p as Post, entitled),
          seeded: false,
        })) as Array<Post & { seeded: boolean }>,
      };
    }

    // 2. Lazy backfill recent posts that lack embeddings (best-effort)
    await lazyBackfillPostEmbeddings(8).catch(() => {});

    // 3. Embed the query and ask match_posts for top matches
    const vec = await embedSeedText(queryText);
    let seededSlugs: string[] = [];
    if (vec) {
      const { data: matches } = await (supabaseAdmin.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: Array<{ slug: string; similarity: number }> | null }>)(
        "match_posts",
        { _query: vec as unknown as number[], _k: limit, _section: null },
      );
      seededSlugs = (matches ?? []).map((m) => m.slug);
    }

    // 4. Fetch full posts (seeded first, then fill remainder with recency)
    const seededSet = new Set(seededSlugs);
    const [{ data: seededRows }, { data: recencyRows }] = await Promise.all([
      seededSlugs.length
        ? supabaseAdmin
            .from("posts")
            .select(SELECT_COLS)
            .in("slug", seededSlugs)
            .eq("published", true)
            .lte("published_at", new Date().toISOString())
        : Promise.resolve({ data: [] as unknown[] }),
      supabaseAdmin
        .from("posts")
        .select(SELECT_COLS)
        .eq("published", true)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(limit * 2),
    ]);

    const seededById = new Map<string, Post>();
    for (const r of (seededRows ?? []) as Post[]) seededById.set(r.slug, r);
    // Preserve match_posts ordering
    const orderedSeeded = seededSlugs
      .map((s) => seededById.get(s))
      .filter((p): p is Post => !!p);

    const remainder = ((recencyRows ?? []) as Post[]).filter((p) => !seededSet.has(p.slug));
    const combined = [...orderedSeeded, ...remainder].slice(0, limit);

    return {
      source: orderedSeeded.length ? ("lumi" as const) : ("recency" as const),
      posts: combined.map((p) => ({
        ...gatePremiumBody(p, entitled),
        seeded: seededSet.has(p.slug),
      })) as Array<Post & { seeded: boolean }>,
    };
  });
