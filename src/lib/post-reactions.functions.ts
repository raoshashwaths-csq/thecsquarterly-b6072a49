import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const REACTIONS = ["applied", "language", "confirmed", "disagree"] as const;
type Reaction = (typeof REACTIONS)[number];

type StatsPayload = {
  total: number;
  counts: Record<Reaction, number>;
};

function emptyStats(): StatsPayload {
  return { total: 0, counts: { applied: 0, language: 0, confirmed: 0, disagree: 0 } };
}

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const StatsInput = z.object({ postId: z.string().uuid() });

export const getPostReactionStats = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => StatsInput.parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row, error } = await sb.rpc("get_post_reaction_stats" as never, { _post_id: data.postId } as never);
    if (error) return emptyStats();
    const r = (row ?? {}) as Partial<StatsPayload>;
    return {
      total: r.total ?? 0,
      counts: {
        applied: r.counts?.applied ?? 0,
        language: r.counts?.language ?? 0,
        confirmed: r.counts?.confirmed ?? 0,
        disagree: r.counts?.disagree ?? 0,
      },
    } satisfies StatsPayload;
  });

export const getMyPostReaction = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StatsInput.parse(d))
  .handler(async ({ context, data }) => {
    const { data: row } = await (context.supabase as unknown as { from: (t: string) => any })
      .from("post_reactions")
      .select("reaction, disagree_session_id")
      .eq("post_id", data.postId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!row) return { reaction: null as Reaction | null, disagreeSessionId: null as string | null };
    return {
      reaction: (row.reaction ?? null) as Reaction | null,
      disagreeSessionId: (row.disagree_session_id ?? null) as string | null,
    };
  });

const SubmitInput = z.object({
  postId: z.string().uuid(),
  reaction: z.enum(REACTIONS),
});

const DISAGREE_OPENER = (title: string, excerpt: string) =>
  `You just pushed back on "${title}". Tell Lumi where the thesis breaks for you — your pushback may shape the next dispatch. What's the specific claim you disagree with, and what does your experience say instead?`;

export const submitPostReaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SubmitInput.parse(d))
  .handler(async ({ context, data }) => {
    const supabase = context.supabase as unknown as { from: (t: string) => any };

    // Look up existing reaction (RLS-safe — own row).
    const { data: existing } = await supabase
      .from("post_reactions")
      .select("id, reaction, disagree_session_id")
      .eq("post_id", data.postId)
      .eq("user_id", context.userId)
      .maybeSingle();

    let disagreeSessionId: string | null = existing?.disagree_session_id ?? null;

    if (data.reaction === "disagree" && !disagreeSessionId) {
      // Pull dispatch metadata for the opener + tag.
      const { data: post } = await supabase
        .from("posts")
        .select("id, slug, title, subtitle, excerpt, section")
        .eq("id", data.postId)
        .maybeSingle();
      const p = (post ?? {}) as {
        id?: string; slug?: string; title?: string; subtitle?: string | null; excerpt?: string; section?: string;
      };
      const title = p.title ?? "this dispatch";
      const excerpt = p.excerpt ?? "";
      const opener = DISAGREE_OPENER(title, excerpt);

      const dispatchTag = [{
        source: "dispatch-disagree",
        post_id: p.id ?? data.postId,
        slug: p.slug ?? "",
        title,
        section: p.section ?? "",
        framework: "Reader pushback",
        why: excerpt,
        excerpt,
        subtitle: p.subtitle ?? null,
        similarity: 1,
        id: p.id ?? data.postId,
      }];

      const { data: inserted, error: insErr } = await supabase
        .from("situation_sessions")
        .insert({
          user_id: context.userId,
          situation: `Reader disagreed with "${title}". Capturing pushback for editorial calibration.`,
          dispatches: dispatchTag,
          messages: [{ role: "assistant", content: opener }],
          title: `Pushback: ${title}`,
        })
        .select("id")
        .single();
      if (insErr || !inserted) throw new Error(insErr?.message ?? "Could not open pushback thread.");
      disagreeSessionId = (inserted as { id: string }).id;
    }

    // Upsert the reaction row.
    const { error: upsertErr } = await supabase
      .from("post_reactions")
      .upsert(
        {
          post_id: data.postId,
          user_id: context.userId,
          reaction: data.reaction,
          disagree_session_id: data.reaction === "disagree" ? disagreeSessionId : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "post_id,user_id" },
      );
    if (upsertErr) throw new Error(upsertErr.message);

    // Fetch fresh aggregate via the public RPC (publishable client — no auth needed).
    const sbPub = publicClient();
    const { data: statsRow } = await sbPub.rpc("get_post_reaction_stats" as never, { _post_id: data.postId } as never);
    const r = (statsRow ?? {}) as Partial<StatsPayload>;
    const stats: StatsPayload = {
      total: r.total ?? 0,
      counts: {
        applied: r.counts?.applied ?? 0,
        language: r.counts?.language ?? 0,
        confirmed: r.counts?.confirmed ?? 0,
        disagree: r.counts?.disagree ?? 0,
      },
    };

    return {
      reaction: data.reaction,
      disagreeSessionId,
      stats,
    };
  });

// ============ Admin ============

const AggInput = z.object({
  sinceDays: z.number().int().min(1).max(365).optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export const listReactionAggregates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AggInput.parse(d ?? {}))
  .handler(async ({ context, data }) => {
    const since = new Date(Date.now() - (data.sinceDays ?? 30) * 24 * 3600 * 1000).toISOString();
    const { data: rows, error } = await (context.supabase as unknown as { rpc: (n: string, a: unknown) => any })
      .rpc("admin_post_reaction_aggregates", { _since: since, _limit: data.limit ?? 50 });
    if (error) throw new Error(error.message);

    // Disagree threads list (admin reads via RLS on situation_sessions — admins have a SELECT-all policy).
    const { data: threads } = await (context.supabase as unknown as { from: (t: string) => any })
      .from("situation_sessions")
      .select("id, title, situation, created_at, dispatches")
      .order("created_at", { ascending: false })
      .limit(50);
    const disagreeThreads = ((threads ?? []) as Array<{
      id: string; title: string | null; situation: string; created_at: string; dispatches: unknown;
    }>)
      .filter((t) => Array.isArray(t.dispatches) && (t.dispatches as Array<{ source?: string }>)[0]?.source === "dispatch-disagree")
      .map((t) => ({
        id: t.id,
        title: t.title ?? t.situation.slice(0, 80),
        createdAt: t.created_at,
        postSlug: (t.dispatches as Array<{ slug?: string }>)[0]?.slug ?? "",
        postTitle: (t.dispatches as Array<{ title?: string }>)[0]?.title ?? "",
      }));

    return {
      rows: (rows ?? []) as Array<{
        post_id: string; slug: string; title: string; section: string;
        total: number; applied: number; language: number; confirmed: number; disagree: number;
        latest_at: string;
      }>,
      disagreeThreads,
    };
  });
