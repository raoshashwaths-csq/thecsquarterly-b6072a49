import { createFileRoute, Link } from "@tanstack/react-router";
import { LumiBadgeButton, type LumiBadgeTone } from "@/components/site/LumiBadgeButton";

export const Route = createFileRoute("/design-system/lumi-badge")({
  component: LumiBadgeDesignSystemPage,
  head: () => ({
    meta: [
      { title: "Lumi badge — Design system" },
      {
        name: "description",
        content:
          "Tokens, sizes, padding, and motion values for the canonical Lumi 3D badge button used across CS Quarterly and CS Factors.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type ToneSpec = {
  tone: LumiBadgeTone;
  use: string;
  mobile: string;
  tablet: string;
  desktop: string;
  padding: string;
};

const TONES: ToneSpec[] = [
  { tone: "hero", use: "Landing & section hero CTAs", mobile: "88 px", tablet: "112 px", desktop: "128 px", padding: "24–32 px around" },
  { tone: "cta", use: "Floating CTA, inline action buttons", mobile: "56 px", tablet: "64 px", desktop: "72 px", padding: "16–24 px around" },
  { tone: "card", use: "Feature cards, inline panels", mobile: "64 px", tablet: "80 px", desktop: "88 px", padding: "20 px around" },
  { tone: "header", use: "Nav chips, page-header avatars", mobile: "40 px", tablet: "44 px", desktop: "48 px", padding: "12 px around" },
];

function LumiBadgeDesignSystemPage() {
  return (
    <main className="min-h-screen bg-background text-foreground page-enter">
      <div className="max-w-5xl mx-auto px-6 py-16 lg:py-24">
        <p className="eyebrow text-accent mb-4">Design system · Lumi badge</p>
        <h1 className="font-display text-5xl lg:text-6xl leading-[1.05] mb-6">
          The 3D Lumi badge.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-12">
          The canonical Lumi trigger across CS Quarterly and CS Factors. One component,
          four tone presets, responsive sizing, theme-aware shadows. Update the source
          in <code className="font-mono text-sm">src/components/site/LumiBadgeButton.tsx</code>{" "}
          and the matching <code className="font-mono text-sm">.lumi-badge</code> rules
          in <code className="font-mono text-sm">src/styles.css</code>.
        </p>

        <section className="mb-16">
          <h2 className="font-display text-3xl mb-6">Tone presets</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {TONES.map((t) => (
              <div key={t.tone} className="border border-border rounded-md p-6 bg-card card-lift">
                <div className="flex items-center justify-between mb-4">
                  <p className="eyebrow text-secondary-accent">tone="{t.tone}"</p>
                </div>
                <div className="min-h-[160px] flex items-center justify-center mb-4">
                  <LumiBadgeButton tone={t.tone} />
                </div>
                <p className="text-sm text-muted-foreground mb-3">{t.use}</p>
                <dl className="text-xs font-mono grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  <dt className="text-muted-foreground">mobile</dt><dd>{t.mobile}</dd>
                  <dt className="text-muted-foreground">tablet</dt><dd>{t.tablet}</dd>
                  <dt className="text-muted-foreground">desktop</dt><dd>{t.desktop}</dd>
                  <dt className="text-muted-foreground">padding</dt><dd>{t.padding}</dd>
                </dl>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="font-display text-3xl mb-6">Motion & shadow</h2>
          <div className="border border-border rounded-md p-8 bg-card">
            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div><dt className="eyebrow text-secondary-accent mb-1">Rest transform</dt><dd className="font-mono text-xs">translate3d(0,0,0) rotateX(0) rotateY(0)</dd></div>
              <div><dt className="eyebrow text-secondary-accent mb-1">Hover transform</dt><dd className="font-mono text-xs">translateY(-4px) rotateX(8deg) rotateY(-6deg) scale(1.04)</dd></div>
              <div><dt className="eyebrow text-secondary-accent mb-1">Active transform</dt><dd className="font-mono text-xs">translateY(-1px) rotateX(2deg) rotateY(-1deg) scale(0.99)</dd></div>
              <div><dt className="eyebrow text-secondary-accent mb-1">Easing / duration</dt><dd className="font-mono text-xs">cubic-bezier(0.16, 1, 0.3, 1) · 380ms (active 120ms)</dd></div>
              <div><dt className="eyebrow text-secondary-accent mb-1">Light shadow (rest)</dt><dd className="font-mono text-xs">drop-shadow(0 10px 22px rgba(15,23,42,.28))</dd></div>
              <div><dt className="eyebrow text-secondary-accent mb-1">Dark shadow (rest)</dt><dd className="font-mono text-xs">drop-shadow(0 10px 26px rgba(232,199,124,.35))</dd></div>
              <div><dt className="eyebrow text-secondary-accent mb-1">Light halo</dt><dd className="font-mono text-xs">radial rgba(15,23,42,.12)</dd></div>
              <div><dt className="eyebrow text-secondary-accent mb-1">Dark halo</dt><dd className="font-mono text-xs">radial rgba(232,199,124,.28)</dd></div>
            </dl>
            <p className="mt-6 text-xs text-muted-foreground">
              Respects <code className="font-mono">prefers-reduced-motion</code> — all transforms collapse to none.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="font-display text-3xl mb-6">Usage</h2>
          <pre className="text-xs font-mono bg-card border border-border rounded-md p-6 overflow-x-auto"><code>{`import { LumiBadgeButton } from "@/components/site/LumiBadgeButton";

<LumiBadgeButton tone="hero" onClick={() => lumi.open()} />
<LumiBadgeButton tone="cta" />
<LumiBadgeButton tone="card" label="Ask Lumi about retention" />
<LumiBadgeButton tone="header" />

// One-off override (skips the responsive ramp):
<LumiBadgeButton size={120} />`}</code></pre>
        </section>

        <Link to="/" className="eyebrow text-accent">← Back home</Link>
      </div>
    </main>
  );
}
