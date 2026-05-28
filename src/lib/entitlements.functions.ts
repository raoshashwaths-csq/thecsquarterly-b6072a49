import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  type Designation,
  Q_MONTHLY_CAP,
  rank,
  tierToDesignation,
} from "./entitlements";

export type MyEntitlements = {
  designation: Designation;
  rank: number;
  isAdmin: boolean;
  qMonthlyCap: number;
};

/** Server-authoritative designation for the current user. */
export const getMyEntitlements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyEntitlements> => {
    const userId = context.userId;

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

    let designation: Designation;
    if (isAdmin) {
      designation = "strategic_partner";
    } else if (sub) {
      const raw = ((sub as { designation?: string | null }).designation ?? null) as
        | Designation
        | null;
      designation = raw ?? tierToDesignation(sub.tier);
    } else {
      designation = "reader";
    }

    return {
      designation,
      rank: rank(designation),
      isAdmin,
      qMonthlyCap: Q_MONTHLY_CAP[designation],
    };
  });

/**
 * Throw if the current user's designation is below `min`.
 * Returns the resolved designation on success.
 */
export async function assertAtLeast(
  userId: string,
  min: Designation,
): Promise<Designation> {
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
  let d: Designation;
  if (isAdmin) {
    d = "strategic_partner";
  } else if (sub) {
    const raw = ((sub as { designation?: string | null }).designation ?? null) as
      | Designation
      | null;
    d = raw ?? tierToDesignation(sub.tier);
  } else {
    d = "reader";
  }
  if (rank(d) < rank(min)) {
    throw new Error(`TIER_REQUIRED:${min}`);
  }
  return d;
}
