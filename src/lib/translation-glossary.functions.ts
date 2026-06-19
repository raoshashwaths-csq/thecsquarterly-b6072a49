import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LANGS = ["ar", "id", "vi", "th"] as const;

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  term: z.string().min(1),
  protection_type: z.enum(["never_translate", "fixed_translation"]),
  category: z.enum(["brand", "metric", "feature_name", "role", "jargon"]).nullable().optional(),
  fixed_translations: z.record(z.string(), z.string()).optional(),
  notes: z.string().nullable().optional(),
  pending_review: z.boolean().optional(),
});

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error || !data) throw new Error("Admin only");
}

export const listGlossary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("translation_glossary")
      .select("*")
      .order("protection_type", { ascending: true })
      .order("term", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertGlossaryTerm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => UpsertSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const row: Record<string, unknown> = {
      term: data.term.trim(),
      protection_type: data.protection_type,
      category: data.category ?? null,
      notes: data.notes ?? null,
      pending_review: data.pending_review ?? false,
      fixed_translations:
        data.protection_type === "fixed_translation"
          ? Object.fromEntries(LANGS.map((l) => [l, (data.fixed_translations?.[l] ?? "").trim() || "[PENDING NATIVE REVIEW]"]))
          : {},
    };
    if (data.id) row.id = data.id;
    const { data: out, error } = await context.supabase
      .from("translation_glossary")
      .upsert([row] as any, { onConflict: "id" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return out;
  });

export const deleteGlossaryTerm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("translation_glossary").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markGlossaryConfirmed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("translation_glossary")
      .update({ pending_review: false })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
