import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  normalizeTier,
  isPaid,
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
        label: (paidSubs.find((s) => s.designation === d)?.label) ?? d,
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
    let subByUser: Record<string, string> = {};
    let methodByUser: Record<string, string> = {};
    if (ids.length) {
      const [subs2, identitiesLikely] = await Promise.all([
        supabaseAdmin.from("subscriptions").select("user_id, tier, status").in("user_id", ids),
        Promise.resolve({ data: [] as Array<{ user_id: string; provider: string }> }),
      ]);
      (subs2.data ?? []).forEach((s) => {
        if (s.status === "active" && s.tier !== "free") subByUser[s.user_id] = s.tier;
      });
      latestProfiles.forEach((p) => {
        methodByUser[p.id] = "Email";
      });
      void identitiesLikely;
    }

    const latestRegistrations = latestProfiles.map((p) => ({
      id: p.id as string,
      email: (p.email as string) ?? "—",
      display_name: (p.display_name as string) ?? "",
      created_at: p.created_at as string,
      method: methodByUser[p.id] ?? "Email",
      tier: subByUser[p.id] ?? "free",
    }));

    return {
      mrrCents,
      paidSubscribers: paidSubs.length,
      activeJobs: jobsRes.count ?? 0,
      agentSessionsMTD: qMTDRes.count ?? 0,
      series: days,
      latestRegistrations,
    };
  });

// =============== Agent Observability ===============

export const getAgentObservability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();

    const [total, recent] = await Promise.all([
      supabaseAdmin.from("q_runs").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("q_runs")
        .select("id, user_id, node_id, witty, shared, created_at, context, zones")
        .gte("created_at", since30)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const runs = recent.data ?? [];

    // Token burn estimate: each run ≈ 1500 in + 900 out tokens (heuristic).
    const tokensPerRun = 2400;
    const totalTokenBurn = (total.count ?? 0) * tokensPerRun;

    // Latency heuristic from json size — until we persist real latency.
    let latencySum = 0;
    let latencyN = 0;
    runs.forEach((r) => {
      const size = JSON.stringify(r.zones ?? {}).length;
      // Rough proxy: 200ms baseline + 1ms per 100 chars
      latencySum += 200 + size / 100;
      latencyN++;
    });
    const avgLatencyMs = latencyN ? Math.round(latencySum / latencyN) : 0;

    // Cost estimate: $0.30 per 1M tokens (gemini flash blended); price to user $4 / session premium.
    const costUsd = (totalTokenBurn / 1_000_000) * 0.3;
    const revenueUsd = (total.count ?? 0) * 0.5; // attributed Q revenue per session proxy
    const profitMarginPct = revenueUsd > 0 ? Math.round(((revenueUsd - costUsd) / revenueUsd) * 100) : 0;

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
      const size = JSON.stringify(r.zones ?? {}).length;
      return {
        id: r.id as string,
        user_id: r.user_id as string,
        operator_email: profMap[r.user_id as string] ?? "—",
        node_id: r.node_id as string,
        latency_ms: Math.round(200 + size / 100),
        sentiment: r.witty ? "up" : "neutral",
        shared: !!r.shared,
        created_at: r.created_at as string,
      };
    });

    return {
      totalRuns: total.count ?? 0,
      totalTokenBurn,
      avgLatencyMs,
      costUsd: Math.round(costUsd * 100) / 100,
      revenueUsd: Math.round(revenueUsd * 100) / 100,
      profitMarginPct,
      treeFrequency,
      executionLogs,
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
      supabaseAdmin.from("subscriptions").select("user_id, tier, status, current_period_end"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("q_runs").select("user_id"),
    ]);

    const subMap: Record<string, { tier: string; status: string }> = {};
    (subsRes.data ?? []).forEach((s) => {
      if (!subMap[s.user_id] || s.status === "active") {
        subMap[s.user_id] = { tier: s.tier, status: s.status };
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

    return (profilesRes.data ?? []).map((p) => ({
      id: p.id as string,
      email: (p.email as string) ?? "—",
      display_name: (p.display_name as string) ?? "",
      created_at: p.created_at as string,
      tier: subMap[p.id]?.tier ?? "free",
      status: subMap[p.id]?.status ?? "inactive",
      is_admin: (roleSet[p.id] ?? []).includes("admin"),
      sessions_used: qUsage[p.id] ?? 0,
      seat_cap: 50, // default cap — wire to per-user override later
    }));
  });

export const manageUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      user_id: z.string().uuid(),
      action: z.enum([
        "grant-vanguard",
        "revoke-vanguard",
        "grant-admin",
        "revoke-admin",
        "revoke-sessions",
      ]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { user_id, action } = data;

    if (action === "grant-vanguard") {
      const ends = new Date(Date.now() + 365 * 86_400_000).toISOString();
      // Try update first, then insert if absent
      const { data: existing } = await supabaseAdmin
        .from("subscriptions").select("id").eq("user_id", user_id).maybeSingle();
      if (existing) {
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "active", tier: "vanguard", current_period_end: ends })
          .eq("user_id", user_id);
      } else {
        await supabaseAdmin
          .from("subscriptions")
          .insert({ user_id, status: "active", tier: "vanguard", current_period_end: ends } as never);
      }
    } else if (action === "revoke-vanguard") {
      await supabaseAdmin
        .from("subscriptions")
        .update({ status: "inactive", tier: "free" })
        .eq("user_id", user_id);
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
