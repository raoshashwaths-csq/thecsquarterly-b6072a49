// Action Centre panel — Surface A. Embedded in Pulse below existing content.
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { listCtas, type Cta } from "@/lib/ctas.functions";
import { CtaCreateDrawer } from "./CtaCreateDrawer";
import { CtaDetailDrawer } from "./CtaDetailDrawer";
import { CtaRow } from "./CtaRow";

export function ActionCentrePanel() {
  const fetch = useServerFn(listCtas);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["ctas", "open", "pulse"],
    queryFn: () =>
      fetch({ data: { status: ["open", "in_progress"], limit: 9 } }),
    staleTime: 30_000,
  });

  const rows: Cta[] = q.data?.ctas ?? [];
  const openCount = rows.length;

  return (
    <>
      <SectionCard
        eyebrow="Action centre"
        title="Open actions"
        actions={
          <>
            <span className="font-mono uppercase tracking-wider text-[10px] text-foreground/60">
              {openCount} OPEN
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="font-mono uppercase tracking-wider text-[10px]"
            >
              New CTA +
            </Button>
          </>
        }
      >
        {q.isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No open actions. Raise one to get started.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.slice(0, 8).map((c) => (
              <CtaRow key={c.id} cta={c} onClick={() => setDetailId(c.id)} />
            ))}
          </div>
        )}
        {rows.length > 8 ? (
          <div className="pt-3 mt-3 border-t border-border text-right">
            <Link
              to="/csfactors/ctas"
              className="font-mono uppercase tracking-wider text-[10px] text-accent hover:underline"
            >
              View all {openCount} open actions →
            </Link>
          </div>
        ) : null}
      </SectionCard>

      <CtaCreateDrawer open={createOpen} onOpenChange={setCreateOpen} />
      <CtaDetailDrawer
        id={detailId}
        open={!!detailId}
        onOpenChange={(v) => !v && setDetailId(null)}
      />
    </>
  );
}
