import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  normalizeTier,
  isPaid,
  TIER_LABEL,
  TIER_Q_CAP,
  TIER_SEAT_CAP,
  PAID_DESIGNATIONS,
} from "@/lib/admin-tiers";
import type { Designation } from "@/lib/tiers";

async function assertAdmin(userId: string) {
  const { data: roles } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId);
  if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
}

// =============== Overview ===============

export const getControlPanelOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const now = new Date();
    const startMTD = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const start30 = new Date(Date.now() - 30 * 86_400_000);
    const start30Iso = start30.toISOString();

    const [subsRes, jobsRes, qMTDRes, profilesRes, qSeriesRes] = await Promise.all([
      supabaseAdmin
        .from("subscriptions")
        .select("user_id, tier, designation, status")
        .eq("status", "active"),
      supabaseAdmin
        .from("job_listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabaseAdmin
        .from("q_runs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startMTD),
      supabaseAdmin
        .from("profiles")
        .select("id, email, display_name, created_at")
        .gte("created_at", start30Iso)
        .order("created_at", { ascending: false })
        .limit(1500),
      supabaseAdmin
        .from("q_runs")
        .select("created_at")
        .gte("created_at", start30Iso)
        .limit(5000),
    ]);

    const normalizedSubs = (subsRes.data ?? []).map((s) => ({
      user_id: s.user_id as string,
      ...normalizeTier({ tier: s.tier, designation: s.designation }),
    }));
    const paidSubs = normalizedSubs.filter((s) => isPaid(s.designation));
    const mrrCents = paidSubs.reduce((sum, s) => sum + s.priceCents, 0);

    // Per-tier breakdown (active paid only)
    const tierBreakdown: { designation: Designation; label: string; count: number }[] =
      PAID_DESIGNATIONS.map((d) => ({
        designation: d,
        label: TIER_LABEL[d] ?? d,
        count: paidSubs.filter((s) => s.designation === d).length,
      }));

    // 30-day registrations + sessions timeseries
    const days: { date: string; registrations: number; sessions: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, registrations: 0, sessions: 0 });
    }
    const idx: Record<string, number> = {};
    days.forEach((d, i) => (idx[d.date] = i));
    (profilesRes.data ?? []).forEach((p) => {
      const key = String(p.created_at).slice(0, 10);
      if (idx[key] !== undefined) days[idx[key]].registrations++;
    });
    (qSeriesRes.data ?? []).forEach((r) => {
      const key = String(r.created_at).slice(0, 10);
      if (idx[key] !== undefined) days[idx[key]].sessions++;
    });

    // Latest registrations w/ method + tier
    const latestProfiles = (profilesRes.data ?? []).slice(0, 25);
    const ids = latestProfiles.map((p) => p.id);
    const subByUser: Record<string, { designation: string; label: string }> = {};
    const methodByUser: Record<string, string> = {};
    if (ids.length) {
      const subs2 = await supabaseAdmin
        .from("subscriptions")
        .select("user_id, tier, designation, status")
        .in("user_id", ids);
      (subs2.data ?? []).forEach((s) => {
        if (s.status !== "active") return;
        const n = normalizeTier({ tier: s.tier, designation: s.designation });
        if (isPaid(n.designation)) subByUser[s.user_id] = { designation: n.designation, label: n.label };
      });

      // Real provider lookup via auth admin API — fall back to "Email".
      await Promise.all(
        ids.map(async (uid) => {
          try {
            const { data } = await supabaseAdmin.auth.admin.getUserById(uid);
            const providers = (data?.user?.identities ?? [])
              .map((i) => i.provider)
              .filter(Boolean);
            if (providers.includes("google")) methodByUser[uid] = "Google";
            else if (providers.includes("apple")) methodByUser[uid] = "Apple";
            else if (providers.includes("github")) methodByUser[uid] = "GitHub";
            else methodByUser[uid] = "Email";
          } catch {
            methodByUser[uid] = "Email";
          }
        }),
      );
    }

    const latestRegistrations = latestProfiles.map((p) => ({
      id: p.id as string,
      email: (p.email as string) ?? "—",
      display_name: (p.display_name as string) ?? "",
      created_at: p.created_at as string,
      method: methodByUser[p.id] ?? "Email",
      designation: subByUser[p.id]?.designation ?? "reader",
      tier: subByUser[p.id]?.label ?? "Reader",
    }));

    return {
      mrrCents,
      arrCents: mrrCents * 12,
      paidSubscribers: paidSubs.length,
      tierBreakdown,
      activeJobs: jobsRes.count ?? 0,
      agentSessionsMTD: qMTDRes.count ?? 0,
      series: days,
      latestRegistrations,
    };
  });

