import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { QHint } from "@/components/site/QHint";

const SECTIONS = [
  { to: "/vanguard", name: "The CS Vanguard", key: "vanguard" },
  { to: "/retention-protocol", name: "The Retention Protocol", key: "retention" },
  { to: "/outcome-forum", name: "The Outcome Forum", key: "outcome" },
  { to: "/codex", name: "The CS Codex", key: "codex" },
  { to: "/ai-readiness", name: "The Diagnostics", key: "diagnostic" },
] as const;

const OVERLAP = 0.15;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function SectionsFillGrid() {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLDivElement>(null);
  const numCards = SECTIONS.length;
  const [fills, setFills] = useState<number[]>(() => new Array(numCards).fill(0));
  const [isMobile, setIsMobile] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const el = trackRef.current;
    if (!el) return;

    const compute = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress 0 → section just entered from bottom; 1 → top about to exit
      const total = rect.height; // distance the section traverses while overlapping the viewport top edge after entering
      const scrolled = vh - rect.top; // 0 when top hits bottom of viewport
      const raw = scrolled / (total + vh);
      const progress = Math.max(0, Math.min(1, raw));

      const totalFillProgress = progress * (numCards - OVERLAP * (numCards - 1));
      const next: number[] = new Array(numCards);
      for (let i = 0; i < numCards; i++) {
        const cardStart = i * (1 - OVERLAP);
        next[i] = Math.max(0, Math.min(1, totalFillProgress - cardStart)) * 100;
      }
      setFills(next);
    };

    let last = 0;
    const onScroll = () => {
      const now = performance.now();
      if (now - last < 16) return;
      last = now;
      compute();
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", compute);
    };
  }, [numCards, reduced]);

  return (
    <div ref={trackRef} className="card-fill-track">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {SECTIONS.map((s, i) => {
          const pct = reduced ? 0 : fills[i] ?? 0;
          const isFilled = pct > 50;
          const fillStyle = isMobile
            ? { transform: `scaleY(${pct / 100})`, transformOrigin: "bottom center" as const }
            : { transform: `scaleX(${pct / 100})`, transformOrigin: "left center" as const };
          return (
            <Link
              key={s.to}
              to={s.to}
              className="fill-card group relative block border bg-card/60 hover:bg-card transition-colors p-6 pt-7 overflow-hidden"
              style={{
                borderColor: isFilled ? "transparent" : undefined,
                transition: "border-color 0.3s ease, background-color 0.2s ease, transform 0.2s ease",
              }}
            >
              {/* Fill layer */}
              <div
                aria-hidden
                className="fill-layer"
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 70%, black))",
                  transition: "transform 0.15s linear",
                  zIndex: 0,
                  willChange: "transform",
                  ...fillStyle,
                }}
              />
              {/* Content */}
              <div
                className="relative"
                style={{
                  zIndex: 1,
                  color: isFilled ? "var(--accent-foreground)" : undefined,
                  transition: "color 0.3s ease",
                }}
              >
                <span
                  aria-hidden
                  className="absolute -top-1 left-0 right-0 h-px"
                  style={{
                    background: isFilled ? "var(--accent-foreground)" : "var(--foreground)",
                    opacity: isFilled ? 0.4 : 0.8,
                    transition: "background 0.3s ease, opacity 0.3s ease",
                  }}
                />
                <div
                  className="font-mono text-xs font-semibold mb-3"
                  style={{
                    color: isFilled ? "var(--accent-foreground)" : "var(--secondary-accent)",
                    transition: "color 0.3s ease",
                  }}
                >
                  0{i + 1} / 0{SECTIONS.length}
                </div>
                <h2 className="font-display text-xl md:text-2xl mb-2 leading-tight">
                  {t(`home.sections.items.${s.key}.name`, { defaultValue: s.name })}
                </h2>
                <p
                  className="text-sm text-pretty mb-4"
                  style={{
                    color: isFilled
                      ? "color-mix(in oklab, var(--accent-foreground) 88%, transparent)"
                      : "color-mix(in oklab, var(--foreground) 65%, transparent)",
                    transition: "color 0.3s ease",
                  }}
                >
                  {t(`home.sections.items.${s.key}.blurb`)}
                </p>
                <div
                  className="font-mono uppercase tracking-widest text-xs mb-3"
                  style={{
                    color: isFilled
                      ? "var(--accent-foreground)"
                      : "color-mix(in oklab, var(--foreground) 60%, transparent)",
                    transition: "color 0.3s ease",
                  }}
                >
                  {t("home.sections.enter")}
                </div>
                <QHint>{t(`home.sections.items.${s.key}.hint`)}</QHint>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
