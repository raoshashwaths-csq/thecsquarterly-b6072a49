// Client-side Paddle.js loader + overlay checkout helper.
// Resolves human-readable price IDs (e.g. "practitioner_monthly") to the
// environment-specific Paddle internal ID via a server function before opening.

import { createServerFn } from "@tanstack/react-start";
import { gatewayFetch, type PaddleEnv } from "@/lib/paddle.server";
import { getPaddleEnvironment } from "@/lib/paddle";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

declare global {
  interface Window {
    Paddle: any;
  }
}

let paddleReady: Promise<void> | null = null;

export function initializePaddle(): Promise<void> {
  if (paddleReady) return paddleReady;
  if (!clientToken) {
    return Promise.reject(new Error("VITE_PAYMENTS_CLIENT_TOKEN is not set"));
  }
  paddleReady = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-paddle="v2"]',
    );
    const onLoad = () => {
      const env = getPaddleEnvironment();
      try {
        window.Paddle.Environment.set(env === "sandbox" ? "sandbox" : "production");
        window.Paddle.Initialize({ token: clientToken });
        resolve();
      } catch (e) {
        reject(e);
      }
    };
    if (existing) {
      if (window.Paddle) onLoad();
      else existing.addEventListener("load", onLoad);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.dataset.paddle = "v2";
    script.onload = onLoad;
    script.onerror = () => reject(new Error("Failed to load Paddle.js"));
    document.head.appendChild(script);
  });
  return paddleReady;
}

export const resolvePaddlePrice = createServerFn({ method: "POST" })
  .inputValidator((data: { priceId: string; environment: PaddleEnv }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
    if (data.environment !== "sandbox" && data.environment !== "live") {
      throw new Error("Invalid environment");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const res = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    const body = (await res.json()) as { data?: Array<{ id: string }> };
    if (!body.data?.length) throw new Error(`Price not found: ${data.priceId}`);
    return body.data[0].id;
  });
