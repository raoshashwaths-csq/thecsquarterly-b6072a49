import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE_URL = "https://www.thecsquarterly.com";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(s: string): string {
  return `<![CDATA[${(s ?? "").replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function rfc822(d: string | null | undefined): string {
  try {
    return new Date(d ?? Date.now()).toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}

export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { data: posts } = await supabaseAdmin
          .from("posts")
          .select("slug, title, excerpt, author, category, published_at")
          .eq("published", true)
          .lte("published_at", new Date().toISOString())
          .order("published_at", { ascending: false })
          .limit(50);

        const lastBuild = rfc822(posts?.[0]?.published_at ?? null);

        const items = (posts ?? []).map((p) => {
          const url = `${BASE_URL}/insights/${p.slug}`;
          return [
            `    <item>`,
            `      <title>${escapeXml(p.title ?? "")}</title>`,
            `      <link>${url}</link>`,
            `      <guid isPermaLink="true">${url}</guid>`,
            `      <description>${cdata(p.excerpt ?? "")}</description>`,
            `      <pubDate>${rfc822(p.published_at)}</pubDate>`,
            p.category ? `      <category>${escapeXml(p.category)}</category>` : null,
            p.author ? `      <dc:creator>${escapeXml(p.author)}</dc:creator>` : null,
            `    </item>`,
          ]
            .filter(Boolean)
            .join("\n");
        });

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">`,
          `  <channel>`,
          `    <title>The CS Quarterly</title>`,
          `    <link>${BASE_URL}</link>`,
          `    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />`,
          `    <description>A weekly dispatch for Customer Success leaders and managers at SaaS companies $20M–$1B ARR. Essays on stakeholder management, escalation, negotiation, sales qualification, and AI in CS.</description>`,
          `    <language>en-us</language>`,
          `    <lastBuildDate>${lastBuild}</lastBuildDate>`,
          ...items,
          `  </channel>`,
          `</rss>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=900",
          },
        });
      },
    },
  },
});
