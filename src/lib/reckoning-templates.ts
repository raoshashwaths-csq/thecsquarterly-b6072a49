// STATE A / STATE B templates for The Action Engine.
// Token substitution happens in the UI: keep tokens inside [Brackets].

export type TemplateState = "A" | "B";

export type SignalTypeKey =
  | "Stakeholder_Departure"
  | "Stakeholder_Promotion"
  | "Competitor_Funding"
  | "Competitor_Layoff"
  | "Renewal_Window"
  | "Expansion_Trigger"
  | "Default";

export type Template = {
  label: string;
  state: TemplateState;
  body: string;
};

// STATE A — Defensive / risk mitigation
// STATE B — Offensive / value reinforcement
export const TEMPLATES: Record<SignalTypeKey, { A: Template; B: Template }> = {
  Stakeholder_Departure: {
    A: {
      state: "A",
      label: "Defensive: bridge meeting with successor",
      body: `Subject: Continuity for [Account Name] — short sync this week\n\nHi [Successor First Name],\n\nI saw the news about [Departed Stakeholder]'s transition. Congratulations on stepping into the role.\n\nOver the last [Tenure Months] months, the workflows under that mandate have produced a Cumulative Value Realized of [Insert Calculated Value] for [Account Name] — I'd like to make sure none of that momentum is lost in the handover.\n\nI've prepared a one-page continuity brief: where the value is concentrated, which initiatives are mid-flight, and the two decisions that need an owner in the next 30 days.\n\nCould we hold 20 minutes this week? I'll come with the brief, not a pitch.\n\n— [Your Name]`,
    },
    B: {
      state: "B",
      label: "Offensive: secure exec air-cover",
      body: `Subject: Quick favor before [Departed Stakeholder] leaves\n\nHi [Executive Sponsor],\n\nBefore [Departed Stakeholder] transitions out, I'd like to lock in a short written endorsement of the [Account Name] program — specifically the [Insert Calculated Value] in cumulative value realized to date.\n\nThis isn't a testimonial ask. It's an internal artifact you can use with the executive suite to back up your team's operational wins, and it gives the incoming stakeholder a clean baseline.\n\nI'll draft it. You edit. 10 minutes of your time.`,
    },
  },
  Stakeholder_Promotion: {
    A: {
      state: "A",
      label: "Defensive: protect existing scope",
      body: `Subject: Congrats on the new role — quick continuity note\n\nHi [Stakeholder First Name],\n\nCongratulations on the move to [New Title]. I want to make sure the work we've built together at [Account Name] — currently tracking at [Insert Calculated Value] in cumulative value — has a clear owner as you transition.\n\nWho should I be cycling with on the operational cadence going forward? Happy to do a 15-minute handover with them, with you in the loop.`,
    },
    B: {
      state: "B",
      label: "Offensive: expand into new mandate",
      body: `Subject: Your new mandate — and where we can help\n\nHi [Stakeholder First Name],\n\nCongratulations on the promotion to [New Title].\n\nThe [Account Name] program we've built has delivered [Insert Calculated Value] in cumulative value. The patterns we used to get there — [Pattern 1], [Pattern 2] — translate directly to the new surface area you now own.\n\nI've put together a one-page POV on the first 90 days. Worth 20 minutes next week?`,
    },
  },
  Competitor_Funding: {
    A: {
      state: "A",
      label: "Defensive: pre-empt the inbound pitch",
      body: `Subject: Before [Competitor] calls you this week\n\nHi [Champion First Name],\n\n[Competitor] just announced [Funding Round]. They'll be in your inbox within the week.\n\nFor context — [Account Name]'s program with us is currently at [Insert Calculated Value] in cumulative value realized, and the next 90 days have three compounding milestones that switching would reset.\n\nI've put together a one-page "what you'd be giving up" brief. Want me to send it over before the inbound starts?`,
    },
    B: {
      state: "B",
      label: "Offensive: reinforce moat with new commitment",
      body: `Subject: A small expansion that closes the door\n\nHi [Champion First Name],\n\nThe market is going to get noisier in your category over the next quarter.\n\nThe simplest way to make [Account Name]'s position uncontested is to extend the [Module / Workflow] scope by [Increment]. It compounds on the [Insert Calculated Value] you've already realized, and structurally removes the surface area a challenger would target.\n\nWant to see the 90-day projection on a call?`,
    },
  },
  Competitor_Layoff: {
    A: {
      state: "A",
      label: "Defensive: stability message",
      body: `Subject: Quick note on the market\n\nHi [Champion First Name],\n\nYou'll have seen the [Competitor] news. No action needed from you — just wanted to confirm our roadmap commitments for [Account Name] are unchanged, and that the [Insert Calculated Value] of cumulative value realized continues to compound on schedule.`,
    },
    B: {
      state: "B",
      label: "Offensive: recruit displaced advocates",
      body: `Subject: Two things worth doing this week\n\nHi [Champion First Name],\n\nWith [Competitor] reorganizing, there are practitioners hitting the market who already understand your category. If you're open to it, I'd like to send you two names whose work I know — could be useful for [Adjacent Team / Initiative].\n\nSeparately: the [Account Name] program is at [Insert Calculated Value] cumulative. Worth a 15-minute alignment on Q+1 scope while attention is high?`,
    },
  },
  Renewal_Window: {
    A: {
      state: "A",
      label: "Defensive: secure renewal early",
      body: `Subject: Renewal — let's get ahead of it\n\nHi [Economic Buyer First Name],\n\nThe [Account Name] renewal lands in [Days to Renewal] days. To date, the program has produced [Insert Calculated Value] in cumulative value realized — I'd like that to be the anchor of the conversation, not the line item.\n\nI've drafted a one-page renewal narrative. Could we walk through it in a 25-minute sync next week?`,
    },
    B: {
      state: "B",
      label: "Offensive: upsell at renewal",
      body: `Subject: A bigger version of what's working\n\nHi [Economic Buyer First Name],\n\nAt renewal, the simplest move is to copy-paste the contract. The better move is to scale what's already produced [Insert Calculated Value] in value into [Adjacent Workflow], where the same pattern would unlock an additional [Projected Value] over the next 12 months.\n\nI've modeled it. 30 minutes next week?`,
    },
  },
  Expansion_Trigger: {
    A: {
      state: "A",
      label: "Defensive: confirm readiness",
      body: `Subject: Before we expand — a readiness check\n\nHi [Champion First Name],\n\nGreat to see [Expansion Trigger]. Before we widen scope, I want to make sure the existing [Insert Calculated Value] of realized value isn't put at risk by parallel rollout.\n\nQuick 20-minute call to map sequencing?`,
    },
    B: {
      state: "B",
      label: "Offensive: executive briefing",
      body: `Subject: An executive line-of-sight for [Account Name]\n\nHi [Executive Sponsor],\n\nThe workflows under your purview have generated a total Cumulative ROI of [Insert Calculated Value] for [Account Name].\n\nI've generated a secure, passwordless executive dashboard link tailored for your new leadership line-of-sight: [Magic Link URL]\n\nLet me know a time next week that works for a brief, 15-minute strategic sync.`,
    },
  },
  Default: {
    A: {
      state: "A",
      label: "Defensive: open the conversation",
      body: `Subject: A quick note on [Account Name]\n\nHi [Stakeholder First Name],\n\nI wanted to flag [Signal Description] so it doesn't catch the team off-guard. Current cumulative value realized on the program is [Insert Calculated Value].\n\nCould we hold 15 minutes this week to align on the right next step?`,
    },
    B: {
      state: "B",
      label: "Offensive: reinforce momentum",
      body: `Subject: Building on what's working\n\nHi [Stakeholder First Name],\n\n[Signal Description] is exactly the kind of moment to compound on the [Insert Calculated Value] of cumulative value we've already produced. I have a short POV on how to do it — 20 minutes next week?`,
    },
  },
};

