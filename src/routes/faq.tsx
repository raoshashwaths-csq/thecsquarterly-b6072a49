import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GLOSSARY } from "@/lib/glossary";

type QA = { q: string; a: string };
type Section = { title: string; eyebrow: string; items: QA[] };

const SECTIONS: Section[] = [
  {
    eyebrow: "Start here",
    title: "The Basics",
    items: [
      { q: "What is The CS Quarterly?", a: "The CS Quarterly is a weekly dispatch and operating platform for Customer Success leaders. We publish one essay every Tuesday, maintain a Codex of playbooks, and ship operator-grade tools (diagnostics, dashboards, decision canvases) for VPs, Directors, and Senior CSMs at SaaS companies between $20M and $1B ARR." },
      { q: "How often do you publish?", a: "One dispatch every Tuesday. No daily noise, no clickbait, no SEO filler. Each dispatch follows our 3-2-1 model: three facts, two insights, one actionable." },
      { q: "Who is this for?", a: "Operators who own retention and expansion outcomes — typically VPs of CS, Directors, Senior CSMs, and Heads of Post-Sales at B2B SaaS companies. If you're benchmarking against 120% NRR, you're our reader." },
      { q: "Is it free?", a: "The weekly briefing, public archive, Retention Ledger ticker, and the free top-line AI Readiness score are all free. Deeper tools (full Codex, Custom Blueprints, CSFactors, Lumi canvas runs) sit behind paid tiers." },
      { q: "How do I subscribe?", a: "Use Subscribe in the footer to join the free briefing, or visit Pricing to compare paid tiers (Vanguard, Practitioner, Operator, Team, Scale, Enterprise)." },
    ],
  },
  {
    eyebrow: "The product",
    title: "Lumi — your CS agent",
    items: [
      { q: "Who or what is Lumi?", a: "Lumi is the single AI agent that powers the entire product — both on the marketing site (essays, Codex) and inside CSFactors (canvas, dashboards). Lumi answers framework questions, runs structured decision canvases, summarizes your workspace, and surfaces signals across your portfolio." },
      { q: "How does the Decision Canvas work?", a: "Ask Lumi a renewal, expansion, or escalation question. Lumi runs it through a structured framework tree, returns a sourced response with zones (Themes, Action Items, Watchlist), and saves the run to your workspace. Each completed run counts toward your monthly Lumi usage." },
      { q: "What counts as a Lumi run?", a: "Any completed canvas execution or workspace summary export counts as one run. Browsing a saved run, re-reading it, or sharing it does not consume usage." },
      { q: "How many Lumi runs do I get?", a: "Practitioner includes 50 runs/month, Operator 100, Team 500, Scale 2000, Enterprise 5000. Runs reset on your billing date and do not roll over." },
      { q: "Can I share a Lumi run with someone outside the site?", a: "Yes. Every run has a public share link. Anonymous viewers can read up to the 50% scroll point. To unlock the rest, they share their email and instantly get free Reader access — they can keep reading the run and explore the public side of the site." },
      { q: "Can I speak to Lumi instead of typing?", a: "Yes. Lumi supports voice input on both the global agent button and the CSFactors drawer, powered by ElevenLabs speech-to-text. Tap the mic, dictate, tap to stop." },
    ],
  },
  {
    eyebrow: "The product",
    title: "Workspace & Exports",
    items: [
      { q: "What is my Workspace?", a: "Your Workspace is the private home for everything you've saved: pinned essays, highlights, Lumi runs, annotations, and ad-hoc notes. It's the read-and-act layer that sits between the dispatch and your day job." },
      { q: "How do PDF exports work?", a: "Open Export PDF from the account menu or the Workspace header. Pick the articles and Lumi runs you want to include, optionally add a Lumi-Summarized workspace digest, and download. Every PDF is rendered in our dark-mode brand template (midnight-blue ground, gold accents, cream text) and personalized with your first name." },
      { q: "What is a Lumi-Summarized export?", a: "A Lumi-generated digest of your recent workspace activity, organized into Themes, Action Items, and Watchlist. It counts as one Lumi run against your monthly usage." },
      { q: "Where are my highlights stored?", a: "In your Workspace, scoped to your account. Highlights persist across devices once you're signed in." },
    ],
  },
  {
    eyebrow: "The product",
    title: "CSFactors — the command centre",
    items: [
      { q: "What is CSFactors?", a: "CSFactors is the operator dashboard inside the platform: portfolio analytics, account health, renewals pipeline, expansion opportunities, stakeholder maps, and CTAs (Calls to Action). It's the daily console for a CS leader running a book of business." },
      { q: "Which tier unlocks CSFactors?", a: "Practitioner and above. Operator adds the executive analytics layer (NRR waterfall, retention funnel, stakeholder radar, team leaderboard)." },
      { q: "What's a CTA in CSFactors?", a: "A Call to Action — a triggered task on a specific account (e.g. \"low usage 14 days\", \"renewal in 60d, no champion mapped\"). CTAs are how the system tells you what to act on today." },
      { q: "What's a Stakeholder Map?", a: "A visual mapping of every contact at an account, scored by influence, sentiment, and engagement. Use it to spot champion dependency risk before it bites you at renewal." },
    ],
  },
  {
    eyebrow: "The product",
    title: "Diagnostics, Benchmarks & Calculators",
    items: [
      { q: "How does the AI Readiness Diagnostic work?", a: "Five minutes, 32 metrics across 8 dimensions. You get a free top-line band (Reactive / Operational / Predictive) instantly. Paid tiers unlock the 12-page Custom Blueprint with prioritized fixes." },
      { q: "What's the Champion Dependency diagnostic?", a: "A focused diagnostic that flags accounts where retention is dangerously tied to a single contact. Outputs risk score and a mitigation playbook." },
      { q: "What's the ROI Calculator?", a: "A model that translates CS investment (headcount, tooling, programs) into projected NRR uplift, payback period, and gross margin impact. Useful for budget conversations with your CFO." },
      { q: "What are the NRR Benchmarks?", a: "Anonymized quarterly data from operators in our community, segmented by ARR band, segment (SMB / Mid-Market / Enterprise), and motion (PLG / Sales-led / Hybrid)." },
    ],
  },
  {
    eyebrow: "The product",
    title: "Editorial",
    items: [
      { q: "What are the four editorial sections?", a: "The CS Vanguard (news & field reports), The Retention Protocol (playbooks & frameworks), The Outcome Forum (validated case studies), and The CS Codex (reference library)." },
      { q: "What's the Two-Voice System?", a: "Every premium essay is written in two parallel registers: Analytical (structured, McKinsey-tone) and Witty (narrative, Wodehouse-tone). Toggle inline. Same argument, same facts, two reading experiences." },
      { q: "What's the 3-2-1 model?", a: "Our editorial spine: every new article delivers three facts, two insights, and one actionable. No filler, no recap, no \"5 things\" listicles." },
      { q: "Can I submit a guest piece?", a: "We don't accept unsolicited submissions but we do commission operator essays for The Outcome Forum. Pitch via the contact link in the footer." },
    ],
  },
  {
    eyebrow: "Account",
    title: "Account, Billing & Tiers",
    items: [
      { q: "What tiers are available?", a: "Free Briefing, Vanguard, Practitioner ($39/mo), Operator ($89/mo), Team, Scale, and Enterprise. Pricing and entitlements live on /pricing." },
      { q: "How do I sign in?", a: "Email/password or Google. Use the sign-in link in the header." },
      { q: "How do I cancel or change plan?", a: "Account → Billing. Changes take effect at the end of your current billing cycle. No retention dark patterns." },
      { q: "Do you offer team or enterprise pricing?", a: "Yes — Team, Scale, and Enterprise tiers include seat pools, shared workspaces, and admin controls. Contact us via the footer for Enterprise quotes." },
      { q: "Do you offer refunds?", a: "Within 14 days of your first paid charge, full refund, no questions. After that, billing is non-refundable but you can cancel anytime to stop future charges." },
    ],
  },
  {
    eyebrow: "Account",
    title: "Privacy, Data & Security",
    items: [
      { q: "Where is my data stored?", a: "On managed infrastructure with row-level security. Your Workspace data, Lumi runs, and highlights are private to your account." },
      { q: "Do you train AI models on my data?", a: "No. Your Workspace content, Lumi prompts, and account data are never used to train third-party models." },
      { q: "What happens when I delete my account?", a: "Your Workspace, highlights, runs, and personal data are permanently deleted within 30 days. Anonymous aggregate benchmarks remain." },
      { q: "How do I unsubscribe from emails?", a: "Every email has a one-click unsubscribe footer link, or use /unsubscribe directly." },
    ],
  },
  {
    eyebrow: "Account",
    title: "Sharing & Reader Access",
    items: [
      { q: "What is Reader access?", a: "Reader is the free tier that anonymous visitors unlock by sharing their email when they hit the paywall on a shared Lumi run. Reader includes the weekly briefing, the public archive, and continued access to any shared run." },
      { q: "Why am I being asked for an email on a shared run?", a: "Shared runs are gated past the 50% scroll mark. Sharing your email unlocks the full run instantly and grants Reader access — no credit card, no spam." },
      { q: "Does the gated viewer get redirected to the original run?", a: "Yes. After unlocking, the viewer stays on the original run page and a welcome popup confirms what they've unlocked before fading away." },
    ],
  },
  {
    eyebrow: "Reference",
    title: "Glossary",
    items: Object.values(GLOSSARY).map((g) => ({
      q: `What does ${g.term} mean?`,
      a: g.definition,
    })),
  },
  {
    eyebrow: "Help",
    title: "Troubleshooting & Contact",
    items: [
      { q: "I'm signed in but a page is blank — what's wrong?", a: "Most blank pages on authenticated routes mean your session expired. Sign out and back in. If it persists, clear site data for thecsquarterly.com and try again." },
      { q: "A Lumi run failed mid-way — am I charged?", a: "No. Failed runs do not count against your monthly Lumi usage. You can retry from the run page." },
      { q: "I can't see the Pricing or Subscribe link in the header.", a: "By design. Pricing and Subscribe live in the footer and inline CTAs only — the header is reserved for sections and your account." },
      { q: "How do I contact support?", a: "Use the Contact link in the footer. We reply within one business day, usually faster." },
    ],
  },
];

