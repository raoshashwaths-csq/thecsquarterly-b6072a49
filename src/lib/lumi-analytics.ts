import { logLumiEvent } from "./lumi-analytics.functions";

export type LumiEventName =
  | "tree.select"
  | "drawer.open"
  | "drawer.close"
  | "tree.focus"
  | "tree.unfocus"
  | "article.signal.shown"
  | "article.resume.shown"
  | "article.resume.click"
  | "article.resume.dismiss"
  | "article.related.click";

export type LumiEventProps = {
  treeId?: string;
  briefingShown?: boolean;
  messageCount?: number;
  surface?: string;
  meta?: Record<string, unknown>;
};

const BUFFER_KEY = "lumi.events.buffer";
const LAST_TREE_KEY = "lumi.lastTree";
const MAX_BUFFER = 50;

/**
 * Fire-and-forget analytics. Writes to a local rolling buffer (debuggable in
 * DevTools) AND best-effort posts to the lumi_events table. Anonymous calls
 * 401 silently — that's fine, we only care about signed-in operator usage.
 */
export function trackLumiEvent(event: LumiEventName, props: LumiEventProps = {}) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    const buf: unknown[] = raw ? JSON.parse(raw) : [];
    buf.push({ event, ...props, at: new Date().toISOString() });
    while (buf.length > MAX_BUFFER) buf.shift();
    localStorage.setItem(BUFFER_KEY, JSON.stringify(buf));
  } catch { /* swallow */ }
  try {
    logLumiEvent({ data: { event, ...props } }).catch(() => { /* anon / network */ });
  } catch { /* */ }
}

export function rememberLastTree(treeId: string) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LAST_TREE_KEY, treeId); } catch { /* */ }
}

export function recallLastTree(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(LAST_TREE_KEY); } catch { return null; }
}
