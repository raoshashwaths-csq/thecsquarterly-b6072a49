import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/ai-readiness")({
  component: () => <Outlet />,
});
