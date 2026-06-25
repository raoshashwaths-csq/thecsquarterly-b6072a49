// Canonical origin for any user-facing share URL that leaves the product
// (clipboard copies, PDF links, native share sheets, emailed links).
//
// Internal flows that depend on the current host (OAuth redirects,
// Paddle return URLs) should keep using `window.location.origin` —
// only outbound share copy is rewritten to this origin so links never
// leak a *.lovable.app preview/published host.
export const CANONICAL_ORIGIN = "https://thecsquarterly.com";

export function canonicalUrl(path: string): string {
  if (!path) return CANONICAL_ORIGIN;
  if (/^https?:\/\//i.test(path)) {
    try {
      const u = new URL(path);
      return `${CANONICAL_ORIGIN}${u.pathname}${u.search}${u.hash}`;
    } catch {
      return CANONICAL_ORIGIN;
    }
  }
  return `${CANONICAL_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function canonicalCurrentUrl(): string {
  if (typeof window === "undefined") return CANONICAL_ORIGIN;
  return canonicalUrl(`${window.location.pathname}${window.location.search}${window.location.hash}`);
}
