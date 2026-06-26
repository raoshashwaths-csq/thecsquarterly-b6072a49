import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertQUnderCap } from "./q-usage.functions";
import { recallMemoryFor, recordMemoryFor, renderMemoryBlock } from "./lumi-memory.functions";





const Input = z.object({
  question: z.string().trim().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(8000),
      }),
    )
    .max(20)
    .optional()
    .default([]),
});

function fmtDate(s: string | null | undefined) {
  if (!s) return null;
  try {
    return new Date(s).toISOString().slice(0, 10);
  } catch {
    return s;
  }
}

function daysUntil(s: string | null | undefined): number | null {
  if (!s) return null;
  const d = new Date(s).getTime();
  if (Number.isNaN(d)) return null;
  return Math.round((d - Date.now()) / 86400000);
}

export const askCSFactorsQ = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ context, data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured.");

    // Monthly Q interaction cap (designation-tier scoped).
    await assertQUnderCap(context.userId);

    const { supabase } = context;



    // Pull the operator's full portfolio context.
    const [
      { data: accountsRaw },
      { data: stakeholdersRaw },
      { data: eventsRaw },
      { data: ctasRaw },
      { data: contractsRaw },
    ] = await Promise.all([
      supabase.from("cs_accounts" as never).select("*").order("arr", { ascending: false }),
      supabase.from("cs_stakeholders" as never).select("*"),
      supabase
        .from("cs_account_events" as never)
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(400),
      supabase
        .from("ctas" as never)
        .select("id,title,status,priority,cta_type,account_id,account_name,due_date,completed_at,outcome,source,created_at")
        .order("created_at", { ascending: false })
        .limit(400),
      supabase
        .from("cs_contracts" as never)
        .select("id,account_id,title,starts_on,renews_on,arr,currency,status"),
    ]);

    type A = Record<string, unknown> & { id: string; name: string };
    const accounts = (accountsRaw ?? []) as unknown as A[];
    const stakeholders = (stakeholdersRaw ?? []) as unknown as Array<
      Record<string, unknown> & { account_id: string }
    >;
    const events = (eventsRaw ?? []) as unknown as Array<
      Record<string, unknown> & {
        account_id: string;
        kind: string;
        occurred_at: string;
        payload: Record<string, unknown> | null;
      }
    >;
    type CtaRow = {
      id: string;
      title: string;
      status: string;
      priority: string;
      cta_type: string;
      account_id: string | null;
      account_name: string | null;
      due_date: string | null;
      completed_at: string | null;
      outcome: string | null;
      source: string;
      created_at: string;
    };
    const ctas = (ctasRaw ?? []) as unknown as CtaRow[];
    type ContractRow = {
      id: string;
      account_id: string;
      title: string | null;
      starts_on: string | null;
      renews_on: string | null;
      arr: number | null;
      currency: string | null;
      status: string | null;
    };
    const contracts = (contractsRaw ?? []) as unknown as ContractRow[];

    const stakesByAccount = new Map<string, typeof stakeholders>();
    for (const s of stakeholders) {
      const arr = stakesByAccount.get(s.account_id) ?? [];
      arr.push(s);
      stakesByAccount.set(s.account_id, arr);
    }

    const eventsByAccount = new Map<string, typeof events>();
    for (const e of events) {
      const arr = eventsByAccount.get(e.account_id) ?? [];
      arr.push(e);
      eventsByAccount.set(e.account_id, arr);
    }

    const ctasByAccount = new Map<string, CtaRow[]>();
    for (const c of ctas) {
      if (!c.account_id) continue;
      const arr = ctasByAccount.get(c.account_id) ?? [];
      arr.push(c);
      ctasByAccount.set(c.account_id, arr);
    }

    const contractsByAccount = new Map<string, ContractRow[]>();
    for (const c of contracts) {
      const arr = contractsByAccount.get(c.account_id) ?? [];
      arr.push(c);
      contractsByAccount.set(c.account_id, arr);
    }

    const nowMs = Date.now();
    const isOpen = (s: string) => s === "open" || s === "in_progress";
    const isOverdue = (c: CtaRow) =>
      isOpen(c.status) && c.due_date != null && new Date(c.due_date).getTime() < nowMs;

    // Compact, model-friendly shape. Trim and rename fields.
    const compact = accounts.map((a) => {
      const evs = eventsByAccount.get(a.id) ?? [];
      const accCtas = ctasByAccount.get(a.id) ?? [];
      const accContracts = contractsByAccount.get(a.id) ?? [];
      const leadership = evs.find((e) =>
        /leadership|exec|executive/i.test(String(e.kind ?? "")),
      );
      const lastQbr = evs.find((e) => /qbr/i.test(String(e.kind ?? "")));
      const lastUpdate = evs[0];
      const renewal = fmtDate(a.contract_renewal_date as string | null);
      const daysToRenewal = daysUntil(a.contract_renewal_date as string | null);
      return {
        name: a.name,
        tier: a.tier,
        arr: a.arr,
        health: a.health,
        qbr_status: a.qbr_status,
        renewal_quarter: a.renewal_quarter,
        contract_renewal_date: renewal,
        days_to_renewal: daysToRenewal,
        csm_sentiment: a.csm_sentiment,
        csm: a.csm_name,
        account_manager: a.account_manager,
        associate_director: a.associate_director,
        champion: a.champion,
        economic_buyer: a.economic_buyer,
        blocker: a.blocker,
        country: a.country,
        industry: a.industry,
        final_cs_nps: a.final_cs_nps,
        implementation_progress: a.implementation_progress,
        journey_stage: a.journey_stage,
        marquee_client: a.marquee_client,
        stakeholders: (stakesByAccount.get(a.id) ?? []).map((s) => ({
          name: s.contact_name,
          title: s.title,
          buying_role: s.buying_role,
          influence: s.influence,
          sentiment: s.sentiment,
        })),
        last_leadership_connect: leadership
          ? { at: fmtDate(leadership.occurred_at), kind: leadership.kind }
          : null,
        last_qbr_event: lastQbr ? { at: fmtDate(lastQbr.occurred_at), kind: lastQbr.kind } : null,
        last_update: lastUpdate
          ? {
              at: fmtDate(lastUpdate.occurred_at),
              kind: lastUpdate.kind,
              title:
                (lastUpdate.payload as { title?: string } | null)?.title ?? null,
            }
          : null,
        recent_events: evs.slice(0, 10).map((e) => ({
          at: fmtDate(e.occurred_at),
          kind: e.kind,
          title: (e.payload as { title?: string } | null)?.title ?? null,
        })),
        ctas: {
          open: accCtas.filter((c) => isOpen(c.status)).length,
          overdue: accCtas.filter(isOverdue).length,
          completed_30d: accCtas.filter(
            (c) =>
              c.status === "completed" &&
              c.completed_at != null &&
              nowMs - new Date(c.completed_at).getTime() < 30 * 86400000,
          ).length,
          top_open: accCtas
            .filter((c) => isOpen(c.status))
            .slice(0, 5)
            .map((c) => ({
              title: c.title,
              priority: c.priority,
              type: c.cta_type,
              due: fmtDate(c.due_date),
              days_to_due: daysUntil(c.due_date),
              source: c.source,
            })),
        },
        contracts: accContracts.map((c) => ({
          title: c.title,
          status: c.status,
          starts_on: fmtDate(c.starts_on),
          renews_on: fmtDate(c.renews_on),
          days_to_renewal: daysUntil(c.renews_on),
          arr: c.arr,
          currency: c.currency,
        })),
      };
    });

    let portfolioJson = JSON.stringify(compact);
    // Hard cap to keep token budget sane.
    if (portfolioJson.length > 60_000) {
      portfolioJson = JSON.stringify(compact.slice(0, 50));
    }

    const totalArr = compact.reduce((s, a) => s + Number(a.arr ?? 0), 0);
    const atRiskArr = compact
      .filter((a) => Number(a.health ?? 0) < 50)
      .reduce((s, a) => s + Number(a.arr ?? 0), 0);
    const renewals90d = compact.filter(
      (a) => a.days_to_renewal != null && a.days_to_renewal >= 0 && a.days_to_renewal <= 90,
    );
    const renewalsArr90d = renewals90d.reduce((s, a) => s + Number(a.arr ?? 0), 0);
    const totalOpenCtas = compact.reduce((s, a) => s + a.ctas.open, 0);
    const totalOverdueCtas = compact.reduce((s, a) => s + a.ctas.overdue, 0);
    const accountsWithoutQbr = compact.filter((a) => a.qbr_status === "Overdue").length;
    const marqueeAtRisk = compact.filter(
      (a) => a.marquee_client && Number(a.health ?? 0) < 60,
    ).length;
    const updatedRecently = compact.filter((a) => {
      const at = a.last_update?.at;
      if (!at) return false;
      return nowMs - new Date(at).getTime() < 14 * 86400000;
    }).length;

    const metricsBlock = [
      `Portfolio totals: ${compact.length} accounts, total ARR $${totalArr.toLocaleString()}, ARR at risk (health < 50) $${atRiskArr.toLocaleString()}.`,
      `Renewals in next 90d: ${renewals90d.length} accounts ($${renewalsArr90d.toLocaleString()} ARR).`,
      `CTAs: ${totalOpenCtas} open, ${totalOverdueCtas} overdue across the portfolio.`,
      `QBR status: ${accountsWithoutQbr} accounts overdue.`,
      `Marquee accounts at risk (health < 60): ${marqueeAtRisk}.`,
      `Accounts updated in last 14 days: ${updatedRecently}.`,
    ].join("\n");

    // Semantic memory — empty for free tier.
    const memories = await recallMemoryFor(context.userId, data.question, 6);
    const memoryBlock = renderMemoryBlock(memories);

    const system = [
      "You are Lumi, the analyst inside The CS Quarterly's CSFactors command center.",
      "Audience: a VP/Director of Customer Success looking at their own book of business.",
      "Answer ONLY from the PORTFOLIO JSON below. If the data does not contain the answer, say so plainly — do not invent accounts, contacts, dates, or numbers.",
      "Cite account names verbatim. Use $ and commas for ARR. Use ISO dates (YYYY-MM-DD) when present.",
      "Be tight: 2–6 short paragraphs or a compact table/bullet list. McKinsey register. No emoji, no hype, no hedging.",
      "Each account record includes: identity & ownership, ARR, health, renewal timing, stakeholders, recent timeline events (including cta.raised / cta.completed and field edits), open/overdue/recently-completed CTAs with their top open items, and contracts with renewal dates.",
      memoryBlock,
      "PORTFOLIO METRICS:",
      metricsBlock,
      `Today: ${new Date().toISOString().slice(0, 10)}.`,
      "",
      "PORTFOLIO JSON:",
      portfolioJson,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          ...data.history,
          { role: "user", content: data.question },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Q is at capacity — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
    if (!res.ok) throw new Error(`Q failed (${res.status})`);

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const reply = json.choices?.[0]?.message?.content ?? "";

    // Log this interaction for cap accounting.
    await supabaseAdmin.from("q_runs").insert({
      user_id: context.userId,
      node_id: "csfactors-ask",
      context: { question: data.question.slice(0, 2000) },
      witty: false,
      zones: { diagnosis: "", playbook: "", executable: reply.slice(0, 8000) },
    });


    // Extract 0-2 durable memories from this CSFactors exchange.
    if (reply) {
      try {
        const extractRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "Extract 0-2 durable facts about the operator's portfolio situation, specific accounts they're navigating, or operating preferences worth remembering. Return JSON: {\"memories\":[{\"memory_type\":\"situation|account|preference\",\"content\":\"...\"}]}. Empty array if nothing notable.",
              },
              { role: "user", content: `Operator asked: ${data.question}\n\nLumi answered: ${reply.slice(0, 2000)}` },
            ],
          }),
        });
        if (extractRes.ok) {
          const ejson = (await extractRes.json()) as { choices?: Array<{ message?: { content?: string } }> };
          const parsed = JSON.parse(ejson.choices?.[0]?.message?.content ?? "{}") as {
            memories?: Array<{ memory_type?: string; content?: string }>;
          };
          const rows = (parsed.memories ?? [])
            .filter(
              (m): m is { memory_type: "situation" | "account" | "preference"; content: string } =>
                typeof m.content === "string" &&
                m.content.length > 0 &&
                (m.memory_type === "situation" || m.memory_type === "account" || m.memory_type === "preference"),
            )
            .slice(0, 2)
            .map((m) => ({ ...m, source: "csfactors_lumi" as const }));
          if (rows.length) await recordMemoryFor(context.userId, rows);
        }
      } catch {
        // best-effort; never fail the user-facing reply
      }
    }

    return {
      reply,
      stats: { accounts: compact.length, totalArr, atRiskArr },
    };
  });
