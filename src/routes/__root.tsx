import { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-accent mb-4">404</p>
        <h1 className="font-display text-5xl mb-4">Page not found.</h1>
        <p className="text-muted-foreground mb-8">
          That dispatch was never published. Head back to the front page.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-foreground text-background font-mono text-[11px] uppercase tracking-widest"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-accent mb-4">Error</p>
        <h1 className="font-display text-4xl mb-4">This page didn't load.</h1>
        <p className="text-muted-foreground mb-8">{error.message || "Something went wrong."}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="px-6 py-3 bg-foreground text-background font-mono text-[11px] uppercase tracking-widest"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "The CS Quarterly — A weekly dispatch for Customer Success leaders" },
      {
        name: "description",
        content:
          "A weekly dispatch for Customer Success leaders and managers. Curated news, playbooks, and the annual AI Readiness Survey.",
      },
      { name: "author", content: "The CS Quarterly" },
      { property: "og:site_name", content: "The CS Quarterly" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "The CS Quarterly" },
      {
        property: "og:description",
        content:
          "A weekly dispatch for Customer Success leaders and managers. Curated news, playbooks, and the annual AI Readiness Survey.",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Lora:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "The CS Quarterly",
          description:
            "A weekly dispatch for Customer Success leaders and managers.",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthInvalidator() {
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInvalidator />
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
