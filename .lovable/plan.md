## 1. Stop unpublished/future articles from appearing in lists

**Root cause:** `listPosts` and `listPostsBySection` (in `src/lib/posts.functions.ts`) filter on `published = true` but do **not** filter on `published_at <= now()`. So any post scheduled for a future date — or one toggled briefly to published — appears in `/insights`, `/vanguard`, `/retention-protocol`, `/outcome-forum`, `/codex` index pages. When a non-entitled visitor clicks through, `getPost` (which *does* enforce both `published = true` AND `published_at <= now()`) returns `null` and the user sees the "never published" empty state.

**Fix (server-side, single file):** in `src/lib/posts.functions.ts`, add the same gate to `listPosts` and `listPostsBySection` for non-entitled callers:

- Admins and active Vanguard subscribers continue to see scheduled/future posts in lists (so editors can preview).
- Anon + free readers only see posts where `published = true` AND `published_at <= now()`.

Mirror the conditional already used in `getPost` (lines 121–128). `listSeriesParts` stays as-is — the series rail intentionally shows locked future parts.

## 2. Redirect to home after sign-in

In `src/routes/login.tsx`, change the post-`signInWithPassword` navigation from `navigate({ to: "/account" })` to `navigate({ to: "/" })`. Sign-up flow (which shows the "check your inbox" toast) is unchanged. Email-confirmation `emailRedirectTo` stays at `/account` so confirming a new account still lands them in their dashboard — only the explicit sign-in returns them home, per the request.

## 3. Soft-disable the job board with "stay tuned"

Job board surfaces today:
- `src/components/site/SiteFooter.tsx` — `Job Board` link
- `src/lib/tiers.ts` — three feature bullets mentioning job board
- `src/routes/pricing.tsx` — a "Job board & admin" group in the comparison matrix with a "Job posting credits / quarter" row

Treatment in all three places:
- Wrap the relevant text in a muted/blurred span (`text-muted-foreground/60 blur-[1.5px] select-none pointer-events-none`) so it's visibly de-emphasized but the layout is preserved.
- Append a small, non-blurred badge to the right: `Stay tuned ✨` in mono eyebrow style (`font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent`).
- Footer: render `Job Board` as a non-link `<span>` (no navigation) with the same blur + "Stay tuned ✨" badge.
- Pricing matrix: blur the row labels and values for the `Job posting credits / quarter` row and append the badge to the group header `Job board & admin`.
- Tier feature bullets in `src/lib/tiers.ts`: append the badge inline. Since `features` is a `string[]` rendered as plain text, switch the three job-board bullets to a marker the `TierCard` can detect (e.g. prefix with `__jobboard__:`) and render the blur + badge treatment in `TierCard` when it sees the marker. This keeps `tiers.ts` data-only without introducing JSX there.

No other plan content (Operator dashboard wording, etc.) changes. No DB migration. No new routes.

## Files touched

- `src/lib/posts.functions.ts` — gate `listPosts` + `listPostsBySection` on `published_at` for non-entitled callers.
- `src/routes/login.tsx` — redirect to `/` after sign-in.
- `src/components/site/SiteFooter.tsx` — blur Job Board entry + "Stay tuned ✨" badge.
- `src/lib/tiers.ts` — mark the three job-board bullets with a sentinel prefix.
- `src/routes/pricing.tsx` — render the sentinel as blur + badge in `TierCard`, and apply the same treatment to the "Job board & admin" matrix group + row.
