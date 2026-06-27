import { useEffect } from "react";

/**
 * 3D tilt + specular highlight on any element marked with `data-tilt`.
 * Pointer-driven CSS transforms only. Tokens drive the glare via --tilt-glare.
 *
 * Performance:
 *  - Skips entirely on coarse-pointer (touch) devices to avoid jank and
 *    the awkward "follow my finger" effect.
 *  - Caches the element rect on pointerenter so pointermove never triggers
 *    a layout (no per-frame getBoundingClientRect).
 *  - Listeners are passive; updates coalesced via rAF.
 *  - Respects prefers-reduced-motion.
 *  - Clears inline transforms on leave so existing .card-lift hover wins.
 */
export function useTilt(opts: { max?: number; scale?: number } = {}) {
  const max = opts.max ?? 6;
  const scale = opts.scale ?? 1.01;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (reduced || coarse) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-tilt]"));
    if (!nodes.length) return;

    const cleanups: Array<() => void> = [];

    nodes.forEach((el) => {
      el.style.transformStyle = "preserve-3d";

      let raf = 0;
      let rect: DOMRect | null = null;
      let pending: { x: number; y: number } | null = null;

      const apply = () => {
        raf = 0;
        if (!pending || !rect) return;
        const px = (pending.x - rect.left) / rect.width;
        const py = (pending.y - rect.top) / rect.height;
        const rx = (0.5 - py) * max * 2;
        const ry = (px - 0.5) * max * 2;
        el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${scale})`;
        el.style.setProperty("--tilt-x", `${(px * 100).toFixed(1)}%`);
        el.style.setProperty("--tilt-y", `${(py * 100).toFixed(1)}%`);
      };

      const onEnter = (e: PointerEvent) => {
        // Only react to fine pointers (mouse / trackpad / pen).
        if (e.pointerType === "touch") return;
        rect = el.getBoundingClientRect();
        el.style.willChange = "transform";
      };

      const onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch" || !rect) return;
        pending = { x: e.clientX, y: e.clientY };
        if (!raf) raf = requestAnimationFrame(apply);
      };

      const onLeave = () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        pending = null;
        rect = null;
        el.style.transform = "";
        el.style.willChange = "";
        el.style.removeProperty("--tilt-x");
        el.style.removeProperty("--tilt-y");
      };

      el.addEventListener("pointerenter", onEnter, { passive: true });
      el.addEventListener("pointermove", onMove, { passive: true });
      el.addEventListener("pointerleave", onLeave, { passive: true });
      el.addEventListener("blur", onLeave, true);

      cleanups.push(() => {
        el.removeEventListener("pointerenter", onEnter);
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
