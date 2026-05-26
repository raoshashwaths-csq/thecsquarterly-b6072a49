import { type ElementType, type HTMLAttributes } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";

type RevealProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  index?: number;
};

/**
 * Reveal — wraps children with a fade-up-on-scroll animation.
 * Use `index` for staggered grids (each card gets +100ms).
 */
export function Reveal({ as: Tag = "div", index = 0, className, children, ...rest }: RevealProps) {
  const ref = useScrollReveal<HTMLElement>(index);
  return (
    <Tag ref={ref as never} className={cn("reveal-up", className)} {...rest}>
      {children}
    </Tag>
  );
}