// =============== Agent Observability ===============

import { heuristicCostMicrosPerRun, microsToUsd, HEURISTIC_TOKENS_PER_RUN } from "@/lib/q-pricing";

export const getAgentObservability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();

    const [total, recent] = await Promise.all([
      supabaseAdmin.from("q_runs").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("q_runs")
        .select("id, user_id, node_id, witty, shared, created_at, context, zones, tokens_in, tokens_out, latency_ms, cost_micros, model")
        .gte("created_at", since30)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const runs = (recent.data ?? []) as Array<{
      id: string; user_id: string; node_id: string; witty: boolean; shared: boolean;
      created_at: string; context: unknown; zones: unknown;
      tokens_in: number | null; tokens_out: number | null;
      latency_ms: number | null; cost_micros: number | null; model: string | null;
    }>;

    // Telemetry coverage on the 30-day window.
    const withTelemetry = runs.filter((r) => r.cost_micros !== null);
    const coverage = runs.length ? withTelemetry.length / runs.length : 0;

    // Real sums where present + heuristic backfill for legacy rows.
    const realTokens = withTelemetry.reduce(
      (s, r) => s + (r.tokens_in ?? 0) + (r.tokens_out ?? 0), 0,
    );
    const legacyRuns = runs.length - withTelemetry.length;
    const heuristicTokens = legacyRuns * (HEURISTIC_TOKENS_PER_RUN.in + HEURISTIC_TOKENS_PER_RUN.out);
    // Project to all-time totals — apply same blended rate to lifetime count.
    const blendedTokensPerRun = runs.length
      ? (realTokens + heuristicTokens) / runs.length
      : (HEURISTIC_TOKENS_PER_RUN.in + HEURISTIC_TOKENS_PER_RUN.out);
    const totalTokenBurn = Math.round((total.count ?? 0) * blendedTokensPerRun);

    // Avg latency from real telemetry only.
    const latencyN = withTelemetry.filter((r) => r.latency_ms !== null).length;
    const latencySum = withTelemetry.reduce((s, r) => s + (r.latency_ms ?? 0), 0);
    const avgLatencyMs = latencyN ? Math.round(latencySum / latencyN) : 0;

    // Cost — real where we have it, heuristic for legacy.
    const realCostMicros = withTelemetry.reduce((s, r) => s + (r.cost_micros ?? 0), 0);
    const heuristicCostMicros = legacyRuns * heuristicCostMicrosPerRun();
    const windowCostMicros = realCostMicros + heuristicCostMicros;
    const windowCostUsd = microsToUsd(windowCostMicros);
    // Approximate revenue: $0.50 attributed per session (placeholder until billing webhook).
    const revenueUsd = runs.length * 0.5;
    const profitMarginPct = revenueUsd > 0
      ? Math.round(((revenueUsd - windowCostUsd) / revenueUsd) * 100)
      : 0;

    // Tree frequency (T1..T8)
    const trees: Record<string, number> = {};
    runs.forEach((r) => {
      const tree = String(r.node_id || "?").split("-")[0];
      trees[tree] = (trees[tree] ?? 0) + 1;
    });
    const treeFrequency = Object.entries(trees)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tree, count]) => ({ tree, count }));

    // Hydrate operator email
    const userIds = Array.from(new Set(runs.map((r) => r.user_id))).filter(Boolean);
    let profMap: Record<string, string> = {};
    if (userIds.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles").select("id, email").in("id", userIds);
      profMap = Object.fromEntries((profs ?? []).map((p) => [p.id, p.email ?? ""]));
    }

    const executionLogs = runs.slice(0, 100).map((r) => {
      const latency = r.latency_ms ?? Math.round(200 + JSON.stringify(r.zones ?? {}).length / 100);
      return {
        id: r.id,
        user_id: r.user_id,
        operator_email: profMap[r.user_id] ?? "—",
        node_id: r.node_id,
        latency_ms: latency,
        cost_micros: r.cost_micros ?? null,
        tokens_in: r.tokens_in ?? null,
        tokens_out: r.tokens_out ?? null,
        sentiment: r.witty ? "up" : "neutral",
        shared: !!r.shared,
        created_at: r.created_at,
      };
    });

    return {
      totalRuns: total.count ?? 0,
      totalTokenBurn,
      avgLatencyMs,
      costUsd: Math.round(windowCostUsd * 100) / 100,
      revenueUsd: Math.round(revenueUsd * 100) / 100,
      profitMarginPct,
      treeFrequency,
      executionLogs,
      // Telemetry coverage on the 30-day window (0..1). 1 = all real.
      telemetryCoverage: Math.round(coverage * 100) / 100,
      estimated: coverage < 1,
    };
  });

