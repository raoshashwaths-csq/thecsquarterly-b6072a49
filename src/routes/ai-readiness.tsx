import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/ai-readiness")({
  beforeLoad: () => {
    throw redirect({ to: "/diagnostics/ai-readiness", replace: true });
  },
  component: () => null,
});
