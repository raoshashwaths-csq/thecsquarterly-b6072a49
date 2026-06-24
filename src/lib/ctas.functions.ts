// CTA Engine — server functions.
// Backing table: public.ctas (see migration 20260624 / CTA Engine).
// All mutating fns require an authenticated session. Reads are RLS-scoped.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CtaType =
  | "call"
  | "email"
  | "meeting"
  | "task"
  | "escalation"
  | "renewal"
  | "expansion"
  | "other";

export type CtaPriority = "critical" | "high" | "medium" | "low";

export type CtaStatus = "open" | "in_progress" | "completed" | "dismissed";

export type CtaSource =
  | "manual"
  | "lumi"
  | "renewal_war_room"
  | "expansion_engine"
  | "health_alert";

export type CtaOutcome =
  | "resolved"
  | "escalated"
  | "deferred"
  | "no_action_needed";

export type Cta = {
  id: string;
  title: string;
  description: string | null;
  cta_type: CtaType;
  priority: CtaPriority;
  status: CtaStatus;
  account_id: string | null;
  account_name: string | null;
  created_by: string;
  created_by_name: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  team_id: string | null;
  team_wide: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  source: CtaSource;
  source_ref: string | null;
  completion_note: string | null;
  outcome: CtaOutcome | null;
};

type CtaScope = "all" | "mine" | "assigned" | "team";

const CTA_TABLE = "ctas" as const;

function nowIso(): string {
  return new Date().toISOString();
}

// LIST -----------------------------------------------------------------------
export const listCtas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      scope?: CtaScope;
      status?: CtaStatus | CtaStatus[];
      accountId?: string;
      assigneeId?: string;
      limit?: number;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (supabase as any).from(CTA_TABLE).select("*");

    if (data.accountId) q = q.eq("account_id", data.accountId);
    if (data.assigneeId) q = q.eq("assigned_to", data.assigneeId);
    if (data.status) {
      q = Array.isArray(data.status)
        ? q.in("status", data.status)
        : q.eq("status", data.status);
    }
    switch (data.scope) {
      case "mine":
        q = q.eq("created_by", userId);
        break;
      case "assigned":
        q = q.eq("assigned_to", userId);
        break;
      case "team":
        q = q.eq("team_wide", true);
        break;
      default:
        break;
    }

    q = q
      .order("status", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(data.limit ?? 200);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { ctas: (rows ?? []) as Cta[] };
  });

// GET ------------------------------------------------------------------------
export const getCta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (context.supabase as any)
      .from(CTA_TABLE)
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { cta: (row ?? null) as Cta | null };
  });

// CREATE ---------------------------------------------------------------------
export type CreateCtaInput = {
  title: string;
  description?: string | null;
  cta_type: CtaType;
  priority?: CtaPriority;
  account_id?: string | null;
  account_name?: string | null;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  team_id?: string | null;
  team_wide?: boolean;
  due_date?: string | null;
  source?: CtaSource;
  source_ref?: string | null;
};

export const createCta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CreateCtaInput) => {
    if (!data.title?.trim()) throw new Error("Title is required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = {
      title: data.title.trim(),
      description: data.description ?? null,
      cta_type: data.cta_type,
      priority: data.priority ?? "medium",
      status: "open" as CtaStatus,
      account_id: data.account_id ?? null,
      account_name: data.account_name ?? null,
      created_by: userId,
      assigned_to: data.assigned_to ?? null,
      assigned_to_name: data.assigned_to_name ?? null,
      team_id: data.team_id ?? null,
      team_wide: data.team_wide ?? false,
      due_date: data.due_date ?? null,
      source: data.source ?? "manual",
      source_ref: data.source_ref ?? null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (supabase as any)
      .from(CTA_TABLE)
      .insert(payload)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    // Mirror onto the account timeline so the client card shows it.
    if (row?.account_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("cs_account_events").insert({
        account_id: row.account_id,
        user_id: userId,
        kind: "cta.raised",
        payload: {
          label: "CTA raised",
          title: row.title,
          cta_id: row.id,
          cta_type: row.cta_type,
          priority: row.priority,
          due_date: row.due_date,
        },
      });
    }
    return { cta: row as Cta };
  });

