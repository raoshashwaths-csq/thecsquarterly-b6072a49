import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { lumiPageActions, type PageContext, type LumiAction } from "@/config/lumiPageActions";

const DISMISS_KEY = "lumi_bubble_dismissed_session";
const MESSAGED_KEY = "lumi_messaged";
const SHOW_DELAY_MS = 3000;
const CYCLE_MS = 5000;
const SCROLL_HIDE_THRESHOLD = 300;

export function LumiBubble({
  pageContext,
  drawerOpen,
  onOpen,
}: {
  pageContext: PageContext;
  drawerOpen: boolean;
  onOpen: (action: LumiAction) => void;
}) {
  const actions = lumiPageActions[pageContext] ?? lumiPageActions.default;
  const [index, setIndex] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [hiddenByScroll, setHiddenByScroll] = useState(false);
  const reducedMotion = useRef(false);

  // Init: respect reduced motion, session dismiss, session messaged.
  useEffect(() => {
    if (typeof window === "undefined") return;
    reducedMotion.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
      if (sessionStorage.getItem(MESSAGED_KEY) === "1") setDismissed(true);
    } catch { /* */ }
    const t = setTimeout(() => setMounted(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Cycle messages.
  useEffect(() => {
    if (!mounted || dismissed || drawerOpen || actions.length <= 1) return;
    if (reducedMotion.current) return;
    const t = setInterval(() => {
      setExiting(true);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % actions.length);
        setExiting(false);
      }, 300);
    }, CYCLE_MS);
    return () => clearInterval(t);
  }, [mounted, dismissed, drawerOpen, actions.length]);

  // Reset cycle index when context (and therefore action set) changes.
  useEffect(() => {
    setIndex(0);
    setExiting(false);
  }, [pageContext]);

  // Scroll-direction visibility.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const goingUp = y < last;
      if (goingUp && y > 80) setHiddenByScroll(true);
      else if (!goingUp && y > SCROLL_HIDE_THRESHOLD) setHiddenByScroll(false);
      else if (y <= 80) setHiddenByScroll(false);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* */ }
    setDismissed(true);
  };

  if (!mounted || dismissed || drawerOpen || hiddenByScroll || actions.length === 0) {
    return null;
  }

  const action = actions[index];

  return (
    <div
      className="lumi-bubble fixed z-30 bottom-[140px] right-5 md:bottom-[180px] md:right-8 w-[220px] max-w-[calc(100vw-48px)]"
      role="status"
      aria-live="polite"
    >
      <div className="relative rounded-md border border-secondary-accent/80 bg-secondary px-3.5 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        {/* Identity row */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-secondary-accent" aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/55">
              Lumi
            </span>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss Lumi suggestion"
            className="text-foreground/45 hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Message — crossfade */}
        <button
          type="button"
          onClick={() => onOpen(action)}
          className={`block w-full text-left font-serif text-[13px] leading-[1.5] text-foreground transition-opacity duration-300 ${
            exiting ? "opacity-0" : "opacity-100"
          }`}
        >
          {action.bubbleMessage}
        </button>

        {/* Counter */}
        {actions.length > 1 && (
          <div className="mt-2 flex items-center justify-end font-mono text-[10px] text-foreground/45">
            {index + 1} / {actions.length}
          </div>
        )}

        {/* Progress bar */}
        {!reducedMotion.current && actions.length > 1 && (
          <div className="absolute left-0 right-0 bottom-0 h-px overflow-hidden rounded-b-md">
            <div
              key={`${pageContext}-${index}`}
              className="lumi-bubble-progress h-full bg-secondary-accent/60"
            />
          </div>
        )}

        {/* Tail */}
        <span className="lumi-bubble-tail" aria-hidden />
        <span className="lumi-bubble-tail-fill" aria-hidden />
      </div>
    </div>
  );
}
