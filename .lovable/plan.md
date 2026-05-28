## Fix

In `src/components/enablement/PlaybookBadge.tsx`, the bulb sits at `top-20 right-6` on content routes, which collides with the header's avatar dropdown (also right-aligned).

Reposition so it sits **directly beneath the avatar**, locked there:

- Content routes (global header present): `top-[72px] right-6` — places the bulb just below the header's bottom edge (header is ~64px) and aligned to the same right gutter as the avatar.
- CSFactors / calculator (no global header, their own sticky bar ~52px): keep `top-[64px] right-6` so the bulb clears that bar too.
- Shrink the FAB slightly (`h-10 w-10`) so it reads as a secondary affordance under the avatar, not a peer.
- Mobile still hidden (unchanged).

No other files touched.
