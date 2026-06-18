INSERT INTO public.playbooks (slug, title, summary, cover_image_url, price_cents, pages, body, category, included_in_vanguard, published, published_at)
VALUES ('escalation-first-60-seconds', 'The Escalation Call You Have Been Avoiding', 'What to say in the first sixty seconds of a crisis conversation — and what never to say', NULL, 4900, 8, '### What to say in the first sixty seconds of a crisis conversation — and what never to say

### THE 4 RULES OF THE ESCALATION CALL

**Rule 1: Never lead with what you are doing to fix it.**
You are not ready to talk about the fix until you have talked about the impact. The fix is the last third of the call, not the first sentence.

**Rule 2: Name the impact before they do.**
The most disarming thing you can say to an escalating customer is a precise description of what this has cost them before they have described it to you. It signals that you have been paying attention and that they do not need to convince you of the severity.

**Rule 3: Own the communication failure, not just the product failure.**
In almost every escalation I have managed, there was a product failure and a communication failure. The product failed to perform. CS failed to surface the risk before it became a crisis. Own both. Customers rarely churn because of product failures alone. They churn because of product failures that nobody warned them about.

**Rule 4: The only promise you make on the escalation call is the one you can keep today.**
Not "we will have this resolved by end of week." If you do not know that, do not say it. "I will have a status update for you by 2pm today with a realistic resolution timeline" is a promise you can keep. It is also a promise that demonstrates operational control. Make small, keepable promises. Make them quickly.

---

### THE FRAMEWORK

**Zone 1: The Acknowledgment (0–60 seconds, you speak)**
Not an apology. Not an explanation. An acknowledgment of the specific business impact in their terms.

"I am on this call because I understand that [specific impact] has been affecting [specific team or process] since [specific time]. Before we talk about resolution, I want to make sure I am describing the situation the same way you are."

**Zone 2: The Confirmation (60–120 seconds, they speak)**
"Can you tell me what the impact looks like from your side right now?" Let them speak. Do not interrupt. Take notes. What they tell you here is what the debrief, the escalation summary, and the executive communication will be built on.

**Zone 3: The Ownership Statement (120–180 seconds, you speak)**
"Based on what you have described, here is what I own on our side: [specific operational accountability]. Here is what I should have caught earlier: [communication failure, not product failure — that is for the engineering team]. Here is what I am doing in the next [specific timeframe]."

**Zone 4: The Promise (180–240 seconds)**
One promise. Specific. Achievable. With a time.

---

### THE SCRIPT

**USE WHEN:** The customer has escalated via email, Slack, or phone and you are getting on a call within the first four hours of the escalation.

```
Opening (before the customer speaks):
"[Name], thank you for getting on this call. I want to start
by making sure I understand the situation the same way you do.

Based on what you''ve shared, [specific impact] has been
affecting [team/process/metric] since [time]. Is that right,
or is there more I should know about the scope?"

[Let them speak. Do not fill silences. Take notes.]

After they have spoken:
"I hear you. What you''re describing is [restate in their terms
— not your terms]. And I want to be direct: [specific thing
you should have caught earlier or communicated better].
That is on us.

Here is where things stand right now: [honest status, no spin].

Here is what I am committing to: [one specific promise with
a specific time].

Between now and [that time], [your name] or I will be
your single point of contact. Any update goes through us.
No more information falling through the gaps."
```

**COMMON MISTAKE:** Bringing your engineering lead into the call in the first thirty minutes to explain the technical failure. The customer does not need a technical explanation in the first thirty minutes. They need a business acknowledgment. The technical explanation comes later, in writing, after the immediate operational situation is stabilised. Bringing in engineering too early signals that the CSM is not confident enough to own the first phase of the conversation themselves.

---

### THE THING MOST CSM TRAINING MISSES

Every escalation has two tracks running simultaneously.

**Track 1:** The operational track — what broke, why, when it will be fixed, what the process change is.

**Track 2:** The relationship track — whether the customer still trusts you after this.

Most CS training focuses entirely on Track 1. The scripts, the escalation matrices, the SLA commitments — all operational. Track 1 is necessary but not sufficient.

Track 2 is determined almost entirely by the first sixty seconds of the escalation call and the quality of communication in the forty-eight hours that follow. A customer whose operational problem takes three days to resolve but who receives clear, honest, frequent communication on Track 2 often comes out of the escalation with a stronger relationship than they had before.

A customer whose operational problem is resolved in six hours but who received confusing, delayed, defensive communication on Track 2 has started their churn clock.

Resolve Track 1. Win on Track 2. The second one is the one that determines whether you still have the account in twelve months.', 'Practitioner Playbook', true, true, now())
ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, summary=EXCLUDED.summary, body=EXCLUDED.body, pages=EXCLUDED.pages, category=EXCLUDED.category, included_in_vanguard=EXCLUDED.included_in_vanguard, published=EXCLUDED.published;