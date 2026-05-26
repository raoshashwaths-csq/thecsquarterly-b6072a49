
# The CS Quarterly — Product Requirements Document
_Version: as of May 26, 2026_

---

## 1. Product Overview

**Name:** The CS Quarterly. Wordmark always set in serif display face with a colored period (`The CS Quarterly.`).

**One-line:** A weekly editorial publication and AI-readiness diagnostic platform for Customer Success operators at $20M–$1B ARR SaaS companies.

**Positioning:** Economist / Stratechery register for CS. Serious, opinionated, no hype. Operator-grade — not generalist marketing reading.

**Audience:** VPs, Directors, and Senior CSMs running revenue retention at SaaS companies between $20M and $1B ARR.

**Cadence:** One dispatch every Tuesday. Issues are called "dispatches," never posts or blogs.

**Core differentiator:** The Two-Voice System — every premium essay is written in two parallel registers (Analytical / Witty) and the reader toggles between them inline.

---

## 2. Editorial Model

### 2.1 The Two-Voice System
- **Analytical** (internal key `mckinsey`): McKinsey-style structured analysis. Default voice. Icon: `Glasses`.
- **Witty** (internal key `wodehouse`): Wodehouse-style narrative voice. Icon: `Smile`. Activates `tone-witty` CSS class which swaps accent to deeper patina gold.
- Posts carry optional `title_mckinsey` / `body_mckinsey` / `title_wodehouse` / `body_wodehouse`. Fallback to canonical `title` / `body` when a tone is missing.
- `ToneToggle` only renders when both tones exist.
- Toggling animates via `animate-tone-swap` keyframe.
- Non-subscribers: teaser of witty version, then `Paywall`. Subscribers: unlimited toggling.

### 2.2 Article Writing Rules
- Title, subtitle, and excerpt must each say something different. Never paraphrase title in excerpt. Never reuse excerpt as pull-quote.
- **3-2-1 model** for new essays: 3 facts, 2 insights, 1 actionable. Both tone variants must respect this structure; only the register changes.
- Categories used: Stakeholder Management, Escalation, Sales Qualification, Negotiation, AI in CS.

### 2.3 Sections
| Section | Route | Purpose |
|---|---|---|
| The CS Vanguard | `/vanguard` | News & field reports |
| The Retention Protocol | `/retention-protocol` | Playbooks & frameworks |
| The Outcome Forum | `/outcome-forum` | Community essays & debate |
| The CS Codex | `/codex` | Reference material & definitions |

All four powered by `SectionPage.tsx` + `listPostsBySection`.

### 2.4 Multi-Part Series (newly added)
- Posts carry `series_slug`, `series_title`, `series_part`, `series_total`, `sources`.
- Series posts auto-render a two-column layout with a `SeriesRail` sidebar showing Roman-numeral instalments (I–IX), each marked Available / Reading now / Locked (with release date).
- Sources rendered as a "Sources & further reading" block at article foot.

---

## 3. Monetization

### 3.1 Tiers
- **Free Briefing:** weekly dispatch, Retention Ledger ticker, public archive, free top-line AI Readiness score.
- **Vanguard (paid):** all Free + unlimited tone toggle, full premium archive, full Codex, AI Readiness Custom Blueprint (12-page report), quarterly NRR / Payback Period data drops, members-only escalation & QBR templates.
- Posts flagged `is_premium` show preview + `Paywall` for non-subscribers. Gating combines `tier`, `is_premium`, and `published_at <= now()` for scheduled release.

### 3.2 Payments
- Stripe via Lovable's native payments integration. Monthly + annual plans.
- Webhook: `/api/public/stripe-webhook` with signature verification.
- Playbooks support à-la-carte pricing (`price_cents`) and bundled-in-Vanguard flag.

---

## 4. Routes & Pages

