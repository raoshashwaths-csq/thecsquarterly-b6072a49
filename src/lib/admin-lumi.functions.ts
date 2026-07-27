/**
 * Admin panels for Lumi knowledge, feedback, translation queue, and
 * scheduled-job health. All endpoints are admin-gated via has_role().
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EMBED_MODEL = "openai/text-embedding-3-small";
const EMBED_DIM = 1536;

const CONTENT_TYPES = [
  "principle", "data_point", "framework", "case_study", "heuristic",
  "article_insight", "benchmark_data", "external_intelligence", "interaction_pattern",
] as const;
const LANGUAGES = ["en", "ar", "id", "th", "tl", "vi"] as const;

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

async function embedText(apiKey: string, text: string): Promise<number[] | null> {
  const input = text.trim().slice(0, 4000);
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

// ─── 1a. Knowledge browser ────────────────────────────────────────────

const ListInput = z.object({
  contentType: z.string().optional(),
  tree: z.string().optional(),
  language: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(100),
  offset: z.number().int().min(0).default(0),
});

export const listLumiKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("lumi_knowledge")
      .select("id, source_slug, source_title, content, content_type, language, tree_relevance, topic_tags, is_active, confidence_level, created_at, source_type")
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (data.contentType) q = q.eq("content_type", data.contentType);
    if (data.language) q = q.eq("language", data.language);
    if (data.tree) q = q.contains("tree_relevance", [data.tree]);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getLumiKnowledgeCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count: total } = await supabaseAdmin
      .from("lumi_knowledge")
      .select("id", { count: "exact", head: true });
    const { data: byTypeRaw } = await supabaseAdmin
      .from("lumi_knowledge")
      .select("content_type, language, is_active");
    const byType: Record<string, number> = {};
    const byLang: Record<string, number> = {};
    let active = 0;
    for (const r of byTypeRaw ?? []) {
      byType[r.content_type] = (byType[r.content_type] ?? 0) + 1;
      byLang[r.language] = (byLang[r.language] ?? 0) + 1;
      if (r.is_active) active += 1;
    }
    return { total: total ?? 0, active, byType, byLang };
  });

const CreateInput = z.object({
  content: z.string().trim().min(10).max(4000),
  content_type: z.enum(CONTENT_TYPES),
  language: z.enum(LANGUAGES).default("en"),
  tree_relevance: z.array(z.string().min(1).max(40)).max(10).default([]),
  topic_tags: z.array(z.string().min(1).max(40)).max(12).default([]),
  confidence_level: z.enum(["high", "medium", "low"]).optional(),
  source_title: z.string().max(200).optional(),
});

export const createLumiKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const apiKey = process.env.LOVABLE_API_KEY;
    const embedding = apiKey ? await embedText(apiKey, data.content) : null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("lumi_knowledge")
      .insert({
        content: data.content,
        content_type: data.content_type,
        language: data.language,
        tree_relevance: data.tree_relevance,
        topic_tags: data.topic_tags,
        confidence_level: data.confidence_level ?? null,
        source_title: data.source_title ?? null,
        source_type: "manual",
        embedding,
        is_active: true,
      } as never)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { id: row?.id, embedded: !!embedding };
  });

const UpdateInput = z.object({
  id: z.string().uuid(),
  patch: CreateInput.partial().extend({ is_active: z.boolean().optional() }),
});

export const updateLumiKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: Record<string, unknown> = { ...data.patch };
    if (typeof patch.content === "string" && patch.content.trim()) {
      const apiKey = process.env.LOVABLE_API_KEY;
      if (apiKey) patch.embedding = await embedText(apiKey, patch.content as string);
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("lumi_knowledge")
      .update(patch as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLumiKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("lumi_knowledge").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── 1b. Feedback rollup ─────────────────────────────────────────────

export const getLumiFeedbackRollup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("lumi_feedback")
      .select("rating, run_id, created_at");
    let up = 0, down = 0;
    for (const r of rows ?? []) {
      if (r.rating === "up") up += 1;
      else if (r.rating === "down") down += 1;
    }
    const total = up + down;

    // Join with q_runs to fetch tree per feedback row (best-effort).
    const { data: rowsWithRun } = await supabaseAdmin
      .from("lumi_feedback")
      .select("rating, run_id");
    const runIds = Array.from(new Set((rowsWithRun ?? []).map((r) => r.run_id).filter(Boolean))) as string[];
    const treeByRun: Record<string, string | null> = {};
    if (runIds.length) {
      const { data: runs } = await supabaseAdmin
        .from("q_runs")
        .select("id, tree_id")
        .in("id", runIds);
      for (const r of runs ?? []) treeByRun[r.id] = (r as { tree_id: string | null }).tree_id;
    }
    const byTree: Record<string, { up: number; down: number }> = {};
    for (const r of rowsWithRun ?? []) {
      const tree = (r.run_id && treeByRun[r.run_id]) || "unknown";
      byTree[tree] ||= { up: 0, down: 0 };
      if (r.rating === "up") byTree[tree].up += 1;
      else if (r.rating === "down") byTree[tree].down += 1;
    }

    return {
      total,
      up,
      down,
      pctPositive: total ? Math.round((up / total) * 100) : 0,
      byTree,
    };
  });

export const listLumiFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      negativeOnly: z.boolean().default(false),
      limit: z.number().int().min(1).max(200).default(50),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("lumi_feedback")
      .select("id, rating, note, run_id, knowledge_record_id, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.negativeOnly) q = q.eq("rating", "down");
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const runIds = Array.from(new Set((rows ?? []).map((r) => r.run_id).filter(Boolean))) as string[];
    const runMap: Record<string, { tree_id: string | null; prompt: string | null }> = {};
    if (runIds.length) {
      const { data: runs } = await supabaseAdmin
        .from("q_runs")
        .select("id, tree_id, prompt")
        .in("id", runIds);
      for (const r of runs ?? []) {
        runMap[r.id] = { tree_id: (r as any).tree_id ?? null, prompt: (r as any).prompt ?? null };
      }
    }
    return (rows ?? []).map((r) => ({
      ...r,
      tree_id: r.run_id ? runMap[r.run_id]?.tree_id ?? null : null,
      prompt_snippet: r.run_id ? (runMap[r.run_id]?.prompt ?? "").slice(0, 240) : "",
    }));
  });

// ─── 1c. Translation queue status ────────────────────────────────────

export const getTranslationQueueStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("knowledge_translation_queue")
      .select("status, target_language");
    const matrix: Record<string, Record<string, number>> = {};
    for (const r of rows ?? []) {
      matrix[r.target_language] ||= {};
      matrix[r.target_language][r.status] = (matrix[r.target_language][r.status] ?? 0) + 1;
    }
    return { matrix, total: rows?.length ?? 0 };
  });

// ─── 1d. Scheduled job health ────────────────────────────────────────

export const getScheduledJobHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.rpc("admin_scheduled_job_health");
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      jobname: string;
      schedule: string;
      active: boolean;
      last_start: string | null;
      last_end: string | null;
      last_status: string | null;
      last_message: string | null;
    }>;
  });
