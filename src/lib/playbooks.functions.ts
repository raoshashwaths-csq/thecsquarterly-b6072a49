import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

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
  unlocked: boolean;
};

const LIST_COLS =
  "id, slug, title, summary, cover_image_url, price_cents, pages, category, included_in_vanguard, published_at";
const FULL_COLS = `${LIST_COLS}, body`;
const PREVIEW_CHARS = 1500;

// Inspect the incoming request for a bearer token and return the verified
// userId, or null when the visitor is anonymous. Mirrors the validation in
// auth-middleware but is non-throwing so public reads still work.
async function getOptionalUserId(): Promise<string | null> {
  const req = getRequest();
  const auth = req?.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  if (!token) return null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const sb = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

async function isEntitled(userId: string | null, playbookId: string, includedInVanguard: boolean) {
  if (!userId) return false;
  // Admins always entitled.
  const { data: roles } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId);
  if ((roles ?? []).some((r) => r.role === "admin")) return true;
  // Active Vanguard subscription covers all Vanguard-included playbooks.
  if (includedInVanguard) {
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .eq("tier", "vanguard")
      .maybeSingle();
    if (sub) return true;
  }
  // Otherwise require a completed à-la-carte purchase.
  const { data: purchase } = await supabaseAdmin
    .from("purchases")
    .select("id")
    .eq("user_id", userId)
    .eq("item_type", "playbook")
    .eq("item_id", playbookId)
    .eq("status", "completed")
    .maybeSingle();
  return !!purchase;
}

export const listPlaybooks = createServerFn({ method: "GET" }).handler(async () => {
  // Never expose body in list views — even for entitled users; the detail
  // route is the authoritative entry point for full content.
  const { data, error } = await supabaseAdmin
    .from("playbooks")
    .select(LIST_COLS)
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({ ...p, body: "", unlocked: false })) as Playbook[];
});

export const getPlaybook = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: pb, error } = await supabaseAdmin
      .from("playbooks")
      .select(FULL_COLS)
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!pb) return null;

    const isFree = pb.price_cents === 0 && !pb.included_in_vanguard;
    if (isFree) return { ...pb, unlocked: true } as Playbook;

    const userId = await getOptionalUserId();
    const entitled = await isEntitled(userId, pb.id, pb.included_in_vanguard);
    if (entitled) return { ...pb, unlocked: true } as Playbook;

    // Non-entitled visitor: send only a preview slice of the body.
    const preview = (pb.body ?? "").slice(0, PREVIEW_CHARS);
    return { ...pb, body: preview, unlocked: false } as Playbook;
  });