// =============== Cost Projection ===============

export const getQCostProjection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const since30Iso = new Date(Date.now() - 30 * 86_400_000).toISOString();

    const [countRes, costRes] = await Promise.all([
      supabaseAdmin
        .from("q_runs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since30Iso),
      supabaseAdmin
        .from("q_runs")
        .select("cost_micros, tokens_in, tokens_out")
        .gte("created_at", since30Iso)
        .not("cost_micros", "is", null)
        .limit(5000),
    ]);

    const runs30d = countRes.count ?? 0;
    const telemetryRows = (costRes.data ?? []) as Array<{
      cost_micros: number | null; tokens_in: number | null; tokens_out: number | null;
    }>;
    const telemetryCoverage = runs30d ? telemetryRows.length / runs30d : 0;

    // Average cost per run.
    let avgCostMicros: number;
    let basis: "real" | "heuristic";
    if (telemetryRows.length >= 5 && telemetryCoverage >= 0.5) {
      avgCostMicros = Math.round(
        telemetryRows.reduce((s, r) => s + (r.cost_micros ?? 0), 0) / telemetryRows.length,
      );
      basis = "real";
    } else {
      avgCostMicros = heuristicCostMicrosPerRun();
      basis = "heuristic";
    }

    const monthlyCostMicros = runs30d * avgCostMicros;
    const annualCostMicros = monthlyCostMicros * 12;

    const projections = [1_000, 10_000, 100_000].map((n) => ({
      conversations: n,
      costMicros: n * avgCostMicros,
    }));

    return {
      runs30d,
      telemetryCoverage: Math.round(telemetryCoverage * 100) / 100,
      basis,
      avgCostMicros,
      monthlyCostMicros,
      annualCostMicros,
      projections,
    };
  });



export const getQRunTranscript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ runId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: run, error } = await supabaseAdmin
      .from("q_runs")
      .select("id, node_id, context, zones, witty, created_at")
      .eq("id", data.runId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!run) throw new Error("Not found");

    // Scrub long free-text and serialize to JSON string for safe transport.
    const scrub = (val: unknown): unknown => {
      if (val === null || val === undefined) return val;
      if (typeof val === "string") return val.length > 2000 ? val.slice(0, 2000) + "…[truncated]" : val;
      if (Array.isArray(val)) return val.map(scrub);
      if (typeof val === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(val)) out[k] = scrub(v);
        return out;
      }
      return val;
    };
    return {
      id: run.id as string,
      node_id: run.node_id as string,
      witty: !!run.witty,
      created_at: run.created_at as string,
      input_json: JSON.stringify(scrub(run.context ?? {}), null, 2),
      output_json: JSON.stringify(scrub(run.zones ?? {}), null, 2),
    };
  });

// =============== Job Marketplace ===============

