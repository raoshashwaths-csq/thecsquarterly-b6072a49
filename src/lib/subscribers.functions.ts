import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SubscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  source: z.string().trim().max(50).optional(),
  segment: z.enum(["leader", "manager", "other"]).optional(),
});

export const subscribe = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input)
  .handler(async ({ data }) => {
    const parsed = SubscribeSchema.safeParse(data);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const field = first?.path.join(".") || "input";
      throw new Error(`Please check the ${field} field: ${first?.message ?? "invalid value"}.`);
    }

    const { error } = await supabaseAdmin
      .from("subscribers")
      .upsert(
        { email: parsed.data.email, source: parsed.data.source ?? "site", segment: parsed.data.segment ?? "other" },
        { onConflict: "email" },
      );

    if (error) {
      console.error("subscribe error", error);
      throw new Error("Could not save your subscription. Please try again.");
    }

    return { ok: true as const, message: "You're in. Look out for the next dispatch." };
  });
