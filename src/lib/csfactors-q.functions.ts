import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";



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

    const { supabase } = context;

    // Pull the operator's full portfolio context.
    const [{ data: accountsRaw }, { data: stakeholdersRaw }, { data: eventsRaw }] =
      await Promise.all([
        supabase.from("cs_accounts" as never).select("*").order("arr", { ascending: false }),
        supabase.from("cs_stakeholders" as never).select("*"),
        supabase
          .from("cs_account_events" as never)
          .select("*")
          .order("occurred_at", { ascending: false })
          .limit(400),
      ]);

    type A = Record<string, unknown> & { id: string; name: string };
    const accounts = (accountsRaw ?? []) as unknown as A[];
    const stakeholders = (stakeholdersRaw ?? []) as unknown as Array<
      Record<string, unknown> & { account_id: string }
    >;
    const events = (eventsRaw ?? []) as unknown as Array<
      Record<string, unknown> & { account_id: string; kind: string; occurred_at: string }
    >;

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

    // Compact, model-friendly shape. Trim and rename fields.
    const compact = accounts.map((a) => {
      const evs = eventsByAccount.get(a.id) ?? [];
      const leadership = evs.find((e) =>
        /leadership|exec|executive/i.test(String(e.kind ?? "")),
      );
      const lastQbr = evs.find((e) => /qbr/i.test(String(e.kind ?? "")));
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
        recent_events: evs.slice(0, 5).map((e) => ({
          at: fmtDate(e.occurred_at),
          kind: e.kind,
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

    const system = [
      "You are Q, the analyst inside The CS Quarterly's CSFactors command center.",
      "Audience: a VP/Director of Customer Success looking at their own book of business.",
      "Answer ONLY from the PORTFOLIO JSON below. If the data does not contain the answer, say so plainly — do not invent accounts, contacts, dates, or numbers.",
      "Cite account names verbatim. Use $ and commas for ARR. Use ISO dates (YYYY-MM-DD) when present.",
      "Be tight: 2–6 short paragraphs or a compact table/bullet list. McKinsey register. No emoji, no hype, no hedging.",
      `Portfolio totals: ${compact.length} accounts, total ARR $${totalArr.toLocaleString()}, ARR at risk (health < 50) $${atRiskArr.toLocaleString()}.`,
      `Today: ${new Date().toISOString().slice(0, 10)}.`,
      "",
      "PORTFOLIO JSON:",
      portfolioJson,
    ].join("\n");




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
    return {
      reply: json.choices?.[0]?.message?.content ?? "",
      stats: { accounts: compact.length, totalArr, atRiskArr },
    };
  });
