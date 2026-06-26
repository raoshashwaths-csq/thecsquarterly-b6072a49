// Onboarding completion — single transactional write that updates the user's
// profile and seeds 1-3 lumi_memory rows so Lumi has context from session one.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { recordMemoryFor } from "./lumi-memory.functions";

const Input = z.object({
  persona: z.string().min(1).max(40),
  acv_band: z.string().min(1).max(40),
  company_arr_range: z.string().min(1).max(40),
  challenges: z.array(z.string().min(1).max(40)).min(1).max(5),
  difficult_account: z.string().max(280).optional().default(""),
});

const CHALLENGE_LABEL: Record<string, string> = {
  churn_risk: "churn risk",
  expansion_motion: "expansion motion",
  stakeholder_coverage: "stakeholder coverage",
  team_capability: "team capability",
  ai_readiness: "AI readiness",
};

export const finishOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const { error: profileError } = await context.supabase
      .from("profiles")
      .update({
        persona: data.persona,
        acv_band: data.acv_band,
        company_arr_range: data.company_arr_range,
        challenges: data.challenges,
        difficult_account: data.difficult_account || null,
        onboarded_at: new Date().toISOString(),
      } as never)
      .eq("id", userId);
    if (profileError) throw new Error(profileError.message);

    const challengeText = data.challenges
      .map((c) => CHALLENGE_LABEL[c] ?? c)
      .join(", ");

    const seeds: Array<{
      memory_type: "situation" | "preference" | "account" | "framework" | "reading";
      content: string;
      source: string;
      pinned?: boolean;
    }> = [
      {
        memory_type: "preference",
        content: `Role: ${data.persona}. Manages ${data.acv_band} ACV at a ${data.company_arr_range} company. Focus areas: ${challengeText}.`,
        source: "onboarding",
        pinned: true,
      },
    ];
    if (data.difficult_account && data.difficult_account.trim().length > 4) {
      seeds.push({
        memory_type: "account",
        content: `Difficult account at onboarding: ${data.difficult_account.trim()}`,
        source: "onboarding",
      });
      seeds.push({
        memory_type: "situation",
        content: `Active situation: ${data.difficult_account.trim()}`,
        source: "onboarding",
      });
    }

    // Force-seed regardless of tier — cheap, useful on upgrade.
    await recordMemoryFor(userId, seeds, { force: true, embed: true });

    return { ok: true };
  });

export const getOnboardingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("onboarded_at, persona, acv_band, company_arr_range, challenges, difficult_account")
      .eq("id", context.userId)
      .maybeSingle();
    const row = data as
      | {
          onboarded_at: string | null;
          persona: string | null;
          acv_band: string | null;
          company_arr_range: string | null;
          challenges: string[] | null;
          difficult_account: string | null;
        }
      | null;
    return {
      onboarded: Boolean(row?.onboarded_at),
      profile: row,
    };
  });
