import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type QBRStatus = "Completed" | "Scheduled" | "Overdue";
export type Tier = "Enterprise" | "Mid-Market" | "SMB";

export type CSAccount = {
  id: string;
  user_id: string;
  name: string;
  tier: Tier;
  arr: number;
  health: number;
  qbr_status: QBRStatus;
  renewal_quarter: string;
  champion: string | null;
  economic_buyer: string | null;
  blocker: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export type CSAccountEvent = {
  id: string;
  account_id: string;
  user_id: string;
  kind: string;
  payload: Json;
  occurred_at: string;
};

const SELECT = "id, user_id, name, tier, arr, health, qbr_status, renewal_quarter, champion, economic_buyer, blocker, notes, created_at, updated_at";

const AccountInput = z.object({
  name: z.string().trim().min(1).max(200),
  tier: z.enum(["Enterprise", "Mid-Market", "SMB"]).default("Mid-Market"),
  arr: z.number().min(0).max(1_000_000_000),
  health: z.number().int().min(0).max(100),
  qbr_status: z.enum(["Completed", "Scheduled", "Overdue"]).default("Scheduled"),
  renewal_quarter: z.string().trim().min(1).max(20),
  champion: z.string().trim().max(200).nullable().optional(),
  economic_buyer: z.string().trim().max(200).nullable().optional(),
  blocker: z.string().trim().max(500).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
});

export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("cs_accounts" as never)
      .select(SELECT)
      .order("arr", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as CSAccount[];
  });

export const getAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("cs_accounts" as never)
      .select(SELECT)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const { data: events, error: evErr } = await supabase
      .from("cs_account_events" as never)
      .select("*")
      .eq("account_id", data.id)
      .order("occurred_at", { ascending: false })
      .limit(100);
    if (evErr) throw new Error(evErr.message);
    return {
      account: row as unknown as CSAccount,
      events: (events ?? []) as unknown as CSAccountEvent[],
    };
  });

export const createAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AccountInput.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("cs_accounts" as never)
      .insert({ ...data, user_id: userId } as never)
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as CSAccount;
  });

export const updateAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), patch: AccountInput.partial() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("cs_accounts" as never)
      .update(data.patch as never)
      .eq("id", data.id)
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as CSAccount;
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("cs_accounts" as never).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkImportAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ rows: z.array(AccountInput).min(1).max(500) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const payload = data.rows.map((r) => ({ ...r, user_id: userId }));
    const { data: rows, error } = await supabase
      .from("cs_accounts" as never)
      .insert(payload as never)
      .select(SELECT);
    if (error) throw new Error(error.message);
    return { inserted: rows?.length ?? 0 };
  });

export const logAccountEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        account_id: z.string().uuid(),
        kind: z.string().min(1).max(60),
        payload: z.any().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("cs_account_events" as never)
      .insert({
        account_id: data.account_id,
        user_id: userId,
        kind: data.kind,
        payload: data.payload,
      } as never)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as CSAccountEvent;
  });

// Heuristic Burning Three: largest at-risk ARR, overdue QBRs, nearest renewals.
export type BurningInsight = {
  id: string;
  headline: string;
  detail: string;
  accent: "danger" | "warn" | "info";
  accountId?: string;
};

export function deriveBurningThree(accounts: CSAccount[]): BurningInsight[] {
  if (!accounts.length) return [];
  const insights: BurningInsight[] = [];

  const atRisk = [...accounts]
    .filter((a) => a.health < 50)
    .sort((a, b) => b.arr - a.arr)[0];
  if (atRisk) {
    insights.push({
      id: `risk-${atRisk.id}`,
      headline: `${atRisk.name} is bleeding`,
      detail: `Health ${atRisk.health}/100 with $${atRisk.arr.toLocaleString()} ARR exposed. Schedule a recovery call this week.`,
      accent: "danger",
      accountId: atRisk.id,
    });
  }

  const overdue = accounts.filter((a) => a.qbr_status === "Overdue");
  if (overdue.length) {
    const sum = overdue.reduce((s, a) => s + a.arr, 0);
    insights.push({
      id: "qbr-overdue",
      headline: `${overdue.length} QBR${overdue.length === 1 ? "" : "s"} overdue`,
      detail: `Total ARR uncovered: $${sum.toLocaleString()}. Book ${overdue[0].name}${overdue.length > 1 ? " first" : ""}.`,
      accent: "warn",
      accountId: overdue[0].id,
    });
  }

  const upcoming = [...accounts]
    .filter((a) => /Q[1-4]-\d{4}/.test(a.renewal_quarter))
    .sort((a, b) => a.renewal_quarter.localeCompare(b.renewal_quarter))[0];
  if (upcoming) {
    insights.push({
      id: `renewal-${upcoming.id}`,
      headline: `${upcoming.name} renews ${upcoming.renewal_quarter}`,
      detail: `Confirm the champion and economic buyer are aligned. Renewal value: $${upcoming.arr.toLocaleString()}.`,
      accent: "info",
      accountId: upcoming.id,
    });
  }

  return insights.slice(0, 3);
}

export const rewriteBurningThree = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        insights: z
          .array(
            z.object({
              id: z.string(),
              headline: z.string(),
              detail: z.string(),
              accent: z.enum(["danger", "warn", "info"]),
              accountId: z.string().optional(),
            }),
          )
          .max(3),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { insights: data.insights };
    }
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": apiKey,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You rewrite three urgent customer-success insights in the voice of a calm, senior CS leader. Keep the same accent and accountId. Tighten each headline to <=8 words and each detail to <=22 words. Reply ONLY with JSON: {\"insights\":[{id,headline,detail,accent,accountId}]}.",
            },
            { role: "user", content: JSON.stringify(data.insights) },
          ],
        }),
      });
      if (!res.ok) return { insights: data.insights };
      const json = await res.json();
      const text: string = json?.choices?.[0]?.message?.content ?? "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return { insights: data.insights };
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed?.insights)) {
        return { insights: parsed.insights.slice(0, 3) };
      }
      return { insights: data.insights };
    } catch {
      return { insights: data.insights };
    }
  });
