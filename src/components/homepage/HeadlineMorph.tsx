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
  const finalStage = phrases.length;

  const rawId = useId();
  const filterId = `headline-morph-goo-${rawId.replace(/[:]/g, "")}`;

  const [stage, setStage] = useState(0); // phrase index, then finalStage = final static headline
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
      setStage(finalStage);
      return;
    }
    setStage(0);
    phrases.slice(1).forEach((_, index) => {
      timers.current.push(setTimeout(() => setStage(index + 1), STEP_MS * (index + 1)));
    });
    timers.current.push(setTimeout(() => setStage(finalStage), STEP_MS * finalStage));
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [mounted, reducedMotion, headlineSet.id, finalStage, phrases]);

  const isFinal = stage === finalStage;
  const currentPhrase = phrases[Math.min(stage, phrases.length - 1)];

  return (
    <div className="headline-morph">
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

      {/* The single visual headline. During the sequence this same h1 changes
          text in-place; there is no absolute overlay layer. */}
      <h1
        className="font-display text-5xl md:text-7xl lg:text-8xl mb-8 min-h-[4.75em] sm:min-h-[3.8em] md:min-h-[2.85em] text-balance leading-[0.95] tracking-tight"
        aria-live="polite"
        aria-label={fullText}
      >
        {isFinal ? (
          <span key={`${headlineSet.id}-final`} className="headline-morph-final">
            {line1} <span className="not-italic text-accent">{line2}</span>
          </span>
        ) : (
          <span
            key={`${headlineSet.id}-${stage}`}
            className="headline-morph-piece"
            style={{ filter: `url(#${filterId})` }}
          >
            {currentPhrase}
          </span>
        )}
      </h1>
    </div>
  );
}
