import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { TierGateOverlay } from "@/components/site/TierGateOverlay";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";

export const Route = createFileRoute("/account/api")({
  head: () => ({
    meta: [
      { title: "API Management — The CS Quarterly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ApiManagementPage,
});

function ApiManagementPage() {
  const { user, loading } = useAuth();
  const ent = useEntitlements();

  if (loading || ent.loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent">Loading…</div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full text-center">
          <p className="text-foreground/70 mb-4">Sign in to manage API access.</p>
          <Link to="/login" className="font-mono text-[11px] uppercase tracking-widest border-b border-foreground/40 hover:text-accent hover:border-accent pb-1">
            Sign in →
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-4 font-semibold">
          Account / API
        </div>
        <h1 className="font-display text-5xl tracking-tight mb-3">API management</h1>
        <p className="font-body text-foreground/70 mb-10 max-w-2xl">
          Generate and rotate bearer tokens for programmatic access to your CS Quarterly data and the v1 REST endpoints.
        </p>

        <SectionCard
          eyebrow="Bearer tokens"
          title="Personal access token"
          description="Tokens authenticate against /api/v1/* endpoints. Treat them like passwords."
          actions={
            <button
              type="button"
              onClick={() => toast.info("Token minting is concierge — we'll provision your first key. Contact us at ops@thecsquarterly.com.")}
              className="px-5 py-2.5 bg-foreground text-background font-mono text-[11px] uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Generate token
            </button>
          }
        >
          <div className="font-mono text-xs text-foreground/60 border border-dashed border-border p-4">
            No tokens issued yet.
          </div>
        </SectionCard>

        <div className="mt-6">
          <SectionCard
            eyebrow="Endpoints"
            title="REST v1"
            description="Cacheable JSON. Rate-limited per token."
          >
            <ul className="font-mono text-xs space-y-2 text-foreground/75">
              <li>GET /api/v1/benchmarks/nrr</li>
              <li>GET /api/v1/retention-ledger/ticker</li>
            </ul>
          </SectionCard>
        </div>
      </main>
      <SiteFooter />

      {!ent.canApiKeys ? (
        <TierGateOverlay
          requiredTier="enterprise"
          title="API access is an Enterprise capability"
          description="Programmatic bearer tokens, the /api/v1 REST surface, and rate-limit lifts unlock at the Enterprise and Strategic Partner tiers."
        />
      ) : null}
    </div>
  );
}
