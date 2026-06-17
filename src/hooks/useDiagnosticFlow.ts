import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type DiagnosticStage = "landing" | "survey" | "calculating" | "results";

export interface DiagnosticQuestion {
  question: string;
  options: string[];
}

export interface DiagnosticConfig<S extends Record<string, number>> {
  questions: DiagnosticQuestion[];
  calcSteps: string[];
  /** Returns the headline number shown to the user (0–100). */
  calculateScore: (answers: Record<number, number>) => number;
  /** Optional sub-score breakdown. */
  calculateSubScores: (answers: Record<number, number>) => S;
  /** Calculating interstitial duration in ms (default 3500). */
  calculatingMs?: number;
}

export function useDiagnosticFlow<S extends Record<string, number>>(
  config: DiagnosticConfig<S>,
) {
  const [stage, setStage] = useState<DiagnosticStage>("landing");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [calcStep, setCalcStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = config.questions.length;
  const isLast = currentQuestion === total - 1;
  const allAnswered = Object.keys(answers).length === total;

  const scrollTop = () => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const start = useCallback(() => {
    setStage("survey");
    setCurrentQuestion(0);
    setSelectedOption(answers[0] ?? null);
    scrollTop();
  }, [answers]);

  const next = useCallback(() => {
    if (selectedOption === null) return;
    const updated = { ...answers, [currentQuestion]: selectedOption };
    setAnswers(updated);
    if (isLast) {
      setStage("calculating");
      scrollTop();
    } else {
      const n = currentQuestion + 1;
      setCurrentQuestion(n);
      setSelectedOption(updated[n] ?? null);
      scrollTop();
    }
  }, [answers, currentQuestion, isLast, selectedOption]);

  const previous = useCallback(() => {
    if (currentQuestion === 0) {
      setStage("landing");
      scrollTop();
      return;
    }
    const p = currentQuestion - 1;
    setCurrentQuestion(p);
    setSelectedOption(answers[p] ?? null);
    scrollTop();
  }, [answers, currentQuestion]);

  const reset = useCallback(() => {
    setStage("landing");
    setCurrentQuestion(0);
    setAnswers({});
    setSelectedOption(null);
    setCalcStep(0);
    scrollTop();
  }, []);

  // Calculating interstitial: cycle steps then advance to results.
  useEffect(() => {
    if (stage !== "calculating") return;
    setCalcStep(0);
    const total = config.calculatingMs ?? 3500;
    const step = total / config.calcSteps.length;
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      if (i < config.calcSteps.length) setCalcStep(i);
    }, step);
    timerRef.current = setTimeout(() => {
      clearInterval(interval);
      setStage("results");
      scrollTop();
    }, total);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [stage, config.calculatingMs, config.calcSteps.length]);

  const score = useMemo(
    () => (stage === "results" ? config.calculateScore(answers) : 0),
    [stage, answers, config],
  );
  const subScores = useMemo(
    () => (stage === "results" ? config.calculateSubScores(answers) : ({} as S)),
    [stage, answers, config],
  );

  return {
    stage,
    setStage,
    currentQuestion,
    answers,
    selectedOption,
    setSelectedOption,
    calcStep,
    score,
    subScores,
    questions: config.questions,
    calcSteps: config.calcSteps,
    isLast,
    allAnswered,
    total,
    start,
    next,
    previous,
    reset,
  };
}

/** Count-up animation hook used by the results score. */
export function useCountUp(target: number, durationMs = 1200, active = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, active]);
  return value;
}
