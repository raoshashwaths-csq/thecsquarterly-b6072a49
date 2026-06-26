// Server functions for the editable subscription_plans + plan_features +
// plan_feature_assignments tables. See supabase/migrations for schema.
// Public reads use a publishable-key server client (RLS gates active rows).
// Admin writes use requireSupabaseAuth + has_role('admin') check.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function getPublicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export type PublicPlan = {
  id: string;
  designation: string;
  label: string;
  tagline: string;
  band: "individual" | "team" | "partner";
  price_monthly_cents: number;
  price_annual_cents: number | null;
  price_monthly_display: string;
  price_annual_display: string | null;
  seat_cap: number;
  seat_cap_display: string;
  q_cap_display: string;
  cta_label: string;
  cta_kind: "free" | "checkout" | "contact";
  highlight: boolean;
  highlight_label: string | null;
  contact_only: boolean;
  display_order: number;
  is_active: boolean;
  paddle_price_id_monthly: string | null;
  paddle_price_id_annual: string | null;
};

export type PublicFeature = {
  id: string;
  code: string;
  label: string;
  category: string;
  kind: "boolean" | "numeric";
  description: string;
  display_order: number;
  is_active: boolean;
};

export type PublicAssignment = {
  plan_id: string;
  feature_id: string;
  enabled: boolean;
  numeric_value: number | null;
  marketing_label_override: string | null;
};

export type PlansBundle = {
  plans: PublicPlan[];
  features: PublicFeature[];
  assignments: PublicAssignment[];
};

/** Public: read all active plans + their feature assignments. No auth. */
export const listPublishedPlans = createServerFn({ method: "GET" }).handler(async (): Promise<PlansBundle> => {
  const supabase = getPublicClient();
  const [plansRes, featuresRes, assignmentsRes] = await Promise.all([
    supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("plan_features")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    supabase.from("plan_feature_assignments").select("*"),
  ]);
  if (plansRes.error) throw plansRes.error;
  if (featuresRes.error) throw featuresRes.error;
  if (assignmentsRes.error) throw assignmentsRes.error;
  return {
    plans: (plansRes.data ?? []) as PublicPlan[],
    features: (featuresRes.data ?? []) as PublicFeature[],
    assignments: (assignmentsRes.data ?? []) as PublicAssignment[],
  };
});

// ---------------- Admin functions ----------------

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw error;
  if (!data) throw new Error("Forbidden");
}

/** Admin: read all plans (active + inactive) + features + assignments. */
export const adminListPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PlansBundle> => {
    await assertAdmin(context.supabase, context.userId);
    const [plansRes, featuresRes, assignmentsRes] = await Promise.all([
      context.supabase.from("subscription_plans").select("*").order("display_order", { ascending: true }),
      context.supabase.from("plan_features").select("*").order("display_order", { ascending: true }),
      context.supabase.from("plan_feature_assignments").select("*"),
    ]);
    if (plansRes.error) throw plansRes.error;
    if (featuresRes.error) throw featuresRes.error;
    if (assignmentsRes.error) throw assignmentsRes.error;
    return {
      plans: (plansRes.data ?? []) as PublicPlan[],
      features: (featuresRes.data ?? []) as PublicFeature[],
      assignments: (assignmentsRes.data ?? []) as PublicAssignment[],
    };
  });

const PlanUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  designation: z.string().min(1),
  label: z.string().min(1),
  tagline: z.string().default(""),
  band: z.enum(["individual", "team", "partner"]),
  price_monthly_cents: z.number().int().min(0),
  price_annual_cents: z.number().int().min(0).nullable(),
  price_monthly_display: z.string().min(1),
  price_annual_display: z.string().nullable(),
  seat_cap: z.number().int().min(1),
  seat_cap_display: z.string().min(1),
  q_cap_display: z.string().default(""),
  cta_label: z.string().min(1),
  cta_kind: z.enum(["free", "checkout", "contact"]),
  highlight: z.boolean(),
  highlight_label: z.string().nullable(),
  contact_only: z.boolean(),
  display_order: z.number().int(),
  is_active: z.boolean(),
  paddle_price_id_monthly: z.string().nullable(),
  paddle_price_id_annual: z.string().nullable(),
});

export const adminUpsertPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof PlanUpsertSchema>) => PlanUpsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("subscription_plans")
      .upsert(data, { onConflict: "designation" });
    if (error) throw error;
    return { ok: true };
  });

export const adminDeletePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("subscription_plans").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const FeatureUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(3).regex(/^[a-z0-9._]+$/, "lowercase letters, digits, dots, underscores"),
  label: z.string().min(1),
  category: z.string().min(1),
  kind: z.enum(["boolean", "numeric"]),
  description: z.string().default(""),
  default_value: z.number().int().nullable().optional(),
  display_order: z.number().int(),
  is_active: z.boolean(),
});

export const adminUpsertFeature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof FeatureUpsertSchema>) => FeatureUpsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("plan_features")
      .upsert(data, { onConflict: "code" });
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteFeature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("plan_features").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const AssignmentSchema = z.object({
  plan_id: z.string().uuid(),
  feature_id: z.string().uuid(),
  enabled: z.boolean(),
  numeric_value: z.number().int().nullable(),
  marketing_label_override: z.string().nullable(),
});

