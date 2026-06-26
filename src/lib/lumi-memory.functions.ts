// Lumi Memory — semantic recall + record around every Lumi response.
// Tier-gated: writes/reads are no-ops below Practitioner. Onboarding seeds
// bypass the gate (cheap, valuable if the user upgrades later).

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DESIGNATION_RANK, type Designation, tierToDesignation } from "./entitlements";

const EMBED_MODEL = "openai/text-embedding-3-small"; // 1536 dims, HNSW-compatible
const EMBED_DIM = 1536;

const MemoryTypeEnum = z.enum(["situation", "preference", "account", "framework", "reading"]);
export type MemoryType = z.infer<typeof MemoryTypeEnum>;

export type LumiMemoryRow = {
  id: string;
  memory_type: MemoryType;
  content: string;
  source: string | null;
  source_ref: string | null;
  pinned: boolean;
  created_at: string;
  last_seen_at?: string;
};

// ---------- Designation resolution (server-only) ---------------------------

async function resolveDesignation(userId: string): Promise<Designation> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: roles }, { data: sub }] = await Promise.all([
    supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
    supabaseAdmin
      .from("subscriptions")
      .select("tier, status, designation")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
  ]);
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");
  if (isAdmin) return "strategic_partner";
  if (!sub) return "reader";
  const raw = ((sub as { designation?: string | null }).designation ?? null) as
    | Designation
    | null;
  return raw ?? tierToDesignation(sub.tier);
}

function hasMemoryAccess(d: Designation): boolean {
  return DESIGNATION_RANK[d] >= DESIGNATION_RANK.practitioner;
}

// ---------- Embedding helper -----------------------------------------------

async function embedText(text: string): Promise<number[] | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;
  const input = text.trim().slice(0, 2000);
  if (!input) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({ model: EMBED_MODEL, input, dimensions: EMBED_DIM }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
    const v = json.data?.[0]?.embedding;
    return Array.isArray(v) && v.length === EMBED_DIM ? v : null;
  } catch {
    return null;
  }
}

// ---------- Internal helpers callable from other server fns ----------------

/**
 * Recall up to `limit` semantically-relevant memories for a user. Server-only
 * helper used inside other .functions handlers. Returns [] for free tier.
 */
export async function recallMemoryFor(
  userId: string,
  query: string,
  limit = 6,
): Promise<LumiMemoryRow[]> {
  const d = await resolveDesignation(userId);
  if (!hasMemoryAccess(d)) return [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const vec = await embedText(query);
  if (!vec) {
    // Fallback: recency
    const { data } = await supabaseAdmin
      .from("lumi_memory")
      .select("id, memory_type, content, source, source_ref, pinned, created_at")
      .eq("user_id", userId)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as LumiMemoryRow[];
  }
  // Supabase RPC; cast to bypass generated types until refresh
  const { data, error } = await (supabaseAdmin.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: LumiMemoryRow[] | null; error: { message: string } | null }>)(
    "match_lumi_memory",
    { _user_id: userId, _query: vec as unknown as number[], _k: limit },
  );
  if (error || !data) {
    const { data: fallback } = await supabaseAdmin
      .from("lumi_memory")
      .select("id, memory_type, content, source, source_ref, pinned, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (fallback ?? []) as LumiMemoryRow[];
  }
  return data;
}

/**
 * Record one or more memories. No-op for users below Practitioner unless
 * `force=true` (used by onboarding seeding).
 */
export async function recordMemoryFor(
  userId: string,
  rows: Array<{
    memory_type: MemoryType;
    content: string;
    source?: string;
    source_ref?: string;
    pinned?: boolean;
  }>,
  opts: { force?: boolean; embed?: boolean } = {},
): Promise<void> {
  if (!rows.length) return;
  const d = await resolveDesignation(userId);
  if (!opts.force && !hasMemoryAccess(d)) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const shouldEmbed = opts.embed !== false;
  const prepared = await Promise.all(
    rows.map(async (r) => ({
      user_id: userId,
      memory_type: r.memory_type,
      content: r.content.trim().slice(0, 2000),
      source: r.source ?? null,
      source_ref: r.source_ref ?? null,
      pinned: r.pinned ?? false,
      embedding: shouldEmbed ? await embedText(r.content) : null,
    })),
  );
  await supabaseAdmin.from("lumi_memory").insert(prepared as never);
}

/** Render a MEMORY block for the Lumi system prompt. Empty string if none. */
export function renderMemoryBlock(rows: LumiMemoryRow[]): string {
  if (!rows.length) return "";
  const lines = rows.map((r) => {
    const date = r.created_at?.slice(0, 10) ?? "";
    const tag = r.pinned ? `${r.memory_type}*` : r.memory_type;
    return `- [${tag}${date ? `, ${date}` : ""}] ${r.content}`;
  });
  return [
    "PRIOR CONTEXT (things this operator has told you or you have observed):",
    ...lines,
    "Use this context to personalise your answer when relevant. Do not invent facts that contradict it. Do not surface unrelated context.",
    "",
  ].join("\n");
}

// ---------- Client-callable server functions -------------------------------

export const listMyLumiMemory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const d = await resolveDesignation(context.userId);
    const { data } = await context.supabase
      .from("lumi_memory" as never)
      .select("id, memory_type, content, source, source_ref, pinned, created_at, last_seen_at")
      .eq("user_id", context.userId)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    return {
      designation: d,
      hasAccess: hasMemoryAccess(d),
      items: (data ?? []) as LumiMemoryRow[],
    };
  });

export const updateLumiMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        content: z.string().trim().min(1).max(2000).optional(),
        pinned: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const patch: Record<string, unknown> = {};
    if (data.content != null) {
      patch.content = data.content;
      const vec = await embedText(data.content);
      if (vec) patch.embedding = vec;
    }
    if (data.pinned != null) patch.pinned = data.pinned;
    const { error } = await context.supabase
      .from("lumi_memory" as never)
      .update(patch as never)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLumiMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("lumi_memory" as never)
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAllLumiMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("lumi_memory" as never)
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Lumi periodically surfaces an older 'situation' memory. */
export const getLumiNudge = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    const { data } = await context.supabase
      .from("lumi_memory" as never)
      .select("id, memory_type, content, created_at, last_seen_at")
      .eq("user_id", context.userId)
      .eq("memory_type", "situation")
      .lt("last_seen_at", fourteenDaysAgo)
      .order("created_at", { ascending: true })
      .limit(1);
    const row = (data?.[0] ?? null) as LumiMemoryRow | null;
    return { nudge: row };
  });

export const resolveLumiNudge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), action: z.enum(["resolved", "still_open", "dismiss"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    if (data.action === "resolved") {
      await context.supabase
        .from("lumi_memory" as never)
        .delete()
        .eq("id", data.id)
        .eq("user_id", context.userId);
    } else {
      await context.supabase
        .from("lumi_memory" as never)
        .update({ last_seen_at: new Date().toISOString() } as never)
        .eq("id", data.id)
        .eq("user_id", context.userId);
    }
    return { ok: true };
  });
