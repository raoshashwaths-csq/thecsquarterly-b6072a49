# Add 3 draft articles

Insert three placeholder posts into the `posts` table with `published = false` so they appear in the admin panel as drafts, ready to flesh out later.

## Drafts to create

| Title | Slug | Section | Category |
|---|---|---|---|
| How to Comp CSMs on Upsells | how-to-comp-csms-on-upsells | retention-protocol | Compensation |
| Pricing Models for AI Agents | pricing-models-for-ai-agents | vanguard | AI in CS |
| Driving NRR in a Down Market | driving-nrr-in-a-down-market | vanguard | Retention |

## Implementation

One SQL migration that inserts three rows into `public.posts`:

- `published = false` (draft — won't appear on public site, visible in `/admin` via `listAllPostsAdmin`)
- `author = 'The Editors'`
- `read_minutes = 7`
- `tier = 'free'` (can be flipped to premium later in admin)
- `body`, `excerpt`, `subtitle` = short placeholder text noting "Draft — to be written"
- `is_premium = false`
- No `series_*`, no `cover_image_url`, no tone variants — those get added when you flesh them out

No code changes. No new components. Drafts are editable from `/admin` once inserted.