export const adminSetAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof AssignmentSchema>) => AssignmentSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (!data.enabled && data.numeric_value === null && data.marketing_label_override === null) {
      // Remove row entirely when toggled off and no overrides exist
      const { error } = await context.supabase
        .from("plan_feature_assignments")
        .delete()
        .match({ plan_id: data.plan_id, feature_id: data.feature_id });
      if (error) throw error;
      return { ok: true, deleted: true };
    }
    const { error } = await context.supabase
      .from("plan_feature_assignments")
      .upsert(data, { onConflict: "plan_id,feature_id" });
    if (error) throw error;
    return { ok: true };
  });

const BulkAssignmentsSchema = z.object({
  plan_id: z.string().uuid(),
  rows: z.array(AssignmentSchema),
});

export const adminBulkSetAssignments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof BulkAssignmentsSchema>) => BulkAssignmentsSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.rows.length === 0) return { ok: true };
    const { error } = await context.supabase
      .from("plan_feature_assignments")
      .upsert(data.rows, { onConflict: "plan_id,feature_id" });
    if (error) throw error;
    return { ok: true };
  });

/** Admin: count of grandfathered subscribers per designation. */
export const adminGrandfatherCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("subscriptions")
      .select("designation, tier, status, plan_snapshot")
      .in("status", ["active", "trialing", "past_due"]);
    if (error) throw error;
    const counts: Record<string, { total: number; snapshotted: number }> = {};
    for (const row of (data ?? []) as Array<{
      designation: string | null;
      tier: string | null;
      plan_snapshot: unknown;
    }>) {
      const key = (row.designation ?? row.tier ?? "unknown").toLowerCase();
      counts[key] ??= { total: 0, snapshotted: 0 };
      counts[key].total++;
      if (row.plan_snapshot) counts[key].snapshotted++;
    }
    return counts;
  });

/** Admin: re-snapshot all active subscribers to match current plan assignments. */
export const adminResnapshotAll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { designation?: string }) => z.object({ designation: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sql = `
      UPDATE public.subscriptions s
      SET plan_snapshot = jsonb_build_object(
            'designation', p.designation,
            'label', p.label,
            'price_monthly_cents', p.price_monthly_cents,
            'snapshot_at', now(),
            'features', (
              SELECT COALESCE(jsonb_object_agg(
                f.code,
                jsonb_build_object('enabled', a.enabled, 'value', a.numeric_value, 'kind', f.kind)
              ), '{}'::jsonb)
              FROM public.plan_feature_assignments a
              JOIN public.plan_features f ON f.id = a.feature_id
              WHERE a.plan_id = p.id
            )
          ),
          grandfathered_at = now()
      FROM public.subscription_plans p
      WHERE p.designation = COALESCE(s.designation, s.tier)
        AND s.status IN ('active','trialing','past_due')
        ${data.designation ? "AND p.designation = $1" : ""};
    `;
    // Use a raw exec via PostgREST RPC fallback isn't available; use admin client RPC via sql.
    // Simpler: do it row-by-row in JS since the admin client can't run raw SQL.
    const { data: plans, error: pErr } = await supabaseAdmin
      .from("subscription_plans")
      .select("id, designation, label, price_monthly_cents");
    if (pErr) throw pErr;
    const { data: assigns, error: aErr } = await supabaseAdmin
      .from("plan_feature_assignments")
      .select("plan_id, enabled, numeric_value, feature_id");
    if (aErr) throw aErr;
    const { data: features, error: fErr } = await supabaseAdmin
      .from("plan_features")
      .select("id, code, kind");
    if (fErr) throw fErr;

    const featureMap = new Map((features ?? []).map((f: any) => [f.id, f]));
    const assignsByPlan = new Map<string, Array<any>>();
    for (const a of assigns ?? []) {
      const list = assignsByPlan.get((a as any).plan_id) ?? [];
      list.push(a);
      assignsByPlan.set((a as any).plan_id, list);
    }
    const snapshotByDesignation = new Map<string, any>();
    for (const p of plans ?? []) {
      const list = assignsByPlan.get((p as any).id) ?? [];
      const featuresObj: Record<string, any> = {};
      for (const a of list) {
        const f = featureMap.get((a as any).feature_id);
        if (!f) continue;
        featuresObj[(f as any).code] = {
          enabled: (a as any).enabled,
          value: (a as any).numeric_value,
          kind: (f as any).kind,
        };
      }
      snapshotByDesignation.set((p as any).designation, {
        designation: (p as any).designation,
        label: (p as any).label,
        price_monthly_cents: (p as any).price_monthly_cents,
        snapshot_at: new Date().toISOString(),
        features: featuresObj,
      });
    }

    let q = supabaseAdmin
      .from("subscriptions")
      .select("id, designation, tier, status")
      .in("status", ["active", "trialing", "past_due"]);
    if (data.designation) q = q.eq("designation", data.designation);
    const { data: subs, error: sErr } = await q;
    if (sErr) throw sErr;

    let updated = 0;
    for (const s of subs ?? []) {
      const designation = (s as any).designation ?? (s as any).tier;
      const snap = snapshotByDesignation.get(designation);
      if (!snap) continue;
      await supabaseAdmin
        .from("subscriptions")
        .update({ plan_snapshot: snap, grandfathered_at: new Date().toISOString() })
        .eq("id", (s as any).id);
      updated++;
    }
    void sql;
    return { ok: true, updated };
  });
