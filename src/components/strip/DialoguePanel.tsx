import type { StripPanel } from "@/data/strips";
import { SpeechBubble } from "./SpeechBubble";

interface Props {
  panel: StripPanel;
}

export function DialoguePanel({ panel }: Props) {
  return (
    <div className="dialogue-panel">
      {panel.stageDirection ? (
        <p className="stage-direction">[{panel.stageDirection}]</p>
      ) : null}
      {panel.bubbles?.map((b, i) => (
        <SpeechBubble key={i} bubble={b} context="dialogue" />
      ))}
    </div>
  );
}
