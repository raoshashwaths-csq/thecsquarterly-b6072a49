import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { QUESTIONS, calculateScore } from "./survey";

const SubmitSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(255),
  company: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  segment: z.string().trim().max(50).optional().default(""),
  hcm_status: z.string().trim().max(50).optional().default(""),
  answers: z.record(z.string().min(1).max(40), z.number().int().min(0).max(5)),
});

export const submitSurvey = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input)
  .handler(async ({ data }) => {
    const parsed = SubmitSchema.safeParse(data);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const field = first?.path.join(".") || "input";
      throw new Error(`Please check the ${field} field: ${first?.message ?? "invalid value"}.`);
    }
    const submission = parsed.data;

    // Validate every metric was answered.
    for (const q of QUESTIONS) {
      for (const m of q.metrics) {
        if (typeof submission.answers[m.id] !== "number") {
          throw new Error(`Missing answer for ${m.id}`);
        }
      }
    }

    // Server-side scoring — never trust client.
    const result = calculateScore(submission.answers);

    const { error } = await supabaseAdmin.from("survey_responses").insert({
      name: submission.name,
      email: submission.email,
      company: submission.company,
      role: submission.title,
      title: submission.title,
      segment: submission.segment || null,
      hcm_status: submission.hcm_status || null,
      answers: submission.answers,
      score: result.finalScore,
      tier: result.tier,
      foundational_score: Math.round(result.foundationalTotal * 10) / 10,
      agent_score: Math.round(result.agentTotal * 10) / 10,
      dimension_scores: result.dimensionScores,
    });
    if (error) {
      console.error("submitSurvey error", error);
      throw new Error("Could not save your responses.");
    }

    await supabaseAdmin
      .from("subscribers")
      .upsert(
        { email: submission.email, source: "ai-readiness-survey", segment: "leader" },
        { onConflict: "email" },
      );

    return result;
  });
