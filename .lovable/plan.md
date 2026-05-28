## Goal

Premium articles currently get their body silently truncated to 1,200 chars by the server (`gatePremiumBody`) but the article route renders that truncated body as if it were the whole essay — no fade, no Paywall, no indication. Fix that so non-subscribers see a clear teaser + Paywall, and entitled users see the full body.

The Codex playbook page already does this correctly — we mirror its pattern for articles.

## Scope

In scope: `/insights/$slug` (the only article renderer that uses `getPost`).
Not in scope: section listing pages (they only show titles/excerpts), Codex (already gated), the 3-free-articles localStorage wall, pricing copy, new tiers.

## Changes

### 1. `src/lib/posts.functions.ts` — surface a `locked` flag

The client shouldn't have to re-derive entitlement (avoids a flash of "full" state on hydration and avoids trusting the client). In `gatePremiumBody`, when truncation happens, set `locked: true` on the returned post; otherwise `false`.

- Add `locked: boolean` to the `Post` type.
- In `gatePremiumBody`: return `{ ...post, locked: false }` when entitled or not premium; return `{ ...post, body/body_*: sliced, locked: true }` when gating.
- `listSeriesParts` already returns its own narrow shape — leave as is.

### 2. `src/routes/insights.$slug.tsx` — render teaser + Paywall when `post.locked`

In `PostPage`:

- Replace the bare `<HighlightedBody body={body} … />` with:
  - If `post.locked`: render the body inside `<BlurredTeaser>` (annotation bar hidden), then `<Paywall variant="card" oneOffLabel={\`Unlock "\${post.title}"\`} oneOffPriceCents={900} subtitle="One essay. Or unlock the full archive with Practitioner from $29/mo." />`. Hide `AnnotationBar` and the sources section when locked.
  - Else: render today's full markup unchanged.
- Wire `onBuyOneOff` to navigate to `/pricing` for now (no per-article checkout exists yet); the second CTA inside `Paywall` already deep-links to `/pricing`.
- Keep the existing 3-free-articles localStorage wall — it's an orthogonal soft gate.

The `is_premium` field is already returned, but we use the server's `locked` flag so the gate is consistent with what was actually delivered (truncated bytes ↔ locked UI).

### 3. No DB / migration / route changes

`is_premium` already exists in the schema; entitlement is already computed server-side via `isVanguardEntitled` (admin role OR active subscription). Nothing to migrate.

## Verification

1. Logged out, visit a premium post → see truncated body fading into Paywall card. No annotation bar, no sources.
2. Logged in without subscription → same as logged out.
3. Logged in admin or `subscriptions.status='active'` → full body, annotation bar, sources, no Paywall.
4. Non-premium post (tier='free') → unchanged, no Paywall regardless of auth state.
5. Server response for a premium post when unauthenticated: `body.length <= 1200` and `locked === true`.