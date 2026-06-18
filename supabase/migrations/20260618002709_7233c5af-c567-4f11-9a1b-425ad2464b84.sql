INSERT INTO public.playbooks (slug, title, summary, cover_image_url, price_cents, pages, body, category, included_in_vanguard, published, published_at)
VALUES ('executive-digest-replaces-qbr', 'Stop Building QBR Decks. Build This Instead.', 'The Executive Digest — what quarterly business reviews should have been all along', NULL, 4900, 9, '### The Executive Digest — what quarterly business reviews should have been all along

### THE EXECUTIVE DIGEST FORMAT

The Executive Digest is not a meeting. It is a document — delivered two business days before any live conversation — that contains everything the executive needs to know and nothing they do not.

It is one page. Structured in five sections. Written in three hours or less with modern tooling. Delivered asynchronously.

If the executive wants to discuss it, you schedule a thirty-minute conversation. Not ninety minutes. Thirty.

The structure:

**Section 1: The Headline Number (one sentence)**
"Your NRR on the book of business managed with [product] this quarter was [X]%, placing you in the [top/bottom X%] of [segment] operators in our current benchmark data."

One sentence. The number that matters. Benchmarked. No preamble.

**Section 2: What Changed (three to five bullets, each with a number)**
Not what you did. What changed in their business as a result. The distinction matters.

Wrong: "We completed the advanced analytics module rollout across your enterprise accounts."
Right: "Your team reduced manual reporting time by 68% following the advanced analytics rollout — equivalent to 4.2 hours per CSM per week across 11 accounts."

**Section 3: What Did Not Go as Planned (one to two bullets)**
Not buried in an appendix. Not softened into a positive framing. Named directly. With status.

"SSO integration for your UK accounts ran six weeks behind commitment. It is complete as of [date]. Here is what changed in the process to prevent the same delay in future integrations."

**Section 4: What We Recommend for Next Quarter (two to three specific actions)**
Not "continue to drive adoption." Specific actions with owners, timelines, and expected outcomes.

"[Action], owned by [person], by [date], expected outcome: [specific metric change]."

**Section 5: What We Need From You (one specific ask)**
One ask. No more. The ask that, if unresolved, creates the biggest risk to the relationship.

"To achieve [specific outcome], we need a decision on [specific thing] by [specific date]. The delay cost is [quantified]."

---

### THE SCRIPT — DELIVERING THE FORMAT TO THE CUSTOMER

**USE WHEN:** Transitioning an existing QBR relationship to the Executive Digest model.

```
"[Name], I want to propose a change to how we run
our quarterly reviews, and I want to explain why.

The format we have been using asks you to sit for
ninety minutes reviewing data that mostly confirms
what you already know. I do not think that is the
best use of your time.

What I would like to try: I send you a one-page
Executive Digest two days before our scheduled
conversation. It contains the headline number,
what changed this quarter, what did not go as planned,
what I recommend for next quarter, and one specific ask.

If the document covers what you need, you have ninety
minutes back. If you want to discuss something in it,
we keep the call to thirty minutes and go deep on that.

Does that sound like a better use of your time?"
```

Almost every executive says yes. Because it is.

---

### BEFORE → AFTER

**BEFORE — The standard QBR opener:**
"Great to be here for our Q2 QBR. I have put together a comprehensive deck covering the last ninety days and I am going to walk you through product usage, adoption metrics, the support summary, what the product team has been shipping, and then we will open up for discussion..."

*[Executive checks their phone at slide three. Has forgotten the context by slide eight. Commits to nothing. Meeting ends with "let''s stay in touch."]*

**AFTER — The Executive Digest opener:**
"You have the digest. Let me give you sixty seconds on the headline and then I want to hear your reaction to section four specifically.

Your NRR this quarter came in at 118%. That is 6 points above the benchmark for your segment. The driver was the expansion on [three named accounts] — [CSM name] can take you through the mechanics of each one if you want the detail.

The one thing I want your decision on before we leave: [specific ask]. The window on that closes in [specific date] and I want to make sure you have the context to decide."

*[Executive closes the laptop. Engages fully. Makes a decision before the meeting ends.]*

---

### WHY MOST CS TEAMS WILL NOT ADOPT THIS

The Executive Digest requires something most QBR processes do not: a clear answer to the question "what changed in the customer''s business because of us this quarter."

If the answer to that question is unclear — if the CSM has been managing activity rather than outcomes — the Executive Digest exposes it immediately. A one-page document that cannot point to a specific business outcome number is not an Executive Digest. It is a to-do list with a logo on it.

The QBR''s bulk — the ninety minutes, the comprehensive deck, the appendices — is partly structural and partly cover. It gives the CSM something to hide behind when the value story is thin.

The Executive Digest removes the cover. If you adopt this format, you are committing to having a real answer to the real question every quarter. That commitment is what makes it valuable. It is also why it is uncomfortable.', 'Practitioner Playbook', true, true, now())
ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, summary=EXCLUDED.summary, body=EXCLUDED.body, pages=EXCLUDED.pages, category=EXCLUDED.category, included_in_vanguard=EXCLUDED.included_in_vanguard, published=EXCLUDED.published;