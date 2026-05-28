# SEO Defaults — Implementation Plan

Goal: replace the static SEO scaffolding with dynamic, data-driven endpoints that always reflect what's actually published, and add Article structured data on every post route.

Base URL across all outputs: `https://www.thecsquarterly.com`.

---

## 1. Dynamic `/sitemap.xml` (server route)

New file: `src/routes/sitemap[.]xml.ts`

- `GET` handler returns `application/xml`, `Cache-Control: public, max-age=3600`.
- Static entries (one per indexable page): `/`, `/insights`, `/vanguard`, `/retention-protocol`, `/outcome-forum`, `/codex`, `/ai-readiness`, `/pricing`, `/subscribe`, `/about`, `/job-board`, `/benchmarks`, `/directory`.
- Dynamic entries:
  - Pull all published posts via `supabaseAdmin.from("posts").select("slug, section, published_at").eq("published", true).lte("published_at", now())`.
  - Emit `/insights/{slug}` for every post (matches the actual route file).
  - Pull all playbooks via `supabaseAdmin.from("playbooks").select("slug, updated_at").eq("published", true)` → emit `/codex/{slug}`.
- Each `<url>` includes `<loc>`, `<lastmod>` (post `published_at` / playbook `updated_at`), and a reasonable `<changefreq>` / `<priority>` per section.
- Delete `public/sitemap.xml` (the static file would shadow the route at the same path).

## 2. `/rss.xml` feed (server route)

New file: `src/routes/rss[.]xml.ts`

- `GET` handler returns `application/rss+xml; charset=utf-8`.
- Channel metadata: title "The CS Quarterly", link to home, description from llms.txt intro, `language=en-us`, `lastBuildDate` = max `published_at`.
- Items: latest 50 published posts ordered by `published_at desc`:
  - `<title>` = post title
  - `<link>` and `<guid isPermaLink="true">` = `https://www.thecsquarterly.com/insights/{slug}`
  - `<description>` = excerpt (CDATA-wrapped, HTML-escaped)
  - `<pubDate>` = RFC 822 from `published_at`
  - `<category>` = post category
  - `<author>` when available
- `Cache-Control: public, max-age=900`.
- Add `<link rel="alternate" type="application/rss+xml" href="/rss.xml" title="The CS Quarterly" />` to `__root.tsx` head `links` so feed readers auto-discover it.

## 3. JSON-LD `Article` schema on post routes

Edit `src/routes/insights.$slug.tsx`:

- Extend the existing `head()` to add a `scripts` array with `type: "application/ld+json"` and a stringified `Article` schema using loaderData:
  - `@context`, `@type: "Article"`, `headline`, `description` (excerpt), `image` (cover_image_url, absolute URL when present), `datePublished` (published_at), `author: { @type: "Person", name }`, `publisher: { @type: "Organization", name: "The CS Quarterly", logo }`, `mainEntityOfPage` = canonical URL, `articleSection` (category).
- Also set `og:image` (and `twitter:image`) on the route head when `cover_image_url` exists — leaf only, per the head-meta rules.
- Canonical and og:url upgraded from relative to absolute `https://www.thecsquarterly.com/insights/{slug}` so crawlers/feed readers resolve correctly.

No change needed at `__root.tsx` beyond the RSS `<link>` (Organization/WebSite JSON-LD already lives there if present; if not, this plan does not add it — out of scope).

## 4. Refresh `public/robots.txt`

Edit in place; preserve existing block:

```
User-agent: *
Allow: /

# Block utility/auth surfaces and admin from index
Disallow: /ai-readiness/survey
Disallow: /admin
Disallow: /account
Disallow: /login
Disallow: /unsubscribe
Disallow: /agent/
Disallow: /api/

Sitemap: https://www.thecsquarterly.com/sitemap.xml
```

## 5. Refresh `public/llms.txt`

Rewrite to mirror the actual current route map (Vanguard, Retention Protocol, Outcome Forum, Codex, CSFactors, AI Readiness, Pricing, Subscribe, About, Job Board, Benchmarks) and list all currently published essays pulled by hand from the live DB. Keep the existing intro voice. Document the two-voice system, the 3-2-1 model, and `/rss.xml` discovery URL.

(This stays a static file — llms.txt is small, low-churn, and conventionally hand-curated. Future post additions update it manually; not worth a build step.)

---

## Files touched

- New: `src/routes/sitemap[.]xml.ts`
- New: `src/routes/rss[.]xml.ts`
- Edit: `src/routes/insights.$slug.tsx` (add JSON-LD + og:image + absolute URLs)
- Edit: `src/routes/__root.tsx` (add RSS `<link rel="alternate">`)
- Edit: `public/robots.txt` (expand disallows + Sitemap directive)
- Edit: `public/llms.txt` (refresh page list + add RSS link)
- Delete: `public/sitemap.xml` (replaced by server route)

## Verification

- After build, hit `/sitemap.xml` and `/rss.xml` in preview → expect valid XML with live post slugs.
- View source on any `/insights/{slug}` → expect one `<script type="application/ld+json">` Article block plus `og:image`.
- Trigger an SEO rescan once shipped to clear related findings.

## Out of scope

- llms.txt automation (kept static).
- Organization/WebSite JSON-LD in `__root.tsx` (already covered by existing root head, not part of this request).
- Per-section index pages (`/vanguard`, etc.) getting JSON-LD — only post routes per the request.
