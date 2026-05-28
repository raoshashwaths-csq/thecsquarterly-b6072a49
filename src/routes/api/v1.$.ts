import { createFileRoute } from "@tanstack/react-router";

/**
 * Catch-all for unmatched /api/v1/* paths.
 * Returns a clean 403 JSON envelope when called without a valid enterprise key.
 *
 * Explicitly declared sibling routes (e.g. v1.benchmarks.nrr.ts) take
 * precedence over this splat, so they remain reachable.
 */

function respond403() {
  return new Response(
    JSON.stringify({
      error: "unauthenticated",
      message: "Enterprise API key required to access /api/v1.",
      docs: "https://www.thecsquarterly.com/account/api",
    }),
    {
      status: 403,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "WWW-Authenticate": 'Bearer realm="thecsquarterly.com"',
      },
    },
  );
}

export const Route = createFileRoute("/api/v1/$")({
  server: {
    handlers: {
      GET: () => respond403(),
      POST: () => respond403(),
      PUT: () => respond403(),
      PATCH: () => respond403(),
      DELETE: () => respond403(),
    },
  },
});
