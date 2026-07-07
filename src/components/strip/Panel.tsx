import type { StripPanel } from "@/data/strips";
import { SpeechBubble } from "./SpeechBubble";

interface Props {
  panel: StripPanel;
}

export function Panel({ panel }: Props) {
  const firstBubble = panel.bubbles?.[0];
  const initial = firstBubble ? firstBubble.character.charAt(0) : "—";

  return (
    <div className="strip-panel">
      <div className="panel-placeholder">
        <div className="panel-placeholder-circle">
          <span className="panel-placeholder-initial">{initial}</span>
        </div>
        {panel.imageAlt ? (
          <p className="panel-placeholder-description">{panel.imageAlt}</p>
        ) : null}
      </div>

      {panel.bubbles?.map((b, i) => (
        <SpeechBubble key={i} bubble={b} context="panel" />
      ))}

      {panel.stageDirection ? (
        <div className="stage-direction-overlay">[{panel.stageDirection}]</div>
      ) : null}
    </div>
  );
}