export const listJobListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("job_listings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const moderateJobListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      action: z.enum(["approve", "reject", "delete"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.action === "delete") {
      const { error } = await supabaseAdmin.from("job_listings").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const status = data.action === "approve" ? "active" : "rejected";
      const { error } = await supabaseAdmin
        .from("job_listings")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const updateJobFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      pinned: z.boolean().optional(),
      featured: z.boolean().optional(),
      status: z.enum(["pending", "active", "rejected"]).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.pinned !== undefined) patch.pinned = data.pinned;
    if (data.featured !== undefined) patch.featured = data.featured;
    if (data.status !== undefined) patch.status = data.status;
    const { error } = await supabaseAdmin
      .from("job_listings")
      .update(patch as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const seedSampleJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const samples = [
      { employer_name: "Datadog", job_title: "Director, Customer Success", package_tier: 1500, status: "pending" },
      { employer_name: "Stripe", job_title: "VP Customer Success — EMEA", package_tier: 6000, status: "pending" },
      { employer_name: "Notion", job_title: "Senior CSM, Enterprise", package_tier: 799, status: "active" },
      { employer_name: "Linear", job_title: "Customer Success Lead", package_tier: 499, status: "active" },
      { employer_name: "Vercel", job_title: "CS Operations Manager", package_tier: 299, status: "active" },
    ];
    const { error } = await supabaseAdmin.from("job_listings").insert(samples as never);
    if (error) throw new Error(error.message);
    return { inserted: samples.length };
  });

// =============== Master Users ===============

export const listMasterUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const [profilesRes, subsRes, rolesRes, qCountsRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, email, display_name, created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabaseAdmin.from("subscriptions").select("user_id, tier, designation, status, current_period_end"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("q_runs").select("user_id"),
    ]);

    const subMap: Record<string, { tier: string; designation: string | null; status: string; current_period_end: string | null }> = {};
    (subsRes.data ?? []).forEach((s) => {
      if (!subMap[s.user_id] || s.status === "active") {
        subMap[s.user_id] = {
          tier: s.tier,
          designation: (s as { designation?: string | null }).designation ?? null,
          status: s.status,
          current_period_end: (s as { current_period_end?: string | null }).current_period_end ?? null,
        };
      }
    });
    const roleSet: Record<string, string[]> = {};
    (rolesRes.data ?? []).forEach((r) => {
      (roleSet[r.user_id] ??= []).push(r.role as string);
    });
    const qUsage: Record<string, number> = {};
    (qCountsRes.data ?? []).forEach((r) => {
      qUsage[r.user_id] = (qUsage[r.user_id] ?? 0) + 1;
    });

    return (profilesRes.data ?? []).map((p) => {
      const sub = subMap[p.id];
      const n = normalizeTier({ tier: sub?.tier ?? null, designation: sub?.designation ?? null });
      return {
        id: p.id as string,
        email: (p.email as string) ?? "—",
        display_name: (p.display_name as string) ?? "",
        created_at: p.created_at as string,
        tier: n.designation,
        tier_label: n.label,
        status: sub?.status ?? "inactive",
        current_period_end: sub?.current_period_end ?? null,
        is_admin: (roleSet[p.id] ?? []).includes("admin"),
        sessions_used: qUsage[p.id] ?? 0,
        seat_cap: TIER_SEAT_CAP[n.designation] ?? 1,
        q_cap: TIER_Q_CAP[n.designation] ?? 0,
      };
    });
  });

const GRANT_ACTIONS = [
  "grant-practitioner",
  "grant-operator",
  "grant-team",
  "grant-scale",
  "grant-enterprise",
  "grant-strategic_partner",
] as const;

const GRANT_TO_DESIGNATION: Record<typeof GRANT_ACTIONS[number], Designation> = {
  "grant-practitioner": "practitioner",
  "grant-operator": "operator",
  "grant-team": "team",
  "grant-scale": "scale",
  "grant-enterprise": "enterprise",
  "grant-strategic_partner": "strategic_partner",
};

