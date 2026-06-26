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
 * Three-stage reveal that resolves into a horizontal scroll carousel.
 *
 * Desktop + fine pointer + no reduced-motion:
 *  - phase 1: stage 01 fades in from LEFT
 *  - phase 2: stage 02 fades in from RIGHT (01 stays)
 *  - phase 3: stage 03 fades in from LEFT (01 + 02 stay) — all three now
 *             form the carousel row; scroll lock releases.
 *
 * Scroll lock engages when ≥75% of the section is in view via
 * IntersectionObserver, with a 6s safety net so the page is never wedged.
 * Wheel / arrow / page-down / space / touch all advance one phase.
 * Esc, ArrowUp at phase 1, and focusin release immediately.
 *
 * Mobile / reduced-motion: the carousel is the default — no lock, no
 * entrance gating, all three cards present from mount.
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
    const ADVANCE_MS = 420;
    const TOTAL_PHASES = 3;

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
            setTimeout(() => release(), 450);
          }
        } else {
          release();
        }
      } else {
        if (phaseRef.current <= 1) release();
        else setP(phaseRef.current - 1);
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
        setP(TOTAL_PHASES);
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
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            engage();
          } else if (!entry.isIntersecting) {
            release();
          }
        }
      },
      { threshold: [0, 0.4, 0.6, 0.85] },
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

  // ── Mobile / reduced-motion: just the carousel, no gating ────────────
  if (reduced || !isDesktop) {
    return (
      <section
        ref={sectionRef}
        className="w-full py-14 md:py-20"
        aria-label="The three stages of the platform"
      >
        <div className="max-w-7xl w-full mx-auto px-6">
          <StageHeader />
          <StageCarousel stages={stages} visible={[true, true, true]} />
        </div>
      </section>
    );
  }

  const visible: [boolean, boolean, boolean] = [phase >= 1, phase >= 2, phase >= 3];

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-16 md:py-24"
      aria-label="The three stages of the platform"
    >
      <div className="max-w-7xl w-full mx-auto px-6">
        <StageHeader />
        <StageCarousel stages={stages} visible={visible} />

        {/* Progress dots */}
        <div className="mt-8 flex justify-center gap-2" aria-hidden>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1 w-10 transition-colors duration-300 ${
                phase >= n ? "bg-accent" : "bg-foreground/15"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StageHeader() {
  return (
    <div className="mb-10 md:mb-14 max-w-2xl">
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-secondary-accent mb-4 font-semibold">
        The three stages
      </div>
      <h2 className="font-display text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-tight text-balance">
        One platform. Three operators. The same retention engine.
      </h2>
    </div>
  );
}

function StageCarousel({
  stages,
  visible,
}: {
  stages: [StageItem, StageItem, StageItem];
  visible: [boolean, boolean, boolean];
}) {
  return (
    <div
      className="-mx-6 px-6 overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="region"
      aria-label="Stages carousel"
      tabIndex={0}
    >
      <ul className="flex gap-6 md:gap-8 pb-2">
        {stages.map((s, i) => {
          const show = visible[i];
          const fromLeft = i % 2 === 0; // 0,2 from left ; 1 from right
          return (
            <li
              key={s.label}
              className={`snap-start shrink-0 w-[88vw] sm:w-[460px] md:w-[520px] lg:w-[560px] transition-all duration-[600ms] ease-out ${
                show
                  ? "opacity-100 translate-x-0"
                  : `opacity-0 ${fromLeft ? "-translate-x-10" : "translate-x-10"}`
              }`}
              aria-hidden={!show}
            >
              <article className="flex flex-col h-full bg-card border border-border overflow-hidden card-lift">
                <div className="border-b border-border bg-background/40 p-4">
                  {s.mock}
                </div>
                <div className="p-6 md:p-8">{s.caption}</div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
