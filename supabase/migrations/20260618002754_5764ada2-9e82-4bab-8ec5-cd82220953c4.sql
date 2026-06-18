INSERT INTO public.playbooks (slug, title, summary, cover_image_url, price_cents, pages, body, category, included_in_vanguard, published, published_at)
VALUES ('expansion-conversation-no-pitch', 'The Conversation That Closes More Upsells Than Any Pitch', 'Why the best expansion CSMs never talk about the product', NULL, 4900, 8, '### Why the best expansion CSMs never talk about the product

### THE 4 RULES OF THE EXPANSION CONVERSATION

**Rule 1: Name their initiative, not your feature.**
Every customer has at least one internal initiative in flight that maps to something your product can do better. Find it before the conversation. Name it at the beginning of the conversation. The first sentence of an expansion conversation should reference something that is already true in their business, not something you want to sell them.

**Rule 2: The qualifying question is not "are you interested in X." It is "what is your biggest friction in Y."**
Interest in a product is a low-quality signal. Friction in a business process is a high-quality signal. Ask about friction. Let the product capability emerge as the natural response to the friction they describe.

**Rule 3: The decision-maker in an expansion conversation is rarely the person you talk to most.**
The CSM''s primary contact is usually an operational leader. The expansion decision — the one that requires budget approval — usually sits one to two levels above. Map the decision-making chain before you make the expansion case. You need the primary contact to be an internal advocate, not a gatekeeper.

**Rule 4: The timing of the expansion ask is set by their calendar, not yours.**
CSMs who try to close expansion deals in Q4 because it is their Q4 are making the timing decision based on their interests. The expansion conversation lands best when it is connected to something the customer is planning — a new initiative, a hiring cycle, a budget refresh, a strategic review. Connect your timing to theirs.

---

### THE FRAMEWORK

**Step 1: The Research Call (before the expansion conversation)**
One call, thirty minutes, focused entirely on where the customer is heading. Not a product call. Not a renewal call. A business conversation.

"I want to spend thirty minutes understanding what your team is focused on this next quarter. No agenda on our side — I want to hear about yours."

**Step 2: The Friction Mapping**
In the research call, listen for three things:
- What are they trying to do that is harder than it should be?
- Where are they losing time that they cannot recover?
- What decision are they trying to make that they do not have enough data to make?

Note these precisely. In their language.

**Step 3: The Connection Statement**
"You mentioned [specific friction from the research call]. I want to share how two other companies in [their segment] addressed exactly that problem with [specific capability] — not because it is the right answer for you yet, but because the approach might be worth 30 minutes of your time."

**Step 4: The Trial or Pilot Offer**
Not a proposal. Not a pricing conversation. A pilot. "Would it be worth running a thirty-day test on [specific accounts] to see whether the numbers hold in your context?" The customer can say yes to a pilot when they cannot say yes to a contract. The pilot creates the evidence that closes the contract.

---

### THE SCRIPT

**USE WHEN:** You have identified a business initiative in the customer''s organisation that maps to a product capability they are not currently using.

```
"[Name], when we spoke last month you mentioned that your
team is trying to [specific initiative — in their words, not
product language].

I''ve been thinking about that since we spoke, and I want
to share how [specific comparable company] handled the
same challenge. Not as a pitch — I don''t know yet if the
approach applies to your situation. But the outcome was
[specific result] in [timeframe], and I thought it was
worth sharing given what you told me.

Would you have thirty minutes to look at it together? If
it''s not relevant to where you are, I''ll know faster and
so will you."
```

**COMMON MISTAKE:** Skipping the research call and going straight to the expansion conversation based on product usage data. Usage data tells you what the customer is doing. It does not tell you what they are trying to do next. A customer with 92% feature adoption is not necessarily a good expansion target — they may be fully deployed and have no adjacent need. A customer with 45% adoption who is about to start a new business unit is a better expansion target. The data does not tell you which situation you are in. The research call does.', 'Practitioner Playbook', true, true, now())
ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, summary=EXCLUDED.summary, body=EXCLUDED.body, pages=EXCLUDED.pages, category=EXCLUDED.category, included_in_vanguard=EXCLUDED.included_in_vanguard, published=EXCLUDED.published;