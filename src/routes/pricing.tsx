import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/Reveal";
import { QMark } from "@/components/site/QMark";
import { TIERS, tierMailto, type Tier } from "@/lib/tiers";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — The CS Quarterly" },
      {
        name: "description",
        content:
          "An operating platform for customer success, with the industry's intelligence layer built in. Seven tiers from a free Reader account to a Strategic Partner contract.",
      },
      { property: "og:title", content: "The CS Quarterly — Pricing" },
      {
        property: "og:description",
        content:
          "Seven tiers from Reader (free) to Strategic Partner. The personal CS dashboard unlocks at Operator; team dashboards begin at Team.",
      },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
  component: PricingPage,
});

const INDIVIDUAL = TIERS.filter((t) => t.band === "individual");
const TEAM = TIERS.filter((t) => t.band === "team");
const PARTNER = TIERS.filter((t) => t.band === "partner");

function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-12 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-4">
            The Platform
          </div>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance mb-6">
            An operating system for the <span className="not-italic">customer success</span> profession.
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto text-pretty">
            Not a newsletter with tools attached. A CS platform with the industry&apos;s intelligence layer, benchmark dataset, and <QMark /> advisor built into the foundation.
          </p>
        </section>

        {/* Three buyer narratives */}
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                eyebrow: "For the practitioner",
                title: "Designed for you, not your portfolio.",
                body: "Your benchmarks. Your career. Your daily crises. The only CS platform built around the operator, not the company seat.",
              },
              {
                eyebrow: "For CS teams",
                title: "The platform without the implementation.",
                body: "No multi-week rollout, no per-seat lock-in, no separate research budget. Dashboard, benchmarks, and Lumi in one place from day one.",
              },
              {
                eyebrow: "For enterprise",
                title: "One invoice, one login.",
                body: "Consolidates the legacy CS suite, the research subscription, and the L&D spend into a single platform with the editorial team on call.",
              },
            ].map((c) => (
              <div key={c.eyebrow} className="p-6 border border-border bg-card/60 card-lift">
                <div className="font-mono text-xs uppercase tracking-[0.25em] text-secondary-accent mb-3">
                  {c.eyebrow}
                </div>
                <h3 className="font-display text-2xl leading-tight mb-3">{c.title}</h3>
                <p className="text-sm text-foreground/70">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Individual tier row */}
        <section className="max-w-7xl mx-auto px-6 pb-12">
          <BandHeader eyebrow="For individuals" title="One operator, one seat." />
          <div className="grid md:grid-cols-3 gap-6">
            {INDIVIDUAL.map((t, i) => (
              <TierCard key={t.designation} tier={t} index={i} />
            ))}
          </div>
        </section>

        {/* Team tier row */}
        <section className="max-w-7xl mx-auto px-6 pb-12">
          <BandHeader eyebrow="For teams" title="Shared dashboard. Pooled intelligence." />
          <div className="grid md:grid-cols-3 gap-6">
            {TEAM.map((t, i) => (
              <TierCard key={t.designation} tier={t} index={i} />
            ))}
          </div>
        </section>

        {/* Strategic partner */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <BandHeader eyebrow="For partners" title="Editorial partnership, not a subscription." />
          {PARTNER.map((t) => (
            <PartnerCard key={t.designation} tier={t} />
          ))}
        </section>

        {/* Comparison strip */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <BandHeader eyebrow="Capability matrix" title="What unlocks where." />
          <ComparisonTable />
        </section>

        {/* Value Onion */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <BandHeader eyebrow="Let's peel the Value Onion" title="Five layers, not one." />
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { k: "Data", v: "The Retention Ledger is proprietary and compounds with every operator who contributes." },
              { k: "Intelligence", v: "Editorial library, Codex playbooks, and decision trees built on four decades of CS practice." },
              { k: "Platform", v: "Once health scores are calibrated and Lumi is in daily use, switching cost is real." },
              { k: "Community", v: "Network effects compound as the profession grows. Senior operators read here." },
              { k: "Brand", v: "The only entity that is simultaneously the platform, the publication, and the source cited to boards." },
            ].map((m) => (
              <div key={m.k} className="p-5 border border-border bg-card/60">
                <div className="font-mono text-xs uppercase tracking-[0.25em] text-accent mb-2">
                  {m.k}
                </div>
                <p className="text-sm text-foreground/75">{m.v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-6 pb-28">
          <BandHeader eyebrow="Questions" title="Before you decide." />
          <div className="divide-y divide-border border-t border-b border-border">
            {[
              {
                q: "Monthly or annual?",
                a: "All paid tiers bill monthly by default. Annual plans on Practitioner, Operator, Team, and Scale carry a two-month discount. Enterprise and Strategic Partner are annual contracts.",
              },
              {
                q: "Can I move between tiers?",
                a: "Upgrade any time and the change applies immediately. Downgrades take effect at the next billing cycle so you keep the seat or dashboard you paid for.",
              },
              {
                q: "What happens if my team outgrows the seat cap?",
                a: "Team caps at 8 seats, Scale at 20, Enterprise at 50. Crossing a cap moves you to the next tier on renewal; we do not bill mid-cycle overage fees.",
              },
              {
                q: "How long does the dashboard take to set up?",
                a: "Personal dashboards on Operator are usable on first login. Team and Scale dashboards take a single working session to map accounts and calibrate health scores — no implementation project required.",
              },
            ].map((f) => (
              <div key={f.q} className="py-6">
                <div className="font-display text-xl mb-2">{f.q}</div>
                <p className="text-sm text-foreground/70">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function BandHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6 border-b border-border pb-4">
      <div>
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-2">
          {eyebrow}
        </div>
        <h2 className="font-display text-3xl md:text-4xl leading-tight tracking-tight">
          {title}
        </h2>
      </div>
    </div>
  );
}

function TierCard({ tier, index }: { tier: Tier; index: number }) {
  const emphasized = !!tier.highlight;
  return (
    <Reveal
      index={index}
      className={
        "flex flex-col p-7 border card-lift relative " +
        (emphasized
          ? "border-2 border-accent bg-card"
          : "border-border bg-card/60")
      }
    >
      {emphasized && tier.highlightLabel && (
        <div className="absolute -top-3 left-7 bg-accent text-accent-foreground px-3 py-1 font-mono text-xs uppercase tracking-widest">
          {tier.highlightLabel}
        </div>
      )}
      <div className="font-mono uppercase tracking-widest text-xs text-secondary-accent mb-3">
        {tier.label}
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-display text-5xl leading-none">{tier.priceMonthly}</span>
        <span className="text-sm text-muted-foreground">
          {tier.priceMonthlyValue === 0 ? "" : "/ month"}
        </span>
      </div>
      {tier.priceAnnual && (
        <div className="text-xs text-muted-foreground mb-3">{tier.priceAnnual}</div>
      )}
      <p className="text-sm text-foreground/70 mt-3 mb-6 min-h-[3rem]">{tier.tagline}</p>

      <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-border">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-foreground/50 mb-1">
            Seats
          </div>
          <div className="text-sm font-medium">{tier.seatCap}</div>
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-foreground/50 mb-1">
            <QMark /> sessions
          </div>
          <div className="text-sm font-medium">{tier.qCap}</div>
        </div>
      </div>

      <ul className="space-y-2.5 mb-8 flex-1">
        {tier.features.map((f) => {
          const isJob = f.startsWith("__jobboard__:");
          const text = isJob ? f.slice("__jobboard__:".length) : f;
          return (
            <li key={f} className="flex gap-2.5 text-sm">
              <Check size={14} className="mt-1 shrink-0 text-accent" />
              {isJob ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-foreground/50 blur-[5px] select-none">{text}</span>
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-secondary-accent whitespace-nowrap">
                    Stay tuned ✨
                  </span>
                </span>
              ) : (
                <span className="text-foreground/85">{text}</span>
              )}
            </li>
          );
        })}
      </ul>

      <TierCta tier={tier} emphasized={emphasized} />
    </Reveal>
  );
}

function TierCta({ tier, emphasized }: { tier: Tier; emphasized: boolean }) {
  const cls =
    "block w-full py-3.5 text-center font-mono text-xs uppercase tracking-[0.25em] transition-all " +
    (emphasized
      ? "bg-accent text-accent-foreground hover:opacity-90"
      : "border border-foreground hover:bg-foreground hover:text-background");

  if (tier.ctaKind === "free") {
    return (
      <Link to="/login" className={cls}>
        {tier.cta}
      </Link>
    );
  }
  if (tier.ctaKind === "contact") {
    return (
      <a href={tierMailto(tier.label)} className={cls}>
        {tier.cta}
      </a>
    );
  }
  return (
    <Link to="/subscribe" search={{ tier: tier.designation }} className={cls}>
      {tier.cta}
    </Link>
  );
}

function PartnerCard({ tier }: { tier: Tier }) {
  return (
    <div className="border-2 border-accent bg-card p-8 md:p-10 flex flex-col md:flex-row gap-8 md:items-center">
      <div className="flex-1">
        <div className="font-mono uppercase tracking-widest text-xs text-secondary-accent mb-3">
          {tier.label}
        </div>
        <h3 className="font-display text-3xl md:text-4xl leading-tight mb-3">
          {tier.tagline}
        </h3>
        <p className="text-sm text-foreground/70 max-w-2xl">
          For CS platforms, large consulting practices, and SaaS companies that want institutional affiliation with the intellectual home of the senior CS profession. This is a content and data partnership, not a subscription.
        </p>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 mt-6">
          {tier.features.map((f) => (
            <li key={f} className="flex gap-2.5 text-sm">
              <Check size={14} className="mt-1 shrink-0 text-accent" />
              <span className="text-foreground/85">{f}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="md:w-72 shrink-0 border-l border-border md:pl-8 md:text-left">
        <div className="font-display text-5xl leading-none">{tier.priceMonthly}</div>
        <div className="text-sm text-muted-foreground mt-1 mb-1">/ month</div>
        {tier.priceAnnual && (
          <div className="text-xs text-muted-foreground mb-6">{tier.priceAnnual}</div>
        )}
        <a
          href={tierMailto(tier.label)}
          className="block w-full py-3.5 text-center font-mono text-xs uppercase tracking-[0.25em] bg-accent text-accent-foreground hover:opacity-90 transition-all"
        >
          {tier.cta}
        </a>
      </div>
    </div>
  );
}

type Row = { label: string; values: (boolean | string)[] };
type Group = { group: string; rows: Row[] };

const COMPARE_GROUPS: Group[] = [
  {
    group: "Editorial",
    rows: [
      { label: "Weekly Tuesday dispatch", values: [true, true, true, true, true, true, true] },
      { label: "Full premium archive", values: [false, true, true, true, true, true, true] },
      { label: "Two-voice toggle on essays", values: [false, true, true, true, true, true, true] },
    ],
  },
  {
    group: "Codex & Diagnostic",
    rows: [
      { label: "AI Diagnostic — score", values: [true, true, true, true, true, true, true] },
      { label: "AI Diagnostic — full blueprint", values: [false, true, true, true, true, true, true] },
      { label: "All Codex playbooks", values: [false, true, true, true, true, true, true] },
    ],
  },
  {
    group: "Lumi",
    rows: [
      { label: "Monthly Lumi sessions", values: ["0", "30", "100", "400", "1,000", "Unlimited", "Unlimited"] },
      { label: "Seat scope", values: ["—", "Personal", "Personal", "Pooled", "Pooled", "Pooled", "Pooled"] },
    ],
  },
  {
    group: "CS dashboard",
    rows: [
      { label: "Personal dashboard", values: [false, false, true, true, true, true, true] },
      { label: "Shared team dashboard", values: [false, false, false, true, true, true, true] },
      { label: "Advanced cohort + churn heatmap", values: [false, false, false, false, true, true, true] },
    ],
  },
  {
    group: "Benchmarks",
    rows: [
      { label: "Benchmark comparison tool", values: [false, false, true, true, true, true, true] },
      { label: "Quarterly branded PDF", values: [false, false, false, false, true, true, true] },
      { label: "White-label benchmark report", values: [false, false, false, false, false, true, true] },
      { label: "Retention Ledger API", values: [false, false, false, false, false, true, true] },
    ],
  },
  {
    group: "Community & learning",
    rows: [
      { label: "Access to the Whiteboard to hold your article notes and pasted URLs", values: [false, true, true, true, true, true, true] },
      { label: "VP+ community space", values: [false, false, true, true, true, true, true] },
      { label: "Assignable learning paths", values: [false, false, false, true, true, true, true] },
      { label: "Certified learning paths", values: [false, false, false, false, false, true, true] },
    ],
  },
  {
    group: "Job board & admin",
    rows: [
      { label: "Job posting credits / quarter", values: ["—", "—", "—", "2", "4", "Custom", "Custom"] },
      { label: "Admin analytics", values: [false, false, false, true, true, true, true] },
      { label: "SSO / SAML", values: [false, false, false, "Prep", true, true, true] },
    ],
  },
];

function ComparisonTable() {
  const headers = TIERS.map((t) => t.label);
  return (
    <div className="overflow-x-auto border border-border bg-card/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-4 font-mono uppercase tracking-widest text-xs text-foreground/60 w-[28%]">
              Capability
            </th>
            {headers.map((h) => (
              <th
                key={h}
                className="p-4 text-center font-mono uppercase tracking-widest text-xs text-foreground/70 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_GROUPS.map((g) => (
            <RowGroup key={g.group} group={g} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RowGroup({ group }: { group: Group }) {
  const isJobGroup = group.group === "Job board & admin";
  return (
    <>
      <tr className="bg-muted/30 border-b border-border">
        <td
          colSpan={TIERS.length + 1}
          className="px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] text-secondary-accent"
        >
          {isJobGroup ? (
            <span className="inline-flex items-center gap-3">
              <span className="blur-[5px] select-none">{group.group}</span>
              <span className="text-secondary-accent">Stay tuned ✨</span>
            </span>
          ) : (
            group.group
          )}
        </td>
      </tr>
      {group.rows.map((r) => {
        const blurRow = r.label.toLowerCase().includes("job posting");
        return (
          <tr key={r.label} className="border-b border-border/60 last:border-b-0">
            <td className={"px-4 py-3 text-foreground/80 " + (blurRow ? "blur-[5px] select-none" : "")}>
              {r.label}
            </td>
            {r.values.map((v, i) => (
              <td key={i} className={"px-4 py-3 text-center " + (blurRow ? "blur-[5px] select-none" : "")}>
                {typeof v === "boolean" ? (
                  v ? (
                    <Check size={14} className="inline text-accent" />
                  ) : (
                    <Minus size={14} className="inline text-foreground/25" />
                  )
                ) : (
                  <span className="text-xs font-mono text-foreground/80">{v}</span>
                )}
              </td>
            ))}
          </tr>
        );
      })}
    </>
  );
}
