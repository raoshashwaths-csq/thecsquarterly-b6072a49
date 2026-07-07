import type { SpeechBubble as SpeechBubbleData } from "@/data/strips";

interface Props {
  bubble: SpeechBubbleData;
  context: "panel" | "dialogue";
}

export function SpeechBubble({ bubble, context }: Props) {
  const posClass =
    context === "panel"
      ? `speech-bubble speech-bubble-panel position-${bubble.position}`
      : "speech-bubble speech-bubble-dialogue";

  return (
    <div className={posClass}>
      <span className={`bubble-character ${bubble.character.toLowerCase()}`}>
        {bubble.character}
      </span>
      <p className="bubble-text">{bubble.text}</p>
    </div>
  );
}
