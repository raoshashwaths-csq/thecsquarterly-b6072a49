/**
 * Future Operator — client-callable server functions.
 *
 * All user-scoped reads go through `context.supabase` (RLS as the user).
 * Anything that writes Future Operator notifications or generates new
 * messages calls into `future-operator.server.ts` via dynamic import.
 *
 * Tier gate: Practitioner+ only. Lower tiers receive a Forbidden error and
 * the UI shows an upsell card.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DESIGNATION_RANK, tierToDesignation, type Designation } from "@/lib/entitlements";

async function userDesignation(
  supabase: Awaited<ReturnType<typeof import("@/integrations/supabase/auth-middleware")["requireSupabaseAuth"]>["context"]>["supabase"] extends infer T ? T : never,
  userId: string,
): Promise<Designation> {
  const { data: isAdmin } = await (supabase as { rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: boolean | null }> }).rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (isAdmin) return "strategic_partner";
  const { data: sub } = await (supabase as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (k: string, v: string) => {
          eq: (k: string, v: string) => {
            maybeSingle: () => Promise<{ data: { tier: string | null; designation: string | null } | null }>;
          };
        };
      };
    };
  })
    .from("subscriptions")
    .select("tier, designation")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (!sub) return "reader";
  return ((sub.designation as Designation | null) ?? tierToDesignation(sub.tier)) as Designation;
}

function assertPractitionerPlus(d: Designation): void {
  if (DESIGNATION_RANK[d] < DESIGNATION_RANK.practitioner) {
    throw new Error("future_operator_requires_practitioner");
  }
}

// ---------------------------------------------------------------------------
// getFutureOperatorProfile
// ---------------------------------------------------------------------------
export const getFutureOperatorProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const designation = await userDesignation(context.supabase, context.userId);
    const eligible = DESIGNATION_RANK[designation] >= DESIGNATION_RANK.practitioner;
    if (!eligible) return { eligible: false as const, designation, profile: null, notifications: [] };

    const [{ data: profile }, { data: notifications }] = await Promise.all([
      context.supabase
        .from("future_operator_profiles")
        .select("*")
        .eq("user_id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("future_operator_notifications")
        .select("id, type, message, subtext, action_label, action_route, delivered_at, read_at, acted_on_at, quest_id, quest_completed")
        .eq("user_id", context.userId)
        .order("delivered_at", { ascending: false })
        .limit(40),
    ]);

    return {
      eligible: true as const,
      designation,
      profile: profile ?? null,
      notifications: notifications ?? [],
    };
  });

// ---------------------------------------------------------------------------
// saveFutureOperatorOnboarding
// ---------------------------------------------------------------------------
const OnboardingInput = z.object({
  future_team_state: z.string().min(1).max(400),
  core_commitments: z.array(z.string().min(1).max(280)).min(1).max(3),
  current_focus_account: z.string().max(280).optional().default(""),
  timezone: z.string().min(1).max(64).optional().default("UTC"),
});

export const saveFutureOperatorOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => OnboardingInput.parse(d))
  .handler(async ({ context, data }) => {
    const designation = await userDesignation(context.supabase, context.userId);
    assertPractitionerPlus(designation);

    const { error } = await context.supabase
      .from("future_operator_profiles")
      .upsert(
        {
          user_id: context.userId,
          future_team_state: data.future_team_state,
          core_commitments: data.core_commitments,
          current_focus_account: data.current_focus_account || null,
          timezone: data.timezone,
        } as never,
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);

    // Kick the intro message generation server-side.
    const { generateIntroMessageFor } = await import("./future-operator.server");
    await generateIntroMessageFor(context.userId);
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// completeQuest
// ---------------------------------------------------------------------------
const CompleteInput = z.object({ questId: z.string().min(1).max(40) });

export const completeQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CompleteInput.parse(d))
  .handler(async ({ context, data }) => {
    const designation = await userDesignation(context.supabase, context.userId);
    assertPractitionerPlus(designation);

    const { data: profile } = await context.supabase
      .from("future_operator_profiles")
      .select("active_quests")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!profile) throw new Error("no_profile");

    type Quest = { id: string; label?: string; lumi_followup?: string; completed?: boolean };
    const quests = Array.isArray(profile.active_quests) ? (profile.active_quests as Quest[]) : [];
    const target = quests.find((q) => q.id === data.questId);
    if (!target) throw new Error("quest_not_found");

    const updated = quests.map((q) => (q.id === data.questId ? { ...q, completed: true } : q));
    await context.supabase
      .from("future_operator_profiles")
      .update({ active_quests: updated as never } as never)
      .eq("user_id", context.userId);

    // Generate the reflection prompt (admin-budget metered).
    if (target.lumi_followup) {
      const { generateReflectionPromptFor } = await import("./future-operator.server");
      try {
        await generateReflectionPromptFor(context.userId, "quest_completed", {
          quest_id: target.id,
          quest_label: target.label,
          lumi_followup: target.lumi_followup,
        });
      } catch {
        // Budget block is a soft fail — quest still flips to completed.
      }
    }

    return { ok: true, allComplete: updated.every((q) => q.completed) };
  });

// ---------------------------------------------------------------------------
// markNotificationRead / markAllRead / actOnNotification
// ---------------------------------------------------------------------------
const NotifIdInput = z.object({ id: z.string().uuid() });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => NotifIdInput.parse(d))
  .handler(async ({ context, data }) => {
    await context.supabase
      .from("future_operator_notifications")
      .update({ read_at: new Date().toISOString() } as never)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .is("read_at", null);
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase
      .from("future_operator_notifications")
      .update({ read_at: new Date().toISOString() } as never)
      .eq("user_id", context.userId)
      .is("read_at", null);
    return { ok: true };
  });

export const actOnNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => NotifIdInput.parse(d))
  .handler(async ({ context, data }) => {
    await context.supabase
      .from("future_operator_notifications")
      .update({ acted_on_at: new Date().toISOString() } as never)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// pause / resume
// ---------------------------------------------------------------------------
const PauseInput = z.object({ days: z.number().int().min(1).max(60) });

export const pauseFutureOperator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PauseInput.parse(d))
  .handler(async ({ context, data }) => {
    const until = new Date();
    until.setDate(until.getDate() + data.days);
    await context.supabase
      .from("future_operator_profiles")
      .update({ paused_until: until.toISOString() } as never)
      .eq("user_id", context.userId);
    return { ok: true, paused_until: until.toISOString() };
  });

export const resumeFutureOperator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase
      .from("future_operator_profiles")
      .update({ paused_until: null } as never)
      .eq("user_id", context.userId);
    return { ok: true };
  });
