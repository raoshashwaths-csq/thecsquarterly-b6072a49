// Server functions for the editable subscription_plans + plan_features +
// plan_feature_assignments tables. See supabase/migrations for schema.
// Public reads use a publishable-key server client (RLS gates active rows).
// Admin writes use requireSupabaseAuth + has_role('admin') check.
// Every admin write is mirrored into admin_audit_log.

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

// ---------------- Admin helpers ----------------

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw error;
  if (!data) throw new Error("Forbidden");
}

/**
 * Insert an admin_audit_log row using the service-role client so the write
 * succeeds regardless of RLS. Best-effort: never throws to caller.
 */
async function logAudit(
  actorId: string,
  action: string,
  target_table: string | null,
  target_id: string | null,
  details: Record<string, unknown>,
) {
  const detailsJson = JSON.parse(JSON.stringify(details));
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Try to resolve email for nicer audit display.
    let actor_email: string | null = null;
    try {
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", actorId)
        .maybeSingle();
      actor_email = (prof as { email?: string | null } | null)?.email ?? null;
    } catch {
      /* ignore */
    }
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: actorId,
      actor_email,
      action,
      target_table,
      target_id,
      details: detailsJson,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[plans:logAudit] failed", e);
  }
}

// ---------------- Admin reads ----------------

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

// ---------------- Plan mutations ----------------

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
    // Snapshot prior row for audit diff
    const { data: prior } = await context.supabase
      .from("subscription_plans")
      .select("*")
      .eq("designation", data.designation)
      .maybeSingle();
    const { data: saved, error } = await context.supabase
      .from("subscription_plans")
      .upsert(data, { onConflict: "designation" })
      .select()
      .maybeSingle();
    if (error) throw error;
    await logAudit(
      context.userId,
      prior ? "plan.update" : "plan.create",
      "subscription_plans",
      (saved as { id?: string } | null)?.id ?? null,
      { designation: data.designation, before: prior, after: saved },
    );
    return { ok: true };
  });

export const adminDeletePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: prior } = await context.supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase.from("subscription_plans").delete().eq("id", data.id);
    if (error) throw error;
    await logAudit(context.userId, "plan.delete", "subscription_plans", data.id, { before: prior });
    return { ok: true };
  });

// ---------------- Feature mutations ----------------

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
    const { data: prior } = await context.supabase
      .from("plan_features")
      .select("*")
      .eq("code", data.code)
      .maybeSingle();
    const { data: saved, error } = await context.supabase
      .from("plan_features")
      .upsert(data, { onConflict: "code" })
      .select()
      .maybeSingle();
    if (error) throw error;
    await logAudit(
      context.userId,
      prior ? "feature.update" : "feature.create",
      "plan_features",
      (saved as { id?: string } | null)?.id ?? null,
      { code: data.code, before: prior, after: saved },
    );
    return { ok: true };
  });

export const adminDeleteFeature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: prior } = await context.supabase
      .from("plan_features")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase.from("plan_features").delete().eq("id", data.id);
    if (error) throw error;
    await logAudit(context.userId, "feature.delete", "plan_features", data.id, { before: prior });
    return { ok: true };
  });

// ---------------- Assignment mutations ----------------

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
    const { data: prior } = await context.supabase
      .from("plan_feature_assignments")
      .select("*")
      .match({ plan_id: data.plan_id, feature_id: data.feature_id })
      .maybeSingle();
    if (!data.enabled && data.numeric_value === null && data.marketing_label_override === null) {
      const { error } = await context.supabase
        .from("plan_feature_assignments")
        .delete()
        .match({ plan_id: data.plan_id, feature_id: data.feature_id });
      if (error) throw error;
      await logAudit(context.userId, "assignment.delete", "plan_feature_assignments", `${data.plan_id}:${data.feature_id}`, { before: prior });
      return { ok: true, deleted: true };
    }
    const { error } = await context.supabase
      .from("plan_feature_assignments")
      .upsert(data, { onConflict: "plan_id,feature_id" });
    if (error) throw error;
    await logAudit(
      context.userId,
      prior ? "assignment.update" : "assignment.create",
      "plan_feature_assignments",
      `${data.plan_id}:${data.feature_id}`,
      { before: prior, after: data },
    );
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
    await logAudit(context.userId, "assignment.bulk_set", "plan_feature_assignments", data.plan_id, {
      plan_id: data.plan_id,
      row_count: data.rows.length,
      rows: data.rows,
    });
    return { ok: true };
  });