**Built:**
`/`, `/insights` + `/insights/$slug`, `/vanguard`, `/retention-protocol`, `/outcome-forum`, `/codex` + `/codex/$slug`, `/ai-readiness` + `/ai-readiness/survey` + `/ai-readiness/results`, `/pricing`, `/subscribe`, `/login`, `/account`, `/admin`, `/about`.

**Approved, not yet built:** `/jobs` (CS job board, affiliate-monetized), `/community` ("The Guild Hall"), `/salary-benchmarks`, `/sponsorship`, `/playbooks` (index), `/events`.

Each route has its own `head()` with unique title, description, og:title, og:description. og:image only on leaf routes (dynamic for `$slug` from loader data).

---

## 5. Site Chrome Rules

### Header
- No Pricing link. No Subscribe button.
- Section nav: Vanguard, Retention Protocol, Outcome Forum, Codex.
- Logged-out: Sign-in as last item.
- Logged-in: circular avatar dropdown (Google-style) as last item.

### Footer
- Pricing, Subscribe, About, social/legal.

---

## 6. AI Readiness Diagnostic

- 6-minute survey, 8 dimensions, 32 metrics.
- Tiers: Block → Emerging → Ready → Leading → AI Native.
- Server-side scoring via `createServerFn` (logic not exposed client-side).
- Captures email + company + role + answers; persists score, tier, dimension breakdown, segment, agent/foundational sub-scores, HCM status, report_unlocked flag.
- Results: free top-line score for everyone; full Custom Blueprint (12-page report) gated to Vanguard.

---

## 7. Visual Design System

### Typography
- Display: `Newsreader` → Source Serif 4 → Georgia.
- Body: `Source Serif 4` → Lora → Georgia.
- Mono / eyebrows: `JetBrains Mono`.
- Eyebrows: mono, uppercase, tracking `[0.25em–0.3em]`, 10–11px, often `text-accent` or `text-secondary-accent`.
- Headlines: `text-5xl md:text-7xl`, `leading-[0.95]`, `tracking-tight`, `text-balance`.

### Palette
- Light: cream off-white bg, near-black foreground, oxblood accent, soft gold secondary.
- Dark: `#1a1a1a` bg, cream text, warm coral-red accent, gold secondary.
- All colors in `oklch` semantic tokens in `src/styles.css`. Never hardcode hex or use raw `text-white` / `bg-black`.

### Layout language
- Asymmetric editorial grid, generous whitespace, hairline `border-border` dividers, giant display headlines with mono eyebrow above every section.

### Texture & motion
- `paper-grain` class on `<body>` globally (controlled by `--paper-grain-opacity`, default `0.06`; dark mode variant exists).
- Animations: `animate-fade-up` (page entry), `animate-tone-swap` (voice toggle).

---

## 8. Architecture & Stack

- **Framework:** TanStack Start v1 + Vite 7 + React 19, deployed to Cloudflare Workers.
- **Styling:** Tailwind v4 (native `@import` + theme vars in `src/styles.css`), shadcn primitives.
- **Backend:** Lovable Cloud (Supabase under the hood). RLS enforced everywhere.
- **Server logic:** `createServerFn` from `@tanstack/react-start` for app logic. `src/routes/api/public/*` for webhooks (always signature-verified). No Supabase Edge Functions.
- **Auth:** standard email + Google (`providers: ["google"]`). Never anonymous sign-ups. Never auto-confirm email unless explicitly requested.
- **Roles:** separate `user_roles` table + `has_role()` security definer. Never on `profiles`.
- **Routing:** flat file-based in `src/routes/`. Never `src/pages/`. Never edit `routeTree.gen.ts`.
- **Data loading:** loader uses `ensureQueryData(queryOptions)`, component reads via `useSuspenseQuery`. No `useEffect + fetch` for initial render.
- **Never touch:** `src/integrations/supabase/{client,client.server,auth-middleware,auth-attacher,types}.ts`, `.env`, project-level `supabase/config.toml`.

---

## 9. Data Model (current Supabase schema)

