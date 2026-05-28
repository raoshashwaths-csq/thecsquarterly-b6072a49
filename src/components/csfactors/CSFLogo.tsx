/**
 * CSFactors brand lockup — the page logo on every CSFactors surface.
 * Treat like a logo: do not inline a plain "CSFactors" string anywhere on /csfactors.
 */
import { cn } from "@/lib/utils";

export function CSFLogo({
  size = "md",
  showWordmark = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}) {
  const tile =
    size === "sm" ? "h-8 w-8 text-[12px]" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-[14px]";
  const word =
    size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";
  return (
    <span className={cn("inline-flex items-center gap-2.5 min-w-0", className)}>
      <span
        aria-hidden
        className={cn(
          "shrink-0 inline-flex items-center justify-center bg-accent text-accent-foreground rounded-sm font-mono font-bold tracking-tight shadow-sm",
          tile,
        )}
      >
        CSF
      </span>
      {showWordmark ? (
        <span className={cn("font-display tracking-tight truncate", word)}>
          CSFactors<span className="text-accent">.</span>
        </span>
      ) : null}
    </span>
  );
}
