import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { listTeamsAdmin, getTeamDetail } from "@/lib/admin-teams.functions";
import { listSurveySubmissions, getSurveyAggregates } from "@/lib/admin-survey.functions";
import { exportDataset } from "@/lib/admin-ops.functions";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";

const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString() : "—");

/* ───────────── Teams & Workspaces ───────────── */

export function TeamsAdmin() {
  const listFn = useServerFn(listTeamsAdmin);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "teams"],
    queryFn: () => listFn(),
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <header>
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2">Enterprise</div>
        <h2 className="font-display text-4xl mb-2">Teams &amp; Workspaces</h2>
        <p className="text-muted-foreground max-w-2xl">
          Every team workspace, its members, and how many reading sequences it has built.
        </p>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Loading teams…</div>}

      {data && data.length === 0 && (
        <div className="border border-border p-6 text-sm text-muted-foreground">No team workspaces yet.</div>
      )}

      {data && data.length > 0 && (
        <div className="border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="w-8" />
                <th className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-3">Team</th>
                <th className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-3">Members</th>
                <th className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-3">Sequences</th>
                <th className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-3">Owner tier</th>
                <th className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((t) => {
                const open = expandedId === t.id;
                return (
                  <>
                    <tr key={t.id} className="hover:bg-muted/20">
                      <td className="px-2 py-3 align-top">
                        <button
                          onClick={() => setExpandedId(open ? null : t.id)}
                          className="p-1 text-muted-foreground hover:text-foreground"
                          aria-label={open ? "Collapse" : "Expand"}
                        >
                          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-display text-base">{t.name}</td>
                      <td className="px-4 py-3">{t.member_count}</td>
                      <td className="px-4 py-3">{t.sequence_count}</td>
                      <td className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                        {t.tier_label}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(t.created_at)}</td>
                    </tr>
                    {open && (
                      <tr key={`${t.id}-detail`} className="bg-muted/10">
                        <td colSpan={6} className="px-4 py-4">
                          <TeamDetail teamId={t.id} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TeamDetail({ teamId }: { teamId: string }) {
  const fn = useServerFn(getTeamDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "team", teamId],
    queryFn: () => fn({ data: { teamId } }),
  });
  if (isLoading || !data) return <div className="text-xs text-muted-foreground">Loading…</div>;
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Members</div>
        {data.members.length === 0 ? (
          <div className="text-xs text-muted-foreground">No members.</div>
        ) : (
          <ul className="space-y-1 text-sm">
            {data.members.map((m: any) => (
              <li key={m.user_id} className="flex justify-between border-b border-border/60 py-1">
                <span className="font-mono text-xs">{m.user_id.slice(0, 8)}…</span>
                <span className="font-mono text-xs uppercase tracking-wider text-accent">{m.role}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Reading sequences</div>
        {data.sequences.length === 0 ? (
          <div className="text-xs text-muted-foreground">No sequences.</div>
        ) : (
          <ul className="space-y-1 text-sm">
            {data.sequences.map((s: any) => (
              <li key={s.id} className="flex justify-between border-b border-border/60 py-1">
                <span>{s.name}</span>
                <span className="text-xs text-muted-foreground">{fmtDate(s.updated_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ───────────── Retention Ledger Survey ───────────── */

export function BenchmarkSurveyAdmin() {
  const listFn = useServerFn(listSurveySubmissions);
  const aggFn = useServerFn(getSurveyAggregates);
  const exportFn = useServerFn(exportDataset);
  const [busy, setBusy] = useState(false);

  const submissions = useQuery({
    queryKey: ["admin", "survey", "submissions"],
    queryFn: () => listFn({ data: { limit: 100, offset: 0 } }),
  });
  const agg = useQuery({
    queryKey: ["admin", "survey", "aggregates"],
    queryFn: () => aggFn(),
  });

  const handleExport = async () => {
    try {
      setBusy(true);
      const res = await exportFn({ data: { dataset: "survey_responses" } });
      const blob = new Blob([res.csv || ""], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `survey_responses_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  const a = agg.data;
  const rows = submissions.data?.rows ?? [];

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2">Diagnostic</div>
          <h2 className="font-display text-4xl mb-2">Retention Ledger submissions</h2>
          <p className="text-muted-foreground max-w-2xl">
            Full submission log plus aggregate scoring across foundational and agent dimensions.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono uppercase tracking-wider border border-border hover:bg-muted/40 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </header>

      {a && (
        <MetricGrid cols={4}>
          <MetricCard eyebrow="Total submissions" value={a.total} accent="accent" />
          <MetricCard eyebrow="Mean score" value={a.scoreMean.toFixed(1)} accent="secondary" />
          <MetricCard eyebrow="Foundational mean" value={a.foundationalMean.toFixed(1)} accent="neutral" />
          <MetricCard eyebrow="Agent mean" value={a.agentMean.toFixed(1)} accent="neutral" />
        </MetricGrid>
      )}

      {a && Object.keys(a.tierCounts).length > 0 && (
        <div className="border border-border p-5">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">Submissions by tier</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(a.tierCounts)
              .sort((x, y) => y[1] - x[1])
              .map(([tier, count]) => (
                <div key={tier} className="border border-border px-3 py-2 text-sm">
                  <span className="font-mono uppercase tracking-wider text-xs text-accent">{tier}</span>
                  <span className="ml-2 font-display text-lg">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {a && a.dimensions.length > 0 && (
        <div className="border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Dimension aggregates
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-2">Dimension</th>
                <th className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-2">n</th>
                <th className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-2">Mean</th>
                <th className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-2">Median</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {a.dimensions.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-2 font-mono text-xs">{d.id}</td>
                  <td className="px-4 py-2">{d.count}</td>
                  <td className="px-4 py-2">{d.mean.toFixed(2)}</td>
                  <td className="px-4 py-2">{d.median.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">
          Recent submissions ({submissions.data?.total ?? 0} total)
        </div>
        {submissions.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {rows.length === 0 && !submissions.isLoading && (
          <div className="border border-border p-6 text-sm text-muted-foreground">No submissions yet.</div>
        )}
        {rows.length > 0 && (
          <div className="border border-border overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-3">Name</th>
                  <th className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-3">Email</th>
                  <th className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-3">Company</th>
                  <th className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-3">Title</th>
                  <th className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-3">Segment</th>
                  <th className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-3">HCM</th>
                  <th className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-3">Score</th>
                  <th className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-3">Tier</th>
                  <th className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">{r.name ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.email}</td>
                    <td className="px-4 py-3">{r.company ?? "—"}</td>
                    <td className="px-4 py-3">{r.title ?? r.role ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.segment ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.hcm_status ?? "—"}</td>
                    <td className="px-4 py-3 font-display text-lg">{Number(r.score).toFixed(1)}</td>
                    <td className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-accent">{r.tier}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{fmtDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
