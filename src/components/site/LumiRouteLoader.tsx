import { useMemo } from "react";
import { useRouterState } from "@tanstack/react-router";
import lightAsset from "@/assets/lumi-badge-light.png.asset.json";
import darkAsset from "@/assets/lumi-badge-dark.jpg.asset.json";
import { getLoaderPrompts } from "@/hooks/useRouteTips";

/**
 * LumiRouteLoader — branded route-pending state for heavy navigations.
 * Centered, full-bleed overlay with a pulsing Lumi badge and use-case
 * "bubbles" rising beneath it. Bubble copy is pulled from the existing
 * route-aware tip registry so it always matches the destination route.
 */
export function LumiRouteLoader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const prompts = useMemo(() => getLoaderPrompts(pathname), [pathname]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-background/85 backdrop-blur-sm"
    >
      {/* Pulsing badge */}
      <div className="lumi-loader-badge relative w-24 h-24 sm:w-28 sm:h-28">
        <img
          src={darkAsset.url}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none dark:hidden"
        />
        <img
          src={lightAsset.url}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none hidden dark:block"
        />
      </div>

      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-secondary-accent">
        Lumi is warming up…
      </p>

      {/* Bubble field */}
      <div className="lumi-bubble-field relative mt-8 h-[160px] w-full max-w-xl overflow-hidden">
        {prompts.slice(0, 5).map((prompt, i) => (
          <span
            key={`${prompt}-${i}`}
            className="lumi-bubble"
            style={{ animationDelay: `${i * 0.7}s`, left: `${10 + i * 18}%` }}
          >
            {prompt}
          </span>
        ))}
      </div>
    </div>
  );
}

export default LumiRouteLoader;
