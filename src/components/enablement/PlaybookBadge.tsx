import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlaybookDrawer } from "./PlaybookDrawer";
import { PlaybookTour } from "./PlaybookTour";
import { useTour } from "@/hooks/useTour";

const HIDDEN_PREFIXES = ["/login", "/checkout", "/api", "/email", "/lovable", "/unsubscribe"];

export function PlaybookBadge() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const tour = useTour();

  const hidden = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));
  if (hidden) return null;

  // Stack above the global Q button on mobile, sit to its left on desktop.
  // On /csfactors the global Q is hidden, so we slide back to the corner.
  const onCsfactors = pathname.startsWith("/csfactors") || pathname === "/calculator";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Command Centre Playbook"
        className={cn(
          "fixed z-40 inline-flex h-12 w-12 items-center justify-center rounded-full",
          "border border-border bg-card/70 backdrop-blur-md shadow-elegant",
          "text-foreground transition-transform duration-200 ease-out",
          "hover:scale-105 active:scale-95 motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "before:absolute before:inset-0 before:rounded-full before:ring-2 before:ring-accent/40",
          "before:animate-ping before:opacity-60 motion-reduce:before:animate-none",
          onCsfactors
            ? "bottom-6 right-6 md:bottom-6 md:right-6"
            : "bottom-24 right-6 md:bottom-6 md:right-24",
        )}
      >
        <Lightbulb className="h-5 w-5 text-accent" aria-hidden />
        <span className="sr-only">Tips and Playbook</span>
      </button>

      <PlaybookDrawer open={open} onOpenChange={setOpen} onStartTour={tour.start} />

      {tour.active && tour.step ? (
        <PlaybookTour
          step={tour.step}
          index={tour.stepIndex}
          total={tour.total}
          onNext={tour.next}
          onSkip={tour.skip}
        />
      ) : null}
    </>
  );
}
