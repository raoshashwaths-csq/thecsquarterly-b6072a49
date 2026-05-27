import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type MeResult = {
  userId: string;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
  subscriptionTier: "free" | "vanguard";
  subscriptionStatus: string;
};

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MeResult> => {
    const userId = context.userId;

    const [{ data: profile }, { data: roles }, { data: sub }] = await Promise.all([
      supabaseAdmin.from("profiles").select("email, display_name").eq("id", userId).maybeSingle(),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
      supabaseAdmin.from("subscriptions").select("tier, status").eq("user_id", userId).maybeSingle(),
    ]);

    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    // Admins get every feature unlocked — treated as active Vanguard.
    const tier: "free" | "vanguard" =
      isAdmin || (sub?.tier === "vanguard" && sub?.status === "active") ? "vanguard" : "free";

    return {
      userId,
      email: profile?.email ?? null,
      displayName: profile?.display_name ?? null,
      isAdmin,
      subscriptionTier: tier,
      subscriptionStatus: isAdmin ? "active" : (sub?.status ?? "inactive"),
    };
  });

async function assertAdmin(userId: string) {
  const { data: roles } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId);
  if (!(roles ?? []).some((r) => r.role === "admin")) {
    throw new Error("Checkout required — Stripe wires up next release.");
  }
}

// Placeholder "start subscription". ADMIN-ONLY until Stripe is wired —
// prevents regular users from self-granting Vanguard access.
export const startSubscriptionPlaceholder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const userId = context.userId;
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const { error } = await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: userId,
        tier: "vanguard",
        status: "active",
        current_period_end: periodEnd.toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Placeholder one-off purchase. ADMIN-ONLY until real checkout is wired.
export const recordPurchasePlaceholder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const o = input as { itemType?: string; itemId?: string; amountCents?: number };
    if (!o.itemType || !o.itemId || typeof o.amountCents !== "number") {
      throw new Error("Invalid purchase payload");
    }
    return { itemType: o.itemType, itemId: o.itemId, amountCents: o.amountCents };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("purchases").insert({
      user_id: context.userId,
      item_type: data.itemType,
      item_id: data.itemId,
      amount_cents: data.amountCents,
      status: "completed",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyPurchases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("purchases")
      .select("item_type, item_id, status, created_at")
      .eq("user_id", context.userId)
      .eq("status", "completed");
    if (error) throw new Error(error.message);
    return data ?? [];
  });
