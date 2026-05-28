import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { TourStep } from "@/hooks/useTour";

type Props = {
  step: TourStep;
  index: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
};

export function PlaybookTour({ step, index, total, onNext, onSkip }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // wait a frame to let the route render
    let raf = 0;
    const find = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      setAnchor(el);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    raf = requestAnimationFrame(() => requestAnimationFrame(find));
    return () => cancelAnimationFrame(raf);
  }, [step.target]);

  const isLast = index + 1 >= total;

  // Anchored popover when we can find the target, otherwise a centered modal card.
  if (!anchor) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 animate-fade-in">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-elegant">
          <TourBody step={step} index={index} total={total} onNext={onNext} onSkip={onSkip} isLast={isLast} />
        </div>
      </div>
    );
  }

  return (
    <Popover open>
      <PopoverAnchor virtualRef={{ current: anchor }} />
      <PopoverContent side="bottom" align="center" className="w-80 animate-fade-in">
        <TourBody step={step} index={index} total={total} onNext={onNext} onSkip={onSkip} isLast={isLast} />
      </PopoverContent>
    </Popover>
  );
}

function TourBody({
  step,
  index,
  total,
  onNext,
  onSkip,
  isLast,
}: {
  step: TourStep;
  index: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
  isLast: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
        Step {index + 1} of {total}
      </p>
      <h3 className="font-display text-lg leading-tight">{step.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onSkip}
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          Skip tour
        </button>
        <Button size="sm" onClick={onNext}>
          {isLast ? "Finish" : "Next →"}
        </Button>
      </div>
    </div>
  );
}
