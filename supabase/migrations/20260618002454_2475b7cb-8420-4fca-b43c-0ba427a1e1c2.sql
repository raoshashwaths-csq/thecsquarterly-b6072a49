INSERT INTO public.playbooks (slug, title, summary, cover_image_url, price_cents, pages, body, category, included_in_vanguard, published, published_at)
VALUES ('renewal-conversation-backwards', 'The Renewal Conversation You Have Been Having Backwards', 'Why leading with ''how are things going?'' is the single most expensive habit in customer success', NULL, 4900, 9, '### Why leading with "how are things going?" is the single most expensive habit in customer success

### THE 6 RULES OF THE RENEWAL CONVERSATION

**Rule 1: You speak first. Always.**
The customer did not come to this meeting to evaluate your product. They came because you asked them to. You set the agenda. You open with your evidence. The moment you open with a question, you have surrendered the frame.

**Rule 2: Lead with a number they did not have before they signed.**
Not a usage metric. Not a login count. A business outcome number. The number that answers the question their CFO asked when they approved the budget for your product twelve months ago. If you do not know what that question was, you have spent twelve months managing a tool instead of managing an outcome.

**Rule 3: Acknowledge the gap before they name it.**
Every account has something that did not go as planned. A missed milestone. A feature that took too long. A support ticket that stayed open two weeks longer than anyone wanted. If you name it first, you own the narrative. If they name it first, it becomes evidence in their case against renewal.

**Rule 4: The price conversation is not a negotiation. It is a comparison.**
The question is never "is this worth the renewal price." The question is "is this worth more than the cost of switching." These are different questions with different answers. Make sure you are answering the right one.

**Rule 5: Ask for the renewal on the second-to-last call, not the last one.**
The last call is for confirming a decision that has already been made. If you are asking for the renewal on the last call, you are asking too late. The second-to-last call is where the real conversation happens and where you have enough time to respond if the answer is complicated.

**Rule 6: Silence after the ask is not a bad sign. Filling it is.**
When you have made your case and asked for the renewal, stop talking. The CSM who rushes to fill the silence with concessions — discounts, added features, extended terms — is not relationship-managing. They are negotiating against themselves.

---

### THE RENEWAL CONVERSATION FRAMEWORK

**Step 1: The Evidence Statement (You, 90 seconds)**
"Before we talk about next year, I want to spend two minutes on what this year actually produced. When you signed with us in [month], the goal was [specific outcome]. Here is where we are: [specific outcome number]. Against that benchmark, [context — how they compare to peers in the Retention Ledger]. That is the foundation of what I want to continue building on."

**Step 2: The Gap Acknowledgment (You, 30 seconds)**
"There are two things I want to name that did not go as planned. [Item 1 — brief, specific, past tense]. [Item 2 — same]. Here is what changed and what the next twelve months looks like differently because of it."

**Step 3: The Continuation Frame (You, 60 seconds)**
"What I am recommending is [specific renewal structure]. The reason I am recommending that structure is [specific rationale tied to their business direction, not your product features]."

**Step 4: The Ask (You, 10 seconds)**
"Does that make sense to move forward on?"

Then stop talking.

---

### BEFORE → AFTER

**BEFORE — What most renewal conversations sound like:**
"Hi Sarah, great to connect as always. So we are coming up on the renewal in about six weeks and I just wanted to check in and see how things are going from your side, if there are any concerns, and then walk you through some of the things we have been doing and maybe talk about the next year..."

*What Sarah hears: This person does not know whether they have delivered value or not. They are asking me to tell them.*

**AFTER — What the renewal conversation should sound like:**
"Sarah, I want to start with what the year produced before we talk about what is next. When you signed in April, the goal was to reduce manual reporting time for your CS team. You are at 6.5 hours per week down from 22 — that is a 70% reduction across a team of eight. I want to talk about what the next year looks like building on that. I also want to name two things that did not go as planned before you do."

*What Sarah hears: This person has been paying attention. They know what matters to me. They are not afraid of the problems.*

---

### THE SCRIPT

**USE WHEN:** Annual or multi-year renewal, 60–90 days out, first formal renewal conversation.

```
"[Name], before we talk about next year I want to spend two
minutes on what this year produced.

When you signed in [month], the stated goal was [specific
outcome from the original deal]. Here is where we are today:
[metric 1], [metric 2], [metric 3].

For context, the benchmark for [their segment] in our data
is [Retention Ledger benchmark]. You are [above/below/at]
that line.

There are two things I want to name that did not go as
planned: [item 1, past tense, resolved] and [item 2, status].
Here is what is different going into next year because
of both of them.

What I am recommending is [specific renewal structure].
That recommendation is based on [specific business rationale].

Does that make sense to move forward on?"
```

**COMMON MISTAKE:** Using the evidence statement to list product features you shipped. The customer does not care what you shipped. They care what changed in their business. "We released 47 product updates" is not an evidence statement. "Your team closed 23% more expansion revenue in accounts where we deployed the new signal model" is.

---

### THE QUESTION THAT TELLS YOU IF YOU ARE READY

Before you go into a renewal conversation, ask yourself one question: if this customer asked me "what did we get for this money," can I answer in thirty seconds without looking at my notes?

If the answer is no — if you have to go back to the CRM, pull the QBR deck, or ask your CS Ops team for the usage report — you are not ready for the renewal conversation. You are ready for the prep call before the renewal conversation.

The CSMs who get renewal decisions reversed in year two, three, and four are the ones who can answer that question without hesitation. The number lives in their head, not their dashboard. That is not data access. That is ownership.', 'Practitioner Playbook', true, true, now())
ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, summary=EXCLUDED.summary, body=EXCLUDED.body, pages=EXCLUDED.pages, category=EXCLUDED.category, included_in_vanguard=EXCLUDED.included_in_vanguard, published=EXCLUDED.published;