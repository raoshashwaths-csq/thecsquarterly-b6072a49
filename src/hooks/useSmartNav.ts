import { useEffect, useState } from "react";

type NavState = {
  /** true once the user has scrolled past ~24px from the top */
  scrolled: boolean;
  /** false when scrolling down past threshold, true when scrolling up */
  visible: boolean;
};

/**
 * useSmartNav — drives the executive-grade sticky header.
 *  - transparent at top, frosted on scroll
 *  - hides when scrolling down, reveals when scrolling up
 *  - honors prefers-reduced-motion (always visible, always frosted once scrolled)
 */
export function useSmartNav(threshold = 96): NavState {
  const [state, setState] = useState<NavState>({ scrolled: false, visible: true });

  useEffect(() => {
    let lastY = typeof window !== "undefined" ? window.scrollY : 0;
    let ticking = false;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const scrolled = y > 24;
        const goingDown = y > lastY;
        // Only hide the header on >= md viewports. On mobile, momentum scroll
        // causes the translate to flicker during route transitions — keep the
        // header pinned instead.
        const isDesktop =
          typeof window !== "undefined" &&
          window.matchMedia?.("(min-width: 768px)").matches;
        const visible = reduce || !isDesktop ? true : !(goingDown && y > threshold);
        setState((prev) =>
          prev.scrolled === scrolled && prev.visible === visible ? prev : { scrolled, visible },
        );
        lastY = y;
        ticking = false;
      });
    };


    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return state;
}
