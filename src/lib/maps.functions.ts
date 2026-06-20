import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MapRecord = {
  id: string;
  title: string;
  account_id: string | null;
  account_name: string | null;
  csm_id: string;
  csm_name: string | null;
  status: "draft" | "active" | "completed" | "archived";
  contract_start_date: string | null;
  target_value_date: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  benchmark_ttv_days: number | null;
  actual_ttv_days: number | null;
  share_token: string;
  share_enabled: boolean;
  customer_email: string | null;
  last_customer_view: string | null;
  lumi_generated: boolean;
  account_tier: string | null;
  account_industry: string | null;
};

export type MapPhase = {
  id: string;
  map_id: string;
  title: string;
  phase_order: number;
  is_value_milestone: boolean;
  color: string;
};

export type MapMilestone = {
  id: string;
  map_id: string;
  phase_id: string;
  title: string;
  description: string | null;
  milestone_order: number;
  owner: "csm" | "customer" | "shared";
  assigned_to: string | null;
  status: "not_started" | "in_progress" | "completed" | "blocked";
  due_days_from_start: number | null;
  completed_at: string | null;
  health_score_impact: number;
  completion_note: string | null;
  blocked_reason: string | null;
};

export type MapComment = {
  id: string;
  map_id: string;
  milestone_id: string | null;
  author_type: "csm" | "customer";
  author_name: string | null;
  content: string;
  created_at: string;
};

/* ============== Authenticated server fns ============== */

export const listMaps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("maps")
      .select("*")
      .eq("csm_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as MapRecord[];
  });

export const getMap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: map, error: mErr }, { data: phases, error: pErr }, { data: milestones, error: msErr }, { data: comments, error: cErr }] =
      await Promise.all([
        context.supabase.from("maps").select("*").eq("id", data.id).maybeSingle(),
        context.supabase.from("map_phases").select("*").eq("map_id", data.id).order("phase_order"),
        context.supabase.from("map_milestones").select("*").eq("map_id", data.id).order("milestone_order"),
        context.supabase.from("map_comments").select("*").eq("map_id", data.id).order("created_at", { ascending: false }),
      ]);
    if (mErr) throw new Error(mErr.message);
    if (pErr) throw new Error(pErr.message);
    if (msErr) throw new Error(msErr.message);
    if (cErr) throw new Error(cErr.message);
    if (!map) throw new Error("Not found");
    return {
      map: map as MapRecord,
      phases: (phases ?? []) as MapPhase[],
      milestones: (milestones ?? []) as MapMilestone[],
      comments: (comments ?? []) as MapComment[],
    };
  });

const phaseInput = z.object({
  title: z.string().min(1),
  color: z.string(),
  is_value_milestone: z.boolean(),
  milestones: z.array(
    z.object({
      title: z.string().min(1),
      owner: z.enum(["csm", "customer", "shared"]),
      due_days_from_start: z.number().int().nullable(),
      health_score_impact: z.number().int().default(0),
    }),
  ),
});

export const createMap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().min(1),
        account_id: z.string().uuid().nullable(),
        account_name: z.string().nullable(),
        account_tier: z.string().nullable(),
        account_industry: z.string().nullable(),
        contract_start_date: z.string().nullable(),
        target_value_date: z.string().nullable(),
        customer_email: z.string().nullable(),
        benchmark_ttv_days: z.number().int().nullable(),
        phases: z.array(phaseInput),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: mapRow, error: mErr } = await context.supabase
      .from("maps")
      .insert({
        title: data.title,
        account_id: data.account_id,
        account_name: data.account_name,
        account_tier: data.account_tier,
        account_industry: data.account_industry,
        contract_start_date: data.contract_start_date,
        target_value_date: data.target_value_date,
        customer_email: data.customer_email,
        benchmark_ttv_days: data.benchmark_ttv_days,
        csm_id: context.userId,
        csm_name: context.claims?.email ?? null,
        lumi_generated: true,
        status: "active",
      })
      .select("*")
      .single();
    if (mErr || !mapRow) throw new Error(mErr?.message ?? "Failed to create map");

    for (let pi = 0; pi < data.phases.length; pi++) {
      const p = data.phases[pi];
      const { data: phaseRow, error: pErr } = await context.supabase
        .from("map_phases")
        .insert({
          map_id: mapRow.id,
          title: p.title,
          color: p.color,
          is_value_milestone: p.is_value_milestone,
          phase_order: pi,
        })
        .select("*")
        .single();
      if (pErr || !phaseRow) throw new Error(pErr?.message ?? "Failed to create phase");

      if (p.milestones.length > 0) {
        const rows = p.milestones.map((m, mi) => ({
          map_id: mapRow.id,
          phase_id: phaseRow.id,
          title: m.title,
          owner: m.owner,
          due_days_from_start: m.due_days_from_start,
          health_score_impact: m.health_score_impact,
          milestone_order: mi,
        }));
        const { error: msErr } = await context.supabase.from("map_milestones").insert(rows);
        if (msErr) throw new Error(msErr.message);
      }
    }

    return { id: mapRow.id as string };
  });

