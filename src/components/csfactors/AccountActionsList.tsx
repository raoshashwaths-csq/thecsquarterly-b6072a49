import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CtaRow } from "@/components/csfactors/ctas/CtaRow";
import { CtaCreateDrawer } from "@/components/csfactors/ctas/CtaCreateDrawer";
import { CtaDetailDrawer } from "@/components/csfactors/ctas/CtaDetailDrawer";
import { listCtas } from "@/lib/ctas.functions";

/**
 * Account-scoped CTA list. Renders inside AccountDrawer so every action
 * raised on this client is visible from the client card itself.
 */
export function AccountActionsList({
  accountId,
  accountName,
}: {
  accountId: string;
  accountName: string | null;
}) {
  const qc = useQueryClient();
  const fetch = useServerFn(listCtas);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ctas", "account", accountId],
    queryFn: () => fetch({ data: { accountId, limit: 50 } }),
    staleTime: 30_000,
  });

  const ctas = data?.ctas ?? [];
  const open = ctas.filter((c) => c.status === "open" || c.status === "in_progress");
  const done = ctas.filter((c) => c.status === "completed");

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["ctas", "account", accountId] });
    qc.invalidateQueries({ queryKey: ["ctas"] });
    qc.invalidateQueries({ queryKey: ["cs-events", accountId] });
    qc.invalidateQueries({ queryKey: ["cta-metrics"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-mono uppercase tracking-[0.22em] text-[10px] text-muted-foreground">
          {open.length} open · {done.length} done
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCreateOpen(true)}
          className="h-7 px-2 font-mono uppercase tracking-wider text-[10px]"
        >
          <Plus className="h-3 w-3 mr-1" /> New CTA
        </Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading actions…</p>
      ) : ctas.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No actions raised on this account yet.
        </p>
      ) : (
        <div className="space-y-1">
          {[...open, ...done].slice(0, 25).map((c) => (
            <CtaRow key={c.id} cta={c} onClick={() => setDetailId(c.id)} />
          ))}
        </div>
      )}

      <CtaCreateDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultAccountId={accountId}
        defaultAccountName={accountName}
        onCreated={invalidate}
      />
      {detailId && (
        <CtaDetailDrawer
          ctaId={detailId}
          open={!!detailId}
          onOpenChange={(o) => !o && setDetailId(null)}
        />
      )}
    </div>
  );
}
