# PRD — The Board Narrative: Internal CS Conversation Intelligence
**Product:** The CS Quarterly  
**Feature:** Board Narrative — preparing for the internal conversation about CS metrics  
**Version:** 1.0  
**Tier:** Vanguard only  
**Connects to:** Lumi Memory, Future Operator, benchmark system  
**Status:** Ready to build  

---

## The moment this feature exists for

A VP of CS or CS Director has a QBR with the CEO next week. Or a board meeting. Or a budget conversation where they need to defend headcount. Or a pipeline review where their renewal forecast is being challenged by the CFO.

The metrics are what they are. The question is how to frame them, contextualise them, anticipate the objections, and communicate them in a language that the audience — who thinks in revenue and cost, not in CSM ratios and health scores — will actually process.

No one prepares for this conversation properly because there is nowhere to prepare for it. Your CS peers will tell you everything is fine. Your manager will tell you to be more confident. Neither of those is useful.

Lumi can be the room where you practice, pressure-test, and prepare.

---

## What the feature does

The Board Narrative is a structured preparation workflow for internal performance conversations. It has four components:

1. **Audience Intelligence** — Lumi helps the CSM/VP understand how their specific audience (CEO, CFO, board, CRO) will receive CS metrics and what their real concerns are likely to be
2. **Metric Contextualisation** — Lumi takes the user's actual metrics and positions them against benchmark data, generating the narrative that puts them in the best honest light
3. **Objection Simulation** — Lumi plays the CFO, the CEO, or the board member and asks the hard questions — so the user is not blindsided in the room
4. **The Narrative Draft** — a structured talking points document the user can take into the meeting

---

## Activation

**Entry point 1 — Future Operator**
If `lumi_memory` contains mentions of "board", "QBR", "presentation", "leadership review", or "budget" and the date is within 10 days of a recurring quarterly boundary:
> *"Q3 is closing. You know what comes next — the conversation with [leadership] about where retention is. Let's make sure you walk into that room prepared, not hoping."*

**Entry point 2 — Lumi bubble (homepage and account pages)**
```typescript
{
  id: 'home-board-narrative',
  icon: 'ti-presentation',
  label: 'Prep a leadership conversation',
  bubbleMessage: 'Board meeting? QBR? Lumi helps you frame the metrics.',
  prompt: "I have an internal leadership conversation about CS metrics coming up and I need to prepare properly.",
  tier: 'vanguard',
  isNew: true,
}
```

**Entry point 3 — Lumi Situation Room**
Semantic routing on queries containing: "board", "QBR", "justify", "defend", "CEO", "CFO", "budget", "headcount", "forecast", "presentation"

---

## Phase 1 — Audience Intelligence

Lumi asks 5 questions to understand the audience and context:

```
Q1: "Who is in the room and who is the most important person 
     you need to land with? CEO, CFO, board, CRO — 
     and what do you know about how they think about CS?"

Q2: "What is the formal purpose of this meeting? 
     Regular QBR, budget review, renewal forecast, 
     headcount justification, something else?"

Q3: "What number in your metrics do you most want 
     them to understand properly — and what's the 
     risk that they will misread it?"

Q4: "What is the question you are most afraid of 
     being asked in that room?"

Q5: "What decision do you need this audience to make, 
     approve, or believe by the end of this meeting?"
```

After these 5 answers, Lumi generates an **Audience Intelligence Brief**:

```
┌─────────────────────────────────────────────────────┐
│  AUDIENCE BRIEF                                      │
│  [Audience type] · [Meeting purpose] · [Date]       │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  HOW THIS AUDIENCE THINKS ABOUT CS                  │
│  CFOs typically process CS through three lenses:    │
│  cost-per-retention, revenue protection, and        │
│  expansion leverage. They do not think about        │
│  customer health scores — they think about whether  │
│  CS cost scales sublinearly with ARR. Frame         │
│  everything through that lens first.                │
│                                                      │
│  THE NUMBER THEY WILL MISREAD                       │
│  [Their answer to Q3 + Lumi's explanation of        │
│   why this specific number is commonly misread      │
│   by this audience type]                            │
│                                                      │
│  THE QUESTION TO PREPARE FOR                        │
│  [Their Q4 answer + Lumi's version of exactly       │
│   how a CFO would phrase this question]             │
│                                                      │
│  THE DECISION YOU NEED                              │
│  [Reframed as what the audience needs to believe,   │
│   not what you need them to approve]                │
└─────────────────────────────────────────────────────┘
```

