import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  author: string;
  read_minutes: number;
  hero_prompt: string | null;
  is_premium: boolean;
  published_at: string;
};

export const listPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("id, slug, title, excerpt, body, category, author, read_minutes, hero_prompt, is_premium, published_at")
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Post[];
});

export const getPost = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: post, error } = await supabaseAdmin
      .from("posts")
      .select("id, slug, title, excerpt, body, category, author, read_minutes, hero_prompt, is_premium, published_at")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (post ?? null) as Post | null;
  });
