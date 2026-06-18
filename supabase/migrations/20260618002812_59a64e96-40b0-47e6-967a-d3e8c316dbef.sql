INSERT INTO public.playbooks (slug, title, summary, cover_image_url, price_cents, pages, body, category, included_in_vanguard, published, published_at)
VALUES ('managing-up-without-politics', 'How to Manage Up Without Making It Political', 'The internal conversation that most CSMs avoid and every operator has mastered', NULL, 4900, 9, '### The internal conversation that most CSMs avoid and every operator has mastered

### THE 4 RULES OF MANAGING UP

**Rule 1: Bring the pattern, not the incident.**
A single difficult account is an incident. Three accounts with the same problem are a pattern. Leadership can act on patterns. They cannot scale responses to incidents. When you go to your manager with an account problem, your first question to yourself should be: "is this a one-account problem or is this showing up in three accounts?" If it is showing up in three accounts, you are not bringing an account problem. You are bringing a systemic issue — and that is a different, more important conversation.

**Rule 2: Quantify the leadership ask in dollars, not in workload.**
"I need more support on this account" is a workload ask. "This account represents $420K in renewal risk and I need sixty minutes of your time with their VP by end of next week to protect it" is a revenue ask. Leadership responds to revenue asks. They defer workload asks.

**Rule 3: Name the systemic problem before it costs revenue.**
The most valuable thing a CSM can do for their organisation is surface a systemic problem before it appears in the churn data. "I am seeing the same handoff failure in 6 of my last 9 new accounts" is a management conversation that should happen in month three of a pattern, not month nine when the churn number shows up. If you wait until the data is undeniable, the decision to surface it was not a courageous act. It was catching up with reality.

**Rule 4: Close every managing-up conversation with your own accountability.**
The CSMs who are heard and trusted by leadership are the ones who come with a proposed path, not just a problem. "Here is the pattern I''m seeing, here is what I believe is causing it, here is what I have tried, here is what I need from you, and here is what I will own going forward" is a complete managing-up conversation. Anything shorter than that is incomplete.

---

### THE FRAMEWORK

**Step 1: The Pattern Declaration**
"I want to bring something to your attention that I think is systemic rather than account-specific."

This sentence does three things. It signals that what follows is important. It signals that you have been paying attention across your book rather than account by account. And it signals that you are not about to complain about one customer.

**Step 2: The Evidence Statement**
"Across [N] accounts over the last [timeframe], I have seen [specific pattern] in [specific context]. The combined ARR across these accounts is [number]. The risk is [specific]."

**Step 3: The Root Cause Hypothesis**
"My read on the root cause is [specific hypothesis]. I could be wrong about the cause. I am not wrong about the pattern."

The last sentence matters. It separates the observation (which you are confident in) from the analysis (which is your current best interpretation). Conflating them makes the conversation easier to dismiss.

**Step 4: The Attempted Solutions**
"Here is what I have already tried at the account level: [list]. Here is why account-level solutions are not sufficient for a systemic problem: [specific reasoning]."

**Step 5: The Specific Ask**
One ask. Specific. With a timeline and a reason.

**Step 6: Your Accountability**
"From my side, here is what I will own going forward regardless of what you decide."

---

### THE SCRIPT

**USE WHEN:** You have identified a pattern across three or more accounts that cannot be resolved at the individual account level and requires a management decision or cross-functional action.

```
"I want to bring something to your attention that I think
is systemic.

Across [N] accounts over the last [timeframe], I have seen
the same pattern: [specific description]. Combined ARR
across those accounts: [number]. At the current trajectory,
[specific risk with timeline].

My read on the root cause: [hypothesis]. The pattern is
consistent enough that I''m confident something structural
is driving it, even if I''m open to a different interpretation
of the cause.

At the account level, I''ve already [attempted solutions].
They''re buying time but not fixing the root issue.

What I need from you: [specific ask, specific timeline].

What I''ll own regardless: [your accountability].

Can we spend twenty minutes on this this week?"
```

**COMMON MISTAKE:** Waiting for your manager to ask. If you are managing up correctly, you are surfacing information your manager does not yet have. They cannot ask for information they do not know exists. The managing-up conversation is always initiated by the CSM, not prompted by the manager. If you are only sharing difficult information when asked, you are not managing up. You are responding to a prompt.

---

### THE CONVERSATION THAT SEPARATES OPERATORS FROM MANAGERS

There is a conversation that happens in every CS organisation at some point, and how the CSM handles it determines which category they fall into.

The conversation is: "I believe we are telling customers something in the sales process that we cannot deliver in the product."

This is the most politically difficult managing-up conversation there is. It implicates sales. It implicates marketing. It potentially implicates leadership decisions about how the product is positioned. It is not comfortable for anyone.

The CSMs who manage it the wrong way: they raise it in a team meeting, broadly, without specific evidence, without quantifying the churn impact, and without a proposed path. The conversation gets defended against, deflected, or postponed.

The CSMs who manage it the right way: they build the pattern over three months, quantify the churn cost, document the specific language that is causing the problem, propose the specific change they are asking for, and bring it to their manager in a one-on-one before it surfaces anywhere public.

The outcome is not guaranteed. Organisational problems do not always get fixed just because someone identified them clearly and asked precisely. But the CSM who managed it the right way has demonstrated something that the organisation does not forget: the ability to hold a difficult truth and deliver it constructively. That is the evidence that earns bigger accounts, bigger roles, and the trust of leadership that no performance review can manufacture.', 'Practitioner Playbook', true, true, now())
ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, summary=EXCLUDED.summary, body=EXCLUDED.body, pages=EXCLUDED.pages, category=EXCLUDED.category, included_in_vanguard=EXCLUDED.included_in_vanguard, published=EXCLUDED.published;