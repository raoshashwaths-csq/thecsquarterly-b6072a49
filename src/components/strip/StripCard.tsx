import type { Strip } from "@/data/strips";
import { StripHeader } from "./StripHeader";
import { Panel } from "./Panel";
import { DialoguePanel } from "./DialoguePanel";

interface Props {
  strip: Strip;
}

export function StripCard({ strip }: Props) {
  const gridClass =
    strip.panels.length === 4 ? "strip-grid strip-grid-4" : "strip-grid strip-grid-3";

  return (
    <article className="strip-card">
      <StripHeader
        id={strip.id}
        title={strip.title}
        tag={strip.tag}
        hoverText={strip.hoverText}
      />
      <div className={gridClass}>
        {strip.panels.map((panel, i) =>
          panel.type === "dialogue" ? (
            <DialoguePanel key={i} panel={panel} />
          ) : (
            <Panel key={i} panel={panel} />
          ),
        )}
      </div>
      <div className="strip-footer">
        <span className="strip-footer-url">thecsquarterly.com/strip</span>
        <span className="strip-footer-signature">F&amp;N</span>
      </div>
    </article>
  );
}
