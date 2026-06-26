import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
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

// Analytics fire from public routes too (e.g. /insights/$slug for signed-out
// readers), so we cannot gate this behind requireSupabaseAuth — that would
// 401 anonymous calls and blank the page. Instead: if a bearer is present
// resolve the user and write a row; otherwise silently no-op.
export const logLumiEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EventSchema.parse(input))
  .handler(async ({ data }) => {
    const authHeader = getRequestHeader("authorization");
    const token = authHeader?.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : null;
    if (!token) return { ok: true, skipped: true } as const;

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      },
    );

    const { data: userData } = await supabase.auth.getUser(token);
    const userId = userData?.user?.id;
    if (!userId) return { ok: true, skipped: true } as const;

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
    return { ok: true } as const;
  });
