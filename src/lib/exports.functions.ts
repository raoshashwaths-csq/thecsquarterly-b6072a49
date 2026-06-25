import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertQUnderCap, countMonthlyQRuns } from "./q-usage.functions";
import { Q_MONTHLY_CAP, tierToDesignation, type Designation } from "./entitlements";

const LUMI_MODEL = "google/gemini-2.5-flash";

/** List the signed-in user's recent Lumi runs + saved articles for export. */
export const listExportable = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [runsRes, workspaceRes] = await Promise.all([
      supabase
        .from("q_runs")
        .select("id, node_id, created_at, witty, zones, context")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("user_workspace_items")
        .select("id, item_type, item_id, title, snippet, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    if (runsRes.error) throw new Error(runsRes.error.message);
    if (workspaceRes.error) throw new Error(workspaceRes.error.message);
    return {
      runs: runsRes.data ?? [],
      workspace: workspaceRes.data ?? [],
    };
  });

/** Lumi-summarized workspace digest. Counts as 1 Lumi call against the monthly cap. */
export const summarizeWorkspaceForExport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI not configured");
    await assertQUnderCap(context.userId);

    const { supabase, userId } = context;
    const [{ data: runs }, { data: items }] = await Promise.all([
      supabase
        .from("q_runs")
        .select("node_id, zones, context, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(15),
      supabase
        .from("user_workspace_items")
        .select("title, snippet, item_type, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const corpus = JSON.stringify({ runs: runs ?? [], items: items ?? [] }).slice(0, 12000);

    const sys =
      "You are Lumi, the CS Quarterly operator agent. Produce a tight, McKinsey-register monthly workspace digest from the user's recent Lumi runs and saved articles. Output STRICT JSON only — no prose, no markdown — matching: " +
      '{"headline": string, "themes": string[], "key_runs": [{"title": string, "insight": string}], "action_items": string[], "watchlist": string[]}. ' +
      "Keep each string under 240 chars. 3-5 items per array. No emoji. No hedging.";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: LUMI_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `Workspace corpus:\n${corpus}` },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Lumi gateway error: ${res.status}`);
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: {
      headline?: string; themes?: string[];
      key_runs?: { title: string; insight: string }[];
      action_items?: string[]; watchlist?: string[];
    } = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    // Record usage by writing a placeholder q_run so the cap math stays consistent.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("q_runs").insert({
      user_id: userId,
      node_id: "WORKSPACE_SUMMARY",
      context: { kind: "workspace_summary" },
      zones: parsed as never,
      witty: false,
      shared: false,
      model: LUMI_MODEL,
    });

    return parsed;
  });

/** Current quota snapshot, for the dialog UI. */
export const getLumiQuotaSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: roles }, { data: sub }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId),
      supabaseAdmin
        .from("subscriptions")
        .select("tier, designation, status")
        .eq("user_id", context.userId)
        .eq("status", "active")
        .maybeSingle(),
    ]);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    let d: Designation = "reader";
    if (isAdmin) d = "strategic_partner";
    else if (sub) {
      d = ((sub as { designation?: Designation | null }).designation ?? null) ?? tierToDesignation(sub.tier);
    }
    const cap = Q_MONTHLY_CAP[d];
    const used = await countMonthlyQRuns(context.userId);
    return { used, cap: Number.isFinite(cap) ? cap : null, designation: d };
  });
