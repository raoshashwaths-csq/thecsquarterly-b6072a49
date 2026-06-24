import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/ai-readiness/survey")({
  beforeLoad: () => {
    throw redirect({ to: "/diagnostics/ai-readiness/survey", replace: true });
  },
  component: () => null,
});
