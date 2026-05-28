import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { Q_MONTHLY_CAP, type Designation, tierToDesignation } from "./entitlements";

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

async function resolveDesignation(userId: string): Promise<Designation> {
  const [{ data: roles }, { data: sub }] = await Promise.all([
    supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
    supabaseAdmin
      .from("subscriptions")
      .select("tier, status, designation")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
  ]);
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");
  if (isAdmin) return "strategic_partner";
  if (!sub) return "reader";
  const raw = ((sub as { designation?: string | null }).designation ?? null) as
    | Designation
    | null;
  return raw ?? tierToDesignation(sub.tier);
}

/** Count this user's q_runs since start of current UTC month. */
export async function countMonthlyQRuns(userId: string): Promise<number> {
  const since = startOfMonthISO();
  const { count, error } = await supabaseAdmin
    .from("q_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Throws Error("Q_MONTHLY_CAP_REACHED") when the user has hit their cap. */
export async function assertQUnderCap(userId: string): Promise<void> {
  const d = await resolveDesignation(userId);
  const cap = Q_MONTHLY_CAP[d];
  if (!Number.isFinite(cap)) return;
  const used = await countMonthlyQRuns(userId);
  if (used >= cap) {
    throw new Error("Q_MONTHLY_CAP_REACHED");
  }
}

export const getMonthlyQUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const d = await resolveDesignation(userId);
    const cap = Q_MONTHLY_CAP[d];
    const used = await countMonthlyQRuns(userId);
    return {
      used,
      cap: Number.isFinite(cap) ? cap : null, // null = unlimited
      designation: d,
    };
  });
