const TICKER = [
  "Avg Enterprise NRR: 112%",
  "AI-CS NRR Benchmark: 120%",
  "Standard TTV: 45 Days",
  "Top-Quartile GRR: 96%",
  "Rule of 40 Index: 42",
  "Enterprise QBR Cadence: 78 Days",
  "Median CSM Book: $4.2M ARR",
  "Onboarding NPS @ 30d: 62",
];

export function RetentionLedger() {
  // Duplicate the array so the CSS marquee loops seamlessly.
  const items = [...TICKER, ...TICKER];
  return (
    <div className="border-y border-border bg-foreground text-background overflow-hidden inset-surface">
      <div className="relative flex">
        <div className="shrink-0 px-4 py-2 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-[0.25em] flex items-center gap-2 z-10">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary-accent animate-pulse" />
          The Retention Ledger
        </div>
        <div className="overflow-hidden flex-1 relative">
          <div className="flex gap-10 py-2 animate-marquee whitespace-nowrap font-mono text-xs tracking-wide">
            {items.map((t, i) => (
              <span key={i} className="opacity-80">
                <span className="text-secondary-accent mr-2">◆</span>{t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
