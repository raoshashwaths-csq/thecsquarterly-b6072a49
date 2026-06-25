import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BackButton } from "@/components/site/BackButton";

/**
 * Read-only diagnostic score view rendered when a recipient opens a
 * shared diagnostic URL (e.g. `/diagnostics/champion-dependency?score=62`).
 *
 * Shows the sender's score + tier interpretation and a CTA to take the
 * diagnostic themselves. Works for both free visitors and paid
 * subscribers — the actual diagnostic page is unchanged when no
 * `?score=` param is present.
 */
export function SharedScoreView({
  eyebrow,
  diagnosticName,
  scoreLabel,
  scoreDisplay,
  tierLabel,
  tierTone = "text-accent",
  interpretation,
  retakeHref,
  retakeLabel = "Run it on your own portfolio →",
}: {
  eyebrow: string;
  diagnosticName: string;
  scoreLabel: string;
  scoreDisplay: string;
  tierLabel?: string;
  tierTone?: string;
  interpretation: string;
  retakeHref: string;
  retakeLabel?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col page-enter">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-6 pt-10 w-full">
        <BackButton label="Back to Diagnostics" fallbackTo="/diagnostics" />
      </div>

      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 py-16 md:py-20 animate-fade-up">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4">
            {eyebrow}
          </div>
          <h1 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight text-balance mb-8">
            {diagnosticName}
            <span className="block not-italic text-muted-foreground text-xl md:text-2xl mt-3">
              A colleague shared their score with you.
            </span>
          </h1>

          <div className="border border-border bg-card p-10 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4">
              {scoreLabel}
            </div>
            <div className="font-display font-bold leading-none text-foreground" style={{ fontSize: "6rem" }}>
              {scoreDisplay}
            </div>
            {tierLabel && (
              <div className={`mt-4 font-mono text-[11px] uppercase tracking-[0.18em] ${tierTone}`}>
                {tierLabel}
              </div>
            )}
          </div>

          <p className="text-[15px] text-foreground/75 leading-[1.75] mt-8 text-pretty">
            {interpretation}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to={retakeHref}
              className="px-6 py-3 bg-accent text-accent-foreground font-mono text-[11px] uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-opacity"
            >
              {retakeLabel}
            </Link>
            <Link
              to="/pricing"
              className="px-6 py-3 border border-border font-mono text-[11px] uppercase tracking-[0.2em] hover:border-foreground transition-colors"
            >
              See Practitioner — $39/mo
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
