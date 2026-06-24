/**
 * Stale-widget freshness helper.
 *
 * Threshold: a widget is considered "stale" when its underlying data hasn't
 * been touched in more than 7 days, or when no `updatedAt` is provided at
 * all (no data has ever flowed through it).
 */
export type FreshnessInput = string | number | Date | null | undefined;

export type Freshness = {
  stale: boolean;
  daysSince: number | null;
  label: string | null;
};

const STALE_DAYS = 7;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function useFreshness(updatedAt: FreshnessInput): Freshness {
  if (updatedAt === undefined) {
    // Not wired at all — caller didn't opt in. Treat as fresh.
    return { stale: false, daysSince: null, label: null };
  }
  if (updatedAt === null || updatedAt === "") {
    return { stale: true, daysSince: null, label: "NEW" };
  }
  const t = new Date(updatedAt).getTime();
  if (Number.isNaN(t)) return { stale: false, daysSince: null, label: null };
  const days = Math.floor((Date.now() - t) / MS_PER_DAY);
  const stale = days > STALE_DAYS;
  return {
    stale,
    daysSince: days,
    label: stale ? `STALE · ${days}D` : null,
  };
}

/** Pick the most recent timestamp from a list of records that may carry `updated_at`. */
export function latestUpdatedAt<T extends { updated_at?: string | null }>(
  rows: ReadonlyArray<T> | undefined | null,
): string | null {
  if (!rows || rows.length === 0) return null;
  let best = 0;
  let bestRaw: string | null = null;
  for (const r of rows) {
    if (!r?.updated_at) continue;
    const t = new Date(r.updated_at).getTime();
    if (!Number.isNaN(t) && t > best) {
      best = t;
      bestRaw = r.updated_at;
    }
  }
  return bestRaw;
}
