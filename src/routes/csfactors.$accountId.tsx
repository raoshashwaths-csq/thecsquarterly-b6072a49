import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";
import { CSFactorsSidebar } from "@/components/csfactors/CSFactorsSidebar";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { HealthChip, QBRText } from "@/components/dashboard/HealthChip";
import { ProgressGauge } from "@/components/dashboard/ProgressGauge";
import { Button } from "@/components/ui/button";
import { BackToCommand } from "@/components/csfactors/BackToCommand";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  getAccount, updateAccount, deleteAccount, logAccountEvent,
  type QBRStatus,
} from "@/lib/csfactors.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/csfactors/$accountId")({
  head: () => ({
    meta: [
      { title: "Account — CSFactors" },
      { name: "description", content: "Full account drill-down: health, stakeholders, risks, activity." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { accountId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getAccount);
  const update = useServerFn(updateAccount);
  const del = useServerFn(deleteAccount);
  const logEv = useServerFn(logAccountEvent);

  const { data, isLoading } = useQuery({
    queryKey: ["cs-account", accountId],
    queryFn: () => get({ data: { id: accountId } }),
  });

  if (isLoading) {
    return <Shell><div className="p-12 text-sm text-muted-foreground">Loading account…</div></Shell>;
  }
  if (!data) {
    return (
      <Shell>
        <div className="p-12">
          <p className="text-sm text-muted-foreground mb-4">Account not found.</p>
          <Link to="/csfactors" className="text-accent font-mono text-xs uppercase tracking-widest">← Back</Link>
        </div>
      </Shell>
    );
  }

  const { account, events } = data;

  async function setQBR(next: QBRStatus) {
    await update({ data: { id: accountId, patch: { qbr_status: next } } });
    await logEv({ data: { account_id: accountId, kind: "qbr.override", payload: { to: next } } });
    await qc.invalidateQueries({ queryKey: ["cs-account", accountId] });
    await qc.invalidateQueries({ queryKey: ["cs-accounts"] });
    toast.success(`QBR ${next.toLowerCase()}`);
  }

  async function onDelete() {
    if (!confirm(`Delete ${account.name}? This cannot be undone.`)) return;
    await del({ data: { id: accountId } });
    await qc.invalidateQueries({ queryKey: ["cs-accounts"] });
    toast.success("Account deleted");
    navigate({ to: "/csfactors" });
  }

  return (
    <Shell>
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 animate-fade-up">
        <BackToCommand label="All accounts" />

        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 pb-6 border-b border-border">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent font-semibold mb-3">
              {account.tier} · Renewal {account.renewal_quarter}
            </div>
            <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-[0.95]">
              {account.name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <HealthChip score={account.health} />
            <QBRText status={account.qbr_status as QBRStatus} />
          </div>
        </header>

        <MetricGrid cols={3}>
          <MetricCard eyebrow="ARR" value={`$${(account.arr / 1000).toFixed(0)}K`} accent="accent" />
          <MetricCard eyebrow="Health" value={account.health} unit="/100" accent={account.health < 50 ? "danger" : account.health < 75 ? "secondary" : "success"} />
          <MetricCard eyebrow="Events logged" value={events.length} accent="neutral" />
        </MetricGrid>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <SectionCard title="QBR alignment" eyebrow="Override">
            <ProgressGauge
              value={account.qbr_status === "Completed" ? 100 : account.qbr_status === "Scheduled" ? 50 : 0}
              label="Quarterly review"
              sub={`Currently: ${account.qbr_status}`}
              accent={account.qbr_status === "Completed" ? "success" : account.qbr_status === "Scheduled" ? "secondary" : "danger"}
            />
            <div className="mt-4">
              <Select value={account.qbr_status} onValueChange={(v) => setQBR(v as QBRStatus)}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completed">Mark Completed</SelectItem>
                  <SelectItem value="Scheduled">Mark Scheduled</SelectItem>
                  <SelectItem value="Overdue">Flag Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SectionCard>

          <SectionCard title="Stakeholders" eyebrow="Map">
            <dl className="space-y-3 text-sm">
              <Row label="Champion" value={account.champion} />
              <Row label="Economic buyer" value={account.economic_buyer} />
              <Row label="Open blocker" value={account.blocker} />
            </dl>
          </SectionCard>
        </div>

        <SectionCard title="Activity log" eyebrow="History" className="mt-6">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet. Overrides and edits are logged automatically.</p>
          ) : (
            <ul className="divide-y divide-border">
              {events.map((e) => (
                <li key={e.id} className="py-3 flex items-baseline justify-between gap-4">
                  <div>
                    <div className="font-mono text-xs uppercase tracking-widest text-accent">{e.kind}</div>
                    <div className="text-xs text-muted-foreground">{JSON.stringify(e.payload)}</div>
                  </div>
                  <time className="font-mono text-xs text-muted-foreground tabular-nums">
                    {new Date(e.occurred_at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {account.notes ? (
          <SectionCard title="Notes" eyebrow="Notepad" className="mt-6">
            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{account.notes}</p>
          </SectionCard>
        ) : null}

        <div className="mt-8 flex justify-end">
          <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}>
            Delete account
          </Button>
        </div>
      </div>
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 pb-2 border-b border-border/60 last:border-0">
      <dt className="font-mono uppercase tracking-widest text-xs text-muted-foreground">{label}</dt>
      <dd className="text-foreground/85">{value || <span className="text-muted-foreground italic">—</span>}</dd>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      <CSFactorsSidebar onOpenWorkspace={() => {}} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
