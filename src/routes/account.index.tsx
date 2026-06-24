import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
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
import {
  createPaddlePortalSession,
  getMyPaddleSubscription,
} from "@/lib/paddle.functions";
import { getPaddleEnvironment } from "@/lib/paddle";



type AccountSearch = { checkout?: "success" | "cancel"; tier?: string };

export const Route = createFileRoute("/account/")({
  head: () => ({
    meta: [
      { title: "Your account, The CS Quarterly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (input: Record<string, unknown>): AccountSearch => {
    const c = input.checkout;
    const t = input.tier;
    return {
      checkout: c === "success" || c === "cancel" ? c : undefined,
      tier: typeof t === "string" ? t : undefined,
    };
  },
  component: AccountPage,
});

function AccountPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const fetchMe = useServerFn(getMe);
  const fetchPurchases = useServerFn(listMyPurchases);
  const fetchSubscription = useServerFn(getMyPaddleSubscription);
  const openPortal = useServerFn(createPaddlePortalSession);
  const { group, isRecruiterOrLead } = usePersona();
  const { designation } = useEntitlements();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), enabled: !!user });
  const purchases = useQuery({ queryKey: ["my-purchases"], queryFn: () => fetchPurchases(), enabled: !!user });
  const subscription = useQuery({
    queryKey: ["my-paddle-subscription", getPaddleEnvironment()],
    queryFn: () => fetchSubscription({ data: { environment: getPaddleEnvironment() } }),
    enabled: !!user,
    // Paddle webhook delivery is near-instant but not synchronous with the
    // success redirect. Poll briefly until we see an active row.
    refetchInterval: (q) =>
      search.checkout === "success" && !q.state.data?.hasSubscription ? 2000 : false,
  });

  // Post-checkout toast + URL cleanup. Refetch immediately on landing.
  useEffect(() => {
    if (!search.checkout) return;
    if (search.checkout === "success") {
      toast.success("Subscription activated. Welcome aboard.");
      subscription.refetch();
      me.refetch();
    } else if (search.checkout === "cancel") {
      toast("Checkout canceled. No charges were made.");
    }
    navigate({ to: "/account", search: {}, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.checkout]);

  const onManageBilling = async () => {
    try {
      const result = await openPortal({
        data: { environment: getPaddleEnvironment() },
      });
      if ("error" in result) throw new Error(result.error);
      window.open(result.url, "_blank", "noopener");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const designationLabel = DESIGNATION_LABEL[designation];
  const isPaid = designation !== "reader";
  const sub = subscription.data;
  const periodEndLabel = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const statusBanner = useMemo(() => {
    if (!sub?.hasSubscription) return null;
    const status = sub.status ?? "";
    if (sub.cancelAtPeriodEnd && periodEndLabel) {
      return {
        tone: "secondary" as const,
        text: `Cancellation scheduled · access continues until ${periodEndLabel}`,
      };
    }
    if (status === "paused") {
      return {
        tone: "secondary" as const,
        text: "Subscription paused · resume any time from the billing portal",
      };
    }
    if (status === "past_due") {
      return {
        tone: "warning" as const,
        text: "Payment failed · update your card to keep access",
      };
    }
    if (status === "canceled") {
      return {
        tone: "warning" as const,
        text: periodEndLabel
          ? `Subscription canceled · access ended ${periodEndLabel}`
          : "Subscription canceled",
      };
    }
    if (status === "trialing" && periodEndLabel) {
      return {
        tone: "secondary" as const,
        text: `Trial · billing starts ${periodEndLabel}`,
      };
    }
    if (status === "active" && periodEndLabel) {
      return {
        tone: "neutral" as const,
        text: `Renews on ${periodEndLabel}`,
      };
    }
    return null;
  }, [sub, periodEndLabel]);


  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-4 font-semibold">Members</div>
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
                  : "Pick a tier to unlock the Vanguard archive, the CSFactors dashboard, and Lumi."
              }
              actions={
                isPaid ? (
                  <button
                    type="button"
                    onClick={onManageBilling}
                    className="px-5 py-2.5 bg-foreground text-background font-mono text-xs uppercase tracking-widest hover:opacity-90"
                  >
                    Manage subscription
                  </button>
                ) : (
                  <Link
                    to="/pricing"
                    className="px-5 py-2.5 bg-secondary-accent text-secondary-accent-foreground font-mono text-xs uppercase tracking-widest inline-block"
                  >
                    See pricing
                  </Link>
                )
              }
            >
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Status</dt>
                  <dd className="capitalize">{sub?.status ?? me.data.subscriptionStatus ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Plan</dt>
                  <dd>{sub?.priceId ?? (isPaid ? designationLabel : "Free")}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">
                    {sub?.cancelAtPeriodEnd ? "Access ends" : "Renews"}
                  </dt>
                  <dd>{periodEndLabel ?? "—"}</dd>
                </div>
              </dl>
              {sub?.cancelAtPeriodEnd && periodEndLabel && (
                <p className="mt-3 text-xs text-secondary-accent font-mono uppercase tracking-widest">
                  Cancellation scheduled · access continues until {periodEndLabel}
                </p>
              )}
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
              eyebrow="Analytics"
              title="Portfolio dashboards have moved"
              description="The executive command center and the four analytics lenses now live inside the CSFactors 360 Dashboard — one consolidated surface."
              actions={
                <Link to="/csfactors/360" className="px-5 py-2.5 border border-foreground font-mono text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors">
                  Open 360 Dashboard
                </Link>
              }
            >
              <div className="text-xs text-muted-foreground">Operator+ unlock. Portfolio matrix, NRR waterfall, retention funnel, stakeholder radar, and team leaderboard — all on one page.</div>
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
                  className="px-5 py-2.5 border border-border font-mono text-xs uppercase tracking-widest hover:border-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                  className="px-5 py-2.5 border border-border font-mono text-xs uppercase tracking-widest opacity-40 cursor-not-allowed"
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
                <Link to="/account/api" className="px-5 py-2.5 border border-foreground font-mono text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors">
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
                  <Link to="/admin" className="px-5 py-2.5 bg-foreground text-background font-mono text-xs uppercase tracking-widest">
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

