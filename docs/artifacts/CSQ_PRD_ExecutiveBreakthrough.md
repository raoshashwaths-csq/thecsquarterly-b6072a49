# PRD — The Executive Breakthrough: Stakeholder Re-engagement Intelligence
**Product:** The CS Quarterly  
**Feature:** Executive Breakthrough — reaching the executive you cannot reach  
**Version:** 1.0  
**Tier:** Vanguard only  
**Connects to:** Lumi Memory, Future Operator, Renewal War Room  
**Status:** Ready to build  

---

## The moment this feature exists for

There is a CFO, a CTO, or a new VP at an account who holds the renewal decision. The CSM has never met them. Their champion either left or lost influence. Every email gets no reply. Every meeting request goes ignored. The renewal is 45 days away.

This is not a lack of effort problem. It is a lack of intelligence and strategy problem. The CSM does not know enough about this person, does not have the right entry angle, and does not have a way to think through the approach without exposing their uncertainty to their manager.

This is what Lumi was built for.

---

## What the feature does

The Executive Breakthrough is a structured Lumi workflow that helps a CSM develop and execute a re-engagement strategy for a specific executive stakeholder they cannot reach. It has three phases:

1. **Stakeholder Intelligence Brief** — Lumi helps the CSM build a profile of the executive from what they know and what they can infer, and generates a read on likely priorities and communication preferences
2. **Breakthrough Strategy** — Lumi generates three distinct re-engagement approaches, each with a different angle, risk profile, and voice
3. **Message Drafts** — Lumi writes the actual outreach messages for the chosen approach, in a register calibrated to the executive's likely communication style

---

## Activation

**Entry point 1 — Lumi bubble on dispatch pages**
When a dispatch is tagged with `category: 'Stakeholder Management'`, the Lumi bubble adds:
> *"Dealing with an executive you can't reach? Lumi has a playbook for this."*

**Entry point 2 — Future Operator Drift Signal**
If `lumi_memory` contains a mention of stakeholder access being a problem and no resolution has been logged in 14+ days:
> *"You mentioned the new CTO at [account type] three weeks ago. Still no reply. That's not a contact problem — it's an angle problem. Let me help you think through this differently."*

**Entry point 3 — Lumi Situation Room**
When a user's free-text query contains signals like: "can't reach", "no response", "gone silent", "executive", "decision maker" — Lumi routes to the Executive Breakthrough workflow automatically.

---

## Phase 1 — Stakeholder Intelligence Brief

Lumi asks 6 questions. Not a form — a conversation that feels like a strategic debrief with a colleague.

```
Q1: "Tell me about this executive. What's their title, how long have they been 
     in this role, and how did they get it — promotion or external hire?"

Q2: "What do you actually know about their priorities right now — from any source: 
     their LinkedIn, their company's earnings calls, things their team has said?"

Q3: "Have you or anyone at your company met them, even briefly? What was the 
     context and what was their demeanour?"

Q4: "What's the business case for this renewal from their perspective — not yours. 
     What problem does your product solve that they would actually care about?"

Q5: "Who at their company has a relationship with someone at yours — any level, 
     any function?"

Q6: "What's the most recent thing their company has done publicly — a press release, 
     a hire, a product launch, an earnings comment — that you could credibly reference?"
```

After the 6 answers, Lumi generates a **Stakeholder Intelligence Brief**:

```
┌─────────────────────────────────────────────────────┐
│  STAKEHOLDER BRIEF                                   │
│  [Title] · [Tenure signal] · [Entry type]           │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  LUMI'S READ                                        │
│  [2-3 sentences: what kind of executive this        │
│   probably is based on the signals provided.        │
│   Not speculation — inference from evidence]        │
│                                                      │
│  LIKELY PRIORITIES                                   │
│  Based on role, tenure, and public signals:         │
│  · [Priority 1]                                     │
│  · [Priority 2]                                     │
│  · [Priority 3]                                     │
│                                                      │
│  COMMUNICATION LIKELY REGISTER                       │
│  [External hire mid-tenure → probably focused on    │
│   proving impact. Prefers data over relationship    │
│   language. Emails with numbers get read first.]    │
│                                                      │
│  YOUR CREDIBLE ENTRY ANGLES                         │
│  · [Angle based on recent public company event]    │
│  · [Angle based on their likely priority]          │
│  · [Internal relationship angle if one exists]     │
│                                                      │
│  BENCHMARK CONTEXT                                   │
│  At this ACV band, the re-engagement pattern that   │
│  works with new economic buyers: [pattern from      │
│  P75 operator data + Quarterly archive]             │
└─────────────────────────────────────────────────────┘
```

---

## Phase 2 — Breakthrough Strategy

Lumi presents three distinct strategic approaches. Each is mutually exclusive — they represent different reads on the situation with different risk profiles.

```
┌─────────────────────────────────────────────────────┐
│  THREE APPROACHES                                    │
│                                                      │
│  APPROACH A — The Business Case Direct              │
│  Risk: Low · Speed: Slow · Requires: ROI data       │
│                                                      │
│  Lead with quantified impact, not relationship.     │
│  A new CFO responds to numbers before names.        │
│  Get your finance team to validate one metric       │
│  before you send anything.                         │
│                                                      │
│  APPROACH B — The Internal Bridge                   │
│  Risk: Medium · Speed: Medium · Requires: An ally   │
│                                                      │
│  Someone at your company needs to open the door.   │
│  Map the org chart intersection. A warm intro       │
│  from your CRO to their CFO changes the dynamic    │
│  entirely. This requires internal selling first.   │
│                                                      │
│  APPROACH C — The External Event Anchor             │
│  Risk: Low · Speed: Fast · Requires: A credible hook│
│                                                      │
│  The press release / earnings comment / new hire    │
│  you mentioned is your reason to reach out now,    │
│  not at renewal time. "I saw [X] and thought of   │
│  [specific implication for them]" is the entry.   │
│                                                      │
│  [Choose Approach A] [Choose Approach B] [Choose C] │
└─────────────────────────────────────────────────────┘
```

