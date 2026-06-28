/**
 * Static map: article slug → linked Codex playbook + CTA label.
 * Drives the "Open the Codex Playbook" CTA rendered at the foot of each
 * matching article in /insights/$slug.
 */

export type ArticlePlaybookLink = {
  /** Codex playbook slug (lives at /codex/<slug>). */
  playbookSlug: string;
  /** CTA button label rendered at the foot of the article. */
  ctaLabel: string;
  /** One-line description placed above the CTA. */
  description: string;
};

export const ARTICLE_PLAYBOOK_MAP: Record<string, ArticlePlaybookLink> = {
  "frontline-sovereignty-handling-high-volatility-account-friction": {
    playbookSlug: "frontline-sovereignty-triage-playbook",
    ctaLabel: "Run the Account Volatility Triage Protocol",
    description:
      "The decision tree from this dispatch is built as a live operational tool in the Codex.",
  },
  "executive-fortitude-the-cco-churn-protocol": {
    playbookSlug: "churn-volatility-triage-playbook",
    ctaLabel: "Run the Churn Volatility Decision Protocol",
    description:
      "Run the ICP match diagnostic, NRR impact model, and commercial architecture chooser as a live tool.",
  },
  "upward-alignment-the-mis-sold-contract": {
    playbookSlug: "upward-alignment-misold-contract-playbook",
    ctaLabel: "Run the Upward Alignment and Mis-Sell Protocol",
    description:
      "The mis-sell diagnostic, commercial cost model, and board-level risk report — as an interactive worksheet.",
  },
};

export function getLinkedPlaybook(articleSlug: string): ArticlePlaybookLink | undefined {
  return ARTICLE_PLAYBOOK_MAP[articleSlug];
}
