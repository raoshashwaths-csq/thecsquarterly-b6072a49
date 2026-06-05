import { cn } from "@/lib/utils";
import lumiAsset from "@/assets/lumi-mark.png.asset.json";
import lumiDarkAsset from "@/assets/lumi-mark-dark.jpg.asset.json";
import lumiGoldAsset from "@/assets/lumi-lighthouse-gold.png.asset.json";

/**
 * LumiMark — the operator agent's brand mark.
 *
 * Variants:
 *  - `emblem`  : the original royal-blue plate with gold lighthouse (cropped).
 *  - `lockup`  : the full vertical lockup (lighthouse + "Lumi" wordmark).
 *  - `gold`    : transparent gold line-art lighthouse — use this inside
 *                colored buttons / on tinted surfaces where the navy plate
 *                would clash. Stars + beams are part of the artwork.
 */
type Props = {
  variant?: "emblem" | "lockup" | "gold";
  size?: number;
  /** Enable beam/star/lantern shimmer (gated by parent data-state). */
  animated?: boolean;
  className?: string;
  alt?: string;
};

export function LumiMark({
  variant = "emblem",
  size = 24,
  animated,
  className,
  alt = "Lumi",
}: Props) {
  if (variant === "lockup") {
    return (
      <span
        className={cn(
          "inline-flex flex-col items-center leading-none",
          animated && "lumi-mark",
          className,
        )}
        aria-label={alt}
      >
        <img
          src={lumiDarkAsset.url}
          alt=""
          aria-hidden
          style={{ width: size, height: size * (1.36) }}
          className="object-contain select-none pointer-events-none"
          draggable={false}
        />
      </span>
    );
  }

  if (variant === "gold") {
    return (
      <span
        className={cn(
          "relative inline-block align-middle",
          animated && "lumi-mark",
          className,
        )}
        aria-label={alt}
        style={{ width: size, height: size }}
      >
        <img
          src={lumiGoldAsset.url}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
        />
        {animated ? (
          <>
            <span aria-hidden className="lumi-beam" />
            <span aria-hidden className="lumi-lantern" />
            <span aria-hidden className="lumi-twinkle lumi-twinkle--a" />
            <span aria-hidden className="lumi-twinkle lumi-twinkle--b" />
            <span aria-hidden className="lumi-twinkle lumi-twinkle--c" />
          </>
        ) : null}
      </span>
    );
  }

  // Emblem-only: crop the bottom wordmark out via aspect-ratio + object-top.
  return (
    <span
      className={cn(
        "relative inline-block overflow-hidden align-middle",
        animated && "lumi-mark",
        className,
      )}
      aria-label={alt}
      style={{ width: size, height: size }}
    >
      <img
        src={lumiAsset.url}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-x-0 top-0 w-full select-none pointer-events-none"
        style={{ height: size * 1.36, objectFit: "cover", objectPosition: "top" }}
      />
      {animated ? (
        <>
          <span aria-hidden className="lumi-beam" />
          <span aria-hidden className="lumi-lantern" />
        </>
      ) : null}
    </span>
  );
}
