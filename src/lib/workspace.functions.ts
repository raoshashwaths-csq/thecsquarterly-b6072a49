import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- annotations ----------
const AnnotationInput = z.object({
  slug: z.string().min(1).max(200),
  kind: z.enum(["highlight", "note"]),
  text: z.string().min(1).max(10000),
  note: z.string().max(10000).optional().nullable(),
});

export const listAnnotations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().min(1).max(200).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase
      .from("user_annotations")
      .select("id, slug, kind, text, note, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (data.slug) q = q.eq("slug", data.slug);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { annotations: rows ?? [] };
  });

export const createAnnotation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnnotationInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("user_annotations")
      .insert({ user_id: userId, ...data })
      .select("id, slug, kind, text, note, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { annotation: row };
  });

export const deleteAnnotation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("user_annotations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- workspace items ----------
const WorkspaceItemInput = z.object({
  kind: z.enum(["link", "asset"]),
  title: z.string().min(1).max(500),
  url: z.string().max(2000).optional().nullable(),
  size_bytes: z.number().int().nonnegative().optional().nullable(),
  mime_type: z.string().max(200).optional().nullable(),
  tag: z.string().min(1).max(100).default("General"),
});

export const listWorkspaceItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_workspace_items")
      .select("id, kind, title, url, size_bytes, mime_type, tag, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const createWorkspaceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => WorkspaceItemInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("user_workspace_items")
      .insert({ user_id: userId, ...data })
      .select("id, kind, title, url, size_bytes, mime_type, tag, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { item: row };
  });

export const deleteWorkspaceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("user_workspace_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- bulk migration from localStorage ----------
export const bulkImportWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      annotations: z.array(AnnotationInput).max(500).optional().default([]),
      items: z.array(WorkspaceItemInput).max(500).optional().default([]),
    }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let importedAnn = 0;
    let importedItems = 0;
    if (data.annotations.length) {
      const { error, count } = await supabase
        .from("user_annotations")
        .insert(data.annotations.map((a) => ({ user_id: userId, ...a })), { count: "exact" });
      if (!error) importedAnn = count ?? data.annotations.length;
    }
    if (data.items.length) {
      const { error, count } = await supabase
        .from("user_workspace_items")
        .insert(data.items.map((i) => ({ user_id: userId, ...i })), { count: "exact" });
      if (!error) importedItems = count ?? data.items.length;
    }
    return { importedAnn, importedItems };
  });
