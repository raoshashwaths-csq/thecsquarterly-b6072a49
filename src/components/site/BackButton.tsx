import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Back button that uses the browser history so TanStack Router's
 * scrollRestoration restores the previous page's exact scroll position.
 *
 * Falls back to `fallbackTo` (defaults to "/") on a cold load with no
 * history entry to pop.
 */
export function BackButton({
  label = "Back",
  fallbackTo = "/",
  className,
}: {
  label?: string;
  fallbackTo?: string;
  className?: string;
}) {
  const router = useRouter();

  const onClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      router.navigate({ to: fallbackTo });
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-foreground bg-card border border-border px-3 py-2 hover:border-accent hover:text-accent transition-colors",
        className,
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
