import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getNode, breadcrumbFor } from "./q-trees";

export const askQ = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const o = input as { question?: string; witty?: boolean };
    if (!o.question || typeof o.question !== "string") throw new Error("Question required");
    if (o.question.length > 1000) throw new Error("Question too long");
    return { question: o.question.trim(), witty: Boolean(o.witty) };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI not configured");

    const system = data.witty
      ? "You are Q, the operator agent for The CS Quarterly — a Wodehouse-witted consigliere for Customer Success leaders. Reply in 2–4 short paragraphs with dry British wit, vivid metaphor, and the air of a slightly amused butler. Underneath the wit, deliver a real, sharp operator answer about CS, escalations, churn, QBRs, or expansion. Never use emoji. Never hedge."
      : "You are Q, the operator agent for The CS Quarterly. Audience: VPs and Directors of Customer Success at $20M–$1B ARR SaaS companies. Reply in 2–4 tight paragraphs, McKinsey register — structured, opinionated, specific. No fluff, no hype, no emoji. Lead with the operator answer, then the why.";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: data.question },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Q is at capacity — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted.");
    if (!res.ok) throw new Error(`Q failed (${res.status})`);

    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return { reply: json.choices?.[0]?.message?.content ?? "" };
  });

export type RunZones = { diagnosis: string; playbook: string; executable: string };

function buildSystem(witty: boolean) {
  const voice = witty
    ? "Voice: Wodehouse-witted consigliere — dry British wit, vivid metaphor, slight amusement. Wit is the wrapper, the operator answer is the substance. Never emoji."
    : "Voice: McKinsey register — structured, opinionated, specific. No hype, no hedging, no emoji.";
  return [
    "You are Q, the operator agent for The CS Quarterly.",
    "Audience: VPs and Directors of Customer Success at $20M–$1B ARR SaaS companies.",
    voice,
    "You will produce a benchmark-grounded, immediately executable response in EXACTLY three zones, separated by the literal marker `---ZONE---` on its own line.",
    "Zone 1 — DIAGNOSIS: Exactly 3 sharp bullets. Start each with `• `. Diagnose what is ACTUALLY happening underneath the stated situation.",
    "Zone 2 — PLAYBOOK: A numbered list (1., 2., 3., …) of 4–7 steps. Each step is 1–2 sentences, names the owner, the deadline, and the concrete artifact. Reference industry benchmarks where they sharpen the call.",
    "Zone 3 — EXECUTABLE: Exactly ONE copy-pasteable artifact — either a short email draft, a 6-line internal Slack/Teams note, or a 5-bullet talk-track. Label it on the first line, then the artifact body. No commentary after.",
    "Never deviate from the 3-zone shape. Never add a 4th zone or pre-amble.",
  ].join("\n\n");
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
    const messages = [
      { role: "system", content: buildSystem(data.witty) },
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

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages }),
    });

    if (res.status === 429) throw new Error("Q is at capacity — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted.");
    if (!res.ok) throw new Error(`Q failed (${res.status})`);

    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const zones = parseZones(raw);

    // Persist (RLS scopes to user_id automatically)
    const { data: row, error } = await supabase
      .from("q_runs")
      .insert({
        user_id: userId,
        node_id: node.id,
        context: data.context,
        witty: data.witty,
        zones,
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
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("q_runs")
      .select("id, node_id, context, witty, zones, created_at")
      .eq("id", data.runId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Run not found");
    return row as {
      id: string; node_id: string; context: Record<string, string>;
      witty: boolean; zones: RunZones; created_at: string;
    };
  });
