import { cn } from "@/lib/utils";
import lumiAsset from "@/assets/lumi-mark.png.asset.json";

/**
 * LumiMark — the operator agent's brand mark.
 *
 * The uploaded asset contains the gold lighthouse emblem above the serif
 * "Lumi" wordmark on a royal-blue field. We crop to just the lighthouse
 * for the `emblem` variant, and show the full lockup for `lockup`.
 */
type Props = {
  variant?: "emblem" | "lockup";
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
          src={lumiAsset.url}
          alt=""
          aria-hidden
          style={{ width: size, height: size * (1.36) }}
          className="object-contain select-none pointer-events-none"
          draggable={false}
        />
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
