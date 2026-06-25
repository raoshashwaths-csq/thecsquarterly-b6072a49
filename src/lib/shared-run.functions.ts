import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Public server functions for shared Lumi run viewing.
 *
 * - getSharedQRun: returns a run ONLY when shared=true. No auth needed,
 *   so off-site share links work for anonymous readers.
 * - unlockSharedRun: captures the viewer's email into `subscribers`
 *   (source = shared_run_unlock) so they can read past the 50% gate.
 *   The unlock itself is enforced client-side via localStorage — this
 *   fn's job is the email capture and gentle dedupe.
 */

type RunZones = { diagnosis: string; playbook: string; executable: string };

export const getSharedQRun = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const o = input as { runId?: string };
    if (!o.runId || typeof o.runId !== "string") throw new Error("runId required");
    return { runId: o.runId };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("q_runs")
      .select("id, node_id, context, witty, zones, shared, created_at")
      .eq("id", data.runId)
      .eq("shared", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("This Lumi run is private or no longer shared.");
    return {
      id: row.id as string,
      node_id: row.node_id as string,
      context: (row.context ?? {}) as Record<string, string>,
      witty: Boolean(row.witty),
      zones: (row.zones ?? { diagnosis: "", playbook: "", executable: "" }) as RunZones,
      shared: true,
      created_at: row.created_at as string,
    };
  });

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email")
  .max(255);

export const unlockSharedRun = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const o = input as { runId?: string; email?: string };
    if (!o.runId || typeof o.runId !== "string") throw new Error("runId required");
    const email = emailSchema.parse(o.email);
    return { runId: o.runId, email };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Confirm the run exists and is shared before recording an unlock —
    // protects against scraping the subscribers list via random IDs.
    const { data: run } = await supabaseAdmin
      .from("q_runs")
      .select("id")
      .eq("id", data.runId)
      .eq("shared", true)
      .maybeSingle();
    if (!run) throw new Error("This Lumi run is private or no longer shared.");

    const { data: existing } = await supabaseAdmin
      .from("subscribers")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabaseAdmin
        .from("subscribers")
        .insert({ email: data.email, source: "shared_run_unlock", segment: "reader" });
      if (error && !/duplicate key/i.test(error.message)) throw new Error(error.message);
    }

    return { ok: true as const, alreadySubscriber: Boolean(existing) };
  });
