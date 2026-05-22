
# CS Newsletter & AI Readiness Hub — Build Plan

A two-phase build. Phase 1 ships a fast, credible marketing site + lead capture. Phase 2 turns it into a paid subscription product.

## Phase 1 — Marketing site + newsletter + survey

### Pages (separate routes, each with its own SEO metadata)

- `/` Home — value prop for CS leaders and managers, newsletter signup hero, featured insights, link to survey.
- `/insights` Articles & news hub — filterable list (News, Tips & Tricks, Playbooks). Categories: Stakeholder Management, Escalation, Sales Qualification, Negotiation, AI in CS.
- `/insights/$slug` Article detail page — long-form content with reading time, author, related posts, inline newsletter CTA.
- `/ai-readiness` Survey landing — explains the survey + CTA to start.
- `/ai-readiness/survey` The interactive survey (ported from your HTML).
- `/ai-readiness/results` Score + interpretation + email-gated full report.
- `/about` Editorial mission, audience, contact.
- `/subscribe` Standalone newsletter signup page (used for ad/social campaigns).

### Newsletter signup
- Email capture stored in Lovable Cloud (`subscribers` table) with source, segment (leader vs manager), and timestamp.
- Double opt-in confirmation email (Lovable Emails).
- Honeypot + basic rate limit on the submit server function.

### AI Readiness Survey
- Ported into a React route, sectioned by topic with progress bar.
- Server-side scoring via `createServerFn` so logic isn't exposed client-side.
- Capture: email + company + role → saves response + score to Cloud.
- Results page shows score, tier (Not Ready / Emerging / Ready / Leading), and 3 personalized recommendations.

### Content management (lightweight, Phase 1)
- Articles stored in a `posts` table (title, slug, category, excerpt, body MDX/markdown, hero_image, published_at, is_premium).
- Simple authenticated `/admin` route (single-admin role via `user_roles` table + `has_role()` security definer) to create/edit posts. No public signup yet.

### SEO & growth basics
- Per-route `head()` metadata, og:image on each article, sitemap.xml, robots.txt, llms.txt, JSON-LD `Article` schema on posts.
- RSS feed at `/rss.xml` so the newsletter content is syndicatable.

## Phase 2 — Paid subscriptions (monetization)

- Public auth (email + Google) for readers.
- Stripe via Lovable's built-in payments. Monthly + annual plans.
- Gate articles flagged `is_premium`; preview first ~200 words then paywall.
- Member dashboard: manage subscription, saved articles, survey history.
- Premium-only: full survey report PDF, deeper playbooks, templates library.

## What I need from you before building

1. **Upload the AI readiness survey HTML** (questions, scoring logic, current styling) so I can port it accurately.
2. **Brand direction** — name, tone, colors, typography. If you don't have one, I'll propose 3 design directions to pick from (editorial/serious, modern SaaS, bold editorial). 
3. Confirm Phase 1 scope above so I can begin.

## Technical notes

- Stack: TanStack Start + Tailwind v4 + shadcn (already scaffolded).
- Lovable Cloud (enabled in Phase 1) for DB, auth, storage, and transactional email.
- Tables (Phase 1): `posts`, `subscribers`, `survey_responses`, `user_roles`. All with RLS; admin writes via `has_role(auth.uid(),'admin')`.
- Server functions for: subscribe, submit-survey, score-survey, create/update/delete post.
- Phase 2 adds: `subscriptions` table synced from Stripe webhooks at `/api/public/stripe-webhook` with signature verification.

Once you upload the survey HTML and confirm, I'll start with Cloud setup + the marketing shell, then wire in the survey.
