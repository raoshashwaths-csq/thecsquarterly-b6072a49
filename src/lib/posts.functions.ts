import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type Post = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  body: string;
  title_mckinsey: string | null;
  body_mckinsey: string | null;
  title_wodehouse: string | null;
  body_wodehouse: string | null;
  category: string;
  section: string;
  author: string;
  read_minutes: number;
  hero_prompt: string | null;
  cover_image_url: string | null;
  is_premium: boolean;
  tier: string;
  published: boolean;
  published_at: string;
  series_slug: string | null;
  series_title: string | null;
  series_part: number | null;
  series_total: number | null;
  sources: string | null;
};

const SELECT_COLS =
  "id, slug, title, subtitle, excerpt, body, title_mckinsey, body_mckinsey, title_wodehouse, body_wodehouse, category, section, author, read_minutes, hero_prompt, cover_image_url, is_premium, tier, published, published_at, series_slug, series_title, series_part, series_total, sources";


export const listPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select(SELECT_COLS)
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Post[];
});

export const listPostsBySection = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ section: z.string().min(1).max(40) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("posts")
      .select(SELECT_COLS)
      .eq("section", data.section)
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as Post[];
  });

export const getPost = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: post, error } = await supabaseAdmin
      .from("posts")
      .select(SELECT_COLS)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (post ?? null) as Post | null;
  });

export const listSeriesParts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ series_slug: z.string().min(1).max(80) }).parse(input),
  )
  .handler(async ({ data }) => {
    // Return ALL parts (including unpublished/future) — admin client bypasses RLS.
    // The UI uses published_at + published flags to mark which are locked vs available.
    const { data: rows, error } = await supabaseAdmin
      .from("posts")
      .select("slug, title, series_part, series_total, series_title, published, published_at, tier, is_premium")
      .eq("series_slug", data.series_slug)
      .order("series_part", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ----- Admin -----
const PostSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(1).max(300),
  subtitle: z.string().trim().max(500).optional().nullable(),
  excerpt: z.string().trim().min(1).max(800),
  body: z.string().trim().min(1).max(120000),
  title_mckinsey: z.string().trim().max(300).optional().nullable(),
  body_mckinsey: z.string().trim().max(120000).optional().nullable(),
  title_wodehouse: z.string().trim().max(300).optional().nullable(),
  body_wodehouse: z.string().trim().max(120000).optional().nullable(),
  category: z.string().trim().min(1).max(80),
  section: z.enum(["vanguard", "retention-protocol", "outcome-forum", "codex"]),
  author: z.string().trim().min(1).max(120).default("The Editors"),
  read_minutes: z.number().int().min(1).max(120).default(7),
  tier: z.enum(["free", "premium"]).default("free"),
  published: z.boolean().default(true),
  published_at: z.string().trim().max(40).optional().nullable(),
  cover_image_url: z.string().trim().max(500).optional().nullable(),
  series_slug: z.string().trim().max(80).regex(/^[a-z0-9-]+$/).optional().nullable(),
  series_title: z.string().trim().max(200).optional().nullable(),
  series_part: z.number().int().min(1).max(99).optional().nullable(),
  series_total: z.number().int().min(1).max(99).optional().nullable(),
  sources: z.string().trim().max(8000).optional().nullable(),
});


export const upsertPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PostSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");

    const { published_at, ...rest } = data;
    const payload: Record<string, unknown> = { ...rest, is_premium: data.tier === "premium" };
    if (published_at && published_at.trim()) payload.published_at = published_at;
    const { error } = await supabaseAdmin.from("posts").upsert(payload as never, { onConflict: "slug" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from("posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const PlaybookSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(1).max(300),
  summary: z.string().trim().min(1).max(800),
  body: z.string().trim().min(0).max(120000).default(""),
  category: z.string().trim().min(1).max(80).default("Framework"),
  price_cents: z.number().int().min(0).max(99900).default(4900),
  pages: z.number().int().min(1).max(500).default(12),
  included_in_vanguard: z.boolean().default(true),
  published: z.boolean().default(true),
  cover_image_url: z.string().trim().max(500).optional().nullable(),
});

export const upsertPlaybook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PlaybookSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from("playbooks").upsert(data, { onConflict: "slug" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePlaybook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from("playbooks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAllPostsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { data, error } = await supabaseAdmin
      .from("posts").select(SELECT_COLS).order("published_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Post[];
  });

export const listAllPlaybooksAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { data, error } = await supabaseAdmin
      .from("playbooks").select("*").order("published_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
