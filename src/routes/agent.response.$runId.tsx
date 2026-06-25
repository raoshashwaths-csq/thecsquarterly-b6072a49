import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { canonicalCurrentUrl } from "@/lib/canonical-url";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getQRun, setQRunShared, type RunZones } from "@/lib/q-agent.functions";
import { getSharedQRun } from "@/lib/shared-run.functions";
import { useAuth } from "@/hooks/useAuth";
import { getNode, breadcrumbFor } from "@/lib/q-trees";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { RunAccountTagger } from "@/components/agent/RunAccountTagger";
import { QMark } from "@/components/site/QMark";
import { Switch } from "@/components/ui/switch";
import { SharedRunGate, isRunUnlocked } from "@/components/site/SharedRunGate";

export const Route = createFileRoute("/agent/response/$runId")({
  head: () => ({
    meta: [
      { title: "Q Response — The CS Quarterly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResponsePage,
});

type Run = {
  id: string; node_id: string; context: Record<string, string>;
  witty: boolean; zones: RunZones; shared: boolean;
  isOwner: boolean; created_at: string;
  account_id: string | null; tagged_stakeholder: string | null; tagged_at: string | null;
};

function ResponsePage() {
  const { runId } = Route.useParams();
  const fetchRun = useServerFn(getQRun);
  const fetchShared = useServerFn(getSharedQRun);
  const updateShared = useServerFn(setQRunShared);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    let alive = true;
    setRun(null); setError(null);
    const loader = user
      ? fetchRun({ data: { runId } }).then((r) => r as Run)
      : fetchShared({ data: { runId } }).then((r) => ({
          ...r,
          isOwner: false,
          account_id: null,
          tagged_stakeholder: null,
          tagged_at: null,
        }) as Run);
    loader
      .then((r) => { if (alive) setRun(r); })
      .catch((e) => { if (alive) setError((e as Error).message); });
    return () => { alive = false; };
  }, [runId, fetchRun, fetchShared, user, authLoading]);

  const node = run ? getNode(run.node_id) : null;
  const crumb = run ? breadcrumbFor(run.node_id) : [];

  async function toggleShared(next: boolean) {
    if (!run || sharing) return;
    setSharing(true);
    try {
      await updateShared({ data: { runId: run.id, shared: next } });
      setRun({ ...run, shared: next });
      if (next) {
        await navigator.clipboard.writeText(canonicalCurrentUrl());
        toast.success("Share link copied to clipboard");
      } else {
        toast.success("Sharing disabled");
      }
    } catch (e) {
      toast.error((e as Error).message || "Couldn't update sharing");
    } finally {
      setSharing(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(canonicalCurrentUrl());
    toast.success("Link copied");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 pt-28 md:pt-32 pb-24">
        <div className="container max-w-4xl mx-auto px-5 sm:px-6 md:px-10">
          {error && (
            <div className="border border-border p-8 max-w-xl mx-auto">
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-3">Error</div>
              <p className="font-body text-foreground/80 mb-6">{error}</p>
              <Link to="/agent/framework" className="font-mono text-xs uppercase tracking-[0.25em] underline">
                Back to canvas
              </Link>
            </div>
          )}

          {!run && !error && (
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-foreground/50 text-center mt-24">
              <QMark /> is composing the response…
            </div>
          )}

          {run && (
            <>
              <div className="mb-10">
                <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-3">
                  <QMark periodClassName="text-foreground" /> Response · {run.witty ? "Witty" : "Analytical"} · {new Date(run.created_at).toLocaleString()}
                </div>
                <h1 className="font-display text-4xl md:text-5xl leading-[0.95] tracking-tight text-balance mb-3 break-words">
                  {node?.label ?? "Decision"}<span className="text-accent">.</span>
                </h1>
                <div className="font-mono text-xs uppercase tracking-[0.25em] text-foreground/55 break-words">
                  {crumb.join(" › ")}
                </div>
              </div>

              {run.isOwner && (
                <div className="flex flex-wrap items-center justify-between gap-4 border border-border rounded-md px-5 py-4 mb-10">
                  <div className="min-w-0">
                    <div className="font-mono text-xs uppercase tracking-[0.25em] text-foreground/70">Share link</div>
                    <div className="text-xs text-foreground/55 mt-0.5">
                      {run.shared ? "Anyone with the link can read this response." : "Only you can see this response."}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={run.shared} onCheckedChange={toggleShared} aria-label="Toggle public sharing" disabled={sharing} />
                    {run.shared && (
                      <button
                        onClick={copyLink}
                        className="font-mono text-xs uppercase tracking-[0.25em] underline underline-offset-4 hover:text-accent"
                      >
                        Copy link
                      </button>
                    )}
                  </div>
                </div>
              )}

              <Zone label="Diagnosis" index="01" tone="primary" body={run.zones.diagnosis} />
              <Zone label="Playbook" index="02" tone="secondary" body={run.zones.playbook} />
              <Zone label="Executable" index="03" tone="accent" body={run.zones.executable} copyable />

              {run.isOwner && node && (
                <RunAccountTagger
                  runId={run.id}
                  treeId={node.treeId}
                  initialAccountId={run.account_id}
                  initialStakeholder={run.tagged_stakeholder}
                  isOwner={run.isOwner}
                />
              )}


              <div className="flex flex-wrap gap-3 pt-10 border-t border-border mt-12">
                <button
                  onClick={() => navigate({ to: "/agent/framework" })}
                  className="px-6 py-3 bg-foreground text-background font-mono text-xs uppercase tracking-[0.25em] hover:bg-accent transition-colors"
                >
                  New decision
                </button>
                <Link
                  to="/agent/framework"
                  className="px-6 py-3 border border-border font-mono text-xs uppercase tracking-[0.25em] hover:border-foreground transition-colors"
                >
                  Back to canvas
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Zone({
  label, index, tone, body, copyable,
}: { label: string; index: string; tone: "primary" | "secondary" | "accent"; body: string; copyable?: boolean }) {
  const toneClass = tone === "primary" ? "text-accent" : tone === "secondary" ? "text-secondary-accent" : "text-accent";
  return (
    <section className="border-t border-border pt-8 pb-10">
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <div className={`font-mono text-xs uppercase tracking-[0.3em] mb-1 ${toneClass}`}>
            Zone {index}
          </div>
          <h2 className="font-display text-2xl md:text-3xl tracking-tight">{label}</h2>
        </div>
        {copyable && (
          <button
            onClick={() => { navigator.clipboard.writeText(body); toast.success("Copied to clipboard"); }}
            className="font-mono text-xs uppercase tracking-[0.25em] underline underline-offset-4 hover:text-accent"
          >
            Copy
          </button>
        )}
      </div>
      <div className="font-body text-[15px] md:text-base leading-[1.7] text-foreground/85 whitespace-pre-wrap break-words">
        {body}
      </div>
    </section>
  );
}
