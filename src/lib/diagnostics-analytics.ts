/**
 * Lightweight diagnostics funnel tracking.
 * Fire-and-forget: writes a rolling buffer to localStorage so we can debug in
 * DevTools and (when signed-in) mirrors to the lumi_events table via the same
 * server function the Lumi tree analytics use. Anonymous calls fail silently.
 */
import { logLumiEvent } from "./lumi-analytics.functions";

export type DiagnosticEventName =
  | "diagnostic.cta_click"   // user clicked a card on /diagnostics
  | "diagnostic.survey_start" // user landed on a survey / began answering
  | "diagnostic.submit";      // results computed / submitted

export type DiagnosticEventProps = {
  slug: string; // ai-readiness | champion-dependency | ...
  surface?: string;
  meta?: Record<string, unknown>;
};

const BUFFER_KEY = "diagnostics.events.buffer";
const MAX_BUFFER = 50;

export function trackDiagnosticEvent(
  event: DiagnosticEventName,
  props: DiagnosticEventProps,
) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    const buf: unknown[] = raw ? JSON.parse(raw) : [];
    buf.push({ event, ...props, at: new Date().toISOString() });
    while (buf.length > MAX_BUFFER) buf.shift();
    localStorage.setItem(BUFFER_KEY, JSON.stringify(buf));
  } catch {
    /* swallow */
  }
  try {
    // Reuse the lumi_events sink so we have one analytics table. The `event`
    // string namespace ("diagnostic.*") keeps it filterable.
    logLumiEvent({
      data: {
        event: event as unknown as "tree.select",
        surface: props.surface ?? "diagnostics",
        meta: { slug: props.slug, ...(props.meta ?? {}) },
      },
    }).catch(() => {
      /* anon / network */
    });
  } catch {
    /* */
  }
}
