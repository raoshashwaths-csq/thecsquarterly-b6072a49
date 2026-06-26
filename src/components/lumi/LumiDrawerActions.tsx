import { useNavigate } from "@tanstack/react-router";
import { lumiPageActions, type PageContext } from "@/config/lumiPageActions";
import { LumiActionCard } from "./LumiActionCard";

export function LumiDrawerActions({
  pageContext,
  isVanguard,
  visible,
  onActionSelect,
}: {
  pageContext: PageContext;
  isVanguard: boolean;
  visible: boolean;
  onActionSelect: (prompt: string) => void;
}) {
  const navigate = useNavigate();
  const actions = lumiPageActions[pageContext] ?? lumiPageActions.default;
  if (!actions.length) return null;

  return (
    <div
      className={`transition-opacity duration-200 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0 h-0 overflow-hidden"
      }`}
      aria-hidden={!visible}
    >
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/55">
          What can I help you with?
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/45">
          Each ask uses 1 Lumi run
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2">

        {actions.map((action) => {
          const locked = action.tier === "vanguard" && !isVanguard;
          return (
            <LumiActionCard
              key={action.id}
              action={action}
              isLocked={locked}
              onClick={() => {
                if (locked) {
                  navigate({ to: "/pricing", search: { highlight: "vanguard" } as never });
                  return;
                }
                onActionSelect(action.prompt);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