// ---------------- Audit log reader ----------------

export const adminListAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number; actions?: string[] } | undefined) =>
    z
      .object({ limit: z.number().int().min(1).max(500).default(200), actions: z.array(z.string()).optional() })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    let q = context.supabase
      .from("admin_audit_log")
      .select("id, actor_id, actor_email, action, target_table, target_id, details, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.actions?.length) q = q.in("action", data.actions);
    const { data: rows, error } = await q;
    if (error) throw error;
    return { rows: rows ?? [] };
  });

// ---------------- CSV exports ----------------

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const lines = [headers.map(csvEscape).join(",")];
  for (const r of rows) lines.push(r.map(csvEscape).join(","));
  return lines.join("\n");
}

/** Admin: CSV of the SKU catalog (one row per feature). */
export const adminExportSkuCsv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: features, error } = await context.supabase
      .from("plan_features")
      .select("*")
      .order("category", { ascending: true })
      .order("display_order", { ascending: true });
    if (error) throw error;
    const csv = toCsv(
      ["code", "label", "category", "kind", "default_value", "description", "display_order", "is_active"],
      (features ?? []).map((f: any) => [
        f.code,
        f.label,
        f.category,
        f.kind,
        f.default_value,
        f.description,
        f.display_order,
        f.is_active,
      ]),
    );
    await logAudit(context.userId, "export.sku_csv", "plan_features", null, { count: features?.length ?? 0 });
    return { filename: `sku-catalog-${new Date().toISOString().slice(0, 10)}.csv`, csv };
  });

/** Admin: CSV of current per-plan feature assignments (one row per plan × feature). */
export const adminExportAssignmentsCsv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const [plansRes, featuresRes, assignsRes] = await Promise.all([
      context.supabase.from("subscription_plans").select("id, designation, label, display_order").order("display_order"),
      context.supabase.from("plan_features").select("id, code, label, category, kind, display_order").order("category").order("display_order"),
      context.supabase.from("plan_feature_assignments").select("*"),
    ]);
    if (plansRes.error) throw plansRes.error;
    if (featuresRes.error) throw featuresRes.error;
    if (assignsRes.error) throw assignsRes.error;
    const assignMap = new Map<string, any>();
    for (const a of (assignsRes.data ?? []) as any[]) assignMap.set(`${a.plan_id}:${a.feature_id}`, a);
    const rows: Array<Array<unknown>> = [];
    for (const p of plansRes.data ?? []) {
      for (const f of featuresRes.data ?? []) {
        const a = assignMap.get(`${(p as any).id}:${(f as any).id}`);
        rows.push([
          (p as any).designation,
          (p as any).label,
          (f as any).code,
          (f as any).label,
          (f as any).category,
          (f as any).kind,
          a?.enabled ?? false,
          a?.numeric_value ?? "",
          a?.marketing_label_override ?? "",
        ]);
      }
    }
    const csv = toCsv(
      ["plan_designation", "plan_label", "feature_code", "feature_label", "category", "kind", "enabled", "numeric_value", "marketing_label_override"],
      rows,
    );
    await logAudit(context.userId, "export.assignments_csv", "plan_feature_assignments", null, { rows: rows.length });
    return { filename: `plan-assignments-${new Date().toISOString().slice(0, 10)}.csv`, csv };
  });

