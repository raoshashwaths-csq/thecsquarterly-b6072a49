import { useEffect, useRef, useState } from "react";
import {
  getHeadlineForDay,
  type HeadlineSet,
} from "@/data/homepageHeadlines";

const PHRASE_HOLD = 1.4; // seconds fully visible
const MORPH_DURATION = 0.55; // seconds for blur/scale transition
const STEP_MS = Math.round((PHRASE_HOLD + MORPH_DURATION) * 1000);

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

  // Single-owner timeline: refs so the effect can run once (empty deps)
  // without React re-scheduling anything based on prop identity.
  const phrasesRef = useRef(phrases);
  phrasesRef.current = phrases;
  const finalStageRef = useRef(finalStage);
  finalStageRef.current = finalStage;

  const [stage, setStage] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setStage(finalStageRef.current);
      return;
    }
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const total = finalStageRef.current;
    for (let i = 1; i < total; i++) {
      timers.push(setTimeout(() => setStage(i), STEP_MS * i));
    }
    timers.push(setTimeout(() => setStage(total), STEP_MS * total));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const isFinal = stage >= finalStage;
  const currentPhrase = phrases[Math.min(stage, phrases.length - 1)];

  return (
    <div className="headline-morph">
      <h1
        className="font-display text-5xl md:text-7xl lg:text-8xl mb-8 min-h-[4.75em] sm:min-h-[3.8em] md:min-h-[2.85em] text-balance leading-[0.95] tracking-tight"
        aria-label={fullText}
      >
        {isFinal ? (
          <span key="final" className="headline-morph-final">
            {line1} <span className="not-italic text-accent">{line2}</span>
          </span>
        ) : (
          <span key={`piece-${stage}`} className="headline-morph-piece">
            {currentPhrase}
          </span>
        )}
      </h1>
      {/* Screen-reader-only full sentence so assistive tech always reads the
          complete headline regardless of animation stage. */}
      <span className="sr-only">{fullText}</span>
    </div>
  );
}
