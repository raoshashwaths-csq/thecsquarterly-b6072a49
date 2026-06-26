// Single source of truth for Lumi's contextual speech bubble and drawer
// action grid. Add a new entry here and both surfaces update automatically.

export type LumiIconName =
  | "brain"
  | "messageCircleHeart"
  | "sitemap"
  | "clock"
  | "target"
  | "mailForward"
  | "chartDots"
  | "gitPullRequest"
  | "ear"
  | "route"
  | "calendarCheck"
  | "chartBar"
  | "microscope"
  | "stars"
  | "arrowsDiff"
  | "playerPlay"
  | "adjustments"
  | "tool"
  | "users"
  | "road"
  | "progress"
  | "trendingUp"
  | "bulb"
  | "databasePlus"
  | "scale"
  | "receipt"
  | "usersGroup"
  | "book"
  | "refresh"
  | "fileText";

export type LumiAction = {
  id: string;
  icon: LumiIconName;
  label: string;
  description: string;       // human-readable card body (max ~80 chars)
  bubbleMessage: string;     // max ~60 chars
  prompt: string;            // pre-filled into the chat input on click
  tier?: "free" | "vanguard";
  isNew?: boolean;
};

export type PageContext =
  | "dispatch"
  | "home"
  | "codex"
  | "codex-item"
  | "ai-readiness"
  | "benchmarks"
  | "pricing"
  | "account"
  | "vanguard"
  | "series"
  | "default";

export type LumiPageActionsRegistry = Record<PageContext, LumiAction[]>;