const ALL_QAS = SECTIONS.flatMap((s) => s.items);

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — The CS Quarterly" },
      {
        name: "description",
        content:
          "Answers to common questions about The CS Quarterly: Lumi, CSFactors, Workspace, exports, diagnostics, billing, sharing, and the CS glossary.",
      },
      { property: "og:title", content: "FAQ — The CS Quarterly" },
      {
        property: "og:description",
        content: "Everything you need to know about The CS Quarterly, in one place.",
      },
      { property: "og:url", content: "/faq" },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: ALL_QAS.map((qa) => ({
            "@type": "Question",
            name: qa.q,
            acceptedAnswer: { "@type": "Answer", text: qa.a },
          })),
        }),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <header className="max-w-3xl mx-auto px-6 pt-24 pb-12 animate-fade-up">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-6">
          Frequently Asked
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance mb-8">
          Everything, in one place.
        </h1>
        <p className="text-lg leading-relaxed text-foreground/75">
          What the product does, how Lumi works, how billing and sharing behave,
          and a glossary of the terms we lean on every week.
        </p>
      </header>

      <main className="max-w-3xl mx-auto w-full px-6 pb-24 space-y-16">
        {SECTIONS.map((section) => (
          <section key={section.title} aria-labelledby={`faq-${section.title}`}>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-3">
              {section.eyebrow}
            </div>
            <h2
              id={`faq-${section.title}`}
              className="font-display text-3xl md:text-4xl tracking-tight mb-6"
            >
              {section.title}
            </h2>
            <Accordion type="single" collapsible className="border-t border-border">
              {section.items.map((qa, i) => (
                <AccordionItem key={i} value={`${section.title}-${i}`} className="border-b border-border">
                  <AccordionTrigger className="text-left font-body text-base md:text-lg py-5 hover:no-underline">
                    {qa.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/80 leading-relaxed text-base pb-5">
                    {qa.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}

        <div className="border-t border-border pt-10 text-sm text-foreground/60 font-body">
          Didn't find your question?{" "}
          <a href="/subscribe" className="text-accent hover:underline">
            Get in touch
          </a>
          .
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
