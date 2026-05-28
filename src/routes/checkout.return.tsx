import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Subscription confirmed — The CS Quarterly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  const qc = useQueryClient();

  // Webhook may land a moment after Stripe redirects — invalidate caches so the
  // user sees their new designation as soon as it does.
  useEffect(() => {
    const t = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["entitlements"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    }, 1500);
    const stop = setTimeout(() => clearInterval(t), 15_000);
    return () => {
      clearInterval(t);
      clearTimeout(stop);
    };
  }, [qc]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-2xl mx-auto px-6 py-24 w-full text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center border border-accent text-accent mb-8">
          <Check className="h-6 w-6" />
        </div>
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-4 font-semibold">
          Payment received
        </div>
        <h1 className="font-display text-5xl md:text-6xl tracking-tight mb-6">
          Welcome to the dispatch.
        </h1>
        <p className="text-lg text-foreground/70 mb-10">
          Your subscription is being provisioned. Your account will reflect the new tier in a few
          seconds — refresh if it doesn't appear immediately.
        </p>
        {session_id && (
          <p className="font-mono text-xs text-foreground/40 mb-10 break-all">
            Ref: {session_id}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <Link
            to="/account"
            className="px-6 py-3 bg-foreground text-background font-mono text-xs uppercase tracking-[0.25em]"
          >
            Go to account
          </Link>
          <Link
            to="/vanguard"
            className="px-6 py-3 border border-border font-mono text-xs uppercase tracking-[0.25em] hover:border-foreground"
          >
            Read Vanguard
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
