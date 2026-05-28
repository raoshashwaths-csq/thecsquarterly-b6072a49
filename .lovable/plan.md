# Fix AI Readiness Copy: 11/44 → 8/32

The AI readiness diagnostic is correctly defined as **8 dimensions and 32 metrics** in the `/ai-readiness` landing page (PILLARS array + hero copy). However, several other routes, tips, and tour copy still reference the outdated "11 dimensions, 44 metrics" figure.

## Files to edit

1. **`src/routes/index.tsx`** (3 fixes)
   - `SECTIONS` array blurb for Diagnostics: `"11 dimensions, 44 metrics"` → `"8 dimensions, 32 metrics"`
   - AI Readiness card body copy: `"11 dimensions, 44 metrics"` → `"8 dimensions, 32 metrics"`
   - QHint below AI Readiness card: `"your weakest of 11 dimensions"` → `"your weakest of 8 dimensions"`

2. **`src/routes/vanguard.tsx`** (1 fix)
   - Diagnostic promo card body: `"11 dimensions"` → `"8 dimensions"`

3. **`src/lib/enablement/tips.ts`** (2 fixes)
   - `home-ai-readiness` tip body: `"11 dimensions"` → `"8 dimensions"`
   - `home-section-diagnostic` tip body: `"11 dimensions, 44 metrics"` → `"8 dimensions, 32 metrics"`

4. **`src/hooks/useTour.ts`** (1 fix)
   - `/ai-readiness` tour step body: `"Eleven dimensions, 44 metrics"` → `"Eight dimensions, 32 metrics"`

## Out of scope
- No changes to `/ai-readiness/index.tsx` or `/ai-readiness/survey.tsx` — they are already correct.
- No visual, structural, or backend changes.