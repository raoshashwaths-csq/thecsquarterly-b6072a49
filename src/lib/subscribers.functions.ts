import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SubscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  source: z.string().trim().max(50).optional(),
  segment: z.enum(["leader", "manager", "other"]).optional(),
});

export const subscribe = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubscribeSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("subscribers")
      .upsert(
        { email: data.email, source: data.source ?? "site", segment: data.segment ?? "other" },
        { onConflict: "email" },
      );

    if (error) {
      console.error("subscribe error", error);
      throw new Error("Could not save your subscription. Please try again.");
    }

    return { ok: true as const, message: "You're in. Look out for the next dispatch." };
  });
