import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { LumiRouteLoader } from "@/components/site/LumiRouteLoader";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: LumiRouteLoader,
    defaultPendingMs: 250,
    defaultPendingMinMs: 600,
  });

  return router;
};
