# Making The CS Quarterly multilingual

Two layers need translation: **UI chrome** (nav, buttons, eyebrows, CTAs, form labels, Q hints, tour copy) and **editorial content** (essays, codex entries, playbooks, AI-readiness questions). They need different strategies.

## 1. Pick languages and a default

Decide upfront:

- Launch locales (suggest: `en` as default + 1–2 others, e.g. `es`, `de`, or `fr` — the audience is global SaaS operators).
- Whether `en` is the canonical URL (`/about`) or every locale is prefixed (`/en/about`, `/es/about`). Recommended: **locale prefix for non-default**, bare paths stay English. This protects existing SEO and incoming links.

## 2. UI translation layer

- Add `i18next` + `react-i18next` (works fine in SSR with TanStack Start).
- Create `src/i18n/` with one JSON per locale (`en.json`, `es.json`, …) organized by namespace (`common`, `nav`, `home`, `qHints`, `tour`, `aiReadiness`, `pricing`, `auth`).
- Initialize i18n in `src/router.tsx` so the instance is available during SSR; detect locale from URL segment first, then `Accept-Language`, then cookie.
- Replace hardcoded strings across components with `t('namespace.key')`. Highest-traffic targets first: `SiteHeader`, `SiteFooter`, `index.tsx` hero + sections, `QHint` bodies in `src/lib/enablement/tips.ts`, `useTour.ts` steps, `Paywall`, auth forms, pricing tiers in `src/lib/tiers.ts`.
- Q brand mark, "The CS Quarterly." wordmark, and section names (Vanguard, Retention Protocol, Outcome Forum, Codex), CS Factors stay in English — they're product names.

## 3. Routing for locales

- Add a pathless locale layout: `src/routes/$lang.tsx` that validates `lang` against the allowed list (else `notFound`), sets the i18n language in `beforeLoad`, and renders `<Outlet />`.
- Keep the existing English routes as-is at the root. Mirror each shareable route under `$lang` (or use a small helper that re-exports). Initial scope: home, section pages, insights/$slug, codex/$slug, ai-readiness, pricing, about, login, subscribe.
- Update every `head()` to localize `title` / `description` / `og:title` / `og:description` and emit `<link rel="alternate" hreflang="…">` tags for each available locale + `x-default`.
- Update `sitemap.xml.ts` and `rss.xml.ts` to emit one entry per (route × locale) with `hreflang` annotations.

## 4. Editorial content translation

This is the bigger lift. Options, pick one:

- **A. Per-locale columns** on `posts` (and `codex_entries`, `ai_readiness_questions`): add `title_es`, `body_es`, `excerpt_es`, … Simple, no joins, but rigid.
- **B. Translations table** (recommended): `post_translations(post_id, locale, title, subtitle, excerpt, body_mckinsey, body_wodehouse)` with unique `(post_id, locale)`. RLS mirrors `posts`. Same shape for `codex_entry_translations` and `ai_readiness_question_translations`. Server fns (`listPostsBySection`, `getPostBySlug`, etc.) accept a `locale` arg and left-join translations, falling back to English when a translation is missing.
- Admin UI in `/admin/control-panel`: add a locale switcher on the post editor so editors can add/update translations side-by-side with the canonical English version. Mark posts with missing translations.

## 5. Translation workflow

- **UI strings**: maintained by hand in JSON, or piped through a service (Lokalise / Crowdin) — out of scope to wire up now, but structure the JSON so it's import/export friendly.
- **Editorial**: two paths, surfaced as an admin choice:
  1. Human translator pastes into the per-locale editor.
  2. "Draft translation with Q" button: server fn calls Lovable AI Gateway (`google/gemini-2.5-pro`) with a tone-preserving prompt (respect McKinsey vs Wodehouse register, 3-2-1 model, keep section names in English). Output saved as `draft` status; an editor must publish.

## 6. Locale switcher UI

- Small dropdown in `SiteHeader` (and footer) — minimal, mono eyebrow style, e.g. `EN ▾`. Persists choice in a `locale` cookie and rewrites the current URL to the chosen locale prefix. Hidden on `/csfactors` and other dashboard surfaces until those are translated.

## 7. Things to verify / decide before building

1. Which locales for launch?
2. URL strategy — locale prefix for all (`/en/...`) or only non-default (`/es/...`, English stays bare)?
3. Does editorial content get translated at launch, or is it "UI chrome only" in phase 1 and content follows in phase 2?
4. AI-assisted draft translations OK, or human-only?

## Technical notes

- TanStack Start SSR: i18next instance must be created per request (don't share state across requests) — wire it into router context the same way `queryClient` is wired.
- `head()` is per-route; the locale is available via `Route.useParams()` or router context, so localized meta is straightforward.
- Tailwind/typography: `Newsreader` and `Source Serif 4` cover Latin extended (es/fr/de/it/pt) fine. CJK or Arabic would require adding fonts and an RTL pass on layouts — flag separately if in scope.
- Date formatting: switch any hand-formatted dates to `Intl.DateTimeFormat(locale)`.
- Email templates (`src/routes/email/`) need parallel locale variants if transactional mail goes multilingual.

## Suggested phased rollout

- **Phase 1**: i18n infra + locale routing + translated UI chrome on marketing routes (home, sections, pricing, about, auth). Editorial stays English with a banner "English only for now."
- **Phase 2**: translations table + admin editor + locale switcher live on `/insights/$slug` and `/codex/$slug`.
- **Phase 3**: AI-readiness questions, Q hints/tour, dashboards.

Answer the four questions in §7 and I'll tighten this into a concrete build plan.