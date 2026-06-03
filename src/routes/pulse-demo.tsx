import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { CSFactorsSidebar } from "@/components/csfactors/CSFactorsSidebar";
import { LumiDrawerProvider } from "@/components/csfactors/AskLumiDrawer";
import { QFilterProvider } from "@/components/csfactors/QFilterContext";
import { PulseDashboard } from "@/components/csfactors/pulse/PulseDashboard";
import { QErrorBoundary } from "@/components/site/QErrorBoundary";

export const Route = createFileRoute("/pulse-demo")({
  head: () => ({
    meta: [
      { title: "Pulse — Demo" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PulseDemoPage,
});

function PulseDemoPage() {
  // Force dark theme on this preview route regardless of system/user setting.
  useEffect(() => {
    const root = document.documentElement;
    const had = root.classList.contains("dark");
    root.classList.add("dark");
    return () => {
      if (!had) root.classList.remove("dark");
    };
  }, []);

  return (
    <QFilterProvider>
      <LumiDrawerProvider>
        <div className="dark min-h-screen bg-background text-foreground flex">
          <aside className="hidden md:block sticky top-0 h-screen">
            <CSFactorsSidebar
              hasAccounts
              onAddAccount={() => {}}
              onImportCsv={() => {}}
              onOpenWorkspace={() => {}}
            />
          </aside>
          <main className="flex-1 min-w-0">
            <div className="max-w-[1600px] mx-auto px-4 md:px-10 pt-8 md:pt-10 pb-32">
              <QErrorBoundary label="Pulse demo">
                <PulseDashboard
                  accounts={[]}
                  firstName="Anya"
                  onRowClick={() => {}}
                />
              </QErrorBoundary>
            </div>
          </main>
        </div>
      </LumiDrawerProvider>
    </QFilterProvider>
  );
}
