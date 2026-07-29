export type PanelType = "illustration" | "dialogue" | "single";

export interface SpeechBubble {
  character: "FELIX" | "NORA" | "BRENDAN";
  text: string;
  position: "top" | "bottom";
}

/** Session-1 panel shape: image-first, with legacy bubble/dialogue fields preserved for backwards compat. */
export interface StripPanel {
  type: PanelType;
  /** Session 1 — uploaded image URL (preferred over alt-text-only rendering). */
  imageUrl?: string;
  imageAlt?: string;
  stageDirection?: string;
  bubbles?: SpeechBubble[];
}

export interface Strip {
  id: number;
  title: string;
  hoverText: string;
  tag: string;
  panels: StripPanel[];
}

export const strips: Strip[] = [
  {
    id: 4,
    title: "The Single Thread",
    hoverText:
      "A champion with no backup is not a relationship. It is a dependency with an expiration date you cannot read.",
    tag: "STAKEHOLDER COVERAGE",
    panels: [
      {
        type: "illustration",
        imageAlt: "Nora at her desk, upbeat, monitors behind her",
        bubbles: [
          {
            character: "NORA",
            text: "Keller Group is in great shape. Marcus loves us. We talk every week. He sends me memes sometimes.",
            position: "bottom",
          },
        ],
      },
      {
        type: "illustration",
        imageAlt: "Felix at his desk, not looking up from legal pad",
        bubbles: [
          {
            character: "FELIX",
            text: "Does anyone else at Keller know who you are?",
            position: "top",
          },
        ],
      },
      {
        type: "illustration",
        imageAlt: "Nora thinking, slight uncertainty crossing her face",
        bubbles: [
          {
            character: "NORA",
            text: "Marcus knows everyone. He says he's our internal champion.",
            position: "bottom",
          },
        ],
      },
      {
        type: "dialogue",
        stageDirection:
          "Felix does not respond. He looks at Nora. His expression is unreadable.",
        bubbles: [
          {
            character: "NORA",
            text: "He sent me a very funny cat meme last Tuesday.",
            position: "top",
          },
          {
            character: "FELIX",
            text: "Go find their Head of Finance.",
            position: "bottom",
          },
        ],
      },
    ],
  },
  {
    id: 30,
    title: "The Toast",
    hoverText:
      "He puts the sticky note in his desk drawer. He does not throw it away.",
    tag: "THE WARM REVERSAL",
    panels: [
      {
        type: "illustration",
        imageAlt:
          "Felix on a difficult call, listening, expression unreadable. Nora at her adjacent desk, overhearing.",
        bubbles: [],
      },
      {
        type: "illustration",
        imageAlt:
          "Nora slides a sticky note across to Felix without looking up from her own screen",
        stageDirection: "Nora slides a sticky note across without looking up.",
        bubbles: [
          {
            character: "NORA",
            text: "She just promoted the person the product was supposed to replace. She's embarrassed. Don't mention the original use case.",
            position: "bottom",
          },
        ],
      },
      {
        type: "illustration",
        imageAlt:
          "Felix glances at the note. Into the phone, his posture shifts slightly.",
        bubbles: [
          {
            character: "FELIX",
            text: "The situation's changed. Let's talk about what you're solving for now.",
            position: "top",
          },
        ],
      },
      {
        type: "dialogue",
        stageDirection:
          "He hangs up. He looks at the sticky note for a moment. Then he puts it in his desk drawer. He does not throw it away.",
        bubbles: [
          {
            character: "FELIX",
            text: "How did you know that?",
            position: "top",
          },
          {
            character: "NORA",
            text: "She mentioned her performance review twice and didn't mention the product once.",
            position: "bottom",
          },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "The QBR",
    hoverText:
      "The EBR that wins renewals has the economic buyer in the room. The one that loses it has 52 slides.",
    tag: "EXECUTIVE ENGAGEMENT",
    panels: [
      {
        type: "illustration",
        imageAlt:
          "Nora rehearsing, standing, very animated, gesturing at her laptop screen",
        bubbles: [
          {
            character: "NORA",
            text: "Okay. I have 52 slides. Company highlights, product updates, roadmap preview, integration announcements—",
            position: "bottom",
          },
        ],
      },
      {
        type: "illustration",
        imageAlt: "Felix, still seated, one eyebrow slightly raised",
        bubbles: [
          {
            character: "FELIX",
            text: "When do you talk about their business?",
            position: "top",
          },
        ],
      },
      {
        type: "illustration",
        imageAlt: "Nora scrolling through slides on her screen, finding slide 47",
        bubbles: [
          {
            character: "NORA",
            text: 'Slide 47. It\'s called "Your Journey With Us So Far."',
            position: "bottom",
          },
        ],
      },
      {
        type: "illustration",
        imageAlt: "Felix picking up his tea. Nora watching him, realising.",
        bubbles: [
          {
            character: "FELIX",
            text: "Their CFO is going to look at the first slide and make a decision.",
            position: "top",
          },
          {
            character: "NORA",
            text: "About the renewal?",
            position: "bottom",
          },
        ],
      },
    ],
  },
];
