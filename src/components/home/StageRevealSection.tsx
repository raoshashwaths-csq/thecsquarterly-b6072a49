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
 * Scroll-locked alternating-fade reveal that ends in a staggered composite.
 *
 * Behaviour (desktop + fine pointer + no reduced-motion):
 *  - phase 1: stage 1 visible from mount (no blank state)
 *  - phase 2: stage 2 fades in from the RIGHT
 *  - phase 3: stage 3 fades in from the LEFT
 *  - phase 4: composite — all three mocks staggered, captions listed beside
 *  - phase 5: lock released, composite stays, page continues
 *
 * Lock engages via IntersectionObserver when ≥ 80% of section is in view.
 * Safety net releases body overflow after 6s in case wheel events are
 * swallowed. Esc / ArrowUp at phase 1 / focusin all release immediately.
 */
export function StageRevealSection({ stages }: Props) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState(1);
  const phaseRef = useRef(1);
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

    let locked = false;
    let lastTick = 0;
    let safety: ReturnType<typeof setTimeout> | null = null;
    const ADVANCE_MS = 380;
    const TOTAL_PHASES = 4;

    const setP = (next: number) => {
      phaseRef.current = next;
      setPhase(next);
    };

    const release = () => {
      if (locked) {
        locked = false;
        document.body.style.overflow = "";
      }
      if (safety) {
        clearTimeout(safety);
        safety = null;
      }
    };

    const engage = () => {
      if (locked) return;
      if (phaseRef.current >= TOTAL_PHASES) return;
      locked = true;
      document.body.style.overflow = "hidden";
      // Safety net — never wedge the page
      safety = setTimeout(() => release(), 6000);
    };

    const advance = (dir: 1 | -1) => {
      const now = Date.now();
      if (now - lastTick < ADVANCE_MS) return;
      lastTick = now;
      if (dir > 0) {
        if (phaseRef.current < TOTAL_PHASES) {
          setP(phaseRef.current + 1);
          if (phaseRef.current >= TOTAL_PHASES) {
            setTimeout(() => {
              setP(TOTAL_PHASES + 1);
              release();
            }, 500);
          }
        } else {
          setP(TOTAL_PHASES + 1);
          release();
        }
      } else {
        if (phaseRef.current <= 1) {
          release();
        } else {
          setP(phaseRef.current - 1);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!locked) return;
      e.preventDefault();
      advance(e.deltaY > 0 ? 1 : -1);
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!locked) return;
      e.preventDefault();
      const dy = touchStartY - (e.touches[0]?.clientY ?? 0);
      if (Math.abs(dy) < 24) return;
      touchStartY = e.touches[0]?.clientY ?? 0;
      advance(dy > 0 ? 1 : -1);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setP(TOTAL_PHASES + 1);
        release();
        return;
      }
      if (!locked) return;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        advance(1);
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        advance(-1);
      }
    };

    const onFocusIn = () => release();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
            engage();
          } else if (!entry.isIntersecting) {
            release();
          }
        }
      },
      { threshold: [0, 0.5, 0.75, 0.9] },
    );
    io.observe(el);

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    el.addEventListener("focusin", onFocusIn);

    return () => {
      io.disconnect();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      el.removeEventListener("focusin", onFocusIn);
      release();
    };
  }, [isDesktop, reduced]);

  // Mobile / reduced-motion: simple stacked vertical reveal
  if (reduced || !isDesktop) {
    return (
      <section ref={sectionRef} className="max-w-7xl w-full mx-auto px-6 py-14 md:py-20">
        <div className="space-y-16">
          {stages.map((s, i) => (
            <div
              key={s.label}
              className={`grid md:grid-cols-2 gap-10 items-center animate-fade-up ${
                i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div>{s.caption}</div>
              <div>{s.mock}</div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const isComposite = phase >= 4;
  const visible = (i: number) => phase >= i + 1;

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-16 md:py-24"
      aria-label="The three stages of the platform"
    >
      <div className="max-w-7xl w-full mx-auto px-6">
        {!isComposite ? (
          <div className="relative min-h-[560px] md:min-h-[600px]">
            {stages.map((s, i) => {
              const fromLeft = i % 2 === 0;
              const show = visible(i);
              const isCurrent = i === phase - 1;
              return (
                <div
                  key={s.label}
                  className={`absolute inset-0 grid md:grid-cols-2 gap-10 items-center transition-all duration-[500ms] ease-out ${
                    show
                      ? `opacity-100 translate-x-0 ${isCurrent ? "" : "opacity-40 scale-[0.96]"}`
                      : `opacity-0 ${fromLeft ? "-translate-x-8" : "translate-x-8"}`
                  }`}
                  style={{ zIndex: 10 + i + (isCurrent ? 5 : 0) }}
                  aria-hidden={!show}
                >
                  <div className={fromLeft ? "" : "md:order-2"}>{s.caption}</div>
                  <div className={fromLeft ? "" : "md:order-1"}>{s.mock}</div>
                </div>
              );
            })}
            <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-2 pointer-events-none">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className={`h-1 w-8 transition-colors ${
                    phase >= n ? "bg-accent" : "bg-foreground/15"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-10 items-center animate-fade-up">
            <div className="relative h-[420px] md:h-[480px]">
              {stages.map((s, i) => (
                <div
                  key={s.label}
                  className="absolute inset-0 transition-all duration-700 ease-out"
                  style={{
                    transform: `translate(${(i - 1) * 28}px, ${(i - 1) * 22}px) rotate(${(i - 1) * 4}deg) scale(${0.86 + i * 0.04})`,
                    zIndex: i + 1,
                  }}
                >
                  <div className="h-full">{s.mock}</div>
                </div>
              ))}
            </div>
            <ol className="space-y-6">
              {stages.map((s, i) => (
                <li
                  key={s.label}
                  className="flex gap-4 border-l-2 border-accent/40 pl-4 animate-fade-up"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent min-w-[3.5ch] pt-1">
                    0{i + 1}
                  </span>
                  <div className="text-sm md:text-base">{s.caption}</div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
