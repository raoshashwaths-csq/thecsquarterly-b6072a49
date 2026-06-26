/**
 * Lumi feedback — operator-facing thumbs up/down on a resolution.
 *
 * RLS: lumi_feedback is service_role-only, so writes go through supabaseAdmin
 * after requireSupabaseAuth has verified the caller. The caller's userId is
 * stamped on every row.
 *
 * Rating is stored as text to match existing workflow 4/5 conventions:
 *   "1"  = helpful (YES)
 *   "-1" = not quite (we capture an optional free-text note)
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({
  runId: z.string().uuid(),
  rating: z.enum(["1", "-1"]),
  note: z.string().trim().max(2000).optional(),
});

export const submitLumiFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // No unique index on (user_id, run_id) — do a manual upsert so the same
    // operator clicking YES then NOT QUITE updates the row instead of
    // creating duplicates.
    const { data: existing } = await supabaseAdmin
      .from("lumi_feedback")
      .select("id")
      .eq("user_id", context.userId)
      .eq("run_id", data.runId)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabaseAdmin
        .from("lumi_feedback")
        .update({
          rating: data.rating,
          note: data.note ?? null,
          processed: false,
          processed_at: null,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("lumi_feedback").insert({
        user_id: context.userId,
        run_id: data.runId,
        rating: data.rating,
        note: data.note ?? null,
        processed: false,
      });
      if (error) throw new Error(error.message);
    }

    return { ok: true };
  });
