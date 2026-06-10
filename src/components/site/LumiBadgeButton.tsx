import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import lightAsset from "@/assets/lumi-badge-light.png.asset.json";
import darkAsset from "@/assets/lumi-badge-dark.jpg.asset.json";

/**
 * LumiBadgeButton — the canonical Lumi trigger across CS Quarterly and
 * CS Factors. Renders the hexagonal Lumi badge with a tactile, theme-aware
 * lift + tilt + shadow on hover so it feels identical in cream and midnight.
 *
 * Use the `tone` preset to keep sizing/padding consistent across surfaces:
 *   - "hero"   96px — landing & section hero CTAs
 *   - "card"   72px — feature cards / inline CTAs
 *   - "header" 44px — nav / page-header chips
 *   - "cta"    56px — floating CTA & inline action buttons
 * Pass `size` only for one-off overrides.
 */
export type LumiBadgeTone = "hero" | "card" | "header" | "cta";

const TONE_SIZE: Record<LumiBadgeTone, number> = {
  hero: 96,
  card: 72,
  header: 44,
  cta: 56,
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: number;
  tone?: LumiBadgeTone;
  label?: string;
};

export const LumiBadgeButton = forwardRef<HTMLButtonElement, Props>(
  ({ tone = "cta", size, label = "Ask Lumi", className, style, ...rest }, ref) => {
    const px = size ?? TONE_SIZE[tone];
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
          className,
        )}
        style={{ width: px, height: px, ...style }}
        {...rest}
      >
        {/* Light theme badge */}
        <img
          src={lightAsset.url}
          alt=""
          aria-hidden
          draggable={false}
          className="lumi-badge-img lumi-badge-img--light absolute inset-0 w-full h-full object-contain select-none pointer-events-none dark:hidden"
        />
        {/* Dark theme badge */}
        <img
          src={darkAsset.url}
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