export const manageUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      user_id: z.string().uuid(),
      action: z.enum([
        ...GRANT_ACTIONS,
        "revoke-subscription",
        "grant-admin",
        "revoke-admin",
        "revoke-sessions",
      ]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { user_id, action } = data;

    if ((GRANT_ACTIONS as readonly string[]).includes(action)) {
      const designation = GRANT_TO_DESIGNATION[action as typeof GRANT_ACTIONS[number]];
      const ends = new Date(Date.now() + 365 * 86_400_000).toISOString();
      const legacyTier =
        designation === "practitioner" ? "vanguard"
        : designation === "operator" ? "vanguard-pro"
        : designation;
      const { data: existing } = await supabaseAdmin
        .from("subscriptions").select("id").eq("user_id", user_id).maybeSingle();
      const row = { status: "active", tier: legacyTier, designation, current_period_end: ends };
      if (existing) {
        await supabaseAdmin.from("subscriptions").update(row as never).eq("user_id", user_id);
      } else {
        await supabaseAdmin.from("subscriptions").insert({ user_id, ...row } as never);
      }
      await supabaseAdmin.from("admin_audit_log").insert({
        actor_id: context.userId,
        action: "subscription.grant",
        target_table: "subscriptions",
        target_id: user_id,
        details: { designation } as never,
      });
    } else if (action === "revoke-subscription") {
      await supabaseAdmin
        .from("subscriptions")
        .update({ status: "inactive", tier: "free", designation: null } as never)
        .eq("user_id", user_id);
      await supabaseAdmin.from("admin_audit_log").insert({
        actor_id: context.userId,
        action: "subscription.revoke",
        target_table: "subscriptions",
        target_id: user_id,
        details: {} as never,
      });
    } else if (action === "grant-admin") {
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id, role: "admin" } as never);
    } else if (action === "revoke-admin") {
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("role", "admin");
    } else if (action === "revoke-sessions") {
      // Soft action: log to audit only; full session revoke needs Supabase admin API.
      // Record via admin_audit_log directly so it's visible.
      await supabaseAdmin.from("admin_audit_log").insert({
        actor_id: context.userId,
        action: "session.revoke",
        target_table: "auth.users",
        target_id: user_id,
        details: { note: "session revoke requested via control panel" } as never,
      });
    }
    return { ok: true };
  });

// =============== Email Center ===============

export const listEmailTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    // Names hard-coded against the registry to keep this fn client-bundle safe.
    return [
      {
        key: "vanguard-welcome",
        displayName: "Welcome Sequence",
        subject: "Welcome to The CS Quarterly Vanguard",
        cadence: "On signup",
      },
      {
        key: "dispatch-notification",
        displayName: "Weekly Dispatch",
        subject: "This week's dispatch is live",
        cadence: "Tuesdays 9am",
      },
      {
        key: "end-of-day-retro",
        displayName: "End-of-Day 6PM Retrospective",
        subject: "Your 6pm Q. retrospective",
        cadence: "Daily 18:00",
      },
      {
        key: "invoice-alert",
        displayName: "Invoice Alerts",
        subject: "Invoice receipt — The CS Quarterly",
        cadence: "On payment",
      },
    ];
  });

export const sendTestBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      templateKey: z.string().min(1).max(80),
      recipient: z.string().email(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    // Enqueue via the existing pgmq pipeline — recorded for the queue dispatcher.
    const { error } = await supabaseAdmin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        template: data.templateKey,
        to: data.recipient,
        data: { test: true, sent_by: context.userId },
        message_id: `cp-test-${crypto.randomUUID()}`,
      } as never,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "email.test-broadcast",
      target_table: "email_send_log",
      target_id: data.templateKey,
      details: { recipient: data.recipient } as never,
    });
    return { ok: true };
  });

// =============== Publishing helper ===============

export const schedulePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
      title: z.string().min(1).max(300),
      subtitle: z.string().max(500).optional(),
      excerpt: z.string().min(1).max(800),
      body: z.string().min(1).max(120000),
      section: z.enum(["vanguard", "retention-protocol", "outcome-forum", "codex"]).default("vanguard"),
      tier: z.enum(["free", "premium"]).default("free"),
      tiers_allowed: z.array(z.string()).optional(),
      scheduled_at: z.string().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const publishedAt = data.scheduled_at ?? new Date().toISOString();
    const { error } = await supabaseAdmin.from("posts").upsert(
      {
        slug: data.slug,
        title: data.title,
        subtitle: data.subtitle ?? null,
        excerpt: data.excerpt,
        body: data.body,
        section: data.section,
        category: "Vanguard",
        author: "The Editors",
        read_minutes: Math.max(3, Math.ceil(data.body.split(/\s+/).length / 220)),
        tier: data.tier,
        is_premium: data.tier === "premium",
        published_at: publishedAt,
        published: new Date(publishedAt) <= new Date(),
      } as never,
      { onConflict: "slug" },
    );
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "post.schedule",
      target_table: "posts",
      target_id: data.slug,
      details: { tiers_allowed: data.tiers_allowed ?? [], scheduled_at: publishedAt } as never,
    });
    return { ok: true };
  });

// =============== Situation Room limits ===============

