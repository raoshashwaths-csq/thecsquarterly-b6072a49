import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Types ----------
export type RLAccount = {
  id: string;
  team_id: string;
  owner_id: string;
  name: string;
  contract_value: number;
  current_roi: number;
  created_at: string;
  updated_at: string;
};

export type RLSignal = {
  id: string;
  team_id: string;
  account_id: string;
  signal_type: string;
  description: string;
  severity: "High" | "Medium" | "Low";
  status: string;
  created_at: string;
};

export type RLStakeholder = {
  id: string;
  account_id: string;
  first_name: string;
  current_title: string | null;
  email: string | null;
};

export type RLMetric = {
  id: string;
  metric_name: string;
  hourly_multiplier: number;
};

export type LedgerSummary = {
  cumulativeValue: number;
  currentQuarterValue: number;
  previousQuarterValue: number;
  velocityPct: number; // QoQ %
  totalEntries: number;
};

// ---------- Helpers (run inside handlers; not exported) ----------
async function getOrCreatePrimaryTeam(supabase: any, userId: string): Promise<string> {
  const { data: owned } = await supabase
    .from("teams").select("id").eq("owner_id", userId)
    .order("created_at", { ascending: true }).limit(1);
  if (owned?.[0]?.id) return owned[0].id;
  const { data: member } = await supabase
    .from("team_members").select("team_id").eq("user_id", userId).limit(1);
  if (member?.[0]?.team_id) return member[0].team_id as string;
  const { data: created, error } = await supabase
    .from("teams").insert({ name: "My Team", owner_id: userId }).select("id").single();
  if (error) throw new Error(error.message);
  return created.id as string;
}

// ---------- Reads ----------
export const getPrimaryTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const teamId = await getOrCreatePrimaryTeam(supabase, userId);
    return { teamId };
  });

export const listLedgerSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LedgerSummary> => {
    const { supabase, userId } = context;
    const teamId = await getOrCreatePrimaryTeam(supabase, userId);

    const { data: metrics } = await supabase
      .from("rl_value_metrics").select("metric_name, hourly_multiplier").eq("team_id", teamId);
    const multiplierMap = new Map<string, number>(
      (metrics ?? []).map((m: any) => [m.metric_name, Number(m.hourly_multiplier) || 0])
    );

    const { data: entries } = await supabase
      .from("rl_value_ledger")
      .select("metric_type, quantity_logged, financial_value_override, logged_at")
      .eq("team_id", teamId);

    const now = new Date();
    const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const prevQStart = new Date(qStart);
    prevQStart.setMonth(qStart.getMonth() - 3);

    let total = 0, curQ = 0, prevQ = 0;
    for (const e of entries ?? []) {
      const override = e.financial_value_override == null ? null : Number(e.financial_value_override);
      const qty = Number(e.quantity_logged) || 0;
      const mult = multiplierMap.get(e.metric_type) ?? 0;
      const value = override ?? qty * mult;
      total += value;
      const at = new Date(e.logged_at);
      if (at >= qStart) curQ += value;
      else if (at >= prevQStart && at < qStart) prevQ += value;
    }

    const velocityPct = prevQ > 0
      ? Math.round(((curQ - prevQ) / prevQ) * 100)
      : (curQ > 0 ? 100 : 0);

    return {
      cumulativeValue: Math.round(total),
      currentQuarterValue: Math.round(curQ),
      previousQuarterValue: Math.round(prevQ),
      velocityPct,
      totalEntries: entries?.length ?? 0,
    };
  });

export const listRLAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const teamId = await getOrCreatePrimaryTeam(supabase, userId);
    const { data } = await supabase
      .from("rl_accounts").select("*").eq("team_id", teamId)
      .order("created_at", { ascending: false });
    return (data ?? []) as RLAccount[];
  });

export const listRLMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const teamId = await getOrCreatePrimaryTeam(supabase, userId);
    const { data } = await supabase
      .from("rl_value_metrics").select("*").eq("team_id", teamId);
    return (data ?? []) as RLMetric[];
  });

