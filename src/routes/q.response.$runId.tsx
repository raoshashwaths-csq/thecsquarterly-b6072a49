import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getQRun, type RunZones } from "@/lib/q-agent.functions";
import { getNode, breadcrumbFor } from "@/lib/q-trees";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { QMark } from "@/components/site/QMark";

export const Route = createFileRoute("/q/response/$runId")({
  head: () => ({
    meta: [
      { title: "Q Response — The CS Quarterly" },
      { name: "robots", content: "index, follow" }, // Public, searchable
    ],
  }),
  component: PublicResponsePage,
});

type Run = {
  id: string; node_id: string; context: Record<string, string>;
  witty: boolean; zones: RunZones; shared: boolean;
  isOwner: boolean; created_at: string;
};

function PublicResponsePage() {
  const { runId } = Route.useParams();
  const fetchRun = useServerFn(getQRun);
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setRun(null);
    setError(null);
    fetchRun({ data: { runId } })
      .then((r) => {
        if (alive) {
          if (!r.shared && !r.isOwner) {
            setError("This response is private.");
          } else {
            setRun(r as Run);
          }
        }
      })
      .catch((e) => {
        if (alive) setError((e as Error).message);
      });
    return () => {
      alive = false;
    };
  }, [runId, fetchRun]);

  const node = run ? getNode(run.node_id) : null;
  const crumb = run ? breadcrumbFor(run.node_id) : [];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 pt-28 md:pt-32 pb-24">
        <div className="container max-w-4xl mx-auto px-5 sm:px-6 md:px-10">
          {error && (
            <div className="border border-border p-8 max-w-xl mx-auto">
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-3">
                Error
              </div>
              <p className="font-body text-foreground/80">{error}</p>
            </div>
          )}

          {!run && !error && (
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-foreground/50 text-center mt-24">
              <QMark /> is loading the response…
            </div>
          )}

          {run && (
            <>
              <div className="mb-10">
                <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-3">
                  <QMark periodClassName="text-foreground" /> Response · {run.witty ? "Witty" : "Analytical"} · {new Date(run.created_at).toLocaleString()}
                </div>
                <h1 className="font-display text-4xl md:text-5xl leading-[0.95] tracking-tight text-balance mb-3 break-words">
                  {node?.label ?? "Decision"}
                  <span className="text-accent">.</span>
                </h1>
                <div className="font-mono text-xs uppercase tracking-[0.25em] text-foreground/55 break-words">
                  {crumb.join(" › ")}
                </div>
              </div>

              <div className="bg-accent/5 border border-accent/20 rounded-md px-5 py-4 mb-10">
                <p className="font-body text-sm text-foreground/75">
                  Shared by the operator. <a href="/agent/framework" className="underline hover:text-accent">Run your own decision</a> with the Operator Canvas.
                </p>
              </div>

              <Zone label="Diagnosis" index="01" tone="primary" body={run.zones.diagnosis} />
              <Zone label="Playbook" index="02" tone="secondary" body={run.zones.playbook} />
              <Zone label="Executable" index="03" tone="accent" body={run.zones.executable} copyable />
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
            onClick={() => {
              navigator.clipboard.writeText(body);
            }}
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
