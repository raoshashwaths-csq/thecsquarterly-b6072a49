## Tier-gating audit — Reader Engagement Features (Planned)

Source of truth: `src/lib/tiers.ts` (Designation: `reader`, `practitioner`, `operator`, `team`, `scale`, `enterprise`, `strategic_partner`) with Lumi caps `Reader 1/week · Practitioner 50/mo · Operator 100/mo · Team 500 pool · Scale 2,000 pool · Enterprise 5,000 pool · Strategic unlimited`. Engagement section lives at `docs/CS-Quarterly-Build-Bible.md` lines 2899–3131.

This plan **only updates the Bible section** (no code, no tables, no routes). Approval will let me rewrite the matrix and append an "Edge cases & open questions" subsection.

---

### A. Naming / tier conflicts (must fix before build)

1. **"Vanguard only" is undefined.** `Lumi Memory` and `Tuesday Morning Brief` are gated to "Vanguard," but Vanguard is not a designation in `tiers.ts`. Workspace knowledge still references Vanguard as the legacy paid tier name. Decide one of:
   - Re-gate to **Operator+** (next premium individual tier above Practitioner), or
   - Re-gate to **Practitioner+** (broader access, faster habit formation).
   Recommendation: **Practitioner+ for Lumi Memory** (it is the moat — every paid reader needs it) and **Operator+ for Tuesday Morning Brief** (per-user generation cost).

2. **Team / Scale / Enterprise / Strategic Partner not enumerated.** Matrix stops at "Vanguard." Inheritance is implied but ambiguous for pooled tiers — especially Lumi Memory (personal artifact) on a shared seat pool. Decide: memory is **per-seat**, not pooled.

3. **"Operator+ for unlimited" Situation Room.** Operator is capped at 100 Lumi/month, not unlimited. Either remove "unlimited" wording or define the Practitioner cap (e.g., 5 Situation Rooms/mo) and let Operator inherit the pool ceiling.

---

### B. Lumi-cap accounting (cost / fairness issues)

Every feature that calls Lumi should declare whether it counts against the monthly cap. Today the matrix is silent. Proposed accounting:

| Feature | Counts against Lumi cap? | Notes |
|---|---|---|
| Lumi Debrief | Yes | Free 1/mo conflicts with Reader's 1/week ceiling — pick one accounting axis. |
| Tuesday Brief | No (system push) | Generation cost absorbed by editorial budget. |
| Weekly Check-In | No (3 short Q/A) | Or count as 1 session. |
| Framework Extractor | Yes | 1 session per extract. |
| Situation Room | Yes | Multi-turn; count as 1 per opened room. |
| Archive Intelligence | Yes | RAG-heavy — could burn Practitioner's 50/mo in a week. |
| Deep Research | Yes (heavy) | Count as 5 sessions or expose a separate "Research credit." |
| Lumi Draft | Yes | 1 per draft. |
| 5-min Brief Toggle | **Conflict** | Doc gates as Free; uses Lumi. Either pre-render briefs at publish time (no per-user call) or move to Practitioner+. |
| Ask Lumi on annotation | Yes | 1 per thread. |
| Personalised Reading Path | No (weekly batch) | Pre-computed, not on-demand. |
| Your Benchmark Position | No (interp paragraph cached) | One-shot per submission. |

---

### C. Free-tier overreach

The current matrix gives Free more than the canonical Reader tier can support:

- **Inline annotation (Free: highlight + note)** — requires per-user persisted workspace storage; Reader tier does not currently include a workspace. Either ship a minimal annotation store for Reader or move annotation to Practitioner+.
- **5-min Brief Toggle (Free)** — Lumi call on a tier capped at 1 session/week (see B).
- **Operator Profile onboarding (All tiers)** — visitors (unauthenticated) cannot have a profile. Either trigger on first sign-up (Reader+) or capture anonymously and bind on auth.
- **Dispatch Reactions (All tiers)** — fine, but Reader contributions feed editorial dashboard; confirm anonymisation rules.
- **Operator Index read (Free)** — fine, but Reader cannot contribute (Check-In is Practitioner+), so the index aggregate excludes the Free base. Acceptable, document explicitly.

---

### D. Cross-feature dependency edges

