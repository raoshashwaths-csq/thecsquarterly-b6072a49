
## 1. Timeline — Lumi run tag shows tree heading + click-to-open detail dialog (all event kinds)

**Problem:** `lumi.run.tagged` events only render the label "Lumi run tagged". The tree heading is not surfaced, payload only stores `node_id` (e.g. `T1`), and rows aren't clickable.

**Fix in `src/components/csfactors/AccountTimeline.tsx`:**

- Extend the row title computation for `lumi.run.tagged`: derive tree id from `payload.node_id` (prefix `T\d+`), resolve via `getTree()` from `src/lib/q-trees.ts`, and use `tree.title` (e.g. *"Manage an Escalation"*) as the row title. Append the stakeholder if present (e.g. *"Manage an Escalation · Champion"*). Never show `T1`/`T7` as the visible title.
- Make every `TimelineItem` a clickable button (keyboard + aria) that opens a centred modal — shadcn `Dialog` (centred by default at viewport centre). One generic `TimelineEventDialog` component, with a kind-specific renderer map.

**Kind-specific dialog content** (keyed off `event.kind`):

| Kind | Dialog title | Body |
|---|---|---|
| `lumi.run.tagged` | Tree heading | Eyebrow (cleaned tree.eyebrow), tree blurb, tagged stakeholder, "Open Lumi run →" link to `/agent/response/$runId` using `payload.run_id` |
| `meeting.new` / `cadence.mom` / `qbr` / `leadership.connect` / `exec.sync` | Payload title | Date, details, attendee/stakeholder if in payload |
| `escalation` | "Escalation" + title | Severity (if any), details, "Open account →" |
| `expansion.signal` | "Expansion signal" + title | Details, ARR delta if present |
| `renewal.note` | "Renewal note" + title | Details, renewal date if present |
| `champion.change` | "Champion change" | From/To if present, details |
| `cta.raised` / `cta.completed` | "CTA — <title>" | Owner, due/closed date, details, link to `/csfactors/ctas` |
| `note` | "Note" | Details (whitespace-preserved) |
| `field.edit` | "Field edit" | Field name, before → after (read-only) |
| `qbr.override` | "QBR override" | Before/after score + reason |
| _fallback_ | Label | Pretty-printed JSON payload (last-resort, behind a `<details>`) |

All dialogs share a header (icon, tinted by `TINT_CLASS[vector.tint]`, eyebrow label, occurred_at) and a footer with a close button. No edit/delete inside the dialog — keep delete on the row (only for owner).

**Visibility:** the timeline list itself is already gated by `listAccountEvents`. The new dialog is purely client-side rendering of already-fetched events, so anyone who can see the account dashboard sees the same detail. No new server function, no new RLS.

**No payload migration** required — `payload.run_id` and `payload.node_id` are already written by `tagQRunToAccount` (lines 407–413 in `src/lib/q-agent.functions.ts`). Older rows without `node_id` fall back to the existing label.

## 2. Homepage card under the headline — mobile render fix

**Target:** the Team/Scale/Enterprise summary card (`src/routes/index.tsx` lines 700–722) containing the *Team Pulse / MAP engine / Workspace* buttons. On mobile the row uses `flex items-center justify-between gap-4 flex-wrap` so the three pills overflow / clip beside the text block.

**Fix:** restructure to mobile-first stack, promote to row at `sm:`:

```text
<div className="grid grid-cols-1 gap-3 sm:flex sm:items-center sm:justify-between sm:flex-wrap">
  <div className="min-w-0">...eyebrow + sentence...</div>
  <div className="flex flex-wrap gap-2 sm:gap-3">...three pills...</div>
</div>
```

Add `min-w-0` to the text block and `whitespace-nowrap` to each pill so labels never wrap mid-word. No business logic touched.

If the user actually meant the four-card grid above (AI Readiness / CSFactors / Workspace / Decision Canvas, lines 115–233), I'll confirm during build — that grid is already `md:grid-cols-2` and renders fine on the 400px viewport. The Pulse/Map/Workspace wording matches only the team summary card, so that's the assumed target.

## 3. Site header — mobile portrait alignment (login button + dark toggle clipped)

**File:** `src/components/site/SiteHeader.tsx` (lines 64–138).

**Root cause:** at narrow widths the wordmark *"The CS Quarterly."* is `text-xl` and `whitespace-nowrap`. Combined with `gap-3` and the right-cluster (LanguageSwitcher + ThemeToggle + Sign-in/avatar), total intrinsic width exceeds the viewport, pushing the right edge off-screen. There's no `min-w-0` on the logo, no shrink rules, and the cluster has no flex-shrink containment.

**Fixes (portrait-only — keep landscape untouched):**

- Wrap the nav in `grid-cols-[minmax(0,1fr)_auto] sm:flex sm:items-center sm:justify-between` so on mobile portrait the logo column gets a real `minmax(0,1fr)` track and the cluster is `auto` and `shrink-0`. From `sm:` upward, revert to the current flex layout (landscape mobile and tablet ≥ 640px is unchanged).
- Logo: add `min-w-0` to the `<Link>` and `truncate` to the inner span — landscape uses `sm:` overrides to keep `whitespace-nowrap` and the larger size.
- Right cluster: wrap in a `shrink-0 flex items-center gap-3 md:gap-4` container. Add `gap-2` on the smallest breakpoint, and reduce LanguageSwitcher/ThemeToggle padding only at `max-sm` via existing utility classes (no component-internal edits if avoidable — confirm at build).
- Sign-in pill keeps `shrink-0 whitespace-nowrap` and gets slightly tighter horizontal padding (`px-2`) at portrait.

All landscape rules use `sm:` upward, so 640px+ (which covers landscape phones and tablets) is byte-identical to today.

## 4. Decision Canvas — selecting a tree scrolls past the wheel

**File:** `src/routes/agent.framework.tsx` line 89.

**Bug:** after selecting a tree, the code calls
`wheelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })`.
With `block: "start"` the wheel's top edge snaps to the viewport top — on mobile and short desktops this puts the wheel's bottom past the fold so the page appears scrolled to the bottom.

**Fix:** change to `block: "center", inline: "center"` so the wheel is centred in the viewport. Also guard for short viewports — if the wheel's height exceeds the viewport, fall back to `block: "start"` with a small top offset so the eyebrow/title is still visible:

```text
const el = wheelRef.current;
const vh = window.innerHeight;
const rect = el.getBoundingClientRect();
el.scrollIntoView({
  behavior: "smooth",
  block: rect.height > vh - 80 ? "start" : "center",
});
```

Apply the same change everywhere `wheelRef.scrollIntoView` is called (search the file). No structural / layout changes to the wheel itself.

## Files touched (build phase)

- `src/components/csfactors/AccountTimeline.tsx` — clickable rows, dialog, kind-specific renderers
- `src/components/csfactors/TimelineEventDialog.tsx` (new) — kind-routed detail dialog
- `src/routes/index.tsx` — Team summary card responsive layout
- `src/components/site/SiteHeader.tsx` — mobile portrait grid + min-w-0/shrink-0 rules
- `src/routes/agent.framework.tsx` — `scrollIntoView` block: "center"

## Out of scope

- No new server functions, migrations, or RLS changes.
- No copy or translation changes outside what's needed for the dialog header labels (reuse existing `VECTORS[].label`).
- No design-system token changes; reuse `TINT_CLASS`, shadcn `Dialog`, mono eyebrow style.
- Landscape header layout (≥ 640px) untouched.

Used the redesign skill's anchor / pin-taste discipline only to scope what changes — no new visual directions needed because every fix is a deterministic correction, not a styling refresh.
