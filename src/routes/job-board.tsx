import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, MapPin, Briefcase, Building2, Star } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/job-board")({
  head: () => ({
    meta: [
      { title: "The Job Board, The CS Quarterly" },
      { name: "description", content: "Pre-qualified Customer Success roles, filtered by tech stack, region, and segment. Recruiters post from $299 a listing." },
      { property: "og:title", content: "The CS Quarterly Job Board" },
      { property: "og:description", content: "Pre-qualified CS roles for operators. Recruiter postings from $299." },
      { property: "og:url", content: "/job-board" },
    ],
    links: [{ rel: "canonical", href: "/job-board" }],
  }),
  component: JobBoardPage,
});

type Segment = "All" | "SMB" | "Mid-Market" | "Enterprise";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  segment: Exclude<Segment, "All">;
  stack: string[];
  comp: string;
  featured?: boolean;
  confidential?: boolean;
};

const JOBS: Job[] = [
  { id: "j1", title: "Head of Customer Success", company: "Confidential — Series C SaaS", location: "Remote · US", segment: "Enterprise", stack: ["Gainsight", "Snowflake"], comp: "$220–260k OTE", confidential: true, featured: true },
  { id: "j2", title: "Senior CSM, Strategic Accounts", company: "Notion", location: "New York, NY", segment: "Enterprise", stack: ["Catalyst", "Looker"], comp: "$165–195k OTE", featured: true },
  { id: "j3", title: "Director, Customer Success Ops", company: "Vercel", location: "Remote · Global", segment: "Mid-Market", stack: ["Gainsight", "Hex"], comp: "$190–220k base" },
  { id: "j4", title: "Customer Success Manager", company: "Linear", location: "Remote · NA", segment: "Mid-Market", stack: ["Vitally", "Metabase"], comp: "$130–155k OTE" },
  { id: "j5", title: "Onboarding Lead, SMB", company: "Ramp", location: "Hybrid · NYC", segment: "SMB", stack: ["Catalyst", "Mixpanel"], comp: "$120–140k base" },
  { id: "j6", title: "VP, Customer Success", company: "Retool", location: "San Francisco, CA", segment: "Enterprise", stack: ["Gainsight", "Snowflake"], comp: "$320–380k OTE" },
];

const SEGMENTS: Segment[] = ["All", "SMB", "Mid-Market", "Enterprise"];

type Plan = {
  slug: string;
  name: string;
  price: string;
  cadence: string;
  hook: string;
  bullets: string[];
  emphasis?: boolean;
  rust?: boolean;
};

const PLANS: Plan[] = [
  {
    slug: "standard",
    name: "Standard Post",
    price: "$299",
    cadence: "/ 30 days",
    hook: "Listed in the directory and the Tuesday newsletter.",
    bullets: ["Table listing on /job-board", "Inclusion in weekly newsletter text directory", "Standard placement"],
  },
  {
    slug: "featured",
    name: "Featured Post",
    price: "$499",
    cadence: "/ 30 days",
    hook: "Pinned to the top with an editorial call-out.",
    bullets: ["Permanent pin at top of board", "Rust-orange highlight border", "Inline editorial call-out in newsletter"],
    rust: true,
  },
  {
    slug: "monthly",
    name: "Employer Monthly",
    price: "$799",
    cadence: "/ month",
    hook: "Always-on hiring presence with rotating featured slots.",
    bullets: ["3 concurrent active listings", "Automated featured-status rotation", "Recruiter analytics panel"],
    emphasis: true,
  },
  {
    slug: "annual",
    name: "Employer Annual",
    price: "$6,000",
    cadence: "/ year",
    hook: "The whole calendar, plus structural placement in the Codex.",
    bullets: ["Unlimited concurrent listings", "Logo in the Codex footer", "1 dedicated newsletter spot / quarter"],
  },
  {
    slug: "executive",
    name: "Executive Search",
    price: "$1,500",
    cadence: "flat fee",
    hook: "Confidential. Bypasses the public board entirely.",
    bullets: [
      "Premium confidential listing container",
      "Bypasses public search index",
      "Direct email blast to Vanguard Pro members",
    ],
  },
];

