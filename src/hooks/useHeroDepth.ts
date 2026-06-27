import { useEffect } from "react";

/**
 * Single-layer scroll parallax for elements marked with `data-depth="0.03"`.
 * Translates the element on Y by `scrollY * depth`. Keeps motion subtle so it
 * never fights the hero's existing animate-fade-up entrance.
 *
 * Respects prefers-reduced-motion.
 */
export function useHeroDepth() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-depth]"),
    );
    if (!nodes.length) return;

    const pairs = nodes.map((el) => ({
      el,
      depth: parseFloat(el.dataset.depth ?? "0") || 0,
    }));

    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      for (const { el, depth } of pairs) {
        el.style.transform = `translate3d(0, ${(y * depth).toFixed(2)}px, 0)`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      for (const { el } of pairs) el.style.transform = "";
    };
  });
}
