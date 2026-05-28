import { useRouterState } from "@tanstack/react-router";
import { tipsForPath, type TipGroup } from "@/lib/enablement/tips";

export function useRouteTips(): TipGroup {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return tipsForPath(pathname);
}
