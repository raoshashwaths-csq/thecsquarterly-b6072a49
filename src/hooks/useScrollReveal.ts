import { useEffect, useRef } from "react";

/**
 * useScrollReveal — adds `.is-revealed` to the element when it enters the viewport.
 * Pair with the `.reveal-up` utility in styles.css. Honors prefers-reduced-motion.
 *
 * Optional `index` staggers the reveal by 100ms per item, capped at 600ms.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  index = 0,
  options: IntersectionObserverInit = { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      el.classList.add("is-revealed");
      return;
    }

    const delay = Math.min(index, 6) * 100;
    el.style.setProperty("--reveal-delay", `${delay}ms`);

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add("is-revealed");
          io.unobserve(entry.target);
        }
      }
    }, options);

    io.observe(el);
    return () => io.disconnect();
  }, [index, options]);

  return ref;
}
