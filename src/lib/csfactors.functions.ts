import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type QBRStatus = "Completed" | "Scheduled" | "Overdue";
export type Tier = "Enterprise" | "Mid-Market" | "SMB";
export type BuyingRole = "economic_buyer" | "champion" | "end_user" | "decision_maker" | "blocker";
export type Influence = "high" | "medium" | "low";
export type Sentiment = "positive" | "neutral" | "negative";
export type CSMSentiment = "Positive" | "Neutral" | "Critical";

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
  // Extended fields
  ucc: string | null;
  account_manager: string | null;
  csm_name: string | null;
  associate_director: string | null;
  backup_owner: string | null;
  customer_success: string | null;
  key_account_manager: string | null;
  contract_renewal_date: string | null;
  carr: number | null;
  invoiced_arr: number | null;
  journey_stage: string | null;
  cs_transition_start: string | null;
  customer_city: string | null;
  csm_sentiment: CSMSentiment | null;
  active_headcount: number | null;
  country: string | null;
  sub_region: string | null;
  actual_go_live: string | null;
  planned_go_live: string | null;
  implementation_progress: number | null;
  da_project_manager: string | null;
  project_manager_ii: string | null;
  server_location: string | null;
  server_name: string | null;
  marquee_client: boolean | null;
  existing_erp: string | null;
  existing_crm: string | null;
  region: string | null;
  payroll_service_type: string | null;
  final_cs_nps: number | null;
  industry: string | null;
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

export type CSStakeholder = {
  id: string;
  account_id: string;
  user_id: string;
  contact_name: string;
  title: string | null;
  buying_role: BuyingRole;
  influence: Influence;
  sentiment: Sentiment;
};

export type CSContract = {
  id: string;
  account_id: string;
  user_id: string;
  doc_type: string;
  file_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  signed_value_cents: number | null;
  executed_on: string | null;
  auto_renewal: boolean;
  notice_days: number;
};

const SELECT = "*";

const nstr = z.string().trim().max(500).nullable().optional();
const nint = z.number().int().nullable().optional();
const nnum = z.number().nullable().optional();
const ndate = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")])
  .nullable()
  .optional()
  .transform((v) => (v === "" ? null : v));

const AccountInput = z.object({
  name: z.string().trim().min(1).max(200),
  tier: z.enum(["Enterprise", "Mid-Market", "SMB"]).default("Mid-Market"),
  arr: z.number().min(0).max(1_000_000_000),
  health: z.number().int().min(0).max(100),
  qbr_status: z.enum(["Completed", "Scheduled", "Overdue"]).default("Scheduled"),
  renewal_quarter: z.string().trim().min(1).max(20),
  champion: nstr,
  economic_buyer: nstr,
  blocker: nstr,
  notes: z.string().trim().max(5000).nullable().optional(),
  // Extended
  ucc: nstr,
  account_manager: nstr,
  csm_name: nstr,
  associate_director: nstr,
  backup_owner: nstr,
  customer_success: nstr,
  key_account_manager: nstr,
  contract_renewal_date: ndate,
  carr: nnum,
  invoiced_arr: nnum,
  journey_stage: nstr,
  cs_transition_start: ndate,
  customer_city: nstr,
  csm_sentiment: z.enum(["Positive", "Neutral", "Critical"]).nullable().optional(),
  active_headcount: nint,
  country: nstr,
  sub_region: nstr,
  actual_go_live: ndate,
  planned_go_live: ndate,
  implementation_progress: z.number().int().min(0).max(100).nullable().optional(),
  da_project_manager: nstr,
  project_manager_ii: nstr,
  server_location: nstr,
  server_name: nstr,
  marquee_client: z.boolean().nullable().optional(),
  existing_erp: nstr,
  existing_crm: nstr,
  region: nstr,
  payroll_service_type: nstr,
  final_cs_nps: z.number().int().min(0).max(10).nullable().optional(),
  industry: nstr,
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

// =================== Portfolio trend (360 dashboard) ===================

export type TrendPoint = {
  label: string;
  nrr: number;
  health: number;
  adoption: number;
  risk: number;
};
export type TrendRange = "30D" | "90D" | "180D";

const RANGE_CONFIG: Record<TrendRange, { days: number; buckets: number; fmt: (d: Date) => string }> = {
  "30D": { days: 30, buckets: 8, fmt: (d) => d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }) },
  "90D": { days: 90, buckets: 8, fmt: (d) => `${d.toLocaleDateString("en-US", { month: "short" })} W${Math.ceil(d.getDate() / 7)}` },
  "180D": { days: 180, buckets: 6, fmt: (d) => d.toLocaleDateString("en-US", { month: "short" }) },
};

