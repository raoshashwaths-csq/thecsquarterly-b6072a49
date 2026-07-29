import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
}

export const listSurveySubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number; offset?: number } = {}) =>
    z.object({ limit: z.number().int().min(1).max(500).default(100), offset: z.number().int().min(0).default(0) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: rows, error, count } = await supabaseAdmin
      .from("survey_responses")
      .select(
        "id, name, email, company, title, role, segment, hcm_status, score, tier, foundational_score, agent_score, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

function median(nums: number[]) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export const getSurveyAggregates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: rows, error } = await supabaseAdmin
      .from("survey_responses")
      .select("score, tier, foundational_score, agent_score, dimension_scores");
    if (error) throw new Error(error.message);

    const total = rows?.length ?? 0;
    const scores = (rows ?? []).map((r) => Number(r.score) || 0);
    const foundational = (rows ?? []).map((r) => Number(r.foundational_score) || 0).filter((n) => n > 0);
    const agent = (rows ?? []).map((r) => Number(r.agent_score) || 0).filter((n) => n > 0);

    const tierCounts: Record<string, number> = {};
    (rows ?? []).forEach((r) => {
      const t = r.tier || "unknown";
      tierCounts[t] = (tierCounts[t] ?? 0) + 1;
    });

    // Dimension aggregation: dimension_scores is { [dimensionId]: number }
    const dimBuckets: Record<string, number[]> = {};
    (rows ?? []).forEach((r) => {
      const ds = (r.dimension_scores ?? {}) as Record<string, unknown>;
      Object.entries(ds).forEach(([k, v]) => {
        const n = Number(v);
        if (Number.isFinite(n)) {
          (dimBuckets[k] ||= []).push(n);
        }
      });
    });
    const dimensions = Object.entries(dimBuckets).map(([id, arr]) => ({
      id,
      count: arr.length,
      mean: arr.reduce((a, b) => a + b, 0) / arr.length,
      median: median(arr),
    })).sort((a, b) => a.id.localeCompare(b.id));

    const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

    return {
      total,
      scoreMean: mean(scores),
      scoreMedian: median(scores),
      foundationalMean: mean(foundational),
      agentMean: mean(agent),
      tierCounts,
      dimensions,
    };
  });
