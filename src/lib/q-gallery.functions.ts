import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// NOTE: `view_count` column does not exist on `q_runs` in the current schema.
// We return 0 for it so callers keep their existing shape until a migration adds the column.

export const getSharedQRuns = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const o = input as { limit?: number };
    const limit = Math.min(o?.limit ?? 20, 100);
    return { limit };
  })
  .handler(async ({ data }) => {
    const { data: runs, error } = await supabaseAdmin
      .from("q_runs")
      .select("id, node_id, witty, created_at")
      .eq("shared", true)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (error) throw new Error(error.message);

    return {
      runs: (runs ?? []).map((r) => ({
        id: r.id,
        node_id: r.node_id,
        witty: r.witty,
        created_at: r.created_at,
        view_count: 0,
      })),
    };
  });

/** Get trending shared runs (most recent shared runs as a stand-in until view_count is added) */
export const getTrendingQRuns = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const o = input as { limit?: number };
    const limit = Math.min(o?.limit ?? 10, 50);
    return { limit };
  })
  .handler(async ({ data }) => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const { data: runs, error } = await supabaseAdmin
      .from("q_runs")
      .select("id, node_id, witty, created_at")
      .eq("shared", true)
      .gte("created_at", oneMonthAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (error) throw new Error(error.message);

    return {
      runs: (runs ?? []).map((r) => ({
        id: r.id,
        node_id: r.node_id,
        witty: r.witty,
        created_at: r.created_at,
        view_count: 0,
      })),
    };
  });

/** Increment view count for a shared run — currently a no-op until view_count column exists. */
export const trackQRunView = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const o = input as { runId?: string };
    if (!o.runId || typeof o.runId !== "string") throw new Error("runId required");
    return { runId: o.runId };
  })
  .handler(async ({ data }) => {
    const { data: run, error: fetchErr } = await supabaseAdmin
      .from("q_runs")
      .select("id, shared")
      .eq("id", data.runId)
      .maybeSingle();

    if (fetchErr || !run) throw new Error("Run not found");
    if (!run.shared) return { ok: true, count: 0 };
    return { ok: true, count: 0 };
  });
