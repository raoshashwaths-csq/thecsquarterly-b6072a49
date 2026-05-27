import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Paywall, BlurredTeaser } from "@/components/site/Paywall";
import { getPlaybook } from "@/lib/playbooks.functions";
import { useAuth } from "@/hooks/useAuth";
import { getMe, listMyPurchases, recordPurchasePlaceholder } from "@/lib/auth.functions";

const playbookQuery = (slug: string) => queryOptions({
  queryKey: ["playbook", slug],
  queryFn: () => getPlaybook({ data: { slug } }),
});

export const Route = createFileRoute("/codex/$slug")({
  loader: async ({ context, params }) => {
    const pb = await context.queryClient.ensureQueryData(playbookQuery(params.slug));
    if (!pb) throw notFound();
    return pb;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Playbook, The CS Codex" }] };
    return {
      meta: [
        { title: `${loaderData.title}, The CS Codex` },
        { name: "description", content: loaderData.summary },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: loaderData.summary },
        { property: "og:url", content: `/codex/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/codex/${params.slug}` }],
    };
  },
  component: PlaybookPage,
});

function PlaybookPage() {
  const { slug } = Route.useParams();
  const { data: pb } = useSuspenseQuery(playbookQuery(slug));
  const { user, loading: authLoading } = useAuth();
  const fetchMe = useServerFn(getMe);
  const fetchPurchases = useServerFn(listMyPurchases);
  const purchase = useServerFn(recordPurchasePlaceholder);
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), enabled: !!user });
  const purchases = useQuery({ queryKey: ["my-purchases"], queryFn: () => fetchPurchases(), enabled: !!user });

  if (!pb) return null;

  // Resolve gate only after auth + entitlement queries have settled, so a
  // logged-in Vanguard never sees a flash of paywall before `me` returns.
  const entitlementLoading =
    authLoading || (!!user && (me.isLoading || purchases.isLoading || !me.data));

  const unlocked =
    me.data?.isAdmin ||
    me.data?.subscriptionTier === "vanguard" ||
    (purchases.data ?? []).some((p) => p.item_type === "playbook" && p.item_id === pb.id);

  const onBuy = async () => {
    if (!user) { window.location.href = "/login"; return; }
    try {
      await purchase({ data: { itemType: "playbook", itemId: pb.id, amountCents: pb.price_cents } });
      toast.success("Playbook unlocked (preview, Stripe checkout activates in the next release).");
      purchases.refetch();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <article className="max-w-3xl mx-auto px-6 pt-16 pb-12 w-full animate-fade-up">
        <Link to="/codex" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent">
          ← The Codex
        </Link>
        <div className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-4 flex items-center gap-3">
          <Lock size={12} /> {pb.category} · {pb.pages} pages
        </div>
        <h1 className="font-display text-5xl md:text-6xl leading-[0.95] tracking-tight text-balance mb-6">
          {pb.title}
        </h1>
        <p className="text-xl text-foreground/75 mb-10 text-pretty">{pb.summary}</p>

        {entitlementLoading ? (
          <div className="border-t border-border pt-10 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Checking access…
          </div>
        ) : unlocked ? (
          <div className="prose-content border-t border-border pt-10">
            <div className="font-mono text-[10px] uppercase tracking-widest text-accent mb-3">Unlocked</div>
            {(() => {
              const normalized = pb.body
                .replace(/\r\n/g, "\n")
                .replace(/([^\n])\n(#{1,6}[^#\n])/g, "$1\n\n$2")
                .replace(/(^|\n)(#{1,6}[^\n]*?)\n(?!\n)/g, "$1$2\n\n");
              return normalized.split(/\n{2,}/).map((raw, i) => {
                const para = raw.trim().replace(/\s*#+\s*$/, "").trim();
                if (!para) return null;
                const h3 = para.match(/^###\s*(.+)$/);
                if (h3) return <h3 key={i} className="font-display text-2xl mt-8 mb-3">{h3[1].trim()}</h3>;
                const h2 = para.match(/^##\s*(.+)$/);
                if (h2) return <h2 key={i} className="font-display text-3xl mt-10 mb-4">{h2[1].trim()}</h2>;
                if (para.startsWith("- ")) {
                  return <ul key={i} className="list-disc pl-6 my-4 space-y-2">{para.split("\n").map((l, j) => <li key={j} className="text-lg leading-relaxed">{l.replace(/^-\s+/, "")}</li>)}</ul>;
                }
                return <p key={i} className="text-lg leading-relaxed my-5 text-foreground/85">{para}</p>;
              });
            })()}
          </div>
        ) : (
          <>
            <BlurredTeaser>
              <div className="prose-content border-t border-border pt-10">
                {pb.body.slice(0, 1200).split("\n\n").map((para, i) => (
                  <p key={i} className="text-lg leading-relaxed my-5">{para.replace(/^##\s+/, "")}</p>
                ))}
              </div>
            </BlurredTeaser>
            <Paywall
              oneOffLabel={`Unlock "${pb.title}"`}
              oneOffPriceCents={pb.price_cents}
              onBuyOneOff={onBuy}
              subtitle={`${pb.pages} pages of executive-grade frameworks, templates and step-by-step plays. Use it tomorrow.`}
              variant="card"
            />
          </>
        )}
      </article>
      <SiteFooter />
    </div>
  );
}
