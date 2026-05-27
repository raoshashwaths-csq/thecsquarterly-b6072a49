import { useMemo, type ReactNode } from "react";

/**
 * Renders article markdown body and exposes word-level highlighting.
 * The parent passes a `progress` (0..1) — typically from <AudioBar onProgress />.
 * We compute total word count once and highlight `floor(progress * total)`.
 * This is approximate but produces smooth karaoke-style emphasis as TTS reads.
 */
export function HighlightedBody({
  body,
  progress = 0,
  className = "prose-content mt-12 animate-tone-swap",
}: {
  body: string;
  progress?: number;
  className?: string;
}) {
  const blocks = useMemo(() => parseBlocks(body), [body]);
  const totalWords = useMemo(
    () => blocks.reduce((n, b) => n + countWords(b), 0),
    [blocks],
  );
  const activeIndex = Math.max(0, Math.min(totalWords - 1, Math.floor(progress * totalWords)));

  let counter = 0;
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        const node = renderBlock(b, i, counter, activeIndex);
        counter += countWords(b);
        return node;
      })}
    </div>
  );
}

type Block =
  | { type: "h2" | "h3" | "p"; text: string }
  | { type: "ul" | "ol"; items: string[] };

function parseBlocks(body: string): Block[] {
  const normalized = body
    .replace(/\r\n/g, "\n")
    .replace(/([^\n])\n(#{1,6}[^#\n])/g, "$1\n\n$2")
    .replace(/(^|\n)(#{1,6}[^\n]*?)\n(?!\n)/g, "$1$2\n\n");

  const out: Block[] = [];
  for (const raw of normalized.split(/\n{2,}/)) {
    const p = raw.trim().replace(/\s*#+\s*$/, "").trim();
    if (!p) continue;
    const h3 = p.match(/^###\s*(.+)$/);
    if (h3) { out.push({ type: "h3", text: h3[1].trim() }); continue; }
    const h2 = p.match(/^##\s*(.+)$/);
    if (h2) { out.push({ type: "h2", text: h2[1].trim() }); continue; }
    const h1 = p.match(/^#\s+(.+)$/);
    if (h1) { out.push({ type: "h2", text: h1[1].trim() }); continue; }
    if (/^\d+\.\s/m.test(p)) {
      out.push({ type: "ol", items: p.split("\n").map((l) => l.replace(/^\s*\d+\.\s+/, "")) });
      continue;
    }
    if (/^[-*]\s/m.test(p)) {
      out.push({ type: "ul", items: p.split("\n").map((l) => l.replace(/^\s*[-*]\s+/, "")) });
      continue;
    }
    out.push({ type: "p", text: p });
  }
  return out;
}

function splitWords(text: string): string[] {
  // Keep punctuation attached to its neighbour token, split on whitespace.
  return text.split(/\s+/).filter(Boolean);
}

function countWords(b: Block): number {
  if (b.type === "ul" || b.type === "ol") {
    return b.items.reduce((n: number, it: string) => n + splitWords(it).length, 0);
  }
  return splitWords((b as { text: string }).text).length;
}

function renderInlineWords(text: string, startIndex: number, activeIndex: number): ReactNode {
  // Render text token-by-token; bold markers handled per token.
  const tokens = splitWords(text);
  return tokens.map((tok, i) => {
    const wordIdx = startIndex + i;
    const isActive = wordIdx === activeIndex;
    const isRead = wordIdx < activeIndex;
    const bold = /^\*\*[^*]+\*\*$/.test(tok);
    const content = bold ? tok.slice(2, -2) : tok;
    const className = isActive
      ? "csq-word csq-word-active"
      : isRead
      ? "csq-word csq-word-read"
      : "csq-word";
    return (
      <span key={i}>
        <span className={className}>
          {bold ? <strong className="font-semibold text-foreground">{content}</strong> : content}
        </span>
        {i < tokens.length - 1 ? " " : ""}
      </span>
    );
  });
}

function renderBlock(b: Block, key: number, startIndex: number, activeIndex: number): ReactNode {
  if (b.type === "h2") {
    return (
      <h2 key={key} className="font-display text-3xl md:text-4xl mt-14 mb-6 leading-tight tracking-tight">
        {renderInlineWords(b.text, startIndex, activeIndex)}
      </h2>
    );
  }
  if (b.type === "h3") {
    return (
      <h3 key={key} className="font-display text-2xl md:text-3xl mt-12 mb-4 leading-tight tracking-tight">
        {renderInlineWords(b.text, startIndex, activeIndex)}
      </h3>
    );
  }
  if (b.type === "p") {
    return (
      <p key={key} className="text-lg leading-relaxed my-6 text-foreground/85">
        {renderInlineWords(b.text, startIndex, activeIndex)}
      </p>
    );
  }
  // narrow to list
  if (b.type !== "ul" && b.type !== "ol") return null;
  const items = b.items;
  let acc = startIndex;
  const lis = items.map((it: string, j: number) => {
    const node = (
      <li key={j}>{renderInlineWords(it, acc, activeIndex)}</li>
    );
    acc += splitWords(it).length;
    return node;
  });
  if (b.type === "ol") {
    return (
      <ol key={key} className="list-decimal pl-6 space-y-2 text-lg leading-relaxed my-6 marker:text-secondary-accent marker:font-mono">
        {lis}
      </ol>
    );
  }
  return (
    <ul key={key} className="list-disc pl-6 space-y-2 text-lg leading-relaxed my-6 marker:text-secondary-accent">
      {lis}
    </ul>
  );
}
