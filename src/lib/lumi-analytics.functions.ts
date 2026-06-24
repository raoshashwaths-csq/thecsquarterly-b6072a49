import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const EventSchema = z.object({
  event: z.enum([
    "tree.select",
    "drawer.open",
    "drawer.close",
    "tree.focus",
    "tree.unfocus",
    "diagnostic.cta_click",
    "diagnostic.survey_start",
    "diagnostic.submit",
    "article.signal.shown",
    "article.resume.shown",
    "article.resume.click",
    "article.resume.dismiss",
    "article.related.click",
  ]),
  treeId: z.string().max(32).optional(),
  briefingShown: z.boolean().optional(),
  messageCount: z.number().int().min(0).max(10_000).optional(),
  surface: z.string().max(64).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const logLumiEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EventSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Cast: lumi_events was just added; generated types refresh on next build.
    await (supabase.from("lumi_events" as never) as unknown as {
      insert: (row: Record<string, unknown>) => Promise<unknown>;
    }).insert({
      user_id: userId,
      event: data.event,
      tree_id: data.treeId ?? null,
      briefing_shown: data.briefingShown ?? false,
      message_count: data.messageCount ?? 0,
      meta: {
        surface: data.surface ?? null,
        ...(data.meta ?? {}),
      },
    });
    return { ok: true };
  });
