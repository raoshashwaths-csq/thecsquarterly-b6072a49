import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

/**
 * Client-side auth gate for top-level (SSR-on) protected routes.
 * - While the session resolves: renders a quiet shell (no children mount,
 *   so protected server fns aren't fired yet).
 * - Unauthenticated: redirects to /login?redirect=<current path>.
 * - Authenticated: renders children.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const redirect = `${location.pathname}${location.searchStr ?? ""}`;
      navigate({ to: "/login", search: { redirect }, replace: true });
    }
  }, [loading, user, location, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="font-mono uppercase tracking-[0.3em] text-xs text-muted-foreground">
            {loading ? "Checking your session…" : "Redirecting to sign in…"}
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return <>{children}</>;
}
