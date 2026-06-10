import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import lightAsset from "@/assets/lumi-badge-light.png.asset.json";
import darkAsset from "@/assets/lumi-badge-dark.jpg.asset.json";

/**
 * LumiBadgeButton — the canonical Lumi trigger across CS Quarterly and
 * CS Factors. Renders the hexagonal Lumi badge (light variant for cream
 * themes, dark variant for midnight) as a tactile, premium button.
 */
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: number;
  label?: string;
};

export const LumiBadgeButton = forwardRef<HTMLButtonElement, Props>(
  ({ size = 64, label = "Ask Lumi", className, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={cn(
          "group relative inline-flex items-center justify-center bg-transparent p-0 border-0 outline-none",
          "transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.04] active:scale-[0.98]",
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent rounded-[14%]",
          className,
        )}
        style={{ width: size, height: size }}
        {...rest}
      >
        {/* Light theme badge */}
        <img
          src={lightAsset.url}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none dark:hidden drop-shadow-[0_10px_24px_rgba(15,23,42,0.25)] group-hover:drop-shadow-[0_14px_30px_rgba(15,23,42,0.35)] transition-[filter] duration-300"
        />
        {/* Dark theme badge */}
        <img
          src={darkAsset.url}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none hidden dark:block drop-shadow-[0_10px_28px_rgba(201,168,76,0.25)] group-hover:drop-shadow-[0_16px_36px_rgba(201,168,76,0.45)] transition-[filter] duration-300"
        />
        <span className="sr-only">{label}</span>
      </button>
    );
  },
);
LumiBadgeButton.displayName = "LumiBadgeButton";
