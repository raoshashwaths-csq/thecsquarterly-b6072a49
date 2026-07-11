import { useEffect, useId, useRef, useState } from "react";
import {
  getHeadlineForDay,
  type HeadlineSet,
} from "@/data/homepageHeadlines";

const PHRASE_HOLD = 1.2; // seconds fully visible
const MORPH_DURATION = 0.55; // seconds for blur/scale transition
const STEP_MS = (PHRASE_HOLD + MORPH_DURATION) * 1000;

interface Props {
  /** Day-of-week (0 = Sunday). Pass from parent to stay SSR-safe. */
  dayIndex?: number;
  /** Explicit headline override (takes precedence over dayIndex). */
  headline?: HeadlineSet;
}

export default function HeadlineMorph({ dayIndex = 0, headline }: Props) {
  const headlineSet = headline ?? getHeadlineForDay(dayIndex);
  const { phrases, line1, line2, fullText } = headlineSet;

  const rawId = useId();
  const filterId = `headline-morph-goo-${rawId.replace(/[:]/g, "")}`;

  const [stage, setStage] = useState(0); // 0,1,2 = phrase; 3 = final static
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (reducedMotion) {
      setStage(3);
      return;
    }
    setStage(0);
    timers.current.push(setTimeout(() => setStage(1), STEP_MS));
    timers.current.push(setTimeout(() => setStage(2), STEP_MS * 2));
    timers.current.push(setTimeout(() => setStage(3), STEP_MS * 3));
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [mounted, reducedMotion, headlineSet.id]);

  const isFinal = stage === 3 || !mounted;

  return (
    <div className="headline-morph relative">
      {/* SVG goo filter — the numeric matrix is a filter math constant, not a
          brand color. It reshapes alpha to create the liquid morph edge. */}
      <svg
        aria-hidden
        className="absolute h-0 w-0 overflow-hidden"
        style={{ position: "absolute" }}
      >
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Real, SEO-visible headline. Reserves layout height so nothing jumps. */}
      <h1
        className={`font-display text-5xl md:text-7xl lg:text-8xl mb-8 text-balance leading-[0.95] tracking-tight transition-[opacity,filter] duration-500 ease-out ${
          isFinal ? "opacity-100 blur-0" : "opacity-0 blur-sm"
        }`}
        aria-live="polite"
      >
        {line1} <span className="not-italic text-accent">{line2}</span>
      </h1>

      {/* Animated phrase overlay (only while morphing). */}
      {!isFinal && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center"
          style={{ filter: `url(#${filterId})` }}
          aria-hidden
        >
          <span
            key={stage}
            className="headline-morph-phrase font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight text-balance"
          >
            {phrases[stage]}
          </span>
        </div>
      )}

      {/* Screen-reader-only immediate full text for a11y (in case aria-live
          on the visual h1 misses the initial mount). */}
      <span className="sr-only">{fullText}</span>
    </div>
  );
}
