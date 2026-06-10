/**
 * Lumi — the operator agent's brand mark for the marketing site.
 *
 * Historically this rendered "Q." — the project has since adopted Lumi as the
 * single agent across both csquarterly.com and the CSFactors canvas. The
 * component name is kept (QMark) to avoid churning every import site, but it
 * now renders "Lumi" with the trailing period in the accent (Quicksand gold).
 *
 * Inherits typography from the parent (font, size, weight, tracking) and only
 * adds the colored period.
 */
type Props = {
  /** Override class for the wrapping span (rarely needed). */
  className?: string;
  /** Override class for the period (defaults to `text-accent`). */
  periodClassName?: string;
  /** Reserved for backwards compat — no longer affects rendering. */
  tight?: boolean;
};

export function QMark({ className, periodClassName = "text-accent" }: Props) {
  return (
    <span className={className} aria-label="Lumi">
      Lumi<span aria-hidden className={periodClassName}>.</span>
    </span>
  );
}
