/**
 * Q. — the operator agent's brand mark.
 *
 * Q is the name of our agent and must ALWAYS appear with its trailing period
 * rendered in the contrast color (accent). Treat this like a logo: never type
 * a bare "Q" in user-facing copy — always render <QMark />.
 *
 * Inherits typography from the parent (font, size, weight, tracking) and only
 * adds the colored period.
 */
type Props = {
  /** Override class for the wrapping span (rarely needed). */
  className?: string;
  /** Override class for the period (defaults to `text-accent`). */
  periodClassName?: string;
  /** Skip the trailing space-collapsing behavior — emit nothing after the dot. */
  tight?: boolean;
};

export function QMark({ className, periodClassName = "text-accent", tight }: Props) {
  return (
    <span className={className} aria-label="Q">
      Q<span aria-hidden className={periodClassName}>.</span>
      {tight ? null : null}
    </span>
  );
}
