# Plan — Branded PDFs, Shared Run Gating, Reader Unlock

Four connected pieces. All UI uses existing dark midnight-slate + Quicksand-gold tokens — no new tokens.

---

## 1. Branded "heavyweight paper" PDF system

**New:** `src/lib/brand-pdf.ts` — shared jsPDF helper.

- Pulls `--background` (midnight), `--accent` (gold), `--foreground` (cream) from `styles.css` as static hex constants mirrored in the file (jsPDF can't read CSS at runtime). Constants: `INK = #0B1220`, `GOLD = #C9A24A`, `PAPER_TEXT = #F5F0E1`, `MUTED = #8A93A6`.
- Page background: full-bleed deep-blue fill with a subtle 4% white noise/grain rectangle pattern + 1pt gold inner border to read as "heavyweight paper."
- Header band: Quicksand-style display title in gold, kicker rule, "Prepared for {FirstName}" line in cream.
- Footer band: "The CS Quarterly · csquarterly.com · {date}" in muted cream, gold page numerals.
- Embeds Quicksand (display) + Inter (body) as base64 via `addFileToVFS` / `addFont`. Fonts loaded from `/public/fonts/` (added in this change).
- Public API:
  ```ts
  renderBrandedPdf({
    firstName, title, subtitle?, sections: Section[],
    footerNote?, filenameSlug
  }): void
  type Section = { kind: 'prose'|'kv'|'bullets'|'quote'|'divider', ... }
  ```
- First name resolved from `profiles.display_name` (split on space) or auth metadata; falls back to "Reader".

**Refactor:** `src/lib/diagnostic-pdf.ts` to call `renderBrandedPdf` instead of its current light-theme drawing. Same input shape preserved at the call sites.

**New export entry points:**

- `src/components/site/ExportDialog.tsx` — modal opened from a new "Export PDF" button in the user account menu and on the workspace page.
  - Tabs: **Articles**, **Lumi Runs**, **Lumi Summary**.
  - Articles tab: searchable list of the user's saved articles (`reading_sequences` + `user_workspace_items` of kind `article`). Multi-select → bundles each as a section.
  - Runs tab: list of the user's `q_runs` (most recent 50) with scenario heading + timestamp; multi-select.
  - Lumi Summary tab: single button "Generate Lumi-Summarized Workspace Export." Calls a new server fn `summarizeWorkspaceForExport` that runs one Lumi call (counts against monthly Lumi cap via existing `Q_MONTHLY_CAP` / `q-usage.functions.ts` increment) and returns a structured digest (top runs, key articles, sentiment trend, action items). Surfaced to the user as a Lumi-spend confirmation before running.
- All three tabs produce the PDF client-side via `renderBrandedPdf`.

**Server fn:** `src/lib/exports.functions.ts`

- `listExportableArticles()` — protected, returns user's articles/run list (RLS-scoped).
- `summarizeWorkspaceForExport()` — protected, checks quota → calls Lumi via existing gateway → records usage → returns sections payload.

---

## 2. Shared canvas-run gating (50% scroll paywall + email unlock)

`**src/routes/agent.response.$runId.tsx`:**

- Detect viewer mode: `isOwner === false && run.shared === true` and viewer not unlocked.
- Wrap run body in a scroll container; track scroll progress. When `>= 50%` and viewer is gated → freeze scroll, blur lower half via a `PaywallOverlay`-style gradient using brand tokens, show "Share your email to read the rest of this Lumi run."
- If user is signed-in (any tier) → no gate, full access. The gate only applies to anonymous viewers.

`**src/lib/shared-run.functions.ts` (new):**

- `unlockSharedRun({ runId, email })` — public server fn (no auth middleware). Validates email with Zod, upserts into existing `subscribers` table with `source = 'shared_run_unlock'`, sets an HTTP-only signed cookie `lumi-reader-unlock` (JWT-ish via `SESSION_SECRET`) listing unlocked run ids + 30-day expiry. Returns `{ ok: true, alreadySubscriber }`.
- `getSharedRunUnlockState()` — reads cookie, returns array of unlocked runIds for the current request.

`**src/components/site/SharedRunGate.tsx` (new):**

- Email form (brand-dark card, gold submit). On success:
  - Trigger `ReaderWelcomeDialog` — centered modal listing newly available Reader features (saved articles, free diagnostic, weekly briefing, share-run view, /codex preview).
  - Auto-fades after 6s (CSS opacity transition) or on click; then removes blur and restores scroll.

**Canonical share link:** existing `canonicalCurrentUrl()` already targets `/agent/response/:runId` — works for off-site shares without changes. Add a `<meta name="robots" content="noindex">` only when run is NOT shared; allow indexing of the gated preview when shared.

---

## 3. Reader tier (lightweight)

Add `'reader'` as the lowest designation in `src/lib/entitlements.ts` (above anonymous, below the current free tier). Sets:

- Can view shared Lumi runs in full
- Can read free articles past soft-gate
- Can Run one Lumi decision a week , cannot access CSFactors

`unlockSharedRun` does NOT create an auth user — Reader is cookie-scoped. If the email later signs up, `handle_new_user` trigger upgrades them.

---

## 4. Wiring and polish

- Account menu: new "Export PDF" item (opens `ExportDialog`).
- Workspace page: "Export…" button in header → same dialog, pre-filtered to current selection.
- Diagnostics: existing "Download PDF" buttons continue to work, now branded.
- All PDF filenames: `csq-{kind}-{firstname}-{YYYYMMDD}.pdf`.

## Technical notes (for review)

- **No new color tokens.** Hex constants in `brand-pdf.ts` mirror the existing CSS tokens; if tokens change, update both.
- **Quicksand + Inter fonts**: added under `public/fonts/` and registered once per render. Keep base64 inline to avoid runtime fetch in jsPDF.
- **Lumi summary quota**: reuses `q-usage.functions.ts` increment; one summary = 1 Lumi call. Surface remaining quota in the dialog.
- **Cookie security**: `httpOnly`, `secure`, `sameSite=lax`, signed with existing `SESSION_SECRET` pattern (add secret if missing).
- **No DB migrations required** beyond reusing `subscribers`. If we later want per-run unlock audit, add a `shared_run_unlocks` table — out of scope here.
- **SSR safety**: PDF generation is client-only (`jsPDF` is browser-only); dialog dynamically imports `brand-pdf.ts`.

## Files

**New:** `src/lib/brand-pdf.ts`, `src/lib/exports.functions.ts`, `src/lib/shared-run.functions.ts`, `src/components/site/ExportDialog.tsx`, `src/components/site/SharedRunGate.tsx`, `src/components/site/ReaderWelcomeDialog.tsx`, `public/fonts/Quicksand-*.ttf`, `public/fonts/Inter-*.ttf`.
**Edited:** `src/lib/diagnostic-pdf.ts`, `src/lib/entitlements.ts`, `src/routes/agent.response.$runId.tsx`, `src/routes/account.workspace.tsx`, `src/components/site/SiteHeader.tsx` (account menu item).