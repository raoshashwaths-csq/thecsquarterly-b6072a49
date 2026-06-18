INSERT INTO public.playbooks (slug, title, summary, cover_image_url, price_cents, pages, body, category, included_in_vanguard, published, published_at)
VALUES ('champion-leaves-48-hours', 'The First 48 Hours After Your Champion Leaves', 'A timestamped action plan for the crisis most CS teams discover two weeks too late', NULL, 4900, 10, '### A timestamped action plan for the crisis most CS teams discover two weeks too late

### THE 48-HOUR ACTION PLAN

**Hour 0–4: Intelligence gathering**

Before you reach out to anyone inside the account, find out what you can from the outside.

Search LinkedIn for the champion''s profile. Have they updated it? Are they still listed at the company or have they already moved? Is their new role visible? What did they post on their way out?

Check your email thread history. What was the last substantive conversation? Was it positive, operational, or unresolved? An unresolved thread from the champion is a liability you need to address before you approach their successor.

Check the account''s Reckoning Ledger — or whatever your activity log shows. Who else has been active in the account over the past ninety days? Is there a secondary contact who has attended meetings, opened emails, responded to anything? That person is your immediate target.

**Hour 4–8: Reach out to the departing champion directly**

This is the step most CSMs skip out of discomfort. Do not skip it.

Send a personal message — not a formal email, not a Slack through the shared channel. A direct, human message acknowledging their departure and asking two specific questions:

One: Is there someone they would like to introduce you to as part of their handover?
Two: Is there anything about the account or the relationship they want you to know before the transition?

The first question gives them the social comfort of a graceful exit. The second one is the real one. What they tell you here — the internal dynamics, the concerns about the new stakeholder, the things that were left unsaid — is intelligence you cannot get anywhere else.

**Hour 8–16: Map the power structure**

You need to understand three things before you reach out to anyone new inside the account.

Who has budget authority over the renewal? This is not always the person with the senior title. In many organisations, the budget holder for a software tool is a Director of Operations or a VP of Finance, not the CS team''s executive sponsor.

Who was the champion''s peer at the same seniority level? This person is often underestimated as a relationship target. They have political capital at the same level as the departing champion, they have not yet formed an opinion of you, and they are often curious about what the departing colleague valued.

Who is the champion''s replacement, if one has been named? This is your primary new relationship. But do not reach out to them first. Reach out to them after you have mapped the context around them.

**Hour 16–24: Reach out to the secondary contact**

Not the new champion. Not the executive. The secondary contact you identified in your intelligence sweep — the person who has been quietly attending meetings and reading your emails for ninety days.

The outreach looks like this:

"[Name], I wanted to reach out directly given [champion name]''s transition. I am conscious that there will be some continuity questions on your end and I want to make sure you have everything you need during the transition. Would you have twenty minutes this week for a brief conversation?"

This call has one purpose: to understand the internal dynamics of the account in the wake of the departure before you make any formal moves. Ask, listen, do not pitch anything.

**Hour 24–48: Reach out to the new champion or executive**

Now, and only now, you reach out to the incoming stakeholder. Not with a product update. Not with a renewal conversation. With the same opener that appears in the Inheritance Call script: a request to understand their business before you talk about anything else.

"[Name], I wanted to reach out following [champion name]''s transition. Rather than jumping straight into where we were, I would love to spend thirty minutes understanding your priorities and where you want [your company] to focus over the next twelve months. I''ll come prepared with everything I know about the account, but I want to hear from you first."

---

### THE SCRIPT

**Hour 4–8 — Reaching out to the departing champion:**

```
"[Name], I heard you are moving on from [company] — congratulations
on whatever comes next.

I want to be respectful of your transition rather than add
to your plate. Two quick questions if you have five minutes:

Is there someone you''d like to introduce me to as part of
your handover? And is there anything about the account or
our work together you''d want me to know going forward?

Whatever you share, I''ll treat it as context, not as a
formal handover document. Just want to make sure the
account is in good hands from your side."
```

**Hour 24–48 — Reaching out to the new stakeholder:**

```
"[Name], I''m [your name] from [company] — I''ve been the
[title] for [their company''s] account for the past [tenure].

With [champion name]''s transition I wanted to reach out
directly rather than wait for a formal introduction.

I''m not here to pick up where we left off. I''d rather
spend thirty minutes understanding where you are and where
you want to go before I assume anything about what matters
to you.

Would you have time this week? I''ll come prepared with
full account context so you''re not starting from zero."
```

---

### WHAT THE DATA SAYS

Accounts where the CSM makes contact with a new stakeholder within 48 hours of a champion departure retain at a dramatically higher rate than accounts where first contact happens after two weeks. The number varies by study but the direction is consistent and the magnitude is significant — some data suggests the difference in retention probability is 30–40 percentage points.

This is not because the CSM has better relationships. It is because the forty-eight-hour contact establishes the frame for the new relationship before anyone else does.

Your competitors are also in contact with your accounts. The window in which you have an advantage is the window in which you know about the departure and they do not. That window is measured in hours.', 'Practitioner Playbook', true, true, now())
ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, summary=EXCLUDED.summary, body=EXCLUDED.body, pages=EXCLUDED.pages, category=EXCLUDED.category, included_in_vanguard=EXCLUDED.included_in_vanguard, published=EXCLUDED.published;