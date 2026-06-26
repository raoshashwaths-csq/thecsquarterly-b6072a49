/**
 * STEP 6 — Process reviewer returns.
 *
 * Admin-only server function. Accepts an array of decisions parsed from the
 * returned reviewer file and applies them:
 *   - APPROVED  → translation_reviewed = true
 *   - CORRECTED → content = correction, translation_reviewed = true
 *   - REJECTED  → is_active = false
 *
 * Parsing the .txt file itself happens in the admin UI (or by hand); this
 * function takes the structured decisions.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DecisionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["APPROVED", "CORRECTED", "REJECTED"]),
  correction: z.string().trim().min(1).max(8000).optional(),
  reason: z.string().trim().max(1000).optional(),
});

const InputSchema = z.object({
  decisions: z.array(DecisionSchema).min(1).max(200),
});

export const applyReviewerDecisions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) {
      throw new Error("Forbidden: admin role required");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const results: Array<{ id: string; ok: boolean; error?: string }> = [];

    for (const d of data.decisions) {
      let update: Record<string, unknown> = {};
      if (d.status === "APPROVED") {
        update = { translation_reviewed: true };
      } else if (d.status === "CORRECTED") {
        if (!d.correction) {
          results.push({ id: d.id, ok: false, error: "missing_correction" });
          continue;
        }
        update = { translation_reviewed: true, content: d.correction };
      } else {
        update = { is_active: false };
      }

      const { error } = await supabaseAdmin
        .from("lumi_knowledge")
        .update(update)
        .eq("id", d.id);

      results.push({
        id: d.id,
        ok: !error,
        error: error?.message,
      });
    }

    const applied = results.filter((r) => r.ok).length;
    return { applied, total: data.decisions.length, results };
  });
