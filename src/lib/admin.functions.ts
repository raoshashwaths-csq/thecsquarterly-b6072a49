import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeTier, isPaid } from "@/lib/admin-tiers";

async function assertAdmin(userId: string) {
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
}

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const [posts, playbooks, activeSubs, subscribers, purchases, surveys] = await Promise.all([
      supabaseAdmin.from("posts").select("id, published", { count: "exact", head: true }),
      supabaseAdmin.from("playbooks").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("subscriptions")
        .select("tier, designation, status")
        .eq("status", "active"),
      supabaseAdmin.from("subscribers").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("purchases").select("amount_cents, status"),
      supabaseAdmin.from("survey_responses").select("id", { count: "exact", head: true }),
    ]);

    // MRR from active paid subs (real, lifetime-correct); legacy `completed`
    // purchases are added on top if/when Stripe/Paddle starts writing them.
    const paid = (activeSubs.data ?? [])
      .map((s) => normalizeTier({ tier: s.tier, designation: s.designation }))
      .filter((n) => isPaid(n.designation));
    const mrrCents = paid.reduce((sum, n) => sum + n.priceCents, 0);
    const arrCents = mrrCents * 12;
    const completedPurchaseCents = (purchases.data ?? [])
      .filter((r) => r.status === "completed")
      .reduce((s, r) => s + (r.amount_cents ?? 0), 0);

    return {
      posts: posts.count ?? 0,
      playbooks: playbooks.count ?? 0,
      activeSubscriptions: paid.length,
      subscribers: subscribers.count ?? 0,
      surveys: surveys.count ?? 0,
      mrrCents,
      arrCents,
      // Kept for backwards compatibility with any caller still reading it.
      revenueCents: completedPurchaseCents,
    };
  });

export const listSubscribers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("subscribers")
      .select("id, email, source, segment, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, tier, designation, status, current_period_end, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []).map((s) => {
      const n = normalizeTier({ tier: s.tier, designation: (s as { designation?: string | null }).designation ?? null });
      return {
        id: s.id as string,
        user_id: s.user_id as string,
        tier: n.designation,
        tier_label: n.label,
        status: s.status as string,
        current_period_end: s.current_period_end as string | null,
        created_at: s.created_at as string,
      };
    });
  });

export const listPurchases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("purchases")
      .select("id, user_id, item_type, item_id, amount_cents, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listSurveyResponses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("survey_responses")
      .select("id, email, name, company, role, score, tier, segment, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ============== Q. — operator agent ==============

export const getQAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [total, last7, last30, witty, shared, recent] = await Promise.all([
      supabaseAdmin.from("q_runs").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("q_runs").select("id", { count: "exact", head: true }).gte("created_at", since7),
      supabaseAdmin.from("q_runs").select("id", { count: "exact", head: true }).gte("created_at", since30),
      supabaseAdmin.from("q_runs").select("id", { count: "exact", head: true }).eq("witty", true),
      supabaseAdmin.from("q_runs").select("id", { count: "exact", head: true }).eq("shared", true),
      supabaseAdmin.from("q_runs").select("node_id, user_id, witty").gte("created_at", since30).limit(2000),
    ]);

    const trees: Record<string, number> = {};
    const userSet = new Set<string>();
    (recent.data ?? []).forEach((r: { node_id: string; user_id: string; witty: boolean }) => {
      const tree = (r.node_id || "").split("-")[0] || "?";
      trees[tree] = (trees[tree] ?? 0) + 1;
      if (r.user_id) userSet.add(r.user_id);
    });

    return {
      total: total.count ?? 0,
      last7: last7.count ?? 0,
      last30: last30.count ?? 0,
      wittyCount: witty.count ?? 0,
      sharedCount: shared.count ?? 0,
      uniqueOperators30: userSet.size,
      perTree30: trees,
    };
  });

export const listQRunsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: runs, error } = await supabaseAdmin
      .from("q_runs")
      .select("id, user_id, node_id, witty, shared, created_at, context")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    const ids = Array.from(new Set((runs ?? []).map((r) => r.user_id).filter(Boolean)));
    let profiles: Record<string, string> = {};
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .in("id", ids);
      profiles = Object.fromEntries((profs ?? []).map((p) => [p.id, p.email ?? ""]));
    }

    return (runs ?? []).map((r) => ({
      id: r.id as string,
      user_id: r.user_id as string,
      operator_email: profiles[r.user_id as string] ?? "—",
      node_id: r.node_id as string,
      witty: !!r.witty,
      shared: !!r.shared,
      created_at: r.created_at as string,
    }));
  });

export const listQEntitlementsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    // Anyone with admin role OR an active paid subscription (any designation) gets Q.
    const [adminsRes, subsRes] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin"),
      supabaseAdmin
        .from("subscriptions")
        .select("user_id, tier, designation, current_period_end, created_at")
        .eq("status", "active"),
    ]);

    const paidSubs = (subsRes.data ?? []).filter((s) => {
      const n = normalizeTier({ tier: s.tier, designation: (s as { designation?: string | null }).designation ?? null });
      return isPaid(n.designation);
    });

    const ids = new Set<string>();
    (adminsRes.data ?? []).forEach((r) => r.user_id && ids.add(r.user_id));
    paidSubs.forEach((r) => r.user_id && ids.add(r.user_id));
    const idList = Array.from(ids);

    let profiles: Record<string, string> = {};
    if (idList.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .in("id", idList);
      profiles = Object.fromEntries((profs ?? []).map((p) => [p.id, p.email ?? ""]));
    }

    const adminIds = new Set((adminsRes.data ?? []).map((r) => r.user_id));
    const subByUser = new Map(paidSubs.map((r) => [r.user_id, r] as const));

    return idList.map((uid) => {
      const sub = subByUser.get(uid);
      const n = sub
        ? normalizeTier({ tier: sub.tier, designation: (sub as { designation?: string | null }).designation ?? null })
        : null;
      return {
        user_id: uid,
        email: profiles[uid] ?? "—",
        is_admin: adminIds.has(uid),
        has_vanguard: !!sub,
        tier_label: n?.label ?? (adminIds.has(uid) ? "Admin" : "—"),
        renews: sub?.current_period_end ?? null,
        since: sub?.created_at ?? null,
      };
    });
  });