export function templatesFor(signalType: string | null | undefined) {
  const key = (signalType ?? "Default") as SignalTypeKey;
  return TEMPLATES[key] ?? TEMPLATES.Default;
}

export type TokenContext = {
  accountName?: string | null;
  stakeholderFirstName?: string | null;
  calculatedValue?: string | null;
  signalDescription?: string | null;
  magicLinkUrl?: string | null;
};

export function substitute(body: string, ctx: TokenContext) {
  return body
    .replaceAll("[Account Name]", ctx.accountName || "[Account Name]")
    .replaceAll("[Stakeholder First Name]", ctx.stakeholderFirstName || "[Stakeholder First Name]")
    .replaceAll("[Successor First Name]", ctx.stakeholderFirstName || "[Successor First Name]")
    .replaceAll("[Champion First Name]", ctx.stakeholderFirstName || "[Champion First Name]")
    .replaceAll("[Economic Buyer First Name]", ctx.stakeholderFirstName || "[Economic Buyer First Name]")
    .replaceAll("[Executive Sponsor]", ctx.stakeholderFirstName || "[Executive Sponsor]")
    .replaceAll("[Insert Calculated Value]", ctx.calculatedValue || "[Insert Calculated Value]")
    .replaceAll("[Signal Description]", ctx.signalDescription || "[Signal Description]")
    .replaceAll("[Magic Link URL]", ctx.magicLinkUrl || "[Magic Link URL]");
}
