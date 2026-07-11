// Homepage hero headline rotation. Indexed by day-of-week (0 = Sunday) to
// match the existing daily rotation in src/routes/index.tsx. Each entry is
// split into exactly 3 phrases for the HeadlineMorph animation. `line1` and
// `line2` preserve the existing accent-span rendering on the final static
// headline (line2 renders in the accent color, matching the pre-morph hero).

export interface HeadlineSet {
  id: string;
  dayIndex: number; // 0 = Sunday .. 6 = Saturday
  phrases: [string, string, string];
  line1: string;
  line2: string;
  fullText: string;
}

export const homepageHeadlines: HeadlineSet[] = [
  {
    id: "sunday-engineering-trajectory",
    dayIndex: 0,
    phrases: [
      "Stop managing accounts.",
      "Start engineering",
      "trajectory.",
    ],
    line1: "Stop managing accounts.",
    line2: "Start engineering trajectory.",
    fullText: "Stop managing accounts. Start engineering trajectory.",
  },
  {
    id: "monday-nrr-gap",
    dayIndex: 1,
    phrases: [
      "The gap between 94% and 120% NRR",
      "is not headcount.",
      "It is system design.",
    ],
    line1: "The gap between 94% NRR and 120% NRR",
    line2: "is not headcount. It is system design.",
    fullText:
      "The gap between 94% NRR and 120% NRR is not headcount. It is system design.",
  },
  {
    id: "tuesday-high-touch-liability",
    dayIndex: 2,
    phrases: [
      "High-touch CS",
      "is a scaling liability.",
      "Here is what replaces it.",
    ],
    line1: "High-touch CS is a scaling liability.",
    line2: "Here is what replaces it.",
    fullText: "High-touch CS is a scaling liability. Here is what replaces it.",
  },
  {
    id: "wednesday-engineering-revenue",
    dayIndex: 3,
    phrases: [
      "Stop managing accounts.",
      "Start engineering",
      "revenue.",
    ],
    line1: "Stop managing accounts.",
    line2: "Start engineering revenue.",
    fullText: "Stop managing accounts. Start engineering revenue.",
  },
  {
    id: "thursday-top-quartile",
    dayIndex: 4,
    phrases: [
      "Your peers are managing relationships.",
      "The top quartile",
      "is engineering expansion.",
    ],
    line1: "Your peers are managing relationships.",
    line2: "The top quartile is engineering expansion.",
    fullText:
      "Your peers are managing relationships. The top quartile is engineering expansion.",
  },
  {
    id: "friday-revenue-leadership",
    dayIndex: 5,
    phrases: [
      "CS done right",
      "does not feel like CS.",
      "It feels like revenue leadership.",
    ],
    line1: "CS done right does not feel like CS.",
    line2: "It feels like revenue leadership.",
    fullText:
      "CS done right does not feel like CS. It feels like revenue leadership.",
  },
  {
    id: "saturday-structural-churn",
    dayIndex: 6,
    phrases: [
      "Why do your best accounts still churn?",
      "The answer is structural.",
      "So is the fix.",
    ],
    line1: "Why do your best accounts still churn?",
    line2: "The answer is structural. So is the fix.",
    fullText:
      "Why do your best accounts still churn? The answer is structural. So is the fix.",
  },
];

export function getHeadlineForDay(dayIndex: number): HeadlineSet {
  const found = homepageHeadlines.find((h) => h.dayIndex === dayIndex);
  return found ?? homepageHeadlines[0];
}

export function getCurrentHeadlineSet(): HeadlineSet {
  return getHeadlineForDay(new Date().getDay());
}
