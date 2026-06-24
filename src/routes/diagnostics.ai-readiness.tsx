import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/diagnostics/ai-readiness")({
  component: () => <Outlet />,
});
