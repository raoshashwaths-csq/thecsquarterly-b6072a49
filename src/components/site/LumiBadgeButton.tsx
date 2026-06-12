import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import lightAsset from "@/assets/lumi-badge-light.png.asset.json";
import darkAsset from "@/assets/lumi-badge-dark.jpg.asset.json";

/**
 * LumiBadgeButton — the canonical Lumi trigger across CS Quarterly and
 * CS Factors. Renders the hexagonal Lumi badge with a tactile, theme-aware
 * lift + tilt + shadow on hover.
 *
 * Tone presets — responsive sizes (mobile → tablet → desktop):
 *   - "hero"   88 → 112 → 128 px  · landing & section hero CTAs
 *   - "card"   64 → 80  → 88  px  · feature cards / inline CTAs
 *   - "header" 40 → 44  → 48  px  · nav / page-header chips
 *   - "cta"    56 → 64  → 72  px  · floating CTA & inline action buttons
 *
 * Pass `size` only for one-off overrides (disables the responsive ramp).
 * See /design-system/lumi-badge for the full token reference.
 */
export type LumiBadgeTone = "hero" | "card" | "header" | "cta";

const TONE_CLASSES: Record<LumiBadgeTone, string> = {
  hero: "w-[88px] h-[88px] sm:w-28 sm:h-28 lg:w-32 lg:h-32",
  card: "w-16 h-16 sm:w-20 sm:h-20 lg:w-[88px] lg:h-[88px]",
  header: "w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12",
  cta: "w-14 h-14 sm:w-16 sm:h-16 lg:w-[72px] lg:h-[72px]",
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: number;
  tone?: LumiBadgeTone;
  label?: string;
};

export const LumiBadgeButton = forwardRef<HTMLButtonElement, Props>(
  ({ tone = "cta", size, label = "Ask Lumi", className, style, ...rest }, ref) => {
    const sizeStyle = size ? { width: size, height: size, ...style } : style;
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        data-tone={tone}
        className={cn(
          "lumi-badge group relative inline-flex items-center justify-center bg-transparent p-0 border-0 outline-none align-middle shrink-0",
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent rounded-[14%]",
          !size && TONE_CLASSES[tone],
          className,
        )}
        style={sizeStyle}
        {...rest}
      >
        {/* Light mode: render the DARK badge for max contrast on cream */}
        <img
          src={darkAsset.url}
          alt=""
          aria-hidden
          draggable={false}
          className="lumi-badge-img lumi-badge-img--light absolute inset-0 w-full h-full object-contain select-none pointer-events-none dark:hidden"
        />
        {/* Dark mode: render the LIGHT badge for max contrast on midnight */}
        <img
          src={lightAsset.url}
          alt=""
          aria-hidden
          draggable={false}
          className="lumi-badge-img lumi-badge-img--dark absolute inset-0 w-full h-full object-contain select-none pointer-events-none hidden dark:block"
        />
        <span className="sr-only">{label}</span>
      </button>
    );
  },
);
LumiBadgeButton.displayName = "LumiBadgeButton";
