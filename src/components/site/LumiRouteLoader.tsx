import { useMemo } from "react";
import { useRouterState } from "@tanstack/react-router";
import lightAsset from "@/assets/lumi-badge-light.png.asset.json";
import darkAsset from "@/assets/lumi-badge-dark.jpg.asset.json";
import { getLoaderPrompts } from "@/hooks/useRouteTips";

/**
 * LumiRouteLoader — branded route-pending state for heavy navigations.
 * Centered, full-bleed overlay with a pulsing Lumi badge above a static
 * cluster of quoted use-case lines pulled from the route-aware tip
 * registry. No motion under the badge — quotes are static.
 */
export function LumiRouteLoader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const prompts = useMemo(() => getLoaderPrompts(pathname).slice(0, 3), [pathname]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-background/85 backdrop-blur-sm"
    >
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

      {/* Static use-case quotes */}
      <ul className="mt-8 w-full max-w-xl space-y-3 px-6">
        {prompts.map((prompt, i) => (
          <li
            key={`${prompt}-${i}`}
            className="border-l-2 border-secondary-accent/40 pl-4 text-sm md:text-base text-foreground/75 italic"
          >
            <span aria-hidden>“</span>
            {prompt}
            <span aria-hidden>”</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LumiRouteLoader;
