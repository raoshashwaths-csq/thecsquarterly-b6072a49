# Diagnostics gating, branded share PDFs, and canonical share URLs

## 1. Lead-capture gate on every diagnostic

**Pattern**: The AI Readiness survey already captures name / work email / company / title / segment before showing questions (`diagnostics.ai-readiness.survey.tsx` lines 40–155). We promote that to a shared component and reuse it.

- New `src/components/diagnostics/LeadCaptureGate.tsx` — extracts the existing AI Readiness gate UI (name, work email, company, title, segment, optional HCM toggle) and emits `onUnlock({ name, email, company, title, segment })`.
- Refactor `diagnostics.ai-readiness.survey.tsx` to consume the shared gate (no UX change).
- Wrap `diagnostics.champion-dependency.tsx` in the same gate — survey/questions only render after unlock. Persist the captured lead via the same server fn AI Readiness uses (`submitAiReadiness` writes a lead row; for Champion we add a thin `submitChampionLead` server fn that inserts into `diagnostic_leads` keyed by `diagnostic_slug`).
- Document the pattern at the top of `LeadCaptureGate.tsx` so future diagnostics (e.g., the next one added under `/diagnostics`) plug in the same way. Add a short note to the Build Bible's Diagnostics section.

## 2. Fix stale pricing in Champion Dependency results

`diagnostics.champion-dependency.tsx` lines 515–519 hardcode "$29/mo Vanguard" and "$500 in playbooks". Source of truth is `src/lib/tiers.ts`.

- Replace the hardcoded copy with values pulled from `TIERS` (Practitioner $39 / Operator $89, per current matrix).
- Audit all diagnostic results screens (AI Readiness results view, share text) for any other stale dollar figures and swap to `tiers.ts` lookups.

## 3. Branded PDF share for diagnostic scores

Today the "share" action copies a link to the diagnostic landing page, not the score. We replace it with a CS Quarterly-branded PDF.

- New server fn `src/lib/diagnostic-pdf.functions.ts` → `generateDiagnosticPdf({ slug, scoreId })`. Uses `pdf-lib` (Worker-safe) to compose:
  - CS Quarterly wordmark header (serif display + colored period), eyebrow mono meta line, paper-grain background tint matching brand tokens.
  - Score block (numeric + tier label + subscores).
  - **Free tier**: score + 1-paragraph interpretation + CTA panel "What Vanguard unlocks" listing Practitioner/Operator deltas from `tiers.ts` + canonical link to `https://thecsquarterly.com/pricing`.
  - **Vanguard / paid tier** (`useSubscriptionTier` rank ≥ practitioner): score + full custom blueprint section (existing Champion remediation plan / AI Readiness 90-day playbook copy) + per-pillar breakdown.
- Score persistence: write completed diagnostic results to a new `diagnostic_results` row (id, user/email, slug, score, subscores, blueprint payload, created_at) so the PDF can be regenerated and the share link is stable. RLS: owner read by email/user_id; service role for PDF render. Includes GRANTs per project rules.
- "Share score" button on each results screen now:
  1. Calls the server fn → returns a signed URL or inline blob.
  2. Triggers download of `cs-quarterly-{slug}-score.pdf`.
  3. Secondary action "Copy link" copies the canonical results URL (see §4) rather than the landing page.

## 4. Canonical share URLs (no lovable.app in shared links)

All shareable surfaces currently use `window.location.origin`, which leaks `*.lovable.app` on preview/published.

- Add `src/lib/canonical-url.ts` exporting `CANONICAL_ORIGIN = "https://thecsquarterly.com"` and `canonicalUrl(path)`.
- Replace `window.location.origin` in user-facing share builders:
  - `diagnostics.champion-dependency.tsx` (line 426)
  - `csfactors.maps.index.tsx` (line 182) and `csfactors.maps.$id.tsx` (line 50) — MAP public links `/m/{token}`
  - `agent.response.$runId.tsx` share toggle — canvas response public link
  - `codex.$slug.tsx` and `csfactors.playbook.$slug.tsx` — playbook share buttons (audit + swap)
  - Diagnostic results "copy link" (new in §3)
- Leave OAuth `emailRedirectTo`, Paddle `successUrl`, and other internal-flow URLs on `window.location.origin` — those must match the current host. Only outbound share copy uses the canonical origin.

## Technical notes

- Lead-capture insert uses an authenticated/anon `createServerFn` writing to `public.diagnostic_leads (id, slug, name, email, company, title, segment, created_at)` with RLS allowing service-role writes and owner reads. Migration includes the standard `GRANT` block.
- `diagnostic_results` migration mirrors the same structure + a `payload jsonb` for blueprint content.
- PDF generation runs server-side (Worker-compatible) — no `sharp`/`canvas`; `pdf-lib` only. Brand fonts embedded as base64 from `src/assets`.
- Sitemap and OG metadata unchanged.

## Out of scope

- No visual redesign of diagnostic landing/result pages beyond the gate insertion and pricing text.
- No new tiers or pricing changes — only sync stale copy to `tiers.ts`.
- No changes to Lumi run sharing data model (only the displayed URL string).
