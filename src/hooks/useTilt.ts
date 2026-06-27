import { useEffect } from "react";

/**
 * 3D tilt + specular highlight on any element marked with `data-tilt`.
 * Uses pointer-driven CSS transforms. Tokens only — the glare draws from
 * --accent via CSS custom property `--tilt-glare`.
 *
 * Respects prefers-reduced-motion. Clears inline transforms on leave so it
 * never fights existing `.card-lift` / hover transitions.
 */
export function useTilt(opts: { max?: number; scale?: number } = {}) {
  const max = opts.max ?? 6;
  const scale = opts.scale ?? 1.01;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-tilt]"));
    if (!nodes.length) return;

    const cleanups: Array<() => void> = [];

    nodes.forEach((el) => {
      // Ensure perspective context
      el.style.transformStyle = "preserve-3d";
      el.style.willChange = "transform";

      let raf = 0;
      let pending: { x: number; y: number } | null = null;

      const apply = () => {
        raf = 0;
        if (!pending) return;
        const { x, y } = pending;
        const rect = el.getBoundingClientRect();
        const px = (x - rect.left) / rect.width;
        const py = (y - rect.top) / rect.height;
        const rx = (0.5 - py) * max * 2;
        const ry = (px - 0.5) * max * 2;
        el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${scale})`;
        el.style.setProperty("--tilt-x", `${(px * 100).toFixed(1)}%`);
        el.style.setProperty("--tilt-y", `${(py * 100).toFixed(1)}%`);
      };

      const onMove = (e: PointerEvent) => {
        pending = { x: e.clientX, y: e.clientY };
        if (!raf) raf = requestAnimationFrame(apply);
      };
      const onLeave = () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        pending = null;
        el.style.transform = "";
        el.style.removeProperty("--tilt-x");
        el.style.removeProperty("--tilt-y");
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      el.addEventListener("blur", onLeave, true);

      cleanups.push(() => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
        el.removeEventListener("blur", onLeave, true);
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = "";
        el.style.willChange = "";
      });
    });

    return () => cleanups.forEach((c) => c());
  });
}
