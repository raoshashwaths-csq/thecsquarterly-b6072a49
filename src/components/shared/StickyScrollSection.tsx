import { useState, useEffect, useRef, type ReactNode } from "react";

export type StickyStage = {
  left: ReactNode;
  right: ReactNode;
  label?: string;
};

type Props = {
  stages: StickyStage[];
};

/**
 * StickyScrollSection — Auxia-style pinned scroll storyteller.
 * Standalone, no deps. Drop into marketing/home pages only —
 * NEVER on article or dashboard routes (would corrupt paywall
 * scroll-depth calculation by inflating page height).
 */
export function StickyScrollSection({ stages }: Props) {
  const [activeStage, setActiveStage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const outerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const handleScroll = () => {
      if (!outerRef.current) return;
      const rect = outerRef.current.getBoundingClientRect();
      const totalScrollDistance = rect.height - window.innerHeight;
      if (totalScrollDistance <= 0) return;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalScrollDistance));
      const stage = Math.min(Math.floor(progress * stages.length), stages.length - 1);
      setActiveStage(stage);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [stages.length, isMobile]);

  if (isMobile) {
    return (
      <div className="w-full">
        {stages.map((stage, i) => (
          <div
            key={i}
            className="flex flex-col gap-6 px-5 py-12 border-b border-border last:border-b-0"
          >
            {stage.label && (
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                {stage.label}
              </div>
            )}
            <div className="min-w-0">{stage.left}</div>
            <div className="w-full min-w-0 overflow-hidden">{stage.right}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={outerRef}
      style={{ position: "relative", height: `calc(85vh * ${stages.length + 0.5})` }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "85vh",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
          overflow: "hidden",
        }}
        className="bg-background"
      >
        {/* LEFT */}
        <div style={{ position: "relative", height: "100%" }}>
          {stages.map((stage, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: 0,
                padding: "80px 64px 80px 96px",
                opacity: activeStage === i ? 1 : 0,
                transform:
                  activeStage === i
                    ? "translateY(0)"
                    : activeStage > i
                    ? "translateY(-24px)"
                    : "translateY(24px)",
                transition: "opacity 0.5s ease, transform 0.5s ease",
                pointerEvents: activeStage === i ? "auto" : "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {stage.left}
            </div>
          ))}
        </div>

        {/* RIGHT */}
        <div style={{ position: "relative", height: "100%" }}>
          {stages.map((stage, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: 0,
                padding: "60px 80px 60px 32px",
                opacity: activeStage === i ? 1 : 0,
                transform:
                  activeStage === i
                    ? "translateY(0)"
                    : activeStage > i
                    ? "translateY(-24px)"
                    : "translateY(24px)",
                transition: "opacity 0.55s ease, transform 0.55s ease",
                transitionDelay: activeStage === i ? "0.05s" : "0s",
                pointerEvents: activeStage === i ? "auto" : "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {stage.right}
            </div>
          ))}

          {/* PROGRESS */}
          <div
            style={{
              position: "absolute",
              right: 24,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            {stages[activeStage]?.label && (
              <div
                className="font-mono"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  writingMode: "vertical-rl",
                  marginBottom: 8,
                }}
              >
                <span className="text-accent">{stages[activeStage]?.label}</span>
              </div>
            )}
            {stages.map((_, i) => (
              <div
                key={i}
                className={activeStage === i ? "bg-accent" : "bg-border"}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  transition: "background 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
