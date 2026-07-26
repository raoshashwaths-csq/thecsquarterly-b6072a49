// Homepage hero headline rotation. Indexed by day-of-week (0 = Sunday) to
// match the existing daily rotation in src/routes/index.tsx. Phrase splits are
// editorial beats, not a forced count: some headlines resolve in two moves,
// others need three. `line1` and `line2` preserve the existing accent-span
// rendering on the final static headline.

export interface HeadlineSet {
  id: string;
  dayIndex: number; // 0 = Sunday .. 6 = Saturday
  phrases: [string, string, ...string[]];
  line1: string;
  line2: string;
  fullText: string;
}

export const homepageHeadlines: HeadlineSet[] = [
  {
    id: "sunday-commanding-officer",
    dayIndex: 0,
    phrases: [
      "Nobody appointed you the commanding officer of your portfolio.",
      "You already are one.",
    ],
    line1: "Nobody appointed you the commanding officer of your portfolio.",
    line2: "You already are one.",
    fullText:
      "Nobody appointed you the commanding officer of your portfolio. You already are one.",
  },
  {
    id: "monday-nrr-gap",
    dayIndex: 1,
    phrases: [
      "The gap between 94% NRR and 120% NRR is not headcount.",
      "It is system design.",
    ],
    line1: "The gap between 94% NRR and 120% NRR",
    line2: "is not headcount. It is system design.",
    fullText:
      "The gap between 94% NRR and 120% NRR is not headcount. It is system design.",
  },
  {
    id: "tuesday-leverage-treadmill",
    dayIndex: 2,
    phrases: [
      "Forty accounts without leverage is not a job.",
      "It's a treadmill with a title.",
    ],
    line1: "Forty accounts without leverage is not a job.",
    line2: "It's a treadmill with a title.",
    fullText:
      "Forty accounts without leverage is not a job. It's a treadmill with a title.",
  },
  {
    id: "wednesday-silence-before-churn",
    dayIndex: 3,
    phrases: [
      "Anyone can read a churn report.",
      "Almost nobody can read the silence that preceded it.",
    ],
    line1: "Anyone can read a churn report.",
    line2: "Almost nobody can read the silence that preceded it.",
    fullText:
      "Anyone can read a churn report. Almost nobody can read the silence that preceded it.",
  },
  {
    id: "thursday-118-vs-104",
    dayIndex: 4,
    phrases: [
      "118% NRR is not fourteen points better than 104%.",
      "Over five years, it's a different company.",
    ],
    line1: "118% NRR is not fourteen points better than 104%.",
    line2: "Over five years, it's a different company.",
    fullText:
      "118% NRR is not fourteen points better than 104%. Over five years, it's a different company.",
  },
  {
    id: "friday-long-game-renewals",
    dayIndex: 5,
    phrases: [
      "Every renewal looks like a short-term game.",
      "The CSMs who win were quietly playing the long one.",
    ],
    line1: "Every renewal looks like a short-term game.",
    line2: "The CSMs who win were quietly playing the long one.",
    fullText:
      "Every renewal looks like a short-term game. The CSMs who win were quietly playing the long one.",
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
