import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SURVEY, scoreToTier } from "./survey";

const SubmitSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  company: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(200),
  answers: z.record(z.string().min(1).max(20), z.number().int().min(0).max(3)),
});

export const submitSurvey = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubmitSchema.parse(input))
  .handler(async ({ data }) => {
    // Server-side scoring — never trust client-sent score.
    let score = 0;
    for (const q of SURVEY) {
      const a = data.answers[q.id];
      const opt = q.options.find((o) => o.value === a);
      if (!opt) {
        throw new Error(`Missing answer for ${q.id}`);
      }
      score += opt.value;
    }

    const tier = scoreToTier(score);

    const { error } = await supabaseAdmin.from("survey_responses").insert({
      email: data.email,
      company: data.company,
      role: data.role,
      answers: data.answers,
      score,
      tier: tier.tier,
    });
    if (error) {
      console.error("submitSurvey error", error);
      throw new Error("Could not save your responses.");
    }

    // Also opt them into the newsletter (best-effort).
    await supabaseAdmin
      .from("subscribers")
      .upsert(
        { email: data.email, source: "ai-readiness-survey", segment: "leader" },
        { onConflict: "email" },
      );

    return { score, tier: tier.tier, blurb: tier.blurb, recommendations: tier.recommendations };
  });
