import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getSharedQRuns = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const o = input as { limit?: number };
    const limit = Math.min(o?.limit ?? 20, 100);
    return { limit };
  })
  .handler(async ({ data }) => {
    const { data: runs, error } = await supabaseAdmin
      .from("q_runs")
      .select("id, node_id, witty, created_at, view_count")
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
        view_count: r.view_count ?? 0,
      })),
    };
  });

/** Get trending shared runs (most viewed this month) */
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
      .select("id, node_id, witty, created_at, view_count")
      .eq("shared", true)
      .gte("created_at", oneMonthAgo.toISOString())
      .order("view_count", { ascending: false })
      .limit(data.limit);

    if (error) throw new Error(error.message);

    return {
      runs: (runs ?? []).map((r) => ({
        id: r.id,
        node_id: r.node_id,
        witty: r.witty,
        created_at: r.created_at,
        view_count: r.view_count ?? 0,
      })),
    };
  });

/** Increment view count for a shared run */
export const trackQRunView = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const o = input as { runId?: string };
    if (!o.runId || typeof o.runId !== "string") throw new Error("runId required");
    return { runId: o.runId };
  })
  .handler(async ({ data }) => {
    const { data: run, error: fetchErr } = await supabaseAdmin
      .from("q_runs")
      .select("id, view_count, shared")
      .eq("id", data.runId)
      .maybeSingle();

    if (fetchErr || !run) throw new Error("Run not found");
    if (!run.shared) return { ok: true }; // Don't track private runs

    const newCount = (run.view_count ?? 0) + 1;
    const { error: updateErr } = await supabaseAdmin
      .from("q_runs")
      .update({ view_count: newCount })
      .eq("id", data.runId);

    if (updateErr) throw new Error(updateErr.message);
    return { ok: true, count: newCount };
  });