export const updateMapShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), share_enabled: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("maps")
      .update({ share_enabled: data.share_enabled })
      .eq("id", data.id)
      .eq("csm_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const archiveMap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("maps")
      .update({ status: "archived" })
      .eq("id", data.id)
      .eq("csm_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const completeMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ milestone_id: z.string().uuid(), note: z.string().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    // load milestone + map
    const { data: ms, error: msErr } = await context.supabase
      .from("map_milestones")
      .select("*, map:maps(*), phase:map_phases(*)")
      .eq("id", data.milestone_id)
      .maybeSingle();
    if (msErr) throw new Error(msErr.message);
    if (!ms) throw new Error("Milestone not found");
    const map = ms.map as MapRecord;
    if (map.csm_id !== context.userId) throw new Error("Forbidden");
    const phase = ms.phase as MapPhase;

    const completedAt = new Date().toISOString();
    const { error: upErr } = await context.supabase
      .from("map_milestones")
      .update({ status: "completed", completed_at: completedAt, completion_note: data.note ?? null })
      .eq("id", data.milestone_id);
    if (upErr) throw new Error(upErr.message);

    // Health score impact
    if (ms.health_score_impact && map.account_id) {
      const { data: acct } = await context.supabase
        .from("cs_accounts")
        .select("health")
        .eq("id", map.account_id)
        .maybeSingle();
      if (acct) {
        await context.supabase
          .from("cs_accounts")
          .update({ health: Math.min(100, (acct.health ?? 0) + ms.health_score_impact) })
          .eq("id", map.account_id);
      }
    }

    // If value-milestone phase fully complete, log actual_ttv_days
    if (phase.is_value_milestone && map.contract_start_date && !map.actual_ttv_days) {
      const { data: remaining } = await context.supabase
        .from("map_milestones")
        .select("id, status")
        .eq("phase_id", phase.id);
      const allDone = (remaining ?? []).every((r) =>
        r.id === data.milestone_id ? true : r.status === "completed",
      );
      if (allDone) {
        const days = Math.max(
          1,
          Math.round(
            (new Date(completedAt).getTime() - new Date(map.contract_start_date).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        );
        await context.supabase.from("maps").update({ actual_ttv_days: days }).eq("id", map.id);
      }
    }

    return { ok: true };
  });

export const addCsmComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        map_id: z.string().uuid(),
        milestone_id: z.string().uuid().optional(),
        content: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("map_comments").insert({
      map_id: data.map_id,
      milestone_id: data.milestone_id ?? null,
      author_type: "csm",
      author_name: context.claims?.email ?? "CSM",
      content: data.content,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============== Public (token-validated) ============== */

export const getSharedMap = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(8) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: map } = await supabaseAdmin
      .from("maps")
      .select("*")
      .eq("share_token", data.token)
      .eq("share_enabled", true)
      .maybeSingle();
    if (!map) return { ok: false as const };

    const [{ data: phases }, { data: milestones }, { data: comments }] = await Promise.all([
      supabaseAdmin.from("map_phases").select("*").eq("map_id", map.id).order("phase_order"),
      supabaseAdmin.from("map_milestones").select("*").eq("map_id", map.id).order("milestone_order"),
      supabaseAdmin.from("map_comments").select("*").eq("map_id", map.id).order("created_at"),
    ]);
    // record view (best-effort)
    await supabaseAdmin.from("maps").update({ last_customer_view: new Date().toISOString() }).eq("id", map.id);

    return {
      ok: true as const,
      map: map as MapRecord,
      phases: (phases ?? []) as MapPhase[],
      milestones: (milestones ?? []) as MapMilestone[],
      comments: (comments ?? []) as MapComment[],
    };
  });

export const addCustomerComment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: z.string().min(8),
        milestone_id: z.string().uuid().optional(),
        content: z.string().min(1).max(2000),
        author_name: z.string().max(120).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: map } = await supabaseAdmin
      .from("maps")
      .select("id, share_enabled")
      .eq("share_token", data.token)
      .maybeSingle();
    if (!map || !map.share_enabled) throw new Error("Share link inactive");
    const { error } = await supabaseAdmin.from("map_comments").insert({
      map_id: map.id,
      milestone_id: data.milestone_id ?? null,
      author_type: "customer",
      author_name: data.author_name ?? "Customer",
      content: data.content,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
