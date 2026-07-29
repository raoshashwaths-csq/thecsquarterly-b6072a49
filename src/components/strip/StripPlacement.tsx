import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getConfirmedPlacementsForTarget } from "@/lib/admin-content.functions";
import { Panel } from "./Panel";

interface Props {
  targetType: "post" | "playbook";
  targetSlug: string;
}

export function StripPlacement({ targetType, targetSlug }: Props) {
  const fetchPlacements = useServerFn(getConfirmedPlacementsForTarget);
  const { data: placements } = useQuery({
    queryKey: ["strip-placements", targetType, targetSlug],
    queryFn: () => fetchPlacements({ data: { targetType, targetSlug } }),
    staleTime: 1000 * 60 * 5,
  });

  if (!placements?.length) return null;

  return (
    <div className="mt-16 pt-10 border-t border-border space-y-16">
      {placements.map((placement) => (
        <div key={placement.id}>
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-6">
            {placement.stripTag}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {placement.panels?.map((panel: any, i: number) => (
              <Panel key={i} panel={panel} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