const SR_KEY = "situation_room.limits";
type SRWindow = "day" | "week" | "month";

const SituationLimitsInput = z.object({
  max_prompts: z.number().int().min(1).max(100),
  window: z.enum(["day", "week", "month"]),
});

export const getSituationRoomSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data } = await supabaseAdmin
      .from("app_settings").select("value, updated_at").eq("key", SR_KEY).maybeSingle();
    const raw = (data as { value?: { max_prompts?: number; window?: SRWindow } } | null)?.value;
    return {
      max_prompts: typeof raw?.max_prompts === "number" ? raw.max_prompts : 5,
      window: (raw?.window ?? "month") as SRWindow,
      updated_at: (data as { updated_at?: string } | null)?.updated_at ?? null,
    };
  });

export const updateSituationRoomSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SituationLimitsInput.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const value = { max_prompts: data.max_prompts, window: data.window };
    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert(
        { key: SR_KEY, value: value as never, updated_at: new Date().toISOString(), updated_by: context.userId },
        { onConflict: "key" },
      );
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "situation_room.update_limits",
      target_table: "app_settings",
      target_id: SR_KEY,
      details: value as never,
    });
    return { ok: true, ...value };
  });

export const getSituationRoomMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const [extraRes, quotaRes] = await Promise.all([
      supabaseAdmin
        .from("lumi_events")
        .select("id", { count: "exact", head: true })
        .eq("event", "situation.extra_attempt_blocked")
        .gte("created_at", since),
      supabaseAdmin
        .from("lumi_events")
        .select("id", { count: "exact", head: true })
        .eq("event", "situation.quota_blocked")
        .gte("created_at", since),
    ]);
    return {
      extraAttemptsBlocked30d: extraRes.count ?? 0,
      quotaBlocks30d: quotaRes.count ?? 0,
    };
  });

// =============== Future Operator limits ===============

const FO_KEY = "future_operator.limits";

type FoLimits = {
  daily_quest_calls_per_user_per_day: number;
  drift_signals_per_user_per_day: number;
  reflection_calls_per_user_per_day: number;
  monthly_global_cap: number;
};

const FO_DEFAULTS: FoLimits = {
  daily_quest_calls_per_user_per_day: 1,
  drift_signals_per_user_per_day: 2,
  reflection_calls_per_user_per_day: 4,
  monthly_global_cap: 5000,
};

const FoLimitsInput = z.object({
  daily_quest_calls_per_user_per_day: z.number().int().min(0).max(10),
  drift_signals_per_user_per_day: z.number().int().min(0).max(10),
  reflection_calls_per_user_per_day: z.number().int().min(0).max(20),
  monthly_global_cap: z.number().int().min(0).max(1_000_000),
});

export const getFutureOperatorSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data } = await supabaseAdmin
      .from("app_settings").select("value, updated_at").eq("key", FO_KEY).maybeSingle();
    const raw = (data as { value?: Partial<FoLimits> } | null)?.value ?? {};
    return {
      ...FO_DEFAULTS,
      ...raw,
      updated_at: (data as { updated_at?: string } | null)?.updated_at ?? null,
    };
  });

export const updateFutureOperatorSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => FoLimitsInput.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const value: FoLimits = data;
    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert(
        { key: FO_KEY, value: value as never, updated_at: new Date().toISOString(), updated_by: context.userId },
        { onConflict: "key" },
      );
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "future_operator.update_limits",
      target_table: "app_settings",
      target_id: FO_KEY,
      details: value as never,
    });
    return { ok: true, ...value };
  });

export const getFutureOperatorMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const [blockedRes, deliveredRes, monthRes] = await Promise.all([
      supabaseAdmin
        .from("lumi_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "future_operator.budget_blocked")
        .gte("created_at", since),
      supabaseAdmin
        .from("future_operator_notifications")
        .select("id", { count: "exact", head: true })
        .gte("delivered_at", since),
      supabaseAdmin
        .from("future_operator_notifications")
        .select("id", { count: "exact", head: true })
        .gte("delivered_at", startOfMonth.toISOString()),
    ]);
    return {
      budgetBlocked30d: blockedRes.count ?? 0,
      delivered30d: deliveredRes.count ?? 0,
      deliveredMTD: monthRes.count ?? 0,
    };
  });