// UPDATE (status / priority / assignee / due_date / description) -------------
export type UpdateCtaPatch = {
  title?: string;
  description?: string | null;
  cta_type?: CtaType;
  priority?: CtaPriority;
  status?: CtaStatus;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  due_date?: string | null;
};

export const updateCta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; patch: UpdateCtaPatch }) => data)
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = { ...data.patch };
    if (patch.status === "completed" && !patch["completed_at"]) {
      patch["completed_at"] = nowIso();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (context.supabase as any)
      .from(CTA_TABLE)
      .update(patch)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { cta: row as Cta };
  });

// COMPLETE -------------------------------------------------------------------
export const completeCta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { id: string; outcome: CtaOutcome; note?: string | null }) => data,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (supabase as any)
      .from(CTA_TABLE)
      .update({
        status: "completed",
        outcome: data.outcome,
        completion_note: data.note ?? null,
        completed_at: nowIso(),
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    if (row?.account_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("cs_account_events").insert({
        account_id: row.account_id,
        user_id: userId,
        kind: "cta.completed",
        payload: {
          label: "CTA completed",
          title: row.title,
          cta_id: row.id,
          outcome: row.outcome,
          note: row.completion_note,
        },
      });
    }
    return { cta: row as Cta };
  });

// BULK UPDATE (list view bulk actions) --------------------------------------
export const bulkUpdateCtas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { ids: string[]; patch: UpdateCtaPatch }) => data)
  .handler(async ({ data, context }) => {
    if (!data.ids.length) return { updated: 0 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error, count } = await (context.supabase as any)
      .from(CTA_TABLE)
      .update(data.patch, { count: "exact" })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { updated: count ?? data.ids.length };
  });

// DISMISS --------------------------------------------------------------------
export const dismissCta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (context.supabase as any)
      .from(CTA_TABLE)
      .update({ status: "dismissed" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// LUMI PUSH — create 3 follow-up CTAs from a Lumi resolution -----------------
export type LumiActionStep = {
  title: string;
  description?: string | null;
  due_hours?: number; // hours from now; defaults 2 / 8 / 24
};

export const pushLumiActions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      steps: LumiActionStep[];
      accountId?: string | null;
      accountName?: string | null;
      runId?: string;
    }) => {
      if (!Array.isArray(data.steps) || data.steps.length === 0) {
        throw new Error("steps[] required");
      }
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const defaults = [2, 8, 24];
    const now = Date.now();
    const rows = data.steps.slice(0, 3).map((s, i) => ({
      title: s.title.trim(),
      description: s.description ?? null,
      cta_type: "task" as CtaType,
      priority: "high" as CtaPriority,
      status: "open" as CtaStatus,
      account_id: data.accountId ?? null,
      account_name: data.accountName ?? null,
      created_by: userId,
      assigned_to: userId,
      team_wide: false,
      due_date: new Date(now + (s.due_hours ?? defaults[i] ?? 24) * 3600_000).toISOString(),
      source: "lumi" as CtaSource,
      source_ref: data.runId ?? null,
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error } = await (supabase as any)
      .from(CTA_TABLE)
      .insert(rows)
      .select("*");
    if (error) throw new Error(error.message);
    return { ctas: (inserted ?? []) as Cta[] };
  });

// METRICS for /csfactors/ctas metric strip ----------------------------------
export const ctaMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = context.supabase as any;
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7;
    startOfWeek.setDate(startOfWeek.getDate() - day + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const [openR, overdueR, todayR, doneR] = await Promise.all([
      sb.from(CTA_TABLE).select("id", { count: "exact", head: true }).eq("status", "open"),
      sb
        .from(CTA_TABLE)
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"])
        .lt("due_date", now.toISOString()),
      sb
        .from(CTA_TABLE)
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"])
        .gte("due_date", new Date(now.toDateString()).toISOString())
        .lt("due_date", new Date(now.getTime() + 86_400_000).toISOString()),
      sb
        .from(CTA_TABLE)
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("completed_at", startOfWeek.toISOString()),
    ]);

    return {
      open: openR.count ?? 0,
      overdue: overdueR.count ?? 0,
      dueToday: todayR.count ?? 0,
      completedThisWeek: doneR.count ?? 0,
    };
  });