export const lumiPageActions: LumiPageActionsRegistry = {
  dispatch: [
    {
      id: "dispatch-debrief",
      icon: "messageCircleHeart",
      label: "Debrief this dispatch",
      description: "Apply the framework to a real account you're navigating.",
      bubbleMessage: "Which account does this apply to right now?",
      prompt:
        "I just finished reading this dispatch. Help me apply the main framework to a specific situation I'm navigating.",
      tier: "vanguard",
    },
    {
      id: "dispatch-extract",
      icon: "sitemap",
      label: "Extract the framework",
      description: "Turn the article into a reusable structured template.",
      bubbleMessage: "Extract a reusable framework from this article.",
      prompt:
        "Extract the core decision framework from this dispatch as a structured template I can save and reuse.",
      tier: "vanguard",
    },
    {
      id: "dispatch-brief",
      icon: "clock",
      label: "Give me the 5-minute brief",
      description: "3 facts, 2 insights, 1 actionable — under 200 words.",
      bubbleMessage: "Short on time? Get the 5-minute brief.",
      prompt:
        "Summarise this dispatch in the 3-2-1 format: 3 facts, 2 insights, 1 actionable. Keep it under 200 words.",
    },
    {
      id: "dispatch-situation",
      icon: "target",
      label: "Apply this to my situation",
      description: "Describe a live situation, Lumi maps the framework to it.",
      bubbleMessage: "Describe your situation — Lumi applies this framework.",
      prompt:
        "I want to apply what I just read to a specific situation. Let me describe it and you tell me how this dispatch's framework applies.",
      tier: "vanguard",
    },
    {
      id: "dispatch-draft",
      icon: "mailForward",
      label: "Draft a message using this",
      description: "An email, Slack message, or exec summary using this thesis.",
      bubbleMessage: "Turn this insight into a message you can send today.",
      prompt:
        "Help me draft a message — an email, Slack message, or executive summary — that applies the framework from this dispatch to a real account situation.",
      tier: "vanguard",
    },
    {
      id: "dispatch-benchmark",
      icon: "chartDots",
      label: "How does my team compare?",
      description: "Place your team against the benchmarks referenced here.",
      bubbleMessage: "Compare your metrics to this dispatch's benchmarks.",
      prompt:
        "Based on the benchmarks in this dispatch, help me understand where my team sits relative to the data referenced.",
    },
    {
      id: "dispatch-debate",
      icon: "gitPullRequest",
      label: "I disagree with this thesis",
      description: "Push back on the argument — Lumi steel-mans both sides.",
      bubbleMessage: "Disagree with the argument? Tell Lumi why.",
      prompt:
        "I want to push back on the thesis of this dispatch. Here's my objection:",
    },
    {
      id: "dispatch-audio",
      icon: "ear",
      label: "Read this to me",
      description: "An audio-ready version of the key points for your commute.",
      bubbleMessage: "Listen to this dispatch on your commute.",
      prompt:
        "Generate an audio-ready version of the key points from this dispatch — structured for listening, not reading.",
    },
  ],

  home: [
    {
      id: "home-situation",
      icon: "target",
      label: "I have a situation right now",
      description: "Bring a live account problem and think it through together.",
      bubbleMessage: "Bring your current account problem to Lumi.",
      prompt:
        "I'm dealing with a specific account situation right now and I need help thinking through it.",
      tier: "vanguard",
    },
    {
      id: "home-reading-path",
      icon: "route",
      label: "What should I read first?",
      description: "A reading path matched to your role and the week ahead.",
      bubbleMessage: "Lumi picks what to read based on your week.",
      prompt:
        "Based on what you know about my professional context, which past dispatches should I read this week and why?",
      tier: "vanguard",
    },
    {
      id: "home-checkin",
      icon: "calendarCheck",
      label: "Monday check-in",
      description: "Set context for the week — three questions, 90 seconds.",
      bubbleMessage: "Set your context for the week — 90 seconds.",
      prompt:
        "Let's do the Monday check-in. Ask me your three questions about the week ahead.",
      tier: "vanguard",
    },
    {
      id: "home-benchmark",
      icon: "chartBar",
      label: "Where does my team stand?",
      description: "NRR and payback compared to your ACV band.",
      bubbleMessage: "See how your NRR compares to your ACV band.",
      prompt:
        "Help me understand how my team's metrics compare to the benchmark data for my ACV band.",
    },
    {
      id: "home-research",
      icon: "microscope",
      label: "Research a CS topic",
      description: "A deep-dive research session with Lumi as co-pilot.",
      bubbleMessage: "Deep-dive on any CS topic with Lumi.",
      prompt:
        "I want to do a deep research session on a specific CS topic. I'll describe what I'm trying to understand.",
      tier: "vanguard",
    },
  ],

  codex: [
    {
      id: "codex-recommend",
      icon: "stars",
      label: "Which playbook do I need?",
      description: "Describe the challenge, Lumi picks the right playbook.",
      bubbleMessage: "Describe your situation — Lumi picks the playbook.",
      prompt:
        "I'll describe my current challenge and I want you to recommend which playbook in the Codex is most relevant.",
    },
    {
      id: "codex-compare",
      icon: "arrowsDiff",
      label: "Compare two playbooks",
      description: "Side-by-side: different approaches and when to use each.",
      bubbleMessage: "Not sure which framework? Compare two playbooks.",
      prompt:
        "Help me compare two Codex playbooks — explain their different approaches and when to use each.",
      tier: "vanguard",
    },
    {
      id: "codex-situation",
      icon: "target",
      label: "Find the right framework",
      description: "A specific account situation mapped to the right framework.",
      bubbleMessage: "Tell Lumi your situation — it picks the framework.",
      prompt:
        "I have a specific account situation. Tell me which framework in the Codex applies and why.",
      tier: "vanguard",
    },
  ],

  "codex-item": [
    {
      id: "codex-item-apply",
      icon: "playerPlay",
      label: "Walk me through this playbook",
      description: "Step-by-step coaching with questions at each stage.",
      bubbleMessage: "Lumi walks you through this playbook step by step.",
      prompt:
        "Walk me through this playbook step by step, asking me the questions I need to answer at each stage.",
      tier: "vanguard",
    },
    {
      id: "codex-item-adapt",
      icon: "adjustments",
      label: "Adapt this for my context",
      description: "Customise for your ACV band, team size, and situation.",
      bubbleMessage: "Customise this for your ACV band and vertical.",
      prompt:
        "Adapt this playbook for my specific context — my ACV band, team size, and current situation.",
      tier: "vanguard",
    },
    {
      id: "codex-item-extract",
      icon: "sitemap",
      label: "Extract the decision criteria",
      description: "Pull the core criteria and inputs as a clean template.",
      bubbleMessage: "Pull the decision criteria from this playbook.",
      prompt:
        "Extract the core decision criteria and input variables from this playbook as a clean structured template.",
    },
  ],

  "ai-readiness": [
    {
      id: "aireadiness-interpret",
      icon: "chartDots",
      label: "Interpret my score",
      description: "What your AI Readiness score means in practical terms.",
      bubbleMessage: "Lumi explains what your AI Readiness score means.",
      prompt:
        "Help me understand what my AI Readiness score means in practical terms — what are the implications for my team?",
    },
    {
      id: "aireadiness-gaps",
      icon: "tool",
      label: "What should I fix first?",
      description: "Prioritise which dimension to address before the others.",
      bubbleMessage: "Which dimension should you fix first?",
      prompt:
        "Based on my AI Readiness dimension scores, which gap should I prioritise addressing first and why?",
      tier: "vanguard",
    },
    {
      id: "aireadiness-benchmark",
      icon: "users",
      label: "How do I compare to my ACV band?",
      description: "Your score against operators at 120%+ NRR in your band.",
      bubbleMessage: "Compare to operators at your ACV level.",
      prompt:
        "How does my AI Readiness score compare to operators in my ACV band who are running at 120%+ NRR?",
    },
    {
      id: "aireadiness-roadmap",
      icon: "road",
      label: "Build my 90-day AI roadmap",
      description: "A realistic 90-day roadmap from your diagnostic results.",
      bubbleMessage: "Lumi builds your 90-day AI readiness roadmap.",
      prompt:
        "Based on my diagnostic results, help me build a realistic 90-day roadmap for improving my team's AI readiness.",
      tier: "vanguard",
    },
  ],

  benchmarks: [
    {
      id: "benchmarks-position",
      icon: "progress",
      label: "Where do I sit on the distribution?",
      description: "Place your numbers on the curve for your ACV band.",
      bubbleMessage: "Enter your NRR — see exactly where you stand.",
      prompt:
        "I want to understand where my metrics sit on the benchmark distribution for my ACV band. I'll share my numbers.",
    },
    {
      id: "benchmarks-gap",
      icon: "trendingUp",
      label: "What would closing the gap mean?",
      description: "Quantify the revenue impact of P50 → P75.",
      bubbleMessage: "Revenue impact of moving from P50 to P75?",
      prompt:
        "Help me quantify the revenue impact of moving my NRR from where it is today to the P75 benchmark for my ACV band.",
      tier: "vanguard",
    },
    {
      id: "benchmarks-drivers",
      icon: "bulb",
      label: "What drives the P75 operators?",
      description: "Structural differences between median and top-quartile.",
      bubbleMessage: "What do top-quartile operators do differently?",
      prompt:
        "Based on the benchmark data, what are the structural differences between median operators and P75 operators in my ACV band?",
      tier: "vanguard",
    },
    {
      id: "benchmarks-submit",
      icon: "databasePlus",
      label: "How do I contribute my data?",
      description: "Submit your numbers and sharpen the benchmark pool.",
      bubbleMessage: "Contribute your numbers and sharpen the benchmark.",
      prompt:
        "How do I submit my team's metrics to the benchmark pool, and what happens with my data once I do?",
    },
  ],

  pricing: [
    {
      id: "pricing-compare",
      icon: "scale",
      label: "Help me choose the right tier",
      description: "Match your role and team size to the right plan.",
      bubbleMessage: "Not sure which plan fits? Lumi helps you decide.",
      prompt:
        "I'll describe my role and team size — help me figure out which CS Quarterly plan is right for me.",
    },
    {
      id: "pricing-justify",
      icon: "receipt",
      label: "Justify this to my manager",
      description: "A short business case for Vanguard you can forward.",
      bubbleMessage: "Lumi drafts a business case for your manager.",
      prompt:
        "Help me write a short business case justifying a Vanguard subscription to my manager or VP.",
    },
    {
      id: "pricing-team",
      icon: "usersGroup",
      label: "Is the Team plan right for us?",
      description: "Talk through team size and needs to test the fit.",
      bubbleMessage: "Find out if the Team plan fits your CS org.",
      prompt:
        "I'm considering the Team plan for my CS team. Ask me about my team's size and needs and help me figure out if it's the right fit.",
    },
  ],

  series: [
    {
      id: "series-context",
      icon: "book",
      label: "Catch me up on this series",
      description: "A quick synthesis of what the series has argued so far.",
      bubbleMessage: "Just arrived? Lumi catches you up on the series.",
      prompt:
        "Give me a quick synthesis of what this series has covered so far, so I have context for this instalment.",
    },
    {
      id: "series-apply",
      icon: "target",
      label: "Apply the thesis to my team",
      description: "Map the series argument to your ACV band and team model.",
      bubbleMessage: "How does the series argument apply to your org?",
      prompt:
        "How does the central argument of this series apply to my specific situation — my ACV band, team model, and current challenges?",
      tier: "vanguard",
    },
    {
      id: "series-debrief",
      icon: "messageCircleHeart",
      label: "Debrief this instalment",
      description: "Talk through the part that challenged your thinking most.",
      bubbleMessage: "Which part of this instalment challenged you most?",
      prompt:
        "I just read this instalment of the series. I want to talk through the part that challenged my thinking most.",
      tier: "vanguard",
    },
  ],

  vanguard: [
    {
      id: "vanguard-overview",
      icon: "stars",
      label: "What is The CS Vanguard?",
      description: "The argument, the cadence, and how to read it.",
      bubbleMessage: "New to Vanguard? Lumi gives you the lay of the land.",
      prompt:
        "Give me a one-paragraph orientation to The CS Vanguard section: what it covers, why it matters, and how to read it.",
    },
    {
      id: "vanguard-latest",
      icon: "fileText",
      label: "Surface the latest dispatch",
      description: "The most recent Vanguard piece — why it matters now.",
      bubbleMessage: "What's the latest Vanguard dispatch about?",
      prompt:
        "What's the most recent Vanguard dispatch about, and why does it matter for an operator this week?",
    },
  ],

  account: [
    {
      id: "account-memory",
      icon: "brain",
      label: "What does Lumi remember?",
      description: "What Lumi knows about your professional context so far.",
      bubbleMessage: "See what Lumi knows about your context.",
      prompt:
        "Summarise what you know about my professional context from our previous conversations.",
      tier: "vanguard",
    },
    {
      id: "account-update",
      icon: "refresh",
      label: "Update my context",
      description: "Tell Lumi what's changed — accounts, role, priorities.",
      bubbleMessage: "Tell Lumi what's changed in your role.",
      prompt:
        "I want to update you on what's changed in my professional context — new accounts, changed role, different priorities.",
      tier: "vanguard",
    },
  ],

  default: [
    {
      id: "default-situation",
      icon: "target",
      label: "I have a situation right now",
      description: "Think through a live CS problem with Lumi.",
      bubbleMessage: "Bring your current CS problem to Lumi.",
      prompt:
        "I'm navigating a specific CS situation and I need help thinking through it.",
      tier: "vanguard",
    },
    {
      id: "default-benchmark",
      icon: "chartBar",
      label: "How does my team compare?",
      description: "NRR and payback against your ACV band's benchmarks.",
      bubbleMessage: "See where your team sits against benchmarks.",
      prompt:
        "Help me understand how my team's NRR and payback compare to the benchmark for my ACV band.",
    },
    {
      id: "default-dispatch",
      icon: "fileText",
      label: "What should I read this week?",
      description: "The most relevant dispatch for your context right now.",
      bubbleMessage: "Lumi picks the most relevant dispatch for you.",
      prompt:
        "Based on what you know about my context, what's the most relevant dispatch I should read this week?",
      tier: "vanguard",
    },
  ],
};
