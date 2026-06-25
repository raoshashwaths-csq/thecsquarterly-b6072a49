import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const LeadSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(255),
  company: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  segment: z.string().trim().max(50).optional().default(""),
});

export const submitDiagnosticLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input)
  .handler(async ({ data }) => {
    const parsed = LeadSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error("Invalid lead capture payload.");
    }
    const { slug, name, email, company, title, segment } = parsed.data;

    const { error } = await supabaseAdmin.from("diagnostic_leads").insert({
      slug,
      name,
      email,
      company,
      title,
      segment: segment || null,
    });
    if (error) {
      console.error("submitDiagnosticLead error", error);
      // best-effort — surface but don't block the user
    }

    await supabaseAdmin
      .from("subscribers")
      .upsert(
        { email, source: `diagnostic:${slug}`, segment: "leader" },
        { onConflict: "email" },
      );

    return { ok: true };
  });