function JobBoardPage() {
  const [segment, setSegment] = useState<Segment>("All");
  const [query, setQuery] = useState("");

  const filtered = JOBS.filter((j) => {
    if (segment !== "All" && j.segment !== segment) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.stack.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-12">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-4">The Job Board</div>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance mb-6 max-w-4xl">
            Pre-qualified roles, <span className="not-italic">read by operators.</span>
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl text-pretty">
            Every listing is filtered for tech stack, region, and segment. Recruiters reach an audience of senior CS operators inside the Tuesday dispatch.
          </p>
        </section>

        {/* Filter bar */}
        <section className="max-w-7xl mx-auto px-6 pb-8">
          <div className="border border-border bg-card p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                placeholder="Search title, company, or stack"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-background border border-border font-mono text-xs focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {SEGMENTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSegment(s)}
                  className={
                    "px-3 py-2 font-mono uppercase tracking-widest text-xs border transition-all " +
                    (segment === s
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:border-foreground")
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Listings */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="font-mono uppercase tracking-widest text-xs text-foreground/50 mb-4">
            {filtered.length} open role{filtered.length === 1 ? "" : "s"}
          </div>
          <ul className="space-y-3">
            {filtered.map((j) => (
              <li
                key={j.id}
                className={
                  "border p-5 md:p-6 bg-card/60 hover:bg-card transition-colors " +
                  (j.featured ? "border-l-4 border-l-secondary-accent border-y-border border-r-border" : "border-border")
                }
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {j.featured && (
                        <span className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-secondary-accent">
                          <Star size={10} /> Featured
                        </span>
                      )}
                      {j.confidential && (
                        <span className="font-mono text-xs uppercase tracking-widest text-accent">
                          · Confidential search
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-2xl leading-tight mb-1">{j.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-foreground/70 flex-wrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 size={12} /> {j.company}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={12} /> {j.location}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase size={12} /> {j.segment}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {j.stack.map((s) => (
                        <span key={s} className="font-mono uppercase tracking-widest text-xs px-2 py-1 border border-border text-foreground/70">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-left md:text-right shrink-0">
                    <div className="font-mono uppercase tracking-widest text-xs text-foreground/50 mb-1">Comp</div>
                    <div className="font-display text-lg mb-3">{j.comp}</div>
                    <button className="px-5 py-2.5 border border-foreground font-mono text-xs uppercase tracking-[0.25em] hover:bg-foreground hover:text-background transition-all">
                      View role
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="border border-border p-10 text-center text-sm text-foreground/60">
                No roles match those filters. Try widening the segment.
              </li>
            )}
          </ul>
        </section>

        {/* Recruiter checkout */}
        <section className="border-t border-border bg-muted/30">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="text-center mb-12">
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-4">For Recruiters</div>
              <h2 className="font-display text-4xl md:text-5xl leading-[0.95] tracking-tight text-balance mb-4">
                Reach the operators <span className="not-italic">other boards can't.</span>
              </h2>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                Five line items, no contracts. Every listing ships inside the Tuesday dispatch.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {PLANS.map((p) => (
                <div
                  key={p.slug}
                  className={
                    "p-7 bg-card flex flex-col border " +
                    (p.emphasis
                      ? "border-2 border-accent"
                      : p.rust
                      ? "border-2 border-secondary-accent"
                      : "border-border")
                  }
                >
                  <div className={
                    "font-mono uppercase tracking-widest text-xs mb-3 " +
                    (p.rust ? "text-secondary-accent" : "text-foreground/60")
                  }>
                    {p.name}
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-display text-4xl leading-none">{p.price}</span>
                    <span className="text-xs text-muted-foreground">{p.cadence}</span>
                  </div>
                  <p className="text-sm text-foreground/70 my-4 min-h-[2.5rem]">{p.hook}</p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {p.bullets.map((b) => (
                      <li key={b} className="text-sm text-foreground/80 flex gap-2">
                        <span className="text-accent mt-1">·</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={
                      "w-full py-3 font-mono text-xs uppercase tracking-[0.25em] transition-all " +
                      (p.emphasis
                        ? "bg-accent text-accent-foreground hover:opacity-90"
                        : "border border-foreground hover:bg-foreground hover:text-background")
                    }
                  >
                    Select plan
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-sm text-foreground/60 mb-4">
                Volume hiring or annual sponsorships?
              </p>
              <Link
                to="/pricing"
                className="inline-block px-6 py-3 border border-foreground font-mono text-xs uppercase tracking-[0.25em] hover:bg-foreground hover:text-background transition-all"
              >
                See team & enterprise tiers
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