// ---------------- Draft / Publish workflow ----------------
// Drafts live in app_settings under key 'pricing.draft' as a JSONB containing
// proposed plans/features/assignments overrides. Admin can preview, then
// Publish (atomic apply) or Discard.

type DraftBundle = {
  plans: PublicPlan[];
  features: PublicFeature[];
  assignments: PublicAssignment[];
  saved_at: string;
  saved_by: string | null;
};

async function readDraft(): Promise<DraftBundle | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "pricing.draft")
    .maybeSingle();
  return (data?.value as DraftBundle | undefined) ?? null;
}

export const adminGetDraft = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ draft: DraftBundle | null }> => {
    await assertAdmin(context.supabase, context.userId);
    const draft = await readDraft();
    return { draft };
  });

const DraftSaveSchema = z.object({
  plans: z.array(z.any()),
  features: z.array(z.any()),
  assignments: z.array(z.any()),
});

export const adminSaveDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof DraftSaveSchema>) => DraftSaveSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload: DraftBundle = {
      plans: data.plans as PublicPlan[],
      features: data.features as PublicFeature[],
      assignments: data.assignments as PublicAssignment[],
      saved_at: new Date().toISOString(),
      saved_by: context.userId,
    };
    const { error } = await supabaseAdmin.from("app_settings").upsert({
      key: "pricing.draft",
      value: JSON.parse(JSON.stringify(payload)),
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    await logAudit(context.userId, "draft.save", "app_settings", "pricing.draft", {
      plans: data.plans.length,
      features: data.features.length,
      assignments: data.assignments.length,
    });
    return { ok: true };
  });

export const adminDiscardDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("app_settings").delete().eq("key", "pricing.draft");
    if (error) throw error;
    await logAudit(context.userId, "draft.discard", "app_settings", "pricing.draft", {});
    return { ok: true };
  });

export const adminPublishDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const draft = await readDraft();
    if (!draft) throw new Error("No draft to publish");

    // Apply atomically (best-effort sequential). Upsert plans, features, then
    // overwrite assignments for affected plans (we replace the full set per
    // plan to honour deletions in the draft).
    if (draft.plans?.length) {
      // strip id when creating new
      const planRows = draft.plans.map((p: any) => ({ ...p, id: p.id }));
      const { error } = await supabaseAdmin
        .from("subscription_plans")
        .upsert(planRows, { onConflict: "designation" });
      if (error) throw new Error(`plans: ${error.message}`);
    }
    if (draft.features?.length) {
      const featRows = draft.features.map((f: any) => ({ ...f }));
      const { error } = await supabaseAdmin
        .from("plan_features")
        .upsert(featRows, { onConflict: "code" });
      if (error) throw new Error(`features: ${error.message}`);
    }
    if (draft.assignments) {
      const planIds = Array.from(new Set(draft.assignments.map((a: any) => a.plan_id)));
      if (planIds.length) {
        // Wipe current assignments for affected plans, then insert draft set.
        const { error: delErr } = await supabaseAdmin
          .from("plan_feature_assignments")
          .delete()
          .in("plan_id", planIds);
        if (delErr) throw new Error(`assignments wipe: ${delErr.message}`);
        if (draft.assignments.length) {
          const { error: insErr } = await supabaseAdmin
            .from("plan_feature_assignments")
            .insert(draft.assignments);
          if (insErr) throw new Error(`assignments insert: ${insErr.message}`);
        }
      }
    }

    // Clear the draft
    await supabaseAdmin.from("app_settings").delete().eq("key", "pricing.draft");

    await logAudit(context.userId, "draft.publish", "app_settings", "pricing.draft", {
      plans: draft.plans?.length ?? 0,
      features: draft.features?.length ?? 0,
      assignments: draft.assignments?.length ?? 0,
      saved_at: draft.saved_at,
      saved_by: draft.saved_by,
    });
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
    await logAudit(context.userId, "subscriptions.resnapshot", "subscriptions", data.designation ?? null, {
      designation: data.designation ?? "all",
      updated,
    });
    return { ok: true, updated };
  });
