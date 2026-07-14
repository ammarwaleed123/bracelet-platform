/** Copy for the Bracelet Passport (Phase 2). No hardcoded strings in the
 *  components — all passport + printable-card wording lives here. */

export const passport = {
  eyebrow: "Bracelet Passport",
  passportNo: "Passport №",
  bornOn: "Born on",
  wristSize: "Wrist size",
  base: "Base",
  madeIn: "Handmade in Egypt",
  value: "Value",
  noPreview: "No preview",

  materials: {
    title: "Materials & meanings",
  },
  history: {
    title: "Design history",
    original: "An original design — the first of its kind.",
    lead: "Reimagined from",
    by: "by",
  },
  creatorPrefix: "Designed by",

  qr: {
    title: "Scan to open this passport",
    hint: "This passport travels with the bracelet. Share the link, or keep it as a record of your piece.",
  },

  actions: {
    addToCart: "Add to cart",
    customize: "Customize this design",
    share: "Share",
    designYours: "Design your own",
    backGallery: "Back to gallery",
    backAccount: "Back to your designs",
    home: "Explore Aurelia",
  },

  card: {
    kicker: "Bracelet Passport",
    scan: "Scan to view your bracelet's passport",
    print: "Print card",
    fulfilmentNote: "Print and place this card in the box.",
  },
} as const;