---

## Phase 2 — Metric Contextualisation

Lumi asks for the user's actual metrics, then positions them against benchmark data.

```
"Give me your key numbers. Whatever you're planning to present — 
NRR, GRR, payback, health score distribution, renewal rate, 
expansion ARR. Don't worry about format. Just tell me the numbers."
```

Lumi takes the free-text input, parses the metrics, and generates a **Contextualisation Layer** — the benchmark positioning for each metric:

```
┌─────────────────────────────────────────────────────┐
│  METRIC CONTEXT                                      │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  YOUR NRR: 103%                                     │
│  Benchmark (mid-market): Median 104% | P75: 116%   │
│                                                      │
│  NARRATIVE: You are at the median for your ACV      │
│  band. Do not present this as strong performance    │
│  — a CFO who does any research will find this       │
│  benchmark. Present it as: "We are tracking at      │
│  industry median, with a defined plan to close      │
│  the 12-point gap to top-quartile performance       │
│  through [specific initiative]."                    │
│                                                      │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  YOUR PAYBACK: 19 months                            │
│  Benchmark (mid-market): Median 15 months          │
│                                                      │
│  NARRATIVE: You are above median on payback.        │
│  Do not present this raw — frame it as:             │
│  "Our fully-loaded payback is 19 months, which      │
│  is above industry median. The gap is driven        │
│  primarily by [specific factor], which [plan]       │
│  addresses. Here's our trajectory."                 │
│                                                      │
│  Then show the trend, not the point-in-time number. │
└─────────────────────────────────────────────────────┘
```

For each metric, Lumi generates:
- The benchmark context (from `benchmark_aggregates`)
- The honest narrative frame (neither spin nor self-flagellation)
- One sentence the user should say and one sentence they should never say

---

## Phase 3 — Objection Simulation

This is the feature that generates the most emotional value. Lumi plays the difficult audience member and asks the hardest version of the questions the CSM is afraid of.

### Activation
After Phases 1 and 2, a button appears:
**"Simulate the hard questions — Lumi plays your CFO"**

### How it works
Lumi enters a role-play mode. It has:
- The user's actual metrics from Phase 2
- The audience profile from Phase 1
- The benchmark context
- The question the user is most afraid of (Q4)

It asks 5 questions in the voice of the CFO/CEO/board member. Hard questions. The kind that get asked in real board rooms. Not straw men.

```
Example CFO simulation questions:

"If I'm looking at 19-month payback on your CS investment, 
 and the industry median is 15, why should I not reduce 
 CS headcount by 20% and see what actually moves?"

"Your NRR is at the industry median. That means half of 
 your competitors are doing better than you. What's your 
 explanation for why that is, and what's your plan?"

"You're telling me health scores are good. But 18 months ago 
 you also told me health scores were good and we had our 
 worst renewal quarter in two years. Why should I believe 
 this metric?"

"If I gave you an extra $500k in CS budget, what would 
 that return and when would I see it?"

"What's the one thing that could go wrong in the next 
 90 days that would make this renewal forecast wrong?"
```

The user types their response to each question. Lumi then gives feedback:

```
┌─────────────────────────────────────────────────────┐
│  YOUR RESPONSE:                                      │
│  [What the user typed]                              │
│                                                      │
│  LUMI'S ASSESSMENT:                                 │
│  ✓ Strong: You anchored to a specific initiative    │
│  ✗ Weak: The payback explanation was defensive.     │
│    A CFO reads defensiveness as uncertainty.        │
│  ✗ Missing: You didn't give a timeline.             │
│    "We're working on it" is not an answer.          │
│                                                      │
│  STRONGER VERSION:                                   │
│  "[Lumi's rewrite of their answer — same substance, │
│   better register, more specific, timeline included]"│
│                                                      │
│  [Use this version] [Try again] [Next question]     │
└─────────────────────────────────────────────────────┘
```

**"Use this version"** saves Lumi's rewrite to the narrative draft.

---

## Phase 4 — The Narrative Draft

After all three phases, Lumi generates a structured talking points document:

