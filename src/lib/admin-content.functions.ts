/**
 * Homepage headlines + Felix & Nora comic strips: public reads for the
 * marketing routes and admin-gated CRUD for the newsroom.
 */
import { createServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-adapter";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { HeadlineSet } from "@/data/homepageHeadlines";
import type { Strip, StripPanel } from "@/data/strips";

function publicClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase env not configured");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

// ─── Homepage headlines ──────────────────────────────────────────────

function headlineRowToSet(row: any): HeadlineSet {
  const phrases = (row.phrases ?? []) as string[];
  return {
    id: row.slug as string,
    dayIndex: row.day_index as number,
    phrases: phrases as HeadlineSet["phrases"],
    line1: row.line1 as string,
    line2: row.line2 as string,
    fullText: row.full_text as string,
  };
}

export const getHeadlineForDayDB = createServerFn({ method: "GET" })
  .inputValidator((data: { dayIndex: number }) =>
    z.object({ dayIndex: z.number().int().min(0).max(6) }).parse(data),
  )
  .handler(async ({ data }): Promise<HeadlineSet | null> => {
    const sb = publicClient();
    const { data: row, error } = await sb
      .from("homepage_headlines" as any)
      .select("*")
      .eq("day_index", data.dayIndex)
      .maybeSingle();
    if (error || !row) return null;
    return headlineRowToSet(row);
  });

export const listHomepageHeadlinesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HeadlineSet[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("homepage_headlines" as any)
      .select("*")
      .order("day_index", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(headlineRowToSet);
  });

const HeadlinePatch = z.object({
  dayIndex: z.number().int().min(0).max(6),
  slug: z.string().min(1).max(120),
  phrases: z.array(z.string().min(1)).min(2).max(6),
  line1: z.string().min(1),
  line2: z.string().min(1),
  fullText: z.string().min(1),
});

export const upsertHomepageHeadline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.input<typeof HeadlinePatch>) => HeadlinePatch.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("homepage_headlines" as any)
      .upsert(
        {
          day_index: data.dayIndex,
          slug: data.slug,
          phrases: data.phrases,
          line1: data.line1,
          line2: data.line2,
          full_text: data.fullText,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "day_index" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Comic strips ────────────────────────────────────────────────────

export type ComicStripAdminRow = {
  id: string;
  slug: string;
  title: string;
  tag: string;
  hoverText: string;
  sortOrder: number;
  panels: StripPanel[];
  isPublished: boolean;
  updatedAt: string;
};

function stripRowToPublic(row: any): Strip {
  return {
    id: (row.sort_order ?? 0) as number,
    title: row.title as string,
    tag: row.tag as string,
    hoverText: row.hover_text as string,
    panels: (row.panels ?? []) as StripPanel[],
  };
}

function stripRowToAdmin(row: any): ComicStripAdminRow {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    tag: row.tag as string,
    hoverText: row.hover_text as string,
    sortOrder: (row.sort_order ?? 0) as number,
    panels: (row.panels ?? []) as StripPanel[],
    isPublished: !!row.is_published,
    updatedAt: row.updated_at as string,
  };
}

export const listPublishedComicStrips = createServerFn({ method: "GET" }).handler(
  async (): Promise<Strip[]> => {
    const sb = publicClient();
    const { data, error } = await sb
      .from("comic_strips" as any)
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return data.map(stripRowToPublic);
  },
);

export const listComicStripsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ComicStripAdminRow[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("comic_strips" as any)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(stripRowToAdmin);
  });

const PanelSchema = z.object({
  type: z.enum(["illustration", "dialogue", "single"]),
  stageDirection: z.string().optional(),
  imageAlt: z.string().optional(),
  bubbles: z
    .array(
      z.object({
        character: z.enum(["FELIX", "NORA", "BRENDAN"]),
        text: z.string().min(1),
        position: z.enum(["top", "bottom"]),
      }),
    )
    .optional(),
});