export const listSignals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const teamId = await getOrCreatePrimaryTeam(supabase, userId);
    const { data } = await supabase
      .from("rl_intelligence_signals").select("*").eq("team_id", teamId)
      .order("created_at", { ascending: false }).limit(50);
    return (data ?? []) as RLSignal[];
  });

export const listStakeholdersForAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { accountId: string }) =>
    z.object({ accountId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const teamId = await getOrCreatePrimaryTeam(supabase, userId);
    const { data: rows } = await supabase
      .from("rl_stakeholders").select("*")
      .eq("team_id", teamId).eq("account_id", data.accountId);
    return (rows ?? []) as RLStakeholder[];
  });

// ---------- Writes ----------
export const createRLAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string; contractValue?: number }) =>
    z.object({
      name: z.string().min(1).max(200),
      contractValue: z.number().min(0).max(1e12).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const teamId = await getOrCreatePrimaryTeam(supabase, userId);
    const { data: row, error } = await supabase
      .from("rl_accounts")
      .insert({ team_id: teamId, owner_id: userId, name: data.name, contract_value: data.contractValue ?? 0 })
      .select("*").single();
    if (error) throw new Error(error.message);
    return row as RLAccount;
  });

export const ensureValueMetric = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { metricName: string; hourlyMultiplier: number }) =>
    z.object({
      metricName: z.string().min(1).max(100),
      hourlyMultiplier: z.number().min(0).max(1e6),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const teamId = await getOrCreatePrimaryTeam(supabase, userId);
    const { data: existing } = await supabase
      .from("rl_value_metrics").select("*")
      .eq("team_id", teamId).eq("metric_name", data.metricName).maybeSingle();
    if (existing) return existing as RLMetric;
    const { data: row, error } = await supabase
      .from("rl_value_metrics")
      .insert({ team_id: teamId, owner_id: userId, metric_name: data.metricName, hourly_multiplier: data.hourlyMultiplier })
      .select("*").single();
    if (error) throw new Error(error.message);
    return row as RLMetric;
  });

export const logWin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    accountId: string;
    metricType: string;
    quantityLogged: number;
    financialValueOverride?: number | null;
  }) => z.object({
    accountId: z.string().uuid(),
    metricType: z.string().min(1).max(100),
    quantityLogged: z.number().min(0).max(1e9),
    financialValueOverride: z.number().min(0).max(1e12).nullish(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const teamId = await getOrCreatePrimaryTeam(supabase, userId);
    const { data: row, error } = await supabase
      .from("rl_value_ledger")
      .insert({
        team_id: teamId,
        owner_id: userId,
        account_id: data.accountId,
        metric_type: data.metricType,
        quantity_logged: data.quantityLogged,
        financial_value_override: data.financialValueOverride ?? null,
      })
      .select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createSignal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    accountId: string;
    signalType: string;
    description: string;
    severity?: "High" | "Medium" | "Low";
  }) => z.object({
    accountId: z.string().uuid(),
    signalType: z.string().min(1).max(80),
    description: z.string().min(1).max(2000),
    severity: z.enum(["High", "Medium", "Low"]).default("Medium"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const teamId = await getOrCreatePrimaryTeam(supabase, userId);
    const { data: row, error } = await supabase
      .from("rl_intelligence_signals")
      .insert({
        team_id: teamId, owner_id: userId, account_id: data.accountId,
        signal_type: data.signalType, description: data.description, severity: data.severity ?? "Medium",
      })
      .select("*").single();
    if (error) throw new Error(error.message);
    return row as RLSignal;
  });

// Mocked share link — returns a deterministic token, not actually signed.
export const createShareLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { accountId: string }) =>
    z.object({ accountId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const token = `mock_${data.accountId.slice(0, 8)}_${Date.now().toString(36)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    // Outbound share URLs always resolve to the canonical origin so links
    // never leak a preview / *.lovable.app host.
    const { CANONICAL_ORIGIN } = await import("@/lib/canonical-url");
    return {
      url: `${CANONICAL_ORIGIN}/api/public/exec-dashboard/${token}`,
      token,
      expiresAt,
      mock: true,
    };
  });
