import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getNode, breadcrumbFor, getTree } from "./q-trees";
import { assertQUnderCap } from "./q-usage.functions";
import { computeCostMicros } from "./q-pricing";

const Q_MODEL = "google/gemini-2.5-flash";


export const askQ = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const o = input as { question?: string; witty?: boolean };
    if (!o.question || typeof o.question !== "string") throw new Error("Question required");
    if (o.question.length > 1000) throw new Error("Question too long");
    return { question: o.question.trim(), witty: Boolean(o.witty) };
  })
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI not configured");

    // Monthly Q interaction cap (designation-tier scoped).
    await assertQUnderCap(context.userId);

    const system = data.witty
      ? "You are Q, the operator agent for The CS Quarterly — a Wodehouse-witted consigliere for Customer Success leaders. Reply in 2–4 short paragraphs with dry British wit, vivid metaphor, and the air of a slightly amused butler. Underneath the wit, deliver a real, sharp operator answer about CS, escalations, churn, QBRs, or expansion. Never use emoji. Never hedge."
      : "You are Q, the operator agent for The CS Quarterly. Audience: VPs and Directors of Customer Success at $20M–$1B ARR SaaS companies. Reply in 2–4 tight paragraphs, McKinsey register — structured, opinionated, specific. No fluff, no hype, no emoji. Lead with the operator answer, then the why.";

    const t0 = Date.now();
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: Q_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: data.question },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Q is at capacity — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted.");
    if (!res.ok) throw new Error(`Q failed (${res.status})`);

    const json = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const reply = json.choices?.[0]?.message?.content ?? "";
    const latencyMs = Date.now() - t0;
    const tokensIn = json.usage?.prompt_tokens ?? 0;
    const tokensOut = json.usage?.completion_tokens ?? 0;
    const costMicros = computeCostMicros(Q_MODEL, tokensIn, tokensOut);

    // Persist a telemetry row so chat counts toward usage + cost dashboards.
    // node_id = "chat:askq" sentinel; zones empty for chat runs.
    await context.supabase.from("q_runs").insert({
      user_id: context.userId,
      node_id: "chat:askq",
      context: { question: data.question.slice(0, 500) },
      witty: data.witty,
      zones: { diagnosis: "", playbook: "", executable: "" },
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      latency_ms: latencyMs,
      cost_micros: costMicros,
      model: Q_MODEL,
    });

    return { reply };
  });


export const getQEntitlement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "admin");
    let hasVanguard = false;
    if (!isAdmin) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status, tier")
        .eq("user_id", userId)
        .eq("status", "active")
        .eq("tier", "vanguard")
        .maybeSingle();
      hasVanguard = !!sub;
    }
    return { unlimited: isAdmin || hasVanguard, isAdmin };
  });

export type RunZones = { diagnosis: string; playbook: string; executable: string };

function buildSystem(witty: boolean, category?: import("@/lib/q-trees").TreeCategory) {
  const voice = witty
    ? "Voice: Wodehouse-witted consigliere — dry British wit, vivid metaphor, slight amusement. Wit is the wrapper, the operator answer is the substance. Never emoji."
    : "Voice: McKinsey register — structured, opinionated, specific. No hype, no hedging, no emoji.";
  const categoryRider =
    category === "ops"
      ? "CATEGORY CONTEXT: Focus on practical, immediate, tactically executable guidance. The user is a CSM dealing with a day-to-day account situation, not a leadership decision."
      : category === "leadership"
      ? "USER SENIORITY CONTEXT: This user is in a leadership role. Responses should be strategic and systemic, not tactical. Reference organisational dynamics, board-level implications, and team-level consequences. Tone: peer-level, direct, assumes CS leadership experience."
      : "";
  return [
    "You are Lumi, the operator agent for The CS Quarterly.",
    "Audience: VPs and Directors of Customer Success at $20M–$1B ARR SaaS companies.",
    voice,
    categoryRider,
    "You will produce a benchmark-grounded, immediately executable response in EXACTLY three zones, separated by the literal marker `---ZONE---` on its own line.",
    "Zone 1 — DIAGNOSIS: Exactly 3 sharp bullets. Start each with `• `. Diagnose what is ACTUALLY happening underneath the stated situation.",
    "Zone 2 — PLAYBOOK: A numbered list (1., 2., 3., …) of 4–7 steps. Each step is 1–2 sentences, names the owner, the deadline, and the concrete artifact. Reference industry benchmarks where they sharpen the call.",
    "Zone 3 — EXECUTABLE: Exactly ONE copy-pasteable artifact — either a short email draft, a 6-line internal Slack/Teams note, or a 5-bullet talk-track. Label it on the first line, then the artifact body. No commentary after.",
    "Never deviate from the 3-zone shape. Never add a 4th zone or pre-amble.",
  ].filter(Boolean).join("\n\n");
}