function deriveSnapshot(accounts: Array<{ health: number; implementation_progress: number | null }>) {
  if (!accounts.length) return { nrr: 100, health: 0, adoption: 0, risk: 0 };
  const avgHealth = Math.round(accounts.reduce((s, a) => s + (a.health ?? 0), 0) / accounts.length);
  const adoption = Math.round(
    accounts.reduce((s, a) => s + (a.implementation_progress ?? a.health ?? 0), 0) / accounts.length,
  );
  return {
    nrr: Math.round(80 + avgHealth * 0.4),
    health: avgHealth,
    adoption,
    risk: accounts.filter((a) => (a.health ?? 0) < 50).length,
  };
}

export const getPortfolioTrend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ range: z.enum(["30D", "90D", "180D"]).default("90D") }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const cfg = RANGE_CONFIG[data.range];
    const now = new Date();
    const start = new Date(now.getTime() - cfg.days * 24 * 60 * 60 * 1000);

    const { data: accountRows, error: accErr } = await supabase
      .from("cs_accounts" as never)
      .select("id, health, implementation_progress");
    if (accErr) throw new Error(accErr.message);
    const accounts = (accountRows ?? []) as Array<{ id: string; health: number; implementation_progress: number | null }>;

    const { data: eventRows } = await supabase
      .from("cs_account_events" as never)
      .select("kind, payload, occurred_at, account_id")
      .gte("occurred_at", start.toISOString())
      .order("occurred_at", { ascending: true });
    const events = (eventRows ?? []) as Array<{ kind: string; payload: Record<string, unknown> | null; occurred_at: string; account_id: string }>;

    const current = deriveSnapshot(accounts);
    const bucketMs = (cfg.days * 24 * 60 * 60 * 1000) / cfg.buckets;
    const points: TrendPoint[] = [];

    const healthById = new Map(accounts.map((a) => [a.id, a.health ?? 0]));
    const adoptById = new Map(accounts.map((a) => [a.id, a.implementation_progress ?? a.health ?? 0]));

    // Reverse-chronological so we can roll the snapshot backward.
    const changes = events
      .filter((e) => e.kind === "health_change" || e.kind === "snapshot")
      .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));

    function snapshotAt(boundary: Date) {
      const h = new Map(healthById);
      const a = new Map(adoptById);
      for (const ev of changes) {
        if (new Date(ev.occurred_at) <= boundary) break;
        const p = (ev.payload ?? {}) as { account_id?: string; previous_health?: number; previous_adoption?: number };
        const id = p.account_id ?? ev.account_id;
        if (p.previous_health != null) h.set(id, Number(p.previous_health));
        if (p.previous_adoption != null) a.set(id, Number(p.previous_adoption));
      }
      const reconstructed = accounts.map((acc) => ({
        health: h.get(acc.id) ?? acc.health,
        implementation_progress: a.get(acc.id) ?? acc.implementation_progress,
      }));
      return deriveSnapshot(reconstructed);
    }

    for (let i = 0; i < cfg.buckets; i++) {
      const boundary = new Date(start.getTime() + (i + 1) * bucketMs);
      const snap = i === cfg.buckets - 1 ? current : snapshotAt(boundary);
      points.push({ label: cfg.fmt(boundary), ...snap });
    }

    return { range: data.range, points, accountCount: accounts.length };
  });

// =================== Stakeholders ===================

const StakeholderInput = z.object({
  account_id: z.string().uuid(),
  contact_name: z.string().trim().min(1).max(200),
  title: z.string().trim().max(200).nullable().optional(),
  buying_role: z.enum(["economic_buyer", "champion", "end_user", "decision_maker", "blocker"]),
  influence: z.enum(["high", "medium", "low"]),
  sentiment: z.enum(["positive", "neutral", "negative"]),
});

export const listStakeholders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ account_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("cs_stakeholders" as never)
      .select("*")
      .eq("account_id", data.account_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as CSStakeholder[];
  });

export const upsertStakeholder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid().optional(), patch: StakeholderInput }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    if (data.id) {
      const { data: row, error } = await supabase
        .from("cs_stakeholders" as never)
        .update(data.patch as never)
        .eq("id", data.id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return row as unknown as CSStakeholder;
    }
    const { data: row, error } = await supabase
      .from("cs_stakeholders" as never)
      .insert({ ...data.patch, user_id: userId } as never)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as CSStakeholder;
  });

