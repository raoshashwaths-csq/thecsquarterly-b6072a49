import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { OperatorTools } from "@/components/site/OperatorTools";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { usePersona } from "@/hooks/usePersona";
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
  const { group, isRecruiterOrLead } = usePersona();


  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), enabled: !!user });
  const purchases = useQuery({ queryKey: ["my-purchases"], queryFn: () => fetchPurchases(), enabled: !!user });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-4 font-semibold">Members</div>
        <h1 className="font-display text-5xl tracking-tight mb-10">Your account</h1>

        {isRecruiterOrLead && <OperatorTools group={group} variant="account" />}

        {me.data && (
          <div className="space-y-6">
            <MetricGrid cols={3}>
              <MetricCard
                eyebrow="Tier"
                value={me.data.subscriptionTier === "vanguard" ? "Vanguard" : "Free"}
                accent={me.data.subscriptionTier === "vanguard" ? "accent" : "neutral"}
                footer={<span className="text-xs text-muted-foreground capitalize">{me.data.subscriptionStatus}</span>}
              />
              <MetricCard
                eyebrow="Purchases"
                value={(purchases.data ?? []).length}
                accent="secondary"
                footer={<span className="text-xs text-muted-foreground">Lifetime playbook orders</span>}
              />
              <MetricCard
                eyebrow="Role"
                value={me.data.isAdmin ? "Admin" : "Member"}
                accent={me.data.isAdmin ? "accent" : "neutral"}
                footer={<span className="text-xs text-muted-foreground truncate block">{me.data.email}</span>}
              />
            </MetricGrid>

            <SectionCard eyebrow="Identity" title={me.data.displayName ?? me.data.email}>
              <div className="text-sm text-muted-foreground">{me.data.email}</div>
            </SectionCard>

            <SectionCard
              eyebrow="Subscription"
              title={me.data.subscriptionTier === "vanguard" ? "Vanguard Access" : "Free Briefing"}
              description="Stripe checkout will replace the preview activation. For now this unlocks gated content end-to-end."
              actions={me.data.subscriptionTier !== "vanguard" ? (
                <button
                  onClick={async () => {
                    try {
                      await startSub();
                      toast.success("Vanguard access activated (placeholder).");
                      me.refetch();
                    } catch (e) { toast.error((e as Error).message); }
                  }}
                  className="px-5 py-2.5 bg-secondary-accent text-secondary-accent-foreground font-mono text-[11px] uppercase tracking-widest"
                >Activate Vanguard</button>
              ) : null}
            >
              <div className="text-sm text-muted-foreground capitalize">Status: {me.data.subscriptionStatus}</div>
            </SectionCard>

            <SectionCard eyebrow="Purchases" title="Playbook orders">
              {(purchases.data ?? []).length === 0 ? (
                <p className="text-muted-foreground text-sm">No playbooks purchased yet. <Link to="/codex" className="underline">Browse the Codex</Link>.</p>
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
            </SectionCard>

            {me.data.isAdmin && (
              <SectionCard
                eyebrow="Editorial"
                title="Admin access"
                description="You have admin access to the editorial dashboard and control panel."
                actions={
                  <Link to="/admin" className="px-5 py-2.5 bg-foreground text-background font-mono text-[11px] uppercase tracking-widest">
                    Open dashboard
                  </Link>
                }
              >
                <div className="text-xs text-muted-foreground">Editorial + moderation tools live behind the admin shell.</div>
              </SectionCard>
            )}
          </div>
        )}

        {!isRecruiterOrLead && <OperatorTools group={group} variant="account" />}
      </main>
      <SiteFooter />
    </div>
  );
}

