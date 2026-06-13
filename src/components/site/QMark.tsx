/**
 * Lumi — the operator agent's brand mark for the marketing site.
 *
 * Renders "Lumi" where the dot on the "i" is replaced with an accent-colored
 * dot that bounces (re-using the q-period-bounce animation). We use a dotless
 * "ı" (U+0131) and stack our own colored dot above it so the tittle becomes
 * the brand accent — same treatment the trailing period used to carry.
 */
type Props = {
  className?: string;
  /** Override class for the accent dot (defaults to `bg-accent`). */
  periodClassName?: string;
  /** Reserved for backwards compat — no longer affects rendering. */
  tight?: boolean;
};

export function QMark({ className, periodClassName = "bg-accent" }: Props) {
  return (
    <span className={className} aria-label="Lumi">
      Lum
      <span className="relative inline-block">
        {/* dotless i — keeps the stem, drops the tittle */}
        <span aria-hidden>ı</span>
        {/* accent tittle: bouncing colored dot positioned over the stem */}
        <span
          aria-hidden
          className={`q-period absolute left-1/2 -translate-x-1/2 rounded-full ${periodClassName}`}
          style={{
            width: "0.22em",
            height: "0.22em",
            top: "-0.05em",
          }}
        />
      </span>
    </span>
  );
}
