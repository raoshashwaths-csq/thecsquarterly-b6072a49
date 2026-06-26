import { useRouterState } from "@tanstack/react-router";
import type { PageContext } from "@/config/lumiPageActions";

export function useLumiPageContext(): PageContext {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Order matters: most specific first.
  if (/^\/insights\/[^/]+/.test(pathname)) return "dispatch";
  if (
    /^\/vanguard\/[^/]+/.test(pathname) ||
    /^\/retention-protocol\/[^/]+/.test(pathname) ||
    /^\/outcome-forum\/[^/]+/.test(pathname)
  ) {
    return "dispatch";
  }
  if (pathname === "/vanguard") return "vanguard";
  if (/^\/codex\/[^/]+/.test(pathname)) return "codex-item";
  if (pathname === "/codex") return "codex";
  if (pathname.startsWith("/ai-readiness") || pathname.startsWith("/diagnostics/ai-readiness")) {
    return "ai-readiness";
  }
  if (pathname === "/benchmarks") return "benchmarks";
  if (pathname === "/pricing" || pathname === "/subscribe") return "pricing";
  if (pathname.startsWith("/account")) return "account";
  if (pathname === "/") return "home";

  return "default";
}
