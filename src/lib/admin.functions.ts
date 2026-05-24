import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
    const [posts, playbooks, subs, subscribers, purchases, surveys] = await Promise.all([
      supabaseAdmin.from("posts").select("id, published", { count: "exact", head: true }),
      supabaseAdmin.from("playbooks").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("subscribers").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("purchases").select("amount_cents").eq("status", "completed"),
      supabaseAdmin.from("survey_responses").select("id", { count: "exact", head: true }),
    ]);
    const revenueCents = (purchases.data ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);
    return {
      posts: posts.count ?? 0,
      playbooks: playbooks.count ?? 0,
      activeSubscriptions: subs.count ?? 0,
      subscribers: subscribers.count ?? 0,
      surveys: surveys.count ?? 0,
      revenueCents,
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
      .select("id, user_id, tier, status, current_period_end, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
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
