// Pricing model for Q runs.
// cost_micros is millionths of a USD cent (1 USD = 100_000_000 micros).
// Keeps everything integer until the final display.

export const GATEWAY_MULTIPLIER = 1.6; // Approximate Lovable Gateway billing vs. provider list.

type ModelPrice = { inPerM: number; outPerM: number }; // USD per 1M tokens, list price.

export const PRICING: Record<string, ModelPrice> = {
  "google/gemini-2.5-flash":      { inPerM: 0.30, outPerM: 2.50 },
  "google/gemini-2.5-flash-lite": { inPerM: 0.10, outPerM: 0.40 },
  "google/gemini-2.5-pro":        { inPerM: 1.25, outPerM: 10.0 },
  "google/gemini-3-flash-preview":      { inPerM: 0.30, outPerM: 2.50 },
  "google/gemini-3.5-flash":            { inPerM: 0.30, outPerM: 2.50 },
  "google/gemini-3.1-flash-lite-preview": { inPerM: 0.10, outPerM: 0.40 },
  "google/gemini-3.1-pro-preview":      { inPerM: 1.25, outPerM: 10.0 },
  "openai/gpt-5":      { inPerM: 1.25, outPerM: 10.0 },
  "openai/gpt-5-mini": { inPerM: 0.25, outPerM: 2.0 },
  "openai/gpt-5-nano": { inPerM: 0.05, outPerM: 0.40 },
};

const DEFAULT_PRICE: ModelPrice = { inPerM: 0.30, outPerM: 2.50 };

export function computeCostMicros(
  model: string,
  tokensIn: number,
  tokensOut: number,
): number {
  const p = PRICING[model] ?? DEFAULT_PRICE;
  // USD = (in/1M)*inPerM + (out/1M)*outPerM, then × multiplier.
  // micros = USD × 100_000_000.
  const usd =
    ((tokensIn / 1_000_000) * p.inPerM + (tokensOut / 1_000_000) * p.outPerM) *
    GATEWAY_MULTIPLIER;
  return Math.round(usd * 100_000_000);
}

export function microsToUsd(micros: number): number {
  return micros / 100_000_000;
}

export function formatUSD(micros: number, opts?: { fractionDigits?: number }): string {
  const usd = microsToUsd(micros);
  const fd = opts?.fractionDigits ?? (usd < 1 ? 4 : 2);
  return `$${usd.toLocaleString(undefined, { minimumFractionDigits: fd, maximumFractionDigits: fd })}`;
}

// Heuristic fallback when telemetry coverage is too low to project.
// Blended estimate across askQ chat + runQNode playbooks.
export const HEURISTIC_TOKENS_PER_RUN = { in: 600, out: 1100 };
export function heuristicCostMicrosPerRun(
  model = "google/gemini-2.5-flash",
): number {
  return computeCostMicros(model, HEURISTIC_TOKENS_PER_RUN.in, HEURISTIC_TOKENS_PER_RUN.out);
}
