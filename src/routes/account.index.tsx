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
import { useEntitlements } from "@/hooks/useEntitlements";
import { DESIGNATION_LABEL } from "@/lib/entitlements";
import { getMe, listMyPurchases } from "@/lib/auth.functions";
import { createPortalSession } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";



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
  const openPortal = useServerFn(createPortalSession);
  const { group, isRecruiterOrLead } = usePersona();
  const { designation } = useEntitlements();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), enabled: !!user });
  const purchases = useQuery({ queryKey: ["my-purchases"], queryFn: () => fetchPurchases(), enabled: !!user });

  const onManageBilling = async () => {
    try {
      const result = await openPortal({
        data: {
          environment: getStripeEnvironment(),
          returnUrl: `${window.location.origin}/account`,
        },
      });
      if ("error" in result) throw new Error(result.error);
      window.open(result.url, "_blank", "noopener");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const designationLabel = DESIGNATION_LABEL[designation];
  const isPaid = designation !== "reader";

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
                value={designationLabel}
                accent={isPaid ? "accent" : "neutral"}
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

            <SectionCard eyebrow="Identity" title={me.data.displayName ?? me.data.email ?? "Member"}>
              <div className="text-sm text-muted-foreground">{me.data.email}</div>
            </SectionCard>

            <SectionCard
              eyebrow="Subscription"
              title={isPaid ? `${designationLabel} access` : "Free Briefing"}
              description={
                isPaid
                  ? "Manage your billing, update your card, or cancel from the secure billing portal. Access continues until the end of your current period."
                  : "Pick a tier to unlock the Vanguard archive, the CSFactors dashboard, and the Q advisor."
              }
              actions={
                isPaid ? (
                  <button
                    type="button"
                    onClick={onManageBilling}
                    className="px-5 py-2.5 bg-foreground text-background font-mono text-[11px] uppercase tracking-widest hover:opacity-90"
                  >
                    Manage subscription
                  </button>
                ) : (
                  <Link
                    to="/pricing"
                    className="px-5 py-2.5 bg-secondary-accent text-secondary-accent-foreground font-mono text-[11px] uppercase tracking-widest inline-block"
                  >
                    See pricing
                  </Link>
                )
              }
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

            <SectionCard
              eyebrow="Executive analytics"
              title="Portfolio command center"
              description="Stakeholder risk matrices, real-time NPS, and renewal pressure across your book."
              actions={
                <Link to="/account/executive/analytics" className="px-5 py-2.5 border border-foreground font-mono text-[11px] uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors">
                  Open analytics
                </Link>
              }
            >
              <div className="text-xs text-muted-foreground">Available to Operator and above.</div>
            </SectionCard>

            <SectionCard
              eyebrow="Dashboards"
              title="Four lenses on the portfolio"
              description="Retention funnel, NRR waterfall, stakeholder radar, and team leaderboard — all built from your CSFactors data."
              actions={
                <Link to="/account/analytics" className="px-5 py-2.5 border border-foreground font-mono text-[11px] uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors">
                  Open dashboards
                </Link>
              }
            >
              <div className="text-xs text-muted-foreground">Operator+ unlock. Click through to any of the four dashboard views.</div>
            </SectionCard>


            <SectionCard
              eyebrow="Enterprise · SSO"
              title="Single Sign-On (SAML)"
              description="Provision WorkOS-backed SAML SSO for your organization."
              actions={
                <button
                  type="button"
                  disabled={!me.data.isAdmin && me.data.subscriptionTier !== "vanguard"}
                  onClick={() => toast.info("SSO setup is concierge — we'll reach out to provision WorkOS.")}
                  className="px-5 py-2.5 border border-border font-mono text-[11px] uppercase tracking-widest hover:border-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Configure SSO
                </button>
              }
            >
              <div className="text-xs text-muted-foreground">Available on Scale and above.</div>
            </SectionCard>

            <SectionCard
              eyebrow="Enterprise · Brand"
              title="White-label brand assets"
              description="Upload logos and color tokens for white-labeled board deck PDFs."
              actions={
                <button
                  type="button"
                  disabled
                  className="px-5 py-2.5 border border-border font-mono text-[11px] uppercase tracking-widest opacity-40 cursor-not-allowed"
                >
                  Upload brand kit
                </button>
              }
            >
              <div className="text-xs text-muted-foreground">Available on Scale and above.</div>
            </SectionCard>

            <SectionCard
              eyebrow="Enterprise · API"
              title="API management"
              description="Generate bearer tokens and call the /api/v1 REST surface."
              actions={
                <Link to="/account/api" className="px-5 py-2.5 border border-foreground font-mono text-[11px] uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors">
                  Manage API
                </Link>
              }
            >
              <div className="text-xs text-muted-foreground">Available to Enterprise and Strategic Partner.</div>
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

