// Client-side Paddle environment helper. Derived from the client token prefix
// so the published build (live_*) and the preview (test_*) self-select.

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export type PaddleEnv = "sandbox" | "live";

export function getPaddleEnvironment(): PaddleEnv {
  return clientToken?.startsWith("test_") ? "sandbox" : "live";
}

export function isTestMode(): boolean {
  return getPaddleEnvironment() === "sandbox";
}
