# PRD — The Signal Reader: Silent Account Diagnosis
**Product:** The CS Quarterly  
**Feature:** Signal Reader — decoding the account that has gone quiet  
**Version:** 1.0  
**Tier:** Vanguard only  
**Connects to:** Lumi Memory, Future Operator, benchmark system, pgvector archive  
**Status:** Ready to build  

---

## The moment this feature exists for

An account that was engaged is now silent. No one has responded to the last two check-ins. Usage data looks fine on the surface. There is no obvious trigger event. The CSM cannot tell if this is:

- A silent churn signal they are 60 days away from discovering
- A champion who has been reorged and hasn't told anyone yet
- An account that is happy and just does not need much contact
- A budget freeze that is making everyone avoid conversations

The uncertainty is the problem. Not knowing which of these it is means the CSM cannot choose the right response. Acting on the wrong read makes things worse. Not acting at all is the most common and the most costly choice.

---

## What the feature does

The Signal Reader is a structured diagnostic workflow that helps a CSM decode a silent account by:

1. **Pattern matching** — comparing the silence pattern to historical data from the benchmark system and the editorial archive to identify which scenario this most resembles
2. **Signal mapping** — a structured checklist of signals to check across product usage, stakeholder activity, and external context
3. **Scenario verdict** — Lumi returns a probability-weighted assessment of what the silence means
4. **Response protocol** — a specific, sequenced action plan calibrated to the most likely scenario

---

## Activation

**Entry point 1 — Future Operator**
If `current_focus_account` in `future_operator_profiles` was mentioned in a check-in as "silent" or "not responding" and 10+ days have passed without a resolution update:
> *"You mentioned [account type] going quiet 10 days ago. You haven't updated me since. That silence — theirs and yours — is usually how this kind of loss starts. Let's figure out what's actually happening."*

**Entry point 2 — Lumi Situation Room (semantic routing)**
When a query contains signals: "gone quiet", "not responding", "silent", "no reply", "haven't heard from", "dark" — Lumi routes to Signal Reader automatically.

**Entry point 3 — Lumi bubble on homepage**
```typescript
{
  id: 'home-silent-account',
  icon: 'ti-radio',
  label: 'Decode a silent account',
  bubbleMessage: 'Account gone quiet? Lumi reads the signals.',
  prompt: "I have an account that's gone quiet and I can't tell what it means. Let's diagnose it.",
  tier: 'vanguard',
  isNew: true,
}
```

---

## Phase 1 — Signal Collection

Lumi asks 8 targeted questions. This is not a form — it is a structured conversation. Lumi acknowledges each answer before asking the next, building a picture out loud.

```
Q1: "How long have they been quiet — and what was the last meaningful 
     interaction before the silence started?"

Q2: "What does their product usage look like right now compared to 
     three months ago — more, less, or flat?"

Q3: "Has anything changed at their company recently — leadership, 
     funding, M&A, layoffs, product launches, anything?"

Q4: "Who was your primary contact and what's their current status — 
     same role, promoted, reorged, or unknown?"

Q5: "Have they paid their last invoice on time, late, or is there 
     anything outstanding?"

Q6: "Are any other accounts in the same industry or ACV band showing 
     similar patterns right now?"

Q7: "What was the last thing you sent them — and be honest: 
     was it valuable to them, or administrative to you?"

Q8: "What's your gut read? Not your professional assessment — 
     your actual instinct about what's going on."
```

Q8 is critical. It surfaces the CSM's intuition, which is often correct but often overridden by professional optimism. Lumi acknowledges it explicitly: *"Your gut matters here. Keep that in mind as we look at the signals."*

---

## Phase 2 — Archive Pattern Match

After collecting the 8 answers, Lumi uses pgvector semantic search to find the 3 most relevant past dispatches covering silent account scenarios.

It also queries `benchmark_aggregates` for:
- Median time between last meaningful engagement and formal churn notice at this ACV band
- Most common churn triggers at this account tenure stage
- Usage pattern correlation with 90-day churn risk

This data is woven into the Signal Reader output — not shown as a separate data table, but integrated into Lumi's analysis in natural language.

---

## Phase 3 — Scenario Verdict

Lumi returns a probability-weighted assessment across four scenarios:

```
┌─────────────────────────────────────────────────────┐
│  SIGNAL READER — VERDICT                            │
│  [Account type] · [ACV band] · [Silence duration]  │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  SCENARIO PROBABILITIES                             │
│                                                      │
│  ████████████████░░░░  72% — Champion displacement  │
│  Your primary contact has lost authority or is      │
│  being reorged. The silence is about internal       │
│  politics, not your product.                        │
│                                                      │
│  ████░░░░░░░░░░░░░░░░  18% — Budget freeze          │
│  Finance has put discretionary spend under review.  │
│  They're avoiding the conversation, not the product.│
│                                                      │
│  ██░░░░░░░░░░░░░░░░░░   8% — Silent satisfaction    │
│  Less likely given usage pattern, but possible.     │
│                                                      │
│  █░░░░░░░░░░░░░░░░░░░   2% — Active evaluation      │
│  Usage pattern does not support this. Low risk.     │
│                                                      │
│  ─────────────────────────────────────────────────  │
│  LUMI'S READ                                        │
│  "The combination of flat usage with sudden         │
│  communication silence, at 8 months into the        │
│  relationship, strongly resembles the champion      │
│  displacement pattern from Q1 dispatch on          │
│  stakeholder mapping. The last thing they opened   │
│  was [item] — that was three weeks ago."           │
│                                                      │
│  YOUR INSTINCT: "[Their Q8 answer]"                │
│  Lumi's assessment: "Your read is consistent        │
│  with the data. Trust it."                         │
└─────────────────────────────────────────────────────┘
```

