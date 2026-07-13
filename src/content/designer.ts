/** Copy + options for the AI Bracelet Designer (Phase 2). No hardcoded strings
 *  in the components — everything the flow shows lives here. */

export type DesignerChoice = { value: string; label: string; hex?: string };
export type DesignerStep = {
  id: "occasion" | "forWhom" | "vibe" | "colors" | "values";
  question: string;
  hint: string;
  multi: boolean;
  choices: DesignerChoice[];
};

export const designer = {
  meta: {
    title: "AI Designer",
    description:
      "Answer a few questions and our AI crafts three bracelets — each one editable in the studio and ready to order.",
  },
  entry: {
    eyebrow: "AI Bracelet Designer",
    title: "Tell us who it's for. We'll design it.",
    subhead:
      "Answer a few quick questions and our AI designer composes three bracelets — each one fully editable in the studio.",
    cta: "Start designing",
  },
  homeCta: {
    eyebrow: "New — AI Bracelet Designer",
    title: "Not sure where to start?",
    body: "Answer a few questions and let our AI design three bracelets just for you — ready to make your own.",
    cta: "Try the AI designer",
    href: "/designer",
  },
  studioLink: "Design with AI",
  gate: {
    eyebrow: "AI Bracelet Designer",
    title: "Sign in to design with AI",
    body: "The AI designer creates bracelets and saves them to your account. Sign in or create a free account to begin.",
    signIn: "Sign in",
    createAccount: "Create account",
  },
  steps: [
    {
      id: "occasion",
      question: "What's the occasion?",
      hint: "Optional — skip if it's just because.",
      multi: false,
      choices: [
        { value: "birthday", label: "Birthday" },
        { value: "an anniversary", label: "Anniversary" },
        { value: "graduation", label: "Graduation" },
        { value: "a new baby", label: "New baby" },
        { value: "a wedding", label: "Wedding" },
        { value: "a treat for myself", label: "Treat myself" },
        { value: "just because", label: "Just because" },
      ],
    },
    {
      id: "forWhom",
      question: "Who is it for?",
      hint: "Optional.",
      multi: false,
      choices: [
        { value: "myself", label: "Myself" },
        { value: "my partner", label: "My partner" },
        { value: "my mother", label: "My mother" },
        { value: "my sister", label: "My sister" },
        { value: "a friend", label: "A friend" },
        { value: "my daughter", label: "My daughter" },
      ],
    },
    {
      id: "vibe",
      question: "What's their style?",
      hint: "Optional — pick the closest.",
      multi: false,
      choices: [
        { value: "minimal", label: "Minimal" },
        { value: "classic", label: "Classic" },
        { value: "bold", label: "Bold" },
        { value: "colourful", label: "Colourful" },
        { value: "playful", label: "Playful" },
        { value: "elegant", label: "Elegant" },
      ],
    },
    {
      id: "colors",
      question: "Any favourite colours?",
      hint: "Optional — choose as many as you like.",
      multi: true,
      choices: [
        { value: "blue", label: "Blue", hex: "#5b8bd0" },
        { value: "green", label: "Green", hex: "#5fa777" },
        { value: "pink", label: "Pink", hex: "#e79cb3" },
        { value: "purple", label: "Purple", hex: "#9b7bc0" },
        { value: "red", label: "Red", hex: "#c65a5a" },
        { value: "gold", label: "Gold", hex: "#c8a24e" },
        { value: "silver", label: "Silver", hex: "#c9ccd1" },
        { value: "white", label: "White", hex: "#f2efe9" },
        { value: "black", label: "Black", hex: "#2b2b2b" },
        { value: "earthy tones", label: "Earthy", hex: "#a9855f" },
      ],
    },
    {
      id: "values",
      question: "What matters to them?",
      hint: "Optional — we'll choose stones whose meanings match.",
      multi: true,
      choices: [
        { value: "love", label: "Love" },
        { value: "protection", label: "Protection" },
        { value: "calm", label: "Calm" },
        { value: "success", label: "Success" },
        { value: "healing", label: "Healing" },
        { value: "energy", label: "Energy" },
        { value: "clarity", label: "Clarity" },
        { value: "strength", label: "Strength" },
        { value: "balance", label: "Balance" },
        { value: "joy", label: "Joy" },
      ],
    },
  ] as DesignerStep[],
  budget: {
    question: "What's your budget?",
    hint: "Per bracelet — we'll design close to it.",
    // piastres: 500, 1,000, 2,000, 3,500 EGP
    presets: [50_000, 100_000, 200_000, 350_000],
    // 500 EGP floor: the cheapest base + 3 stones already lands here, so every
    // budget on the slider can yield a real, in-stock bracelet.
    min: 50_000,
    max: 500_000,
    step: 10_000,
    default: 100_000,
  },
  controls: { skip: "Skip", back: "Back", next: "Next", generate: "Design my bracelets" },
  generating: {
    title: "Designing your bracelets…",
    sub: "Reading the meanings, balancing the palette, and composing three ideas.",
  },
  results: {
    eyebrow: "Made for you",
    title: "Three designs to choose from",
    subhead:
      "Open one in the studio to make it your own — swap, add, or remove any piece you like.",
    openInStudio: "Open in Studio",
    save: "Save",
    saved: "Saved ✓",
    addToCart: "Add to cart",
    added: "Added ✓",
    regenerate: "Try 3 more",
    startOver: "Start over",
  },
  errors: {
    auth: "Please sign in to use the AI designer.",
    rate_limited:
      "You've generated a lot just now — take a short break and try again in a little while.",
    exhausted:
      "Our designer is taking a short break. Please try again in a few minutes.",
    failed: "Something went wrong creating your designs. Please try again.",
    disabled: "The AI designer isn't available right now.",
    retry: "Try again",
  },
} as const;
