/**
 * User-facing copy and site structure.
 *
 * Per CLAUDE.md, no user-facing string is hardcoded in a component — they all
 * live here so the UI can be translated later without an i18n framework.
 * The brand name is a placeholder until the owner finalizes it (see
 * docs/GUIDE.md Part 6).
 */

export const site = {
  name: "Aurelia",
  // DECISION: tagline kept short; it sets the "made-to-order luxury" tone the
  // spec calls for without committing to marketing copy the owner will replace.
  tagline: "Bracelets, made to mean something.",
  description:
    "Design your own bracelet in a live 3D studio. Each piece is handmade to order in Egypt, bead by bead.",
} as const;

export type NavLink = {
  readonly label: string;
  readonly href: string;
};

/** Primary navigation shown in the header and mobile menu. */
export const primaryNav: readonly NavLink[] = [
  { label: "Studio", href: "/studio" },
  { label: "Gallery", href: "/gallery" },
  { label: "Collections", href: "/collections" },
  { label: "About", href: "/about" },
] as const;

/** The prominent call to action that leads into the studio. */
export const primaryCta: NavLink = {
  label: "Design yours",
  href: "/studio",
} as const;

/** Account / auth entry points in the header. */
export const accountNav = {
  signIn: { label: "Sign in", href: "/sign-in" } as NavLink,
  account: { label: "Account", href: "/account" } as NavLink,
  cart: { label: "Cart", href: "/cart" } as NavLink,
} as const;

/**
 * One-time popup shown to logged-out visitors. It's purely a prompt: the CTAs
 * link to the existing sign-up / sign-in pages — no offer, discount, or code.
 */
export const signupPrompt = {
  title: "Design it. Save it. Sell it.",
  points: [
    "Save every design you make",
    "Share it in the community gallery",
    "Let others buy your designs",
  ],
  createAccount: { label: "Create account", href: "/sign-up" } as NavLink,
  signIn: { label: "Sign in", href: "/sign-in" } as NavLink,
  close: "Close",
} as const;

export type FooterColumn = {
  readonly title: string;
  readonly links: readonly NavLink[];
};

export const footerNav: readonly FooterColumn[] = [
  {
    title: "Shop",
    links: [
      { label: "The Studio", href: "/studio" },
      { label: "Gallery", href: "/gallery" },
      { label: "Collections", href: "/collections" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Track your order", href: "/orders" },
      { label: "Shipping", href: "/policies/shipping" },
      { label: "Returns", href: "/policies/returns" },
      { label: "Privacy", href: "/policies/privacy" },
    ],
  },
] as const;

export const footer = {
  blurb:
    "Handmade to order in Egypt. Cash on delivery available nationwide.",
  rights: (year: number) => `© ${year} ${site.name}. All rights reserved.`,
} as const;

export const gallery = {
  eyebrow: "Community & collections",
  title: "The gallery",
  subhead:
    "Designs from our studio and our community. Love one? Make it yours, or customize it into something new.",
} as const;

/** Home page copy. */
export const home = {
  eyebrow: "Made to order · Egypt",
  headline: "Wear your story.",
  subhead:
    "Design a bracelet that is entirely yours in our live 3D studio, then have it handmade and delivered to your door.",
  primaryCta: { label: "Enter the studio", href: "/studio" } as NavLink,
  secondaryCta: { label: "Browse the gallery", href: "/gallery" } as NavLink,

  valueProps: [
    {
      title: "Designed by you",
      body: "Arrange every bead and charm by hand in a live 3D studio. No two bracelets are alike.",
    },
    {
      title: "Handmade to order",
      body: "Each piece is crafted bead by bead in Egypt after you order — nothing sits on a shelf.",
    },
    {
      title: "Cash on delivery",
      body: "Pay when it arrives, anywhere in Egypt. Card & wallet payments coming soon.",
    },
  ],

  steps: {
    eyebrow: "How it works",
    title: "From your imagination to your wrist",
    items: [
      {
        n: "01",
        title: "Design in 3D",
        body: "Pick a base, then add beads and charms and arrange them however you like in the studio.",
      },
      {
        n: "02",
        title: "We handcraft it",
        body: "Your design is made to order, by hand, by our artisans — exactly as you built it.",
      },
      {
        n: "03",
        title: "Delivered to you",
        body: "It arrives at your door ready to wear or gift. Pay cash on delivery.",
      },
    ],
  },

  featured: {
    eyebrow: "From the gallery",
    title: "Loved by our community",
    subhead: "Real designs from our studio and our makers. Buy one, or make it your own.",
    cta: { label: "Explore the gallery", href: "/gallery" } as NavLink,
  },

  meaning: {
    eyebrow: "The lifestyle layer",
    title: "Every stone carries a meaning",
    body: "Choose stones not only for their colour, but for what they hold — clarity, protection, love. Your bracelet becomes a story you can wear every day.",
    cta: { label: "Start your story", href: "/studio" } as NavLink,
  },

  closing: {
    title: "Your bracelet is waiting to be made.",
    body: "Open the studio and design something that is entirely, unmistakably yours.",
    cta: { label: "Design yours", href: "/studio" } as NavLink,
  },
} as const;

/** About page copy. */
export const about = {
  eyebrow: "Our story",
  headline: "Jewellery that means something.",
  intro:
    "Aurelia began with a simple belief: the pieces you wear every day should be as personal as the story behind them. So we built a studio where you design your own bracelet, bead by bead — and we handcraft it, to order, in Egypt.",

  story: {
    title: "Made for you, not for a shelf",
    body: [
      "Most jewellery is mass-produced and sits in a warehouse waiting for a buyer. We do the opposite — nothing exists until you design it. When you place an order, an artisan makes your bracelet by hand: the exact one you arranged in the studio.",
      "It means less waste, no two pieces alike, and a bracelet that is genuinely yours from the first bead to the clasp.",
    ],
  },

  craft: {
    eyebrow: "The craft",
    title: "Handmade in Egypt",
    body: "Every bracelet is strung and finished by hand by our makers. We source real stones and quality bases, and we sweat the details — the weight of a bead, the fall of a chain, the meaning of a stone — so the piece feels considered on your wrist.",
  },

  values: [
    {
      title: "Designed by you",
      body: "A live 3D studio, not a fixed catalogue. Choose every bead and charm and arrange them yourself.",
    },
    {
      title: "Made to order",
      body: "We craft your design only after you order — no inventory, no waste, no two the same.",
    },
    {
      title: "Stones with meaning",
      body: "Choose stones for what they carry — clarity, protection, love — not only their colour.",
    },
    {
      title: "For Egypt",
      body: "Designed and made here, delivered to your door nationwide with cash on delivery.",
    },
  ],

  cta: {
    title: "Design something that's yours.",
    body: "Open the studio and build a bracelet that tells your story.",
    primary: { label: "Design yours", href: "/studio" } as NavLink,
    secondary: { label: "Browse the gallery", href: "/gallery" } as NavLink,
  },
} as const;