- **Lumi Memory** is a prerequisite for Tuesday Brief, Situation Room, Personalised Reading Path, Your Benchmark Position (interpretation), Lumi Draft (voice tuning). Any tier that unlocks these without Memory will feel generic. Implication: Memory must be gated **no higher** than the lowest-gated dependent (Framework Extractor / Annotation Ask Lumi at Practitioner+). Confirms recommendation A.1.
- **Operator Debate** publishes a community artifact authored by Practitioner+ pairs. Reader read access requires moderation surface — not yet planned.
- **Board-ready PDF (Practitioner+)** overlaps in name with **Scale tier's "Quarterly branded benchmark PDF"**. Different artifact (per-dispatch export vs. quarterly benchmark report); rename one to avoid pricing-page confusion.
- **Audio mode (Practitioner+)** has TTS cost per dispatch per listener. Define a per-tier listen cap or pre-render once per voice per dispatch.
- **Deep Research (Operator+)** on pooled tiers (Team/Scale/Enterprise) — token-heavy; one user could drain the pool. Recommend a per-seat soft cap.

---

### E. Proposed corrected matrix (to replace lines 3095–3119)

```
Feature                        | Reader      | Practitioner    | Operator        | Team/Scale/Ent (per seat) | Strategic
Lumi Debrief                   | 1 / month*  | unlimited       | unlimited       | unlimited                 | unlimited
Lumi Memory                    | —           | ✅              | ✅              | ✅ (per seat, not pooled) | ✅
Tuesday Morning Brief          | —           | —               | ✅              | ✅                        | ✅
Lumi Framework Extractor       | —           | ✅ (1 cap unit) | ✅              | ✅                        | ✅
Lumi Situation Room            | —           | 5 / month       | within 100 cap  | within pool               | unlimited
Lumi Weekly Check-In           | —           | ✅ (uncounted)  | ✅              | ✅                        | ✅
Inline annotation              | highlight+note (requires Reader workspace) | + Ask Lumi | + Ask Lumi | + Ask Lumi | + Ask Lumi
Audio mode                     | —           | 4 dispatches/mo | unlimited       | unlimited                 | unlimited
5-min brief toggle             | ✅ (pre-rendered) | ✅          | ✅              | ✅                        | ✅
Live benchmark callouts        | render      | + drill-down    | + drill-down    | + drill-down              | + drill-down
Board-ready PDF (per dispatch) | —           | ✅              | ✅              | ✅                        | ✅
Operator profile onboarding    | ✅ (on sign-up) | ✅           | ✅              | ✅                        | ✅
Personalised reading path      | —           | ✅              | ✅              | ✅                        | ✅
Your benchmark position        | —           | ✅              | ✅              | ✅                        | ✅
Dispatch reactions             | ✅          | ✅              | ✅              | ✅                        | ✅
Operator Debate                | read        | participate     | participate     | participate               | participate
Operator Index                 | read        | read+contribute | read+contribute | read+contribute           | read+contribute
Deep Research mode             | —           | —               | ✅ (5 cap units)| ✅ (soft per-seat cap)    | ✅
Archive Intelligence           | —           | ✅              | ✅              | ✅                        | ✅
Lumi Draft                     | —           | ✅              | ✅              | ✅                        | ✅
* Lumi Debrief on Reader competes with Reader's 1-session/week ceiling — choose one accounting axis.
```

---

### F. Edge cases to document inline

1. **Anonymous / logged-out visitors** — which features render at all (5-min brief, reactions, callouts)?
2. **Trial / lapsed subscribers** — does Memory persist or freeze on downgrade? Recommend freeze + read-only access for 30 days.
3. **Team seat downgrade** — Memory artifact ownership when a seat is removed.
4. **GDPR delete** — cascading from Memory into Operator Index aggregate (anonymisation must survive deletion).
5. **Admin / impersonation** — admins viewing as a reader should not write to that reader's Memory.
6. **Pooled Lumi exhaustion** — Team/Scale/Enterprise pool drained mid-month: which features degrade first (Deep Research → Situation Room → Draft → Debrief)?
7. **Free reader hitting weekly cap mid-Debrief** — graceful upgrade nudge, not a hard cut.
8. **Audio mode language fallback** — multilingual voices (mem://product/prd-v3 §Lumi Multilingual) interact with the two-voice (Analytical/Witty) toggle — define matrix.
9. **Operator Debate moderation** — Free readers see Practitioner+ authored content; abuse / takedown path is undefined.
10. **Editorial overrides** — any feature should be flag-toggleable per-dispatch (e.g. suppress Debrief on light essays).

---

### Scope of change if approved

Single file edit: `docs/CS-Quarterly-Build-Bible.md`.
- Replace tier-gating table at lines 3095–3119 with the corrected matrix above.
- Update Lumi Memory and Tuesday Morning Brief gating lines (2930, 2938) to remove "Vanguard."
- Append a new "Edge cases & open questions" subsection after line 3131.
- Leave the feature cards, indispensability ladder, and build sequence untouched.

No code, components, routes, server functions, migrations, env vars, or memory writes.