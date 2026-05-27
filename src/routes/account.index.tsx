import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useAuth } from "@/hooks/useAuth";
import { getMe, listMyPurchases, startSubscriptionPlaceholder } from "@/lib/auth.functions";

export const Route = createFileRoute("/account/")({
  head: () => ({
    meta: [
      { title: "Your account, The CS Quarterly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchMe = useServerFn(getMe);
  const fetchPurchases = useServerFn(listMyPurchases);
  const startSub = useServerFn(startSubscriptionPlaceholder);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), enabled: !!user });
  const purchases = useQuery({ queryKey: ["my-purchases"], queryFn: () => fetchPurchases(), enabled: !!user });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4">Members</div>
        <h1 className="font-display text-5xl mb-8">Your account</h1>

        {me.data && (
          <div className="space-y-8">
            <section className="border border-border p-8">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Identity</div>
              <div className="text-lg">{me.data.displayName ?? me.data.email}</div>
              <div className="text-sm text-muted-foreground">{me.data.email}</div>
            </section>

            <section className="border border-border p-8">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Subscription</div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-display text-3xl">
                    {me.data.subscriptionTier === "vanguard" ? "Vanguard Access" : "Free Briefing"}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">{me.data.subscriptionStatus}</div>
                </div>
                {me.data.subscriptionTier !== "vanguard" && (
                  <button
                    onClick={async () => {
                      try {
                        await startSub();
                        toast.success("Vanguard access activated (placeholder, Stripe wires up later).");
                        me.refetch();
                      } catch (e) { toast.error((e as Error).message); }
                    }}
                    className="px-6 py-3 bg-secondary-accent text-secondary-accent-foreground font-mono text-[11px] uppercase tracking-widest"
                  >Activate Vanguard (preview)</button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Stripe checkout will replace the preview button. For now this lets you experience the gated content end-to-end.
              </p>
            </section>

            <section className="border border-border p-8">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Purchases</div>
              {(purchases.data ?? []).length === 0 ? (
                <p className="text-muted-foreground">No playbooks purchased yet. <Link to="/codex" className="underline">Browse the Codex</Link>.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {(purchases.data ?? []).map((p, i) => (
                    <li key={i} className="py-3 flex items-center justify-between font-mono text-xs">
                      <span className="uppercase tracking-widest">{p.item_type}</span>
                      <span className="opacity-60">{p.item_id}</span>
                      <span className="text-secondary-accent">{p.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {me.data.isAdmin && (
              <section className="border border-accent bg-accent/5 p-8">
                <div className="font-mono text-[10px] uppercase tracking-widest text-accent mb-3">Editorial</div>
                <div className="flex items-center justify-between gap-4">
                  <p>You have admin access to the editorial dashboard.</p>
                  <Link to="/admin" className="px-6 py-3 bg-foreground text-background font-mono text-[11px] uppercase tracking-widest">
                    Open dashboard
                  </Link>
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