The probability weights are generated by Lumi based on the 8 signal answers, benchmark data, and archive pattern matches. They are presented as probabilities, not certainties — the language throughout communicates inference, not diagnosis.

---

## Phase 4 — Response Protocol

Based on the top scenario, Lumi generates a sequenced action plan:

```
┌─────────────────────────────────────────────────────┐
│  RESPONSE PROTOCOL — Champion Displacement          │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  ACTION 1 — TODAY                                   │
│  Map the org chart. Check LinkedIn for any changes  │
│  to your contact's title or connections in the     │
│  last 60 days. Look for who might have authority   │
│  over their function now.                          │
│                                                      │
│  ACTION 2 — THIS WEEK                              │
│  Send a value signal, not a check-in. Not "just    │
│  checking in" — a specific, relevant insight that  │
│  demonstrates you understand their business right  │
│  now. Reference something external, not internal.  │
│  [Lumi will draft this if you want]                │
│                                                      │
│  ACTION 3 — IF NO RESPONSE IN 5 DAYS               │
│  Go lateral. Find one other contact at the account │
│  — any function — and send a different message.    │
│  Not about the renewal. About something useful.    │
│                                                      │
│  ACTION 4 — ESCALATION TRIGGER                      │
│  If no response from any contact in 14 days:       │
│  loop in your executive for an exec-to-exec touch. │
│  Do not wait for renewal proximity to do this.     │
│                                                      │
│  FROM YOUR FUTURE OPERATOR                          │
│  "[A message from the Future Operator character    │
│   about what they wish they'd done sooner in       │
│   this exact type of situation]"                   │
│                                                      │
│  [Set reminder for Action 3]  [Draft Action 2]     │
└─────────────────────────────────────────────────────┘
```

**"Draft Action 2"** opens the Executive Breakthrough workflow pre-seeded with context from the Signal Reader session, if a stakeholder contact issue is involved.

**"Set reminder for Action 3"** creates a `future_operator_notifications` entry for 5 days from now.

---

## The CSM's gut acknowledgement

This is a deliberate design choice throughout the Signal Reader. Q8 asks for the CSM's instinct, and Lumi explicitly validates or gently challenges it in the verdict:

- If the gut read aligns with the data: *"Your read is consistent with the signals. Trust it."*
- If the gut read diverges: *"Your instinct is pointing toward [X]. The data is pointing more toward [Y]. It's worth holding both — instinct often picks up signals that data misses."*

This is the feature that makes CSMs feel understood. Most tools treat them as data inputs. The Signal Reader treats their professional judgment as a variable worth considering. That is the shoulder.

---

## Database additions

```sql
CREATE TABLE signal_reader_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Account context
  acv_band            text,
  industry            text,
  silence_duration_days integer,
  
  -- Collected signals (answers to 8 questions)
  signals             jsonb,
  
  -- Generated output
  scenario_verdict    jsonb,  -- array of {scenario, probability, explanation}
  top_scenario        text,
  response_protocol   jsonb,  -- array of {action, timing, description}
  
  -- Follow-through
  actions_set         jsonb[],  -- which actions the CSM committed to
  outcome_reported    text,     -- what actually happened
  
  -- Links to other features
  breakthrough_session_id uuid REFERENCES executive_breakthrough_sessions(id),
  war_room_session_id     uuid REFERENCES renewal_war_room_sessions(id),
  
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE signal_reader_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions"
  ON signal_reader_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid());
```

---

## Lumi Memory writes

After verdict is generated:

```typescript
[
  {
    memory_type: 'situation',
    content: `Silent account diagnostic: [account type], [ACV band]. 
              Top scenario: [scenario] at [probability]%. 
              Response protocol set: [date].`,
  },
  {
    memory_type: 'account',
    content: `[Account type] went silent at [silence_duration] days. 
              Assessed as [top_scenario]. Next action: [Action 1].`,
  }
]
```

---

## Verification checklist

- [ ] Signal Reader activates from Future Operator drift (10-day silent account trigger)
- [ ] Signal Reader activates from Situation Room semantic routing
- [ ] Signal Reader activates from Lumi bubble CTA
- [ ] 8-question flow is conversational — Lumi acknowledges each answer
- [ ] Q8 (gut read) is explicitly surfaced and acknowledged in the verdict
- [ ] pgvector search returns 3 relevant archive dispatches
- [ ] Benchmark data (median engagement-to-churn timeline) is woven into analysis
- [ ] Scenario probabilities render as visual bars with explanations
- [ ] Response protocol shows 4 sequenced actions with timing labels
- [ ] "Draft Action 2" opens Executive Breakthrough pre-seeded with session context
- [ ] "Set reminder" creates Future Operator notification for correct future date
- [ ] From Your Future Operator section appears in response protocol
- [ ] lumi_memory receives 2 entries after verdict
- [ ] session_reader_sessions record created with all fields
- [ ] Outcome reporting available for closed sessions (learning loop)

---

*Document reference: CSQ-PRD-SIGNALREADER-2026-001 | Ready to feed into Lovable*
