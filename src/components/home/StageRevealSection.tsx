import { useEffect, useRef, useState, type ReactNode } from "react";

export type StageItem = {
  label: string;
  caption: ReactNode; // headline + body + cta block
  mock: ReactNode;    // image / fake screen
};

type Props = {
  stages: [StageItem, StageItem, StageItem];
};

/**
 * Scroll-locked alternating-fade reveal that ends in a staggered composite.
 *
 * Behaviour:
 *  - phase 0: section pinned, nothing yet visible
 *  - phase 1: stage 1 fades in from the LEFT
 *  - phase 2: stage 2 fades in from the RIGHT (stage 1 stays)
 *  - phase 3: stage 3 fades in from the LEFT (stages 1+2 stay)
 *  - phase 4: composite — all three mocks staggered, captions listed beside
 *  - phase 5: scroll unlocked, page continues normally
 *
 * Accessibility:
 *  - prefers-reduced-motion → no lock, no transforms, simple stack
 *  - Esc / focus-trap-escape releases the lock immediately
 *  - touch: vertical 3-card flow (no lock) on small screens
 */
export function StageRevealSection({ stages }: Props) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState(0); // 0..5
  const phaseRef = useRef(0);
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

  // Scroll-lock + phase advance via wheel
  useEffect(() => {
    if (!isDesktop || reduced) return;
    const el = sectionRef.current;
    if (!el) return;

    let locked = false;
    let lastTick = 0;
    const ADVANCE_MS = 380;
    const TOTAL_PHASES = 4; // phases 1..4 visible; phase 5 = unlock

    const setP = (next: number) => {
      phaseRef.current = next;
      setPhase(next);
    };

    const tryLock = () => {
      const rect = el.getBoundingClientRect();
      // Lock when section top is at viewport top and we haven't finished
      const atTop = rect.top <= 4 && rect.top >= -4;
      if (atTop && phaseRef.current < TOTAL_PHASES) {
        if (!locked) {
          locked = true;
          document.body.style.overflow = "hidden";
        }
      } else if (phaseRef.current >= TOTAL_PHASES) {
        unlock();
      }
    };

    const unlock = () => {
      if (locked) {
        locked = false;
        document.body.style.overflow = "";
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!locked) return;
      e.preventDefault();
      const now = Date.now();
      if (now - lastTick < ADVANCE_MS) return;
      lastTick = now;
      if (e.deltaY > 0) {
        if (phaseRef.current < TOTAL_PHASES) setP(phaseRef.current + 1);
        if (phaseRef.current >= TOTAL_PHASES) {
          setTimeout(() => {
            setP(TOTAL_PHASES + 1);
            unlock();
          }, 350);
        }
      } else if (e.deltaY < 0 && phaseRef.current === 0) {
        unlock();
      } else if (e.deltaY < 0) {
        setP(Math.max(0, phaseRef.current - 1));
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setP(TOTAL_PHASES + 1);
        unlock();
      }
      if (!locked) return;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        if (phaseRef.current < TOTAL_PHASES) setP(phaseRef.current + 1);
        else {
          setP(TOTAL_PHASES + 1);
          unlock();
        }
      }
      if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        if (phaseRef.current === 0) unlock();
        else setP(Math.max(0, phaseRef.current - 1));
      }
    };

    const onScroll = () => tryLock();
    const onFocusIn = () => {
      // Never trap keyboard users — release when focus moves inside
      unlock();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    el.addEventListener("focusin", onFocusIn);
    tryLock();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      el.removeEventListener("focusin", onFocusIn);
      unlock();
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
  const visible = (i: number) => phase >= i + 1; // stage i (0-indexed)

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      aria-label="The three stages of the platform"
    >
      <div className="h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="max-w-7xl w-full px-6">
          {!isComposite ? (
            <div className="relative min-h-[560px]">
              {stages.map((s, i) => {
                const fromLeft = i % 2 === 0; // 0,2 from left ; 1 from right
                const show = visible(i);
                return (
                  <div
                    key={s.label}
                    className={`absolute inset-0 grid md:grid-cols-2 gap-10 items-center transition-all duration-[500ms] ease-out ${
                      show ? "opacity-100 translate-x-0" : `opacity-0 ${fromLeft ? "-translate-x-8" : "translate-x-8"}`
                    } ${i !== phase - 1 && show ? "scale-[0.96] opacity-40" : ""}`}
                    style={{ zIndex: 10 + i }}
                    aria-hidden={!show}
                  >
                    <div className={fromLeft ? "" : "md:order-2"}>{s.caption}</div>
                    <div className={fromLeft ? "" : "md:order-1"}>{s.mock}</div>
                  </div>
                );
              })}
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 pointer-events-none">
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
              {/* Composite stack of all three mocks */}
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
              {/* Captions list */}
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
      </div>
    </section>
  );
}