```
┌─────────────────────────────────────────────────────┐
│  BOARD NARRATIVE                                     │
│  CS Performance Review · [Quarter] · [Date]         │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  OPENING FRAME (30 seconds)                         │
│  [How to open the conversation — sets the context   │
│   before any metric is mentioned]                   │
│                                                      │
│  THE THREE METRICS THAT MATTER                      │
│  [Only 3 — not all of them. The ones the audience   │
│   will remember and that tell the real story]       │
│  For each: the number, the benchmark position,      │
│  the narrative sentence, the trend direction.       │
│                                                      │
│  THE PLAN (the most important slide)                │
│  [What changes in the next 90 days and why          │
│   it will move the number — specific, not vague]    │
│                                                      │
│  QUESTIONS TO EXPECT + PREPARED RESPONSES           │
│  [The 5 simulated questions + the best answers      │
│   from the simulation phase]                        │
│                                                      │
│  THE ASK                                            │
│  [Specific, one sentence. What decision/approval/   │
│   belief you need them to leave with]               │
│                                                      │
│  [Export as PDF]  [Edit in Lumi]  [Save to Workspace]│
└─────────────────────────────────────────────────────┘
```

---

## The learning loop

After the meeting, Lumi sends a Reflection Prompt:

> *"The board conversation — how did it go? And the question you were most afraid of: did they ask it?"*

The user's response is written to `lumi_memory`. Over time, Lumi builds a model of what questions this specific user's leadership consistently asks — and the Future Operator's quarterly drift signals reference this:

> *"Board review in 8 days. Last quarter, the CFO came back hard on payback. You have a better answer for that now. Want to run the simulation again?"*

---

## Database additions

```sql
CREATE TABLE board_narrative_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Meeting context
  audience_type       text,  -- 'cfo', 'ceo', 'board', 'cro', 'mixed'
  meeting_purpose     text,
  meeting_date        date,
  
  -- Generated content
  audience_brief      jsonb,
  metric_context      jsonb,     -- user metrics + benchmark positions + narratives
  simulation_exchanges jsonb[],  -- array of {question, user_response, lumi_assessment, rewrite}
  narrative_draft     jsonb,
  
  -- Outcome
  meeting_completed   boolean DEFAULT false,
  outcome_notes       text,
  feared_question_asked boolean,
  
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE board_narrative_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions"
  ON board_narrative_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid());
```

---

## Lumi Memory writes

```typescript
// Written after simulation phase completes
[
  {
    memory_type: 'situation',
    content: `Board narrative prep completed for [audience_type], [quarter]. 
              Most feared question: [Q4 answer]. 
              Key metric tension: [the metric furthest from benchmark].`,
  },
  {
    memory_type: 'preference',
    content: `Internal audience type: [audience_type]. 
              Leadership communication challenge: [the specific framing issue 
              identified in Phase 1].`,
  }
]

// Written after meeting outcome reported
[
  {
    memory_type: 'situation',
    content: `[Quarter] board review outcome: [outcome_notes]. 
              Feared question asked: [yes/no]. 
              Note for next quarter: [what Lumi should surface earlier].`,
  }
]
```

---

## Why this feature makes Lumi indispensable

A VP of CS who uses the Board Narrative before their first QBR and walks out of that room having handled the CFO's payback question cleanly — using Lumi's rewrite — will never prepare for a leadership conversation without Lumi again.

The simulation is the feature. Being asked hard questions by Lumi in private is categorically less threatening than being asked them in a board room. The first time Lumi asks a question the CFO then asks verbatim in the meeting, the user will tell every CS leader they know.

That is the word-of-mouth mechanic disguised as a preparation tool.

---

## Verification checklist

- [ ] Board Narrative activates from Future Operator drift (quarterly boundary proximity)
- [ ] Board Narrative activates from Lumi bubble on homepage and account pages
- [ ] Board Narrative activates from Situation Room semantic routing
- [ ] 5-question audience flow generates Audience Intelligence Brief
- [ ] Free-text metric input is correctly parsed and matched to benchmark data
- [ ] Contextualisation layer shows benchmark position + narrative + say/don't say for each metric
- [ ] Objection simulation enters Lumi role-play mode correctly
- [ ] Simulation questions are audience-type specific (CFO questions differ from CEO questions)
- [ ] User response receives structured feedback: Strong / Weak / Missing
- [ ] Lumi's rewrite of each answer can be accepted into the narrative draft
- [ ] Narrative draft generates with all 5 sections
- [ ] Draft is exportable as PDF
- [ ] Post-meeting Reflection Prompt fires after meeting date passes
- [ ] Outcome + feared question asked/not asked writes to lumi_memory
- [ ] Future Operator references prior board prep in next quarterly drift signal
- [ ] board_narrative_sessions record created with all fields

---

*Document reference: CSQ-PRD-BOARDNARRATIVE-2026-001 | Ready to feed into Lovable*
