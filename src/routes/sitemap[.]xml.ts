import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE_URL = "https://www.thecsquarterly.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/insights", changefreq: "daily", priority: "0.9" },
  { path: "/vanguard", changefreq: "weekly", priority: "0.8" },
  { path: "/retention-protocol", changefreq: "weekly", priority: "0.8" },
  { path: "/outcome-forum", changefreq: "weekly", priority: "0.7" },
  { path: "/codex", changefreq: "weekly", priority: "0.8" },
  { path: "/ai-readiness", changefreq: "monthly", priority: "0.8" },
  { path: "/pricing", changefreq: "monthly", priority: "0.7" },
  { path: "/subscribe", changefreq: "monthly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/job-board", changefreq: "daily", priority: "0.7" },
  { path: "/benchmarks", changefreq: "monthly", priority: "0.6" },
  { path: "/directory", changefreq: "weekly", priority: "0.5" },
];

function fmt(d: string | null | undefined): string | undefined {
  if (!d) return undefined;
  try {
    return new Date(d).toISOString();
  } catch {
    return undefined;
  }
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [...STATIC_ENTRIES];

        const { data: posts } = await supabaseAdmin
          .from("posts")
          .select("slug, published_at")
          .eq("published", true)
          .lte("published_at", new Date().toISOString());

        for (const p of posts ?? []) {
          entries.push({
            path: `/insights/${p.slug}`,
            lastmod: fmt(p.published_at),
            changefreq: "monthly",
            priority: "0.8",
          });
        }

        const { data: playbooks } = await supabaseAdmin
          .from("playbooks")
          .select("slug, published_at")
          .eq("published", true);

        for (const pb of playbooks ?? []) {
          entries.push({
            path: `/codex/${pb.slug}`,
            lastmod: fmt(pb.published_at),
            changefreq: "monthly",
            priority: "0.7",
          });
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
