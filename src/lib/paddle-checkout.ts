// Client-side Paddle.js loader + initialize helper.
// The server-side resolver for human-readable -> Paddle internal price ID
// lives in `paddle.functions.ts` (resolvePaddlePrice).

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
    const onLoad = () => {
      try {
        const env = getPaddleEnvironment();
        window.Paddle.Environment.set(env === "sandbox" ? "sandbox" : "production");
        window.Paddle.Initialize({ token: clientToken });
        resolve();
      } catch (e) {
        reject(e);
      }
    };
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-paddle="v2"]',
    );
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
