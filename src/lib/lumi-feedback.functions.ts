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

    // One feedback row per (user, run). Upsert by (user_id, run_id).
    const { error } = await supabaseAdmin
      .from("lumi_feedback")
      .upsert(
        {
          user_id: context.userId,
          run_id: data.runId,
          rating: data.rating,
          note: data.note ?? null,
          processed: false,
          processed_at: null,
        },
        { onConflict: "user_id,run_id" },
      );

    if (error) {
      // Fallback when no unique index exists — plain insert.
      const { error: insErr } = await supabaseAdmin.from("lumi_feedback").insert({
        user_id: context.userId,
        run_id: data.runId,
        rating: data.rating,
        note: data.note ?? null,
        processed: false,
      });
      if (insErr) throw new Error(insErr.message);
    }

    return { ok: true };
  });
