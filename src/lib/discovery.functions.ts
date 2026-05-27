import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TREES } from "@/lib/q-trees";

export type SearchHit = {
  kind: "article" | "playbook" | "qtree" | "workspace" | "annotation";
  id: string;
  title: string;
  excerpt: string;
  href: string;
  readMinutes?: number;
  category?: string;
  score: number;
};

function scoreMatch(haystack: string, needle: string): number {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (!n) return 0;
  if (h === n) return 100;
  if (h.startsWith(n)) return 80;
  // Token overlap
  const tokens = n.split(/\s+/).filter(Boolean);
  let s = 0;
  for (const t of tokens) {
    const idx = h.indexOf(t);
    if (idx === -1) continue;
    s += 20 - Math.min(15, idx / 10); // earlier match scores higher
  }
  return s;
}

export const globalSearch = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ q: z.string().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data }) => {
    const q = data.q.trim();
    if (!q) return { hits: [] as SearchHit[] };

    const [postsRes, pbRes] = await Promise.all([
      supabaseAdmin
        .from("posts")
        .select("id, slug, title, subtitle, excerpt, category, section, read_minutes, published_at")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("playbooks")
        .select("id, slug, title, summary, category, pages")
        .eq("published", true)
        .limit(100),
    ]);

    const hits: SearchHit[] = [];

    for (const p of postsRes.data ?? []) {
      const blob = [p.title, p.subtitle, p.excerpt, p.category].filter(Boolean).join(" ");
      const s = scoreMatch(blob, q);
      if (s <= 0) continue;
      const sec = p.section === "codex" ? "/codex" : "/insights";
      hits.push({
        kind: "article",
        id: p.id,
        title: p.title,
        excerpt: p.excerpt ?? "",
        href: `${sec}/${p.slug}`,
        readMinutes: p.read_minutes ?? undefined,
        category: p.category ?? undefined,
        score: s + 5, // articles bias
      });
    }

    for (const pb of pbRes.data ?? []) {
      const blob = [pb.title, pb.summary, pb.category].filter(Boolean).join(" ");
      const s = scoreMatch(blob, q);
      if (s <= 0) continue;
      hits.push({
        kind: "playbook",
        id: pb.id,
        title: pb.title,
        excerpt: pb.summary ?? "",
        href: `/codex/${pb.slug}`,
        readMinutes: pb.pages ?? undefined,
        category: pb.category ?? undefined,
        score: s,
      });
    }

    for (const t of TREES) {
      const blob = [t.title, t.eyebrow, t.blurb].join(" ");
      const s = scoreMatch(blob, q);
      if (s <= 0) continue;
      hits.push({
        kind: "qtree",
        id: t.id,
        title: t.title,
        excerpt: t.blurb,
        href: `/agent/framework?tree=${t.id}`,
        category: t.eyebrow,
        score: s - 2,
      });
    }

    hits.sort((a, b) => b.score - a.score);
    return { hits: hits.slice(0, 24) };
  });

// Personalized "For You" — accepts optional score band derived client-side
// from the user's latest diagnostic. Anonymous callers get a curated default.
export const getForYou = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        band: z.enum(["foundational", "emerging", "operating", "scaling"]).nullish(),
        userEmail: z.string().email().nullish(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    // Pull a deep pool; pick across categories for variety.
    const { data: posts } = await supabaseAdmin
      .from("posts")
      .select("id, slug, title, subtitle, excerpt, category, section, read_minutes, published_at, is_premium")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(60);

    // If we know the email, pull their most recent diagnostic to derive a band.
    let band = data.band ?? null;
    if (!band && data.userEmail) {
      const { data: latest } = await supabaseAdmin
        .from("survey_responses")
        .select("tier, score, agent_score, foundational_score")
        .eq("email", data.userEmail)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latest?.tier) {
        const t = String(latest.tier).toLowerCase();
        if (t.includes("found")) band = "foundational";
        else if (t.includes("emerg")) band = "emerging";
        else if (t.includes("scal")) band = "scaling";
        else band = "operating";
      }
    }

    // Category preference by band.
    const order: Record<string, string[]> = {
      foundational: ["Stakeholder Management", "Escalation", "Sales Qualification"],
      emerging: ["Escalation", "Negotiation", "AI in CS"],
      operating: ["Negotiation", "AI in CS", "Stakeholder Management"],
      scaling: ["AI in CS", "Negotiation", "Sales Qualification"],
    };
    const preferred = (band && order[band]) || ["AI in CS", "Escalation", "Negotiation", "Stakeholder Management"];

    const pool = posts ?? [];
    const picked: typeof pool = [];
    const seen = new Set<string>();
    for (const cat of preferred) {
      const next = pool.find((p) => !seen.has(p.id) && (p.category ?? "") === cat);
      if (next) {
        picked.push(next);
        seen.add(next.id);
      }
    }
    for (const p of pool) {
      if (picked.length >= 4) break;
      if (!seen.has(p.id)) {
        picked.push(p);
        seen.add(p.id);
      }
    }

    return {
      band,
      picks: picked.slice(0, 4).map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle,
        excerpt: p.excerpt,
        category: p.category,
        section: p.section,
        readMinutes: p.read_minutes,
        isPremium: p.is_premium,
        href: `${p.section === "codex" ? "/codex" : "/insights"}/${p.slug}`,
      })),
    };
  });