const StripPatch = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  tag: z.string().min(1).max(80),
  hoverText: z.string().min(1),
  sortOrder: z.number().int().min(0).max(9999),
  isPublished: z.boolean().default(true),
  panels: z.array(PanelSchema).min(1).max(6),
});

export const upsertComicStrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.input<typeof StripPatch>) => StripPatch.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const row = {
      slug: data.slug,
      title: data.title,
      tag: data.tag,
      hover_text: data.hoverText,
      sort_order: data.sortOrder,
      is_published: data.isPublished,
      panels: data.panels as any,
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("comic_strips" as any)
        .update(row)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("comic_strips" as any)
        .insert(row);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteComicStrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("comic_strips" as any)
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Panel image upload ──────────────────────────────────────────────

export const uploadPanelImage = createServerFn({ method: "POST" })
  .validator(zodValidator(z.object({
    fileBase64: z.string(),
    fileName: z.string(),
    contentType: z.string(),
  })))
  .handler(async ({ data }) => {
    const { requireRole } = await import("@/integrations/supabase/auth-middleware");
    await requireRole("admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const buffer = Buffer.from(data.fileBase64, "base64");
    const path = `panels/${Date.now()}_${data.fileName}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("comic-strip-panels")
      .upload(path, buffer, { contentType: data.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: urlData } = supabaseAdmin.storage
      .from("comic-strip-panels")
      .getPublicUrl(path);
    return { publicUrl: urlData.publicUrl };
  });

// ─── Strip context parser ────────────────────────────────────────────

export { parseStripContext } from "./strip-context-parser.functions";

// ─── Placements ──────────────────────────────────────────────────────

export const listStripsWithPlacements = createServerFn({ method: "GET" })
  .handler(async () => {
    const { requireRole } = await import("@/integrations/supabase/auth-middleware");
    await requireRole("admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: strips, error } = await supabaseAdmin
      .from("comic_strips")
      .select("id, title, tag, panels, sort_order, is_published")
      .order("sort_order");
    if (error) throw new Error(error.message);

    const { data: placements } = await supabaseAdmin
      .from("strip_placements")
      .select("*")
      .order("created_at", { ascending: false });

    return (strips ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      tag: s.tag,
      placements: (placements ?? []).filter((p) => p.strip_id === s.id),
    }));
  });

export const confirmPlacement = createServerFn({ method: "POST" })
  .validator(zodValidator(z.object({ id: z.string().uuid() })))
  .handler(async ({ data }) => {
    const { requireRole } = await import("@/integrations/supabase/auth-middleware");
    await requireRole("admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("strip_placements")
      .update({ confirmed: true })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePlacement = createServerFn({ method: "POST" })
  .validator(zodValidator(z.object({ id: z.string().uuid() })))
  .handler(async ({ data }) => {
    const { requireRole } = await import("@/integrations/supabase/auth-middleware");
    await requireRole("admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("strip_placements")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updatePlacementNote = createServerFn({ method: "POST" })
  .validator(zodValidator(z.object({ id: z.string().uuid(), note: z.string() })))
  .handler(async ({ data }) => {
    const { requireRole } = await import("@/integrations/supabase/auth-middleware");
    await requireRole("admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("strip_placements")
      .update({ admin_note: data.note })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Public: confirmed placements by target ─────────────────────────

export const getConfirmedPlacementsForTarget = createServerFn({ method: "GET" })
  .validator(zodValidator(z.object({
    targetType: z.enum(["post", "playbook"]),
    targetSlug: z.string(),
  })))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("strip_placements")
      .select("*, comic_strips(title, tag, panels)")
      .eq("target_type", data.targetType)
      .eq("target_slug", data.targetSlug)
      .eq("confirmed", true)
      .order("created_at");

    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id,
      stripId: r.strip_id,
      placement: r.placement,
      stripTitle: r.comic_strips?.title ?? "",
      stripTag: r.comic_strips?.tag ?? "",
      panels: r.comic_strips?.panels ?? [],
    }));
  });
