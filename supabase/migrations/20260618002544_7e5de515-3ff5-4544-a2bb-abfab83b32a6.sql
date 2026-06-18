INSERT INTO public.playbooks (slug, title, summary, cover_image_url, price_cents, pages, body, category, included_in_vanguard, published, published_at)
VALUES ('feature-request-never-built', 'How to Tell a Customer Their Feature Request Will Never Be Built', 'The conversation that most CSMs avoid. The one that builds the most trust.', NULL, 4900, 8, '### The conversation that most CSMs avoid. The one that builds the most trust.

### WHY HONESTY CLOSES MORE RENEWALS THAN OPTIMISM

In thirty-five years of managing customer relationships I have seen exactly one thing predict long-term account health with more reliability than any health score, usage metric, or NPS response.

It is whether the customer trusts you to tell them the truth.

Not the truth about the product when it is good. Customers do not need you to tell them that. The truth about the product when it is hard. When the answer is no. When the timeline slipped. When the roadmap changed.

The CSMs who operate with that level of honesty generate something that no product feature can generate: a customer who brings their problems to you before they become crises. Because they know you will not manage them. You will tell them what is real.

That relationship survives product gaps. It survives missed SLAs. In many cases it survives competitive evaluations. It does not survive dishonesty.

---

### THE FRAMEWORK

**Step 1: Confirm your intelligence before you speak.**
Before you deliver any news about the roadmap, make sure you have a current, direct answer from the product team — not your interpretation of a Slack message from three weeks ago. "I believe it is not on the roadmap" is hearsay. "I spoke with [Product Lead] on [date] and the decision is [X] for [specific reason]" is intelligence. Deliver intelligence.

**Step 2: Deliver the answer in the first sentence.**
Not after context. Not after relationship-warming. The answer first. "The feature you requested in February will not be on our roadmap this year. I want to explain why and what that means for your workflow."

**Step 3: Give them the reason, not the apology.**
The reason is what the customer actually needs. The apology is for you. "We prioritised [alternative capability] because [specific strategic rationale]" is a reason. "I''m so sorry about this, I know it has been frustrating" is an apology. One of those is useful to the customer in planning their business. The other one is not.

**Step 4: Name the real cost to them.**
"Here is what this means for your team specifically: [concrete impact, quantified where possible]." Skipping this step makes the customer feel like you have not understood why the feature mattered. Naming it first shows you were paying attention.

**Step 5: Offer a genuine path, not a consolation prize.**
The path must be real. A workaround that takes fourteen manual steps is not a path — it is evidence that the problem has not been solved. A third-party integration that fills the gap is a path. An alternative workflow that produces 80% of the same outcome with existing functionality is a path. Be honest about which category your solution falls into.

---

### THE SCRIPT

**USE WHEN:** A feature request has been formally declined by product, or has been on the roadmap for more than two cycles without movement and will not move.

```
"[Name], I want to give you a clear answer on [feature request]
rather than another update.

I spoke with [product lead] on [date]. The decision is that
[feature] will not be on the roadmap in [timeframe]. The
reason is [specific strategic rationale — not "competing
priorities," something real].

I want to name what that actually means for your team:
[concrete impact]. That is a real gap and I am not going
to minimise it.

Here is what I can offer that is not a workaround:
[genuine alternative path with specifics].

I would rather have this conversation with you directly than
let you continue to wait for an answer that is not coming.

What questions do you have?"
```

**COMMON MISTAKE:** Treating the conversation as closed after you deliver the no. It is not closed. The customer now needs to make a decision about how to run their business without this feature. Your job does not end at the delivery of the answer. It begins there.

---

### WHAT THIS CONVERSATION ACTUALLY PROTECTS

The CSM who has this conversation in month eight protects the renewal in month twelve.

The CSM who deflects until month eleven has a customer who has been building a case for twelve months, has the feature gap as exhibit A, and has already started evaluating alternatives. They are not deciding whether to renew. They have already decided. They are managing their exit.

The feature conversation is not a threat to the relationship. The avoidance of it is.', 'Practitioner Playbook', true, true, now())
ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, summary=EXCLUDED.summary, body=EXCLUDED.body, pages=EXCLUDED.pages, category=EXCLUDED.category, included_in_vanguard=EXCLUDED.included_in_vanguard, published=EXCLUDED.published;