Each approach card is clickable and expands into Phase 3.

---

## Phase 3 — Message Drafts

For the chosen approach, Lumi generates three message variants:

- **Email (formal register)** — subject line + 4-sentence body
- **LinkedIn connection note** — 280 characters maximum
- **Internal escalation note** — for the CSM to send to their own executive, requesting a warm intro (Approach B only)

Each draft is:
- Specific to the intelligence gathered in Phase 1
- Written without relationship language for new contacts ("I hope you're well" is explicitly excluded)
- Calibrated to the executive's likely communication register from the brief
- Never longer than necessary — Lumi trims ruthlessly

**Draft UI:**

```
┌─────────────────────────────────────────────────────┐
│  APPROACH C — EMAIL DRAFT                           │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  Subject: [Specific, references their recent event] │
│                                                      │
│  [Draft body — 4 sentences max, no pleasantries,   │
│   specific business case, one clear ask]            │
│                                                      │
│  [Edit in Lumi] [Copy to clipboard] [Regenerate]   │
│                                                      │
│  ─────────────────────────────────────────────────  │
│  LINKEDIN NOTE                                       │
│  [280-char version]                                 │
│  [Copy] [Regenerate]                               │
└─────────────────────────────────────────────────────┘
```

**"Edit in Lumi"** opens a Lumi thread pre-seeded with the draft and the brief, allowing the CSM to iterate with specific instructions: "Make it shorter", "Remove the ROI reference", "Add a reference to their Q3 earnings comment about efficiency."

---

## Follow-through tracking

After messages are sent (user self-reports via a "Sent — tracking response" button):

- Lumi sets a 5-day follow-up reminder in `future_operator_notifications`
- If no response reported after 5 days: Future Operator Drift Signal activates
  > *"Five days on the CFO outreach. No reply yet doesn't mean no. Here's the follow-up sequence that P75 operators use at this stage."*
- If response reported: Lumi asks "How did they respond?" and updates `lumi_memory` with the outcome

---

## Lumi Memory writes

After the Phase 1 brief is generated, write to `lumi_memory`:

```typescript
[
  {
    memory_type: 'stakeholder',
    content: `Executive breakthrough in progress: [title] at [account type]. 
              Approach chosen: [A/B/C]. Messages drafted: [date].`,
  },
  {
    memory_type: 'situation',
    content: `Stakeholder access challenge: cannot reach [title]. 
              Most credible angle: [the chosen approach summary].`,
  }
]
```

---

## Database additions

```sql
CREATE TABLE executive_breakthrough_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Stakeholder context (no identifying info stored)
  stakeholder_title   text,
  acv_band            text,
  industry            text,
  
  -- Session state
  phase               text DEFAULT 'intelligence'
                      CHECK (phase IN ('intelligence','strategy','drafts','tracking')),
  chosen_approach     text CHECK (chosen_approach IN ('A','B','C')),
  
  -- Generated content
  intelligence_brief  jsonb,
  strategy_options    jsonb,
  message_drafts      jsonb,
  
  -- Outcome
  outreach_sent_at    timestamptz,
  response_received   boolean,
  response_notes      text,
  
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE executive_breakthrough_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions"
  ON executive_breakthrough_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid());
```

---

## Lumi bubble additions

Add to `lumiPageActions` for `dispatch` pages with `category: 'Stakeholder Management'`:

```typescript
{
  id: 'dispatch-exec-breakthrough',
  icon: 'ti-user-search',
  label: 'Reach an executive you can\'t reach',
  bubbleMessage: 'Can\'t reach the decision maker? Lumi has a playbook.',
  prompt: "I'm dealing with an executive stakeholder I can't reach. Walk me through the breakthrough process.",
  tier: 'vanguard',
  isNew: true,
}
```

---

## Verification checklist

- [ ] Workflow activates from Lumi bubble on stakeholder-management dispatches
- [ ] Workflow activates from Future Operator drift signal (14-day inactivity on stakeholder situation)
- [ ] Workflow activates automatically from Situation Room query detection
- [ ] 6-question intelligence flow completes conversationally (not a form)
- [ ] Stakeholder brief generates with all 5 sections populated
- [ ] Three approach cards render with risk/speed/requirement labels
- [ ] Clicking an approach expands Phase 3 message drafts
- [ ] All three message formats generate (email, LinkedIn, internal escalation for B)
- [ ] "Edit in Lumi" opens pre-seeded Lumi thread with draft + brief context
- [ ] "Sent — tracking response" creates 5-day follow-up notification
- [ ] Future Operator drift fires at day 5 if no response reported
- [ ] lumi_memory receives 2 entries after Phase 1 completes
- [ ] Session saved to executive_breakthrough_sessions

---

*Document reference: CSQ-PRD-EXECBREAKTHROUGH-2026-001 | Ready to feed into Lovable*
