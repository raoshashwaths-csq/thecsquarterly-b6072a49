import { useEffect } from "react";

/**
 * useHeadlineReveal — on each route mount, finds every h1/h2 in the
 * document and wraps its text in `.headline-wrapper > .headline-line`
 * so the CSS reveal animation can play. Idempotent: nodes already
 * processed (data-headline-reveal) are skipped.
 *
 * This runs at runtime so no existing component JSX has to change.
 */
export function useHeadlineReveal(pathname: string) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const nodes = document.querySelectorAll<HTMLElement>("h1, h2");
    nodes.forEach((el) => {
      if (el.dataset.headlineReveal === "true") return;
      // Skip headlines that already contain block-level / interactive markup
      // we don't want to flatten (links, buttons, custom components).
      if (el.querySelector("a, button, svg, img, [data-no-reveal]")) {
        el.dataset.headlineReveal = "skipped";
        return;
      }
      const text = el.textContent;
      if (!text || !text.trim()) return;

      const wrapper = document.createElement("div");
      wrapper.className = "headline-wrapper";
      const line = document.createElement("span");
      line.className = "headline-line";
      // Preserve original children (including <em>, <span>, <br>) by moving
      // them into the line span rather than replacing with textContent.
      while (el.firstChild) line.appendChild(el.firstChild);
      wrapper.appendChild(line);
      el.appendChild(wrapper);
      el.dataset.headlineReveal = "true";
    });
  }, [pathname]);
}
