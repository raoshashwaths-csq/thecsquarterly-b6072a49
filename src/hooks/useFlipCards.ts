import { useEffect } from "react";

/**
 * Mobile tap-to-flip support for `.flip-card` elements.
 * Desktop uses CSS :hover / :focus-within (no JS). On coarse-pointer devices,
 * tapping the card toggles a `.is-flipped` class. Tap-outside flips back.
 *
 * Also keeps the non-visible face out of the a11y tree using `inert` +
 * `aria-hidden`. Existing CTAs on the front face remain fully clickable —
 * mobile tap only flips when the target is the card surface itself
 * (not an interactive child).
 */
export function useFlipCards() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const coarse = window.matchMedia("(hover: none)").matches;
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".flip-card"));
    if (!cards.length) return;

    const syncFaces = (card: HTMLElement) => {
      const flipped = card.classList.contains("is-flipped");
      const front = card.querySelector<HTMLElement>(".flip-front");
      const back = card.querySelector<HTMLElement>(".flip-back");
      if (front) {
        front.setAttribute("aria-hidden", flipped ? "true" : "false");
        if (flipped) front.setAttribute("inert", ""); else front.removeAttribute("inert");
      }
      if (back) {
        back.setAttribute("aria-hidden", flipped ? "false" : "true");
        if (!flipped) back.setAttribute("inert", ""); else back.removeAttribute("inert");
      }
    };

    cards.forEach(syncFaces);

    // Desktop: track :focus-within transitions via focusin to also sync a11y
    const onFocusIn = (e: FocusEvent) => {
      const card = (e.target as HTMLElement | null)?.closest<HTMLElement>(".flip-card");
      if (!card) return;
      // CSS handles the visual; ensure aria/inert mirror it.
      requestAnimationFrame(() => syncFaces(card));
    };
    document.addEventListener("focusin", onFocusIn);

    if (!coarse) {
      return () => {
        document.removeEventListener("focusin", onFocusIn);
      };
    }

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const card = target.closest<HTMLElement>(".flip-card");
      if (!card) {
        // tap outside — collapse all
        cards.forEach((c) => {
          if (c.classList.contains("is-flipped")) {
            c.classList.remove("is-flipped");
            syncFaces(c);
          }
        });
        return;
      }
      // If user tapped an interactive child (link/button), don't flip.
      if (target.closest("a, button, [role=button], input, textarea, select")) return;
      e.preventDefault();
      card.classList.toggle("is-flipped");
      syncFaces(card);
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("focusin", onFocusIn);
    };
  });
}
