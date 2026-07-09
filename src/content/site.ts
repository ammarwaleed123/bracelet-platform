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

/** Home page placeholder copy — the full hero lands in milestone 1.6. */
export const home = {
  eyebrow: "Made to order · Egypt",
  headline: "Wear your story.",
  subhead:
    "Design a bracelet that is entirely yours in our live 3D studio, then have it handmade and delivered to your door.",
  primaryCta: { label: "Enter the studio", href: "/studio" } as NavLink,
  secondaryCta: { label: "Browse the gallery", href: "/gallery" } as NavLink,
  buildingNote:
    "We're putting the finishing touches on the experience. The full home page arrives soon.",
} as const;