function buildUser(args: {
  nodeLabel: string;
  breadcrumb: string[];
  promptTemplate: string;
  context: Record<string, string>;
}) {
  const ctxLines = Object.entries(args.context)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");
  return [
    `DECISION PATH: ${args.breadcrumb.join(" › ")}`,
    `OPERATOR CONTEXT:\n${ctxLines || "- (none provided)"}`,
    `BRIEF:\n${args.promptTemplate}`,
    "Respond in the 3-zone format. Begin now.",
  ].join("\n\n");
}

function sanitize(s: string): string {
  return s
    // strip markdown bold/italic asterisks and underscores around words
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(?=\S)(.+?)(?<=\S)_/g, "$1")
    // strip leading markdown headings
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    // strip backticks
    .replace(/`+/g, "")
    // collapse runs of 3+ dashes/equals (markdown HR)
    .replace(/^[-=]{3,}\s*$/gm, "")
    // tidy excess blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseZones(raw: string): RunZones {
  const parts = raw.split(/^-{2,}\s*ZONE\s*-{2,}\s*$/im).map((s) => s.trim()).filter(Boolean);
  const strip = (s: string) => sanitize(s.replace(/^(zone\s*\d+\s*[—\-:·]?\s*)?(diagnosis|playbook|executable)\s*[:\-—]?\s*/i, "").trim());
  if (parts.length >= 3) {
    return { diagnosis: strip(parts[0]), playbook: strip(parts[1]), executable: strip(parts[2]) };
  }
  return {
    diagnosis: sanitize(raw),
    playbook: "(Q did not return a structured playbook. Use Run again.)",
    executable: "(No executable artifact returned.)",
  };
}

export const runQNode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const o = input as { nodeId?: string; context?: Record<string, string>; witty?: boolean };
    if (!o.nodeId || typeof o.nodeId !== "string") throw new Error("nodeId required");
    const ctx: Record<string, string> = {};
    if (o.context && typeof o.context === "object") {
      for (const [k, v] of Object.entries(o.context)) {
        if (typeof v === "string" && v.length <= 500) ctx[k.slice(0, 60)] = v;
      }
    }
    return { nodeId: o.nodeId, context: ctx, witty: Boolean(o.witty) };
  })
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI not configured");

    const node = getNode(data.nodeId);
    if (!node || !node.isTerminal || !node.promptTemplate) {
      throw new Error("Invalid decision node");
    }

    // Vanguard gate — active subscription with tier='vanguard', admins bypass.
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "admin");
    if (!isAdmin) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status, tier")
        .eq("user_id", userId)
        .eq("status", "active")
        .eq("tier", "vanguard")
        .maybeSingle();
      if (!sub) {
        throw new Error("VANGUARD_REQUIRED");
      }
    }

    const breadcrumb = breadcrumbFor(node.id);
    const category = getTree(node.treeId)?.category;
    const messages = [
      { role: "system", content: buildSystem(data.witty, category) },
      {
        role: "user",
        content: buildUser({
          nodeLabel: node.label,
          breadcrumb,
          promptTemplate: node.promptTemplate,
          context: data.context,
        }),
      },
    ];

    const t0 = Date.now();
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({ model: Q_MODEL, messages }),
    });

    if (res.status === 429) throw new Error("Q is at capacity — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted.");
    if (!res.ok) throw new Error(`Q failed (${res.status})`);

    const json = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const zones = parseZones(raw);
    const latencyMs = Date.now() - t0;
    const tokensIn = json.usage?.prompt_tokens ?? 0;
    const tokensOut = json.usage?.completion_tokens ?? 0;
    const costMicros = computeCostMicros(Q_MODEL, tokensIn, tokensOut);

    // Persist (RLS scopes to user_id automatically)
    const { data: row, error } = await supabase
      .from("q_runs")
      .insert({
        user_id: userId,
        node_id: node.id,
        context: data.context,
        witty: data.witty,
        zones,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        latency_ms: latencyMs,
        cost_micros: costMicros,
        model: Q_MODEL,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);


    return { runId: row.id as string, zones };
  });

export const getQRun = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const o = input as { runId?: string };
    if (!o.runId || typeof o.runId !== "string") throw new Error("runId required");
    return { runId: o.runId };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("q_runs")
      .select("id, node_id, context, witty, zones, shared, user_id, created_at, account_id, tagged_stakeholder, tagged_at")
      .eq("id", data.runId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Run not found");
    return {
      ...row,
      isOwner: row.user_id === userId,
    } as {
      id: string; node_id: string; context: Record<string, string>;
      witty: boolean; zones: RunZones; shared: boolean;
      user_id: string; isOwner: boolean; created_at: string;
      account_id: string | null; tagged_stakeholder: string | null; tagged_at: string | null;
    };
  });

export const listMyQRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("q_runs")
      .select("id, node_id, created_at, witty, shared")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return { runs: (data ?? []) as Array<{ id: string; node_id: string; created_at: string; witty: boolean; shared: boolean }> };
  });

export const setQRunShared = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const o = input as { runId?: string; shared?: boolean };
    if (!o.runId || typeof o.runId !== "string") throw new Error("runId required");
    return { runId: o.runId, shared: Boolean(o.shared) };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("q_runs")
      .update({ shared: data.shared })
      .eq("id", data.runId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true, shared: data.shared };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Account tagging — only the run's owner can tag a run to one of their accounts.
// ─────────────────────────────────────────────────────────────────────────────
export const listMyAccountsForTagging = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("cs_accounts")
      .select("id, name, health, arr_usd")
      .eq("user_id", userId)
      .order("name", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return {
      accounts: (data ?? []) as Array<{
        id: string; name: string; health: string | null; arr_usd: number | null;
      }>,
    };
  });

export const tagQRunToAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const o = input as { runId?: string; accountId?: string | null; stakeholder?: string | null };
    if (!o.runId || typeof o.runId !== "string") throw new Error("runId required");
    return {
      runId: o.runId,
      accountId: o.accountId ?? null,
      stakeholder: (o.stakeholder ?? null) as string | null,
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // If clearing the tag
    if (!data.accountId) {
      const { error } = await supabase
        .from("q_runs")
        .update({ account_id: null, tagged_stakeholder: null, tagged_at: null })
        .eq("id", data.runId)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return { ok: true, accountId: null as string | null };
    }

    // Confirm the account belongs to this user before tagging
    const { data: acct, error: acctErr } = await supabase
      .from("cs_accounts")
      .select("id, name")
      .eq("id", data.accountId)
      .eq("user_id", userId)
      .maybeSingle();
    if (acctErr) throw new Error(acctErr.message);
    if (!acct) throw new Error("Account not found or not yours");

    // Confirm the run is owned by this user, then update
    const { data: runRow, error: runErr } = await supabase
      .from("q_runs")
      .update({
        account_id: data.accountId,
        tagged_stakeholder: data.stakeholder,
        tagged_at: new Date().toISOString(),
      })
      .eq("id", data.runId)
      .eq("user_id", userId)
      .select("id, node_id")
      .maybeSingle();
    if (runErr) throw new Error(runErr.message);
    if (!runRow) throw new Error("Run not found or not yours");

    // Write a timeline event so the account card shows the tagged Lumi run.
    await supabase.from("account_events").insert({
      account_id: data.accountId,
      user_id: userId,
      kind: "lumi_run_tagged",
      payload: {
        run_id: data.runId,
        node_id: runRow.node_id,
        stakeholder: data.stakeholder,
      },
    });

    return { ok: true, accountId: data.accountId, accountName: acct.name };
  });
