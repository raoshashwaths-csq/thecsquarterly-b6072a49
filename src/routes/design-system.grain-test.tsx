import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/design-system/grain-test")({
  head: () => ({
    meta: [
      { title: "Grain visual test — CS Quarterly" },
      { name: "description", content: "Internal visual test for paper-grain overlay across widths and themes." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: GrainTest,
});

const SAMPLE_BODY =
  "Customer Success operators run the renewal, expansion, and escalation motions that decide whether ARR compounds or leaks. The point of a dispatch is to make that motion legible — not to entertain. If the grain in the background interferes with the readability of this paragraph at 16–19px, it is calibrated wrong. Read this at arm's length. Then read it up close. Both should feel like ink on paper, never like a filter.";

function GrainTest() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const had = root.classList.contains("dark");
    root.classList.toggle("dark", dark);
    return () => { root.classList.toggle("dark", had); };
  }, [dark]);

  const widths = [360, 414, 768, 1024, 1440];

  return (
    <div className="min-h-screen">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent">Design System</div>
          <h1 className="font-display text-2xl">Grain visual test</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {dark ? "Dark · midnight-slate" : "Light · ledger stock"}
          </span>
          <button
            onClick={() => setDark((v) => !v)}
            className="px-4 py-2 bg-foreground text-background font-mono text-xs uppercase tracking-widest hover:bg-accent transition-colors"
          >
            Toggle theme
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        <section>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-3">Reference</p>
          <h2 className="font-display text-3xl mb-4">Body copy on the page background</h2>
          <p className="text-base leading-relaxed max-w-2xl">{SAMPLE_BODY}</p>
          <p className="text-sm text-muted-foreground max-w-2xl mt-4">
            The grain should be visible <em>here</em> — this text sits directly on the body background. If you cannot see any texture, the overlay is under-calibrated. If the letters shimmer or the paragraph feels dirty, it's over-calibrated.
          </p>
        </section>

        <section>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-3">Contrast — cards should be clean</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border bg-card p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-2">Card surface</div>
              <h3 className="font-display text-xl mb-3">No grain here</h3>
              <p className="text-sm leading-relaxed">{SAMPLE_BODY}</p>
            </div>
            <div className="border border-border bg-muted p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-2">Muted surface</div>
              <h3 className="font-display text-xl mb-3">Also clean</h3>
              <p className="text-sm leading-relaxed">{SAMPLE_BODY}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Cards use opaque <code className="font-mono">bg-card</code> / <code className="font-mono">bg-muted</code> — grain must NOT appear on either.
          </p>
        </section>

        <section>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-3">Cross-device preview</p>
          <h2 className="font-display text-3xl mb-2">Grain at real device widths</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
            Each iframe loads the homepage at a fixed CSS width. Same document, different viewport — verify the grain reads consistently on mobile, tablet, and desktop. Use browser DevTools to check Chrome / Safari / Firefox rendering.
          </p>
          <div className="space-y-10">
            {widths.map((w) => (
              <div key={w}>
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  {w}px {w <= 414 ? "· mobile" : w <= 768 ? "· tablet" : w <= 1024 ? "· laptop" : "· desktop"}
                </div>
                <div className="border border-border overflow-hidden" style={{ width: Math.min(w, 1200) }}>
                  <iframe
                    title={`preview-${w}`}
                    src="/"
                    style={{ width: w, height: 520, border: 0, display: "block" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-3">Readability targets</p>
          <ul className="text-sm leading-relaxed space-y-2 list-disc pl-5 max-w-2xl">
            <li>Body copy at 16–19px must remain crisp; no visible shimmer inside letterforms.</li>
            <li>Text on <code className="font-mono">bg-card</code> and <code className="font-mono">bg-muted</code> must show <em>zero</em> grain.</li>
            <li>Light mode should feel like fine bond / ledger stock — never parchment or aged paper.</li>
            <li>Dark mode should feel like ink on midnight slate — never a static overlay.</li>
            <li>Toggling theme should preserve the sense of physical surface, not swap two different textures.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