export const deleteStakeholder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("cs_stakeholders" as never).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =================== Contracts ===================

const ContractInput = z.object({
  account_id: z.string().uuid(),
  doc_type: z.enum(["MSA", "SOW", "Amendment", "Other"]).default("MSA"),
  file_path: z.string().max(500).nullable().optional(),
  file_name: z.string().max(255).nullable().optional(),
  mime_type: z.string().max(120).nullable().optional(),
  size_bytes: z.number().int().nullable().optional(),
  signed_value_cents: z.number().int().nullable().optional(),
  executed_on: ndate,
  auto_renewal: z.boolean().default(false),
  notice_days: z.number().int().min(0).max(365).default(90),
});

export const listContracts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ account_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("cs_contracts" as never)
      .select("*")
      .eq("account_id", data.account_id)
      .order("executed_on", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as CSContract[];
  });

export const upsertContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid().optional(), patch: ContractInput }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    if (data.id) {
      const { data: row, error } = await supabase
        .from("cs_contracts" as never)
        .update(data.patch as never)
        .eq("id", data.id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return row as unknown as CSContract;
    }
    const { data: row, error } = await supabase
      .from("cs_contracts" as never)
      .insert({ ...data.patch, user_id: userId } as never)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as CSContract;
  });

export const deleteContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: existing } = await supabase
      .from("cs_contracts" as never)
      .select("file_path")
      .eq("id", data.id)
      .maybeSingle();
    const path = (existing as unknown as { file_path: string | null } | null)?.file_path;
    if (path) {
      await supabase.storage.from("cs-contracts").remove([path]);
    }
    const { error } = await supabase.from("cs_contracts" as never).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createContractUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        account_id: z.string().uuid(),
        filename: z.string().min(1).max(255),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${data.account_id}/${crypto.randomUUID()}-${safe}`;
    const { data: signed, error } = await supabase.storage
      .from("cs-contracts")
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });

export const createContractDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: signed, error } = await supabase.storage
      .from("cs-contracts")
      .createSignedUrl(data.path, 60);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

// =================== Heuristics ===================

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

  const atRisk = [...accounts].filter((a) => a.health < 50).sort((a, b) => b.arr - a.arr)[0];
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

// NPS scale: 0-10 per account. Promoters 9-10, Passives 7-8, Detractors 0-6.
export function computeNPS(accounts: CSAccount[]) {
  const scored = accounts.filter((a) => a.final_cs_nps !== null && a.final_cs_nps !== undefined);
  const n = scored.length;
  if (!n) return { score: 0, promoters: 0, passives: 0, detractors: 0, n: 0 };
  let p = 0,
    pa = 0,
    d = 0;
  for (const a of scored) {
    const s = a.final_cs_nps!;
    if (s >= 9) p++;
    else if (s >= 7) pa++;
    else d++;
  }
  const score = Math.round(((p - d) / n) * 100);
  return { score, promoters: p, passives: pa, detractors: d, n };
}

export function computeSentimentIndex(accounts: CSAccount[]) {
  const scored = accounts.filter((a) => a.csm_sentiment);
  const n = scored.length;
  if (!n) return { positive: 0, neutral: 0, critical: 0, healthPct: 0, n: 0 };
  let pos = 0,
    neu = 0,
    crit = 0;
  for (const a of scored) {
    if (a.csm_sentiment === "Positive") pos++;
    else if (a.csm_sentiment === "Neutral") neu++;
    else if (a.csm_sentiment === "Critical") crit++;
  }
  const healthPct = Math.round((pos / n) * 100);
  return { positive: pos, neutral: neu, critical: crit, healthPct, n };
}

export function noticeWindow(renewalDate: string | null, noticeDays = 90) {
  if (!renewalDate) return { daysOut: null as number | null, band: null as 90 | 60 | 30 | null };
  const r = new Date(renewalDate);
  if (Number.isNaN(r.getTime())) return { daysOut: null, band: null };
  const now = new Date();
  const ms = r.getTime() - now.getTime();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  const daysOut = days - noticeDays;
  let band: 90 | 60 | 30 | null = null;
  if (days <= 30 && days >= 0) band = 30;
  else if (days <= 60 && days > 30) band = 60;
  else if (days <= 90 && days > 60) band = 90;
  return { daysOut, band, days };
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
