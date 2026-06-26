import { useEffect, useRef, useState, type ReactNode } from "react";

export type StageItem = {
  label: string;
  caption: ReactNode;
  mock: ReactNode;
};

type Props = {
  stages: [StageItem, StageItem, StageItem];
};

/**
 * Three-stage reveal built on a sticky scroll container.
 *
 * Desktop + fine pointer + no reduced-motion:
 *  - Outer wrapper is 300vh tall (3 phases × viewport).
 *  - Inner is sticky `top-0 h-screen` and holds a two-column layout:
 *      left  = stacked mocks layered on top of each other, cross-fading
 *      right = vertical caption list, active row highlighted
 *  - A thin vertical rail with 3 dots tracks the active phase.
 *  - Page scroll drives phase 1 → 2 → 3 naturally — no scroll lock, no
 *    wheel/key/touch interception, no body-overflow mutation.
 *
 * Mobile / reduced-motion: the three stages render as a normal vertical
 * stack — no sticky, no scroll math.
 */
export function StageRevealSection({ stages }: Props) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqDesk = window.matchMedia("(min-width: 768px) and (pointer: fine)");
    const sync = () => {
      setReduced(mqReduce.matches);
      setIsDesktop(mqDesk.matches);
    };
    sync();
    mqReduce.addEventListener("change", sync);
    mqDesk.addEventListener("change", sync);
    return () => {
      mqReduce.removeEventListener("change", sync);
      mqDesk.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop || reduced) return;
    const el = sectionRef.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const progress = Math.min(1, Math.max(0, -rect.top / total));
      // Map 0..1 → phase 0/1/2 via thirds.
      const next = progress >= 0.66 ? 2 : progress >= 0.33 ? 1 : 0;
      setPhase((p) => (p === next ? p : next));
    };
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isDesktop, reduced]);

  const jumpToPhase = (i: number) => {
    const el = sectionRef.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    const target =
      el.getBoundingClientRect().top + window.scrollY + (total * i) / (stages.length - 1 || 1);
    window.scrollTo({ top: target, behavior: "smooth" });
  };

  // Mobile / reduced-motion: simple vertical stack.
  if (!isDesktop || reduced) {
    return (
      <section className="border-y border-border bg-background/60">
        <div className="max-w-7xl w-full mx-auto px-6 py-16 space-y-20">
          {stages.map((s, i) => (
            <div key={i} className="space-y-8">
              <div>{s.caption}</div>
              <div>{s.mock}</div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative border-y border-border bg-background/60"
      style={{ height: `${stages.length * 100}vh` }}
      aria-label="The CSFactors stages"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="max-w-7xl w-full mx-auto h-full px-6 md:px-10 grid grid-cols-12 gap-8 items-center">
          {/* Progress rail */}
          <div className="hidden md:flex col-span-1 flex-col items-center gap-3">
            {stages.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Jump to stage ${i + 1}`}
                onClick={() => jumpToPhase(i)}
                className="group flex items-center gap-2"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full border transition-colors ${
                    phase === i
                      ? "bg-accent border-accent"
                      : "bg-transparent border-foreground/30 group-hover:border-foreground"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Mocks — stacked, cross-faded */}
          <div className="col-span-12 md:col-span-6 relative h-[70vh]">
            {stages.map((s, i) => (
              <div
                key={i}
                aria-hidden={phase !== i}
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
                  phase === i
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-2 pointer-events-none"
                }`}
              >
                {s.mock}
              </div>
            ))}
          </div>

          {/* Caption list */}
          <ol className="col-span-12 md:col-span-5 space-y-6">
            {stages.map((s, i) => {
              const active = phase === i;
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => jumpToPhase(i)}
                    className={`w-full text-left border-l-2 pl-5 py-2 transition-all ${
                      active
                        ? "border-accent opacity-100"
                        : "border-border opacity-50 hover:opacity-80"
                    }`}
                  >
                    <div
                      className={`transition-all duration-300 ${
                        active ? "max-h-[600px]" : "max-h-12 overflow-hidden"
                      }`}
                    >
                      {active ? (
                        s.caption
                      ) : (
                        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-foreground/60">
                          Stage 0{i + 1} · {s.label}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
