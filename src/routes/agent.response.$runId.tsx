import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getQRun, type RunZones } from "@/lib/q-agent.functions";
import { getNode, breadcrumbFor } from "@/lib/q-trees";

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
  witty: boolean; zones: RunZones; created_at: string;
};

function ResponsePage() {
  const { runId } = Route.useParams();
  const fetchRun = useServerFn(getQRun);
  const navigate = useNavigate();
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setRun(null); setError(null);
    fetchRun({ data: { runId } })
      .then((r) => { if (alive) setRun(r as Run); })
      .catch((e) => { if (alive) setError((e as Error).message); });
    return () => { alive = false; };
  }, [runId, fetchRun]);

  const node = run ? getNode(run.node_id) : null;
  const crumb = run ? breadcrumbFor(run.node_id) : [];

  return (
    <main className="min-h-screen pt-32 pb-32">
      <div className="container max-w-4xl mx-auto px-6 md:px-10">
        {error && (
          <div className="border border-border p-8 max-w-xl mx-auto">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">Error</div>
            <p className="font-body text-foreground/80 mb-6">{error}</p>
            <Link to="/agent/framework" className="font-mono text-[10px] uppercase tracking-[0.25em] underline">
              Back to canvas
            </Link>
          </div>
        )}

        {!run && !error && (
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/50 text-center mt-24">
            Q is composing the response…
          </div>
        )}

        {run && (
          <>
            <div className="mb-12">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">
                Q Response · {run.witty ? "Witty" : "Analytical"} · {new Date(run.created_at).toLocaleString()}
              </div>
              <h1 className="font-display text-4xl md:text-5xl leading-[0.95] tracking-tight text-balance mb-3">
                {node?.label ?? "Decision"}<span className="text-accent">.</span>
              </h1>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/55">
                {crumb.join(" › ")}
              </div>
            </div>

            <Zone label="Diagnosis" index="01" tone="primary" body={run.zones.diagnosis} />
            <Zone label="Playbook" index="02" tone="secondary" body={run.zones.playbook} />
            <Zone label="Executable" index="03" tone="accent" body={run.zones.executable} copyable />

            <div className="flex flex-wrap gap-3 pt-10 border-t border-border mt-12">
              <button
                onClick={() => navigate({ to: "/agent/framework" })}
                className="px-6 py-3 bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.25em] hover:bg-accent transition-colors"
              >
                New decision
              </button>
              <Link
                to="/agent/framework"
                className="px-6 py-3 border border-border font-mono text-[10px] uppercase tracking-[0.25em] hover:border-foreground transition-colors"
              >
                Back to canvas
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
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
          <div className={`font-mono text-[10px] uppercase tracking-[0.3em] mb-1 ${toneClass}`}>
            Zone {index}
          </div>
          <h2 className="font-display text-2xl md:text-3xl tracking-tight">{label}</h2>
        </div>
        {copyable && (
          <button
            onClick={() => { navigator.clipboard.writeText(body); toast.success("Copied to clipboard"); }}
            className="font-mono text-[10px] uppercase tracking-[0.25em] underline underline-offset-4 hover:text-accent"
          >
            Copy
          </button>
        )}
      </div>
      <div className="font-body text-[15px] md:text-base leading-[1.7] text-foreground/85 whitespace-pre-wrap">
        {body}
      </div>
    </section>
  );
}
