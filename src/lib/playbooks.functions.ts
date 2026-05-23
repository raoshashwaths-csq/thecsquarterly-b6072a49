import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type Playbook = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  cover_image_url: string | null;
  price_cents: number;
  pages: number;
  body: string;
  category: string;
  included_in_vanguard: boolean;
  published_at: string;
};

export const listPlaybooks = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("playbooks")
    .select("id, slug, title, summary, cover_image_url, price_cents, pages, body, category, included_in_vanguard, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Playbook[];
});

export const getPlaybook = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: pb, error } = await supabaseAdmin
      .from("playbooks")
      .select("id, slug, title, summary, cover_image_url, price_cents, pages, body, category, included_in_vanguard, published_at")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (pb ?? null) as Playbook | null;
  });
