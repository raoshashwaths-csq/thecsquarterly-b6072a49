import { useEffect, useLayoutEffect, useState, lazy, Suspense } from "react";

import { ClientOnly } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n/config";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { QAgentButton } from "@/components/site/QAgentButton";
import { QErrorBoundary } from "@/components/site/QErrorBoundary";
import { EndOfDaySentimentCheckIn } from "@/components/site/EndOfDaySentimentCheckIn";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { useOnboardingGate } from "@/hooks/useOnboardingGate";
import type { Persona } from "@/hooks/usePersona";

const CommandPalette = lazy(() =>
  import("@/components/site/CommandPalette").then((m) => ({ default: m.CommandPalette })),
);
import { useHeadlineReveal } from "@/hooks/useHeadlineReveal";


import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">404</p>
        <h1 className="font-display text-5xl mb-4">Page not found.</h1>
        <p className="text-muted-foreground mb-8">
          That dispatch was never published. Head back to the front page.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-foreground text-background font-mono text-xs uppercase tracking-widest"
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
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">Error</p>
        <h1 className="font-display text-4xl mb-4">This page didn't load.</h1>
        <p className="text-muted-foreground mb-8">{error.message || "Something went wrong."}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="px-6 py-3 bg-foreground text-background font-mono text-xs uppercase tracking-widest"
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
      { title: "The CS Quarterly, A weekly dispatch for Customer Success leaders" },
      {
        name: "description",
        content:
          "A weekly dispatch for Customer Success leaders and managers. Curated news, playbooks, and the annual AI Readiness Survey.",
      },
      { name: "author", content: "The CS Quarterly" },
      { property: "og:site_name", content: "The CS Quarterly" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "The CS Quarterly, A weekly dispatch for Customer Success leaders" },
      {
        property: "og:description",
        content:
          "A weekly dispatch for Customer Success leaders and managers. Curated news, playbooks, and the annual AI Readiness Survey.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "The CS Quarterly, A weekly dispatch for Customer Success leaders" },
      { name: "description", content: "Customer Success Hub is a website offering customer success news, insights, and skill-building resources for leaders and managers." },
      { property: "og:description", content: "Customer Success Hub is a website offering customer success news, insights, and skill-building resources for leaders and managers." },
      { name: "twitter:description", content: "Customer Success Hub is a website offering customer success news, insights, and skill-building resources for leaders and managers." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,500&family=Source+Serif+4:opsz,wght@8..60,300;8..60,400;8..60,500;8..60,600&family=JetBrains+Mono:wght@400;500;600;700&family=Inter+Tight:wght@400;500;600;700&display=swap",
      },
      { rel: "alternate", type: "application/rss+xml", title: "The CS Quarterly", href: "/rss.xml" },
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
  const [lang, setLang] = useState<string>(i18n.language || "en");
  useEffect(() => {
    const onChange = (lng: string) => setLang(lng);
    i18n.on("languageChanged", onChange);
    return () => {
      i18n.off("languageChanged", onChange);
    };
  }, []);
  return (
    <html lang={lang} className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('csq-theme');var d=s?s==='dark':true;document.documentElement.classList.toggle('dark',d);}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
        <HeadContent />
      </head>
      {/* paper-grain: subtle paper texture overlay on cream sections. Remove this class to disable globally. */}
      <body className="paper-grain">
        <PaymentTestModeBanner />
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        <Scripts />
      </body>
    </html>
  );
}


function AuthInvalidator() {
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        queryClient.cancelQueries();
        queryClient.clear();
      } else {
        queryClient.invalidateQueries();
      }
      router.invalidate();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);
  return null;
}

function PageTransition() {
  // Re-key on pathname so each route mount replays the cinematic page-enter.
  const router = useRouter();
  const pathname = router.state.location.pathname;
  useHeadlineReveal(pathname);
  // Reset scroll on route change so we don't land mid-page (which on mobile
  // immediately triggers the smart-nav hide-on-scroll and reads as a glitch).
  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, [pathname]);
  return (
    <div key={pathname} className="page-enter">
      <Outlet />
    </div>
  );
}



function OnboardingGateMount() {
  const gate = useOnboardingGate();
  if (!gate.open) return null;
  return (
    <OnboardingStepper
      open={gate.open}
      initialPersona={gate.initialPersona as Persona | null}
      onComplete={gate.complete}
      onDismiss={gate.dismiss}
    />
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const hideGlobalQ = pathname.startsWith("/csfactors") || pathname.startsWith("/pulse-demo") || pathname === "/calculator";
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInvalidator />
      <PageTransition />
      {!hideGlobalQ ? (
        <QErrorBoundary label="Lumi">
          <QAgentButton />
        </QErrorBoundary>
      ) : null}
      
      <EndOfDaySentimentCheckIn />
      <ClientOnly fallback={null}>
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      </ClientOnly>
      <ClientOnly fallback={null}>
        <OnboardingGateMount />
      </ClientOnly>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
