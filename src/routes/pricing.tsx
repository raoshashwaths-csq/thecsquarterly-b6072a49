import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useAuth } from "@/hooks/useAuth";
import { getMe, startSubscriptionPlaceholder } from "@/lib/auth.functions";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing, The CS Quarterly" },
      { name: "description", content: "Free Briefing or Vanguard Access. The reference newsletter for serious CS operators." },
      { property: "og:title", content: "The CS Quarterly, Pricing" },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
  component: PricingPage,
});

const FREE = [
  "Weekly dispatch (one essay every Tuesday)",
  "The Retention Ledger benchmark ticker",
  "Public archive of past briefings",
  "Free top-line score on the AI Readiness Diagnostic",
];
const VANGUARD = [
  "Everything in Free Briefing",
  "Full library of premium dispatches (Vanguard, Outcome Forum, Codex deep-dives)",
  "Unlimited access to The Codex, $500+ of executive playbooks",
  "AI Readiness Custom Blueprint (12-page diagnostic report)",
  "Quarterly NRR / Payback Period data drops",
  "Members-only escalation & QBR templates",
];

function PricingPage() {
  const { user } = useAuth();
  const fetchMe = useServerFn(getMe);
  const startSub = useServerFn(startSubscriptionPlaceholder);
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), enabled: !!user });
  const onVanguard = async () => {
    if (!user) { window.location.href = "/login"; return; }
    try {
      await startSub();
      toast.success("Vanguard activated (preview, Stripe checkout wires up later).");
      me.refetch();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4">Membership</div>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance mb-6">
            Two tiers. <span className="italic">One discipline.</span>
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto text-pretty">
            The Briefing is free, forever. The Vanguard tier is for operators who need the playbooks, not just the theses.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free */}
          <div className="border border-border p-10 flex flex-col">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Free Briefing</div>
            <div className="font-display text-6xl mb-2">$0</div>
            <div className="text-sm text-muted-foreground mb-8">forever</div>
            <ul className="space-y-3 mb-10 flex-1">
              {FREE.map((f) => (
                <li key={f} className="flex gap-3 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-secondary-accent" /><span>{f}</span></li>
              ))}
            </ul>
            <Link to="/subscribe" className="block w-full py-4 text-center border border-foreground font-mono text-[11px] uppercase tracking-widest hover:bg-foreground hover:text-background transition-all">
              Subscribe free
            </Link>
          </div>
          {/* Vanguard */}
          <div className="border-2 border-accent p-10 flex flex-col relative">
            <div className="absolute -top-3 left-10 bg-accent text-accent-foreground px-3 py-1 font-mono text-[9px] uppercase tracking-widest">Recommended</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-accent mb-4">Vanguard Access</div>
            <div className="font-display text-6xl mb-2">$49<span className="text-2xl text-muted-foreground">/mo</span></div>
            <div className="text-sm text-muted-foreground mb-2">or $490/year (save 17%)</div>
            <div className="text-xs text-secondary-accent mb-8">Includes $500+ of Executive Playbooks</div>
            <ul className="space-y-3 mb-10 flex-1">
              {VANGUARD.map((f) => (
                <li key={f} className="flex gap-3 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-accent" /><span>{f}</span></li>
              ))}
            </ul>
            <button onClick={onVanguard} className="block w-full py-4 text-center bg-accent text-accent-foreground font-mono text-[11px] uppercase tracking-widest hover:opacity-90">
              {me.data?.subscriptionTier === "vanguard" ? "You're a Vanguard member" : "Join the Vanguard"}
            </button>
            <p className="text-xs text-muted-foreground mt-4 text-center">Cancel anytime. Real Stripe checkout activates in the next release.</p>
          </div>
        </div>

        <div className="mt-20 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">For organisations</div>
          <p className="text-foreground/70 max-w-xl mx-auto text-pretty">
            Team subscriptions (5+ seats) and enterprise licenses with the full benchmark dataset are available on request.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
