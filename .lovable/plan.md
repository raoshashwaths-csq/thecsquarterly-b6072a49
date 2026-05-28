# Multilingual support — Phase 1

UI chrome only. English default (bare paths). Five additional locales prefixed: `/ar`, `/id`, `/th`, `/vi`, `/tl`. AI-assisted draft translations. LTR layout for everyone (Arabic deferred RTL until Phase 2). Editorial content (essays, codex, vanguard, etc.) stays English-only.

## 1. Scope

**In scope (Phase 1)**
- Site chrome: header nav, footer, buttons, form labels, auth screens, paywall, Q hints, tour copy, pricing tier names/descriptions, dashboard primitive labels, error & empty states.
- Locale switcher in the header (last item before sign-in / avatar).
- SEO: per-route `hreflang` alternates + localized `<title>` / `<meta description>` for translated chrome.
- Sitemap entries for each locale prefix.

**Out of scope (deferred)**
- Editorial content: posts, codex entries, playbooks, vanguard, retention-protocol bodies. These render in English regardless of locale.
- RTL layout mirroring (Arabic ships in LTR for now).
- Translated email templates, AI agent (Q) responses, Lovable AI prompts.
- Admin control-panel UI (English only — internal tool).

## 2. URL strategy

- `/about` → English (default, no prefix)
- `/ar/about`, `/id/about`, `/th/about`, `/vi/about`, `/tl/about` → translated chrome
- Editorial routes (`/insights/$slug`, `/codex/$slug`, etc.) accept the prefix but render English body; only chrome around them translates.
- Locale detected from URL only (no cookie/Accept-Language redirect in Phase 1 — simpler, predictable, SEO-safe).

## 3. Architecture

### Routing
- Wrap all routes in a pathless layout `src/routes/{-$lang}.tsx` (optional path param). `{-$lang}` makes the segment optional, so both `/about` and `/ar/about` resolve.
- The layout validates `lang` against `['ar','id','th','vi','tl']`; anything else 404s. `undefined` = English.
- `beforeLoad` sets the active locale on router context so `head()` and components read it without prop drilling.

### i18n runtime
- Install `i18next` + `react-i18next` + `i18next-resources-to-backend` (lazy chunk per locale).
- Create one i18next instance **per request** inside `src/router.tsx` `createRouter()` so SSR stays isolated (no shared mutable state across requests).
- Translation files live at `src/locales/{lang}/{namespace}.json`. Namespaces: `common`, `nav`, `auth`, `pricing`, `qHints`, `tour`, `dashboard`, `seo`.
- English (`en`) is the source of truth — written by hand. Other locales generated via the AI-drafted workflow (§5).

### Components
- Replace hardcoded strings with `useTranslation('namespace').t('key')`.
- `<LangSwitcher />` added to `SiteHeader` as the last item when logged out (before sign-in), and inside the avatar dropdown when logged in.
- `<Link>` calls use a small helper `localizedTo(path, lang)` that prepends the prefix when `lang !== 'en'`.

### SEO per route
- `head()` reads `lang` from route context and:
  - sets localized `title` / `description` from the `seo` namespace
  - emits `<link rel="alternate" hreflang="...">` for every locale + `x-default`
  - sets `<html lang="...">` via root route (already supports dynamic lang).
- `sitemap.xml` server route enumerates each indexable path × each locale.

## 4. Files to add / modify

**New**
- `src/routes/{-$lang}.tsx` — pathless locale layout
- `src/lib/i18n/config.ts` — i18next instance factory
- `src/lib/i18n/locales.ts` — `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, helpers (`localizedTo`, `getAlternates`)
- `src/components/site/LangSwitcher.tsx`
- `src/locales/en/{common,nav,auth,pricing,qHints,tour,dashboard,seo}.json` (source)
- `src/locales/{ar,id,th,vi,tl}/*.json` (AI-drafted)
- `scripts/translate-locales.ts` — one-off script that reads `en/*.json` and uses Lovable AI Gateway (`google/gemini-2.5-pro`) to produce drafts for the other five locales. Re-runnable, only fills missing keys.

**Modified**
- `src/router.tsx` — wire per-request i18n instance into router context
- `src/routes/__root.tsx` — set `<html lang>` dynamically, mount `I18nextProvider`
- `src/components/site/SiteHeader.tsx` — add `<LangSwitcher />`, route `<Link>`s through `localizedTo`
- `src/components/site/SiteFooter.tsx` — same
- `src/components/site/QHint.tsx`, `src/hooks/useTour.ts`, `src/lib/enablement/tips.ts` — pull strings from `qHints` / `tour` namespaces
- `src/lib/tiers.ts` consumers (pricing card components) — translate names/descriptions via `pricing` namespace; tier IDs stay English
- `src/routes/sitemap[.]xml.ts` — emit one entry per locale
- All shareable route files' `head()` — switch to `seo` namespace + add `hreflang` alternates

## 5. Translation workflow

1. Engineer/PM edits `src/locales/en/*.json` (source of truth).
2. Run `bun scripts/translate-locales.ts` — script diffs source against each locale, sends missing keys to Lovable AI Gateway with a tone-preserving prompt (Economist / Stratechery register, operator audience, no hype/emoji), writes JSON back.
3. Optional human review pass before commit.
4. CI/typecheck guard (later phase) ensures every key in `en` exists in every locale.

## 6. Phasing inside this PR

Step A — Foundation (no visible change)
- Install deps, add i18n config, locale layout route, English source files, locale helpers.

Step B — Header / footer / auth / pricing chrome
- Migrate strings, add `<LangSwitcher />`, route links through `localizedTo`.

Step C — Q hints, tour, dashboard primitives, paywall, error/empty states.

Step D — SEO
- Per-route `seo` namespace, `hreflang` alternates, sitemap × locales.

Step E — Translation script + first AI draft pass for all five locales.

Each step is independently reviewable; nothing breaks English while in progress.

## 7. Risks & non-goals

- **RTL**: Arabic will look awkward (punctuation, alignment) until Phase 2 adds `dir="rtl"` and logical CSS properties. Acceptable trade-off per your call.
- **Editorial content drift**: readers landing on `/ar/insights/some-essay` see translated chrome around English body. We'll surface a small note ("Essay available in English") in the article header for non-`en` locales.
- **Build size**: lazy per-locale chunks keep initial bundle flat; only the active locale loads.
- **No locale auto-detect**: users must click the switcher or land on a prefixed URL. Intentional — avoids redirect loops and SEO ambiguity in Phase 1.

## 8. What you'll see when it ships

- A small `EN / AR / ID / TH / VI / TL` switcher in the header.
- Translated nav, buttons, pricing cards, Q hints, tour, footer.
- English essays/codex unchanged.
- Each translated page indexable separately by Google with correct `hreflang`.
