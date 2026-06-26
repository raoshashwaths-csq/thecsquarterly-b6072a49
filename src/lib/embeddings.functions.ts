import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const EMBED_MODEL = "openai/text-embedding-3-small";
const EMBED_DIM = 1536;

async function assertAdmin(userId: string) {
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (!(roles ?? []).some((r) => r.role === "admin")) {
    throw new Error("Forbidden");
  }
}

async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
  const input = text.trim();
  if (!input) throw new Error("Cannot embed empty text");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({ model: EMBED_MODEL, input, dimensions: EMBED_DIM }),
  });
  if (!res.ok) {
    throw new Error(`Embedding gateway ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
  const v = json.data?.[0]?.embedding;
  if (!Array.isArray(v) || v.length !== EMBED_DIM) {
    throw new Error(`Bad embedding response (len=${v?.length ?? "n/a"})`);
  }
  return v;
}

function buildPostText(post: {
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  body: string | null;
  category: string | null;
  section: string | null;
}): string {
  const cleanBody = (post.body ?? "")
    .replace(/[#*`_~\[\]]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 6000);
  return [
    post.title,
    post.title, // intentional repeat for weight
    post.subtitle ?? "",
    post.excerpt ?? "",
    post.category ?? "",
    post.section ?? "",
    cleanBody,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Generate and store an embedding for a single post. Admin-only.
 * Internal callers (e.g. upsertPost) can call embedPostInternal directly.
 */
export async function embedPostInternal(postId: string): Promise<void> {
  const { data: post, error } = await supabaseAdmin
    .from("posts")
    .select("id, title, subtitle, excerpt, body, category, section")
    .eq("id", postId)
    .single();
  if (error || !post) throw new Error(`Post not found: ${postId}`);

  const text = buildPostText(post);
  const vec = await embedText(text);

  const { error: updateError } = await supabaseAdmin
    .from("posts")
    .update({ embedding: vec as never })
    .eq("id", postId);
  if (updateError) throw new Error(`Failed to store embedding: ${updateError.message}`);
}

export const embedPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ postId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await embedPostInternal(data.postId);
    return { ok: true, postId: data.postId };
  });

/**
 * Semantic search over published posts. Public — only safe published metadata
 * is returned via the match_posts RPC.
 */
export const searchPostsBySimilarity = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        query: z.string().trim().min(1).max(2000),
        matchCount: z.number().int().min(1).max(50).default(5),
        section: z.string().trim().min(1).max(40).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const vec = await embedText(data.query);
    const { data: rows, error } = await (
      supabaseAdmin.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{
        data: Array<{ id: string; slug: string; title: string; similarity: number }> | null;
        error: { message: string } | null;
      }>
    )("match_posts", {
      _query: vec as unknown as number[],
      _k: data.matchCount,
      _section: data.section ?? null,
    });
    if (error) throw new Error(`Similarity search failed: ${error.message}`);
    return rows ?? [];
  });

/**
 * Backfill embeddings for all published posts that don't have one yet.
 * Admin-only. Loops with a small delay to avoid rate limits.
 */
export const backfillEmbeddings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ limit: z.number().int().min(1).max(500).default(200) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { data: posts, error } = await supabaseAdmin
      .from("posts")
      .select("id")
      .eq("published", true)
      .lte("published_at", new Date().toISOString())
      .is("embedding", null)
      .limit(data.limit);
    if (error) throw new Error(error.message);

    let embedded = 0;
    let failed = 0;
    const errors: string[] = [];
    for (const p of posts ?? []) {
      try {
        await embedPostInternal(p.id);
        embedded++;
      } catch (e) {
        failed++;
        errors.push(`${p.id}: ${(e as Error).message}`);
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    return { embedded, failed, total: posts?.length ?? 0, errors: errors.slice(0, 10) };
  });
