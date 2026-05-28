// Logic tree of starter questions for the CSFactors Q drawer.
// Grouped by intent. Click a chip → seed the chat composer.

export type QTreeGroup = {
  id: string;
  label: string;
  prompts: string[];
};

export const CSFACTORS_Q_TREE: QTreeGroup[] = [
  {
    id: "stakeholders",
    label: "Stakeholders",
    prompts: [
      "Who is the primary stakeholder at each of my top 3 ARR accounts?",
      "Which accounts have no champion or economic buyer mapped?",
      "List every account where the blocker is named.",
    ],
  },
  {
    id: "qbrs",
    label: "QBRs",
    prompts: [
      "Which QBRs are overdue right now?",
      "How many QBRs have I completed vs scheduled?",
      "Which Enterprise accounts are missing a scheduled QBR?",
    ],
  },
  {
    id: "sentiment",
    label: "Sentiment",
    prompts: [
      "What's the CSM sentiment breakdown across my portfolio?",
      "Which Critical accounts have the highest ARR exposure?",
      "Which Positive accounts could become reference customers?",
    ],
  },
  {
    id: "leadership",
    label: "Leadership connects",
    prompts: [
      "When was the last leadership connect logged per account?",
      "Which accounts haven't had a leadership touchpoint in 60+ days?",
      "Summarize all leadership-connect events from the last 30 days.",
    ],
  },
  {
    id: "renewals",
    label: "Renewals & risk",
    prompts: [
      "What's at risk in the next 90 days by ARR?",
      "List my top 3 renewals this quarter and their health scores.",
      "Which accounts have health below 50 and a renewal inside 90 days?",
    ],
  },
];