| Table | Purpose | Key columns |
|---|---|---|
| `posts` | All dispatches | slug, title, subtitle, excerpt, body, `title_mckinsey`, `body_mckinsey`, `title_wodehouse`, `body_wodehouse`, category, section, author, read_minutes, hero_prompt, cover_image_url, `is_premium`, `tier`, `published`, `published_at`, `series_slug`, `series_title`, `series_part`, `series_total`, `sources` |
| `playbooks` | Paid frameworks | slug, title, summary, body, category, `price_cents`, pages, `included_in_vanguard`, published, cover_image_url |
| `profiles` | User profile mirror | id (=auth.uid), display_name, email |
| `user_roles` | RBAC | user_id, role (enum `app_role`) |
| `subscribers` | Newsletter list | email, source, segment |
| `subscriptions` | Stripe sync | user_id, tier, status, stripe_customer_id, stripe_subscription_id, current_period_end |
| `purchases` | À-la-carte | user_id, item_type, item_id, amount_cents, status, stripe_session_id |
| `survey_responses` | AI Readiness data | email, company, role, name, title, answers, score, tier, dimension_scores, agent_score, foundational_score, hcm_status, segment, report_unlocked |

### RLS highlights
- `posts` SELECT: `published AND published_at <= now() AND (free-tier OR active Vanguard sub) OR admin`. Enforces scheduled release + tier gating in one policy.
- `subscribers`, `survey_responses`: INSERT open to anyone; SELECT admin-only.
- `user_roles`: admins manage; users can SELECT own.
- `playbooks`: published readable by all; admin writes.

---

## 10. Admin Surface (`/admin`)

- Single-admin route gated by `has_role(auth.uid(),'admin')`.
- CRUD on `posts` and `playbooks` via `upsertPost` / `deletePost` / `upsertPlaybook` / `deletePlaybook` server functions.
- Editor supports both tone variants (analytical/witty toggle) inline.
- Schema validation via Zod (`PostSchema`, `PlaybookSchema`).

---

## 11. SEO & Distribution

- Per-route `head()` metadata; unique titles & descriptions per page.
- `og:image` only at leaf routes; for `$slug` derived from loader data.
- `sitemap.xml`, `robots.txt`, `llms.txt`, JSON-LD `Article` schema on posts, `/rss.xml` feed.
- Custom domains: `thecsquarterly.com`, `www.thecsquarterly.com`. Published: `thecsquarterly.lovable.app`.

---

## 12. Security Posture

- All tables RLS-enforced; admin paths double-check via `has_role()` in server functions before mutating.
- Webhooks verify HMAC signatures via `timingSafeEqual`.
- Service-role client (`client.server.ts`) never imported in client code.
- Recent finding (subscribers SELECT) reviewed: acceptable — no SELECT policy exists for non-admins; only admins can read.

---

## 13. Active Series

**"The Structural Reckoning"** — 9-part series on AI's impact on Customer Success.
- One part released per Tuesday, May 26 → Jul 21, 2026.
- Both tone variants drafted for all 9 parts via Lovable AI.
- Scheduled via `published_at`; SeriesRail sidebar shows locked/unlocked state automatically.
- Sources collected per part, rendered at article foot.

---

## 14. Open / In-Flight Work

- Seed remaining 8 parts (II–IX) of The Structural Reckoning with scheduled `published_at`.
- Extend admin `PostSchema` to expose series fields in the editor UI.
- Build the queued monetization routes (`/jobs`, `/community`, `/salary-benchmarks`, `/sponsorship`, `/playbooks`, `/events`).

---

## 15. Non-Goals / Explicit Don'ts

- No emoji, no "🚀 game-changing" copy, no growth-hacker tone.
- No Pricing or Subscribe button in the header.
- No anonymous auth, no auto-confirm email, no Supabase Edge Functions.
- No raw color classes in components; semantic tokens only.
- No hash-anchor primary navigation between content sections.
- Never refer to dispatches as "posts" or "blogs" in user-facing copy.
