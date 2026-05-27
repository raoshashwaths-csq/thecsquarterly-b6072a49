// CS glossary — single-sentence operator-grade definitions for the
// terms we lean on across dispatches. Used by <Acronym /> and the
// home-page glossary rail. Keep entries short; the tooltip is meant to
// confirm meaning at a glance, not teach the concept.

export type GlossaryEntry = {
  term: string;
  definition: string;
};

export const GLOSSARY: Record<string, GlossaryEntry> = {
  NRR: { term: "NRR", definition: "Net Revenue Retention — recurring revenue from existing customers including expansion, minus churn and contraction, over the prior period." },
  GRR: { term: "GRR", definition: "Gross Revenue Retention — recurring revenue retained from existing customers, excluding any expansion." },
  ARR: { term: "ARR", definition: "Annual Recurring Revenue — the annualized value of a SaaS contract base at a point in time." },
  MRR: { term: "MRR", definition: "Monthly Recurring Revenue — the monthly equivalent of ARR, normalized across contract lengths." },
  ACV: { term: "ACV", definition: "Annual Contract Value — the average annualized revenue per customer contract." },
  TCV: { term: "TCV", definition: "Total Contract Value — total committed revenue across the full contract term." },
  QBR: { term: "QBR", definition: "Quarterly Business Review — a structured executive check-in tying product usage to business outcomes." },
  EBR: { term: "EBR", definition: "Executive Business Review — a higher-altitude QBR aimed at C-level stakeholders." },
  CSM: { term: "CSM", definition: "Customer Success Manager — owner of post-sale retention and expansion for a portfolio of accounts." },
  CSQL: { term: "CSQL", definition: "Customer Success Qualified Lead — an expansion opportunity surfaced and validated by CS before handoff to sales." },
  TTV: { term: "TTV", definition: "Time to Value — elapsed time between a customer signing and realizing the first measurable outcome." },
  LTV: { term: "LTV", definition: "Lifetime Value — the projected gross profit a customer generates across their full tenure." },
  CAC: { term: "CAC", definition: "Customer Acquisition Cost — fully loaded sales and marketing spend to land one new customer." },
  PLG: { term: "PLG", definition: "Product-Led Growth — a go-to-market motion where product usage drives acquisition, expansion, and retention." },
  NPS: { term: "NPS", definition: "Net Promoter Score — likelihood-to-recommend metric on a 0–10 scale, surfaced as promoters minus detractors." },
  CSAT: { term: "CSAT", definition: "Customer Satisfaction — short-interval rating of a specific interaction or moment." },
  RACI: { term: "RACI", definition: "Responsible, Accountable, Consulted, Informed — a role-mapping grid for cross-functional decisions." },
  THI: { term: "THI", definition: "True Health Index — composite account-health signal blending usage, sentiment, and commercial posture." },
  ICP: { term: "ICP", definition: "Ideal Customer Profile — the firmographic and behavioral pattern that predicts highest retention and expansion." },
  CLG: { term: "CLG", definition: "Customer-Led Growth — a strategy that treats existing customers as the primary engine for new revenue." },
};

export const GLOSSARY_TERMS = Object.keys(GLOSSARY);
