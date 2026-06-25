import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const inputSchema = z.object({
  sectionSlug: z.string().min(1).max(64),
  itemSlug: z.string().min(1).max(128),
  vote: z.union([z.literal(1), z.literal(-1)]),
  locale: z.string().min(2).max(8),
});

export const submitFaqFeedback = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const { error } = await supabase.from("faq_feedback").insert({
      section_slug: data.sectionSlug,
      item_slug: data.itemSlug,
      vote: data.vote,
      locale: data.locale,
    });

    if (error) {
      console.error("[faq-feedback] insert failed", error);
      return { ok: false as const };
    }
    return { ok: true as const };
  });
