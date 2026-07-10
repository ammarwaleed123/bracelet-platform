/**
 * Copy for the content / trust pages (Contact, FAQ, policies).
 *
 * NOTE: contact details and policy specifics are sensible placeholders — the
 * owner should review and replace them (real WhatsApp/email/Instagram, exact
 * return window, courier, and legal wording) before launch.
 */

export const contact = {
  eyebrow: "Contact",
  title: "We'd love to hear from you",
  intro:
    "Questions about a design, an order, or a custom request? Reach us on any channel below — we usually reply within a few hours.",
  channels: [
    {
      label: "WhatsApp",
      value: "+20 100 000 0000",
      href: "https://wa.me/201000000000",
      note: "Fastest — chat with us directly.",
    },
    {
      label: "Email",
      value: "hello@aurelia.example",
      href: "mailto:hello@aurelia.example",
      note: "For orders, questions and wholesale.",
    },
    {
      label: "Instagram",
      value: "@aurelia",
      href: "https://instagram.com/",
      note: "See new pieces and customer designs.",
    },
  ],
  hours: "Sunday–Thursday, 10am–6pm (Cairo time).",
  note: "Placing an order? You don't need to contact us — design in the studio and check out. We'll call to confirm before crafting.",
} as const;

export const faq = {
  eyebrow: "Help",
  title: "Frequently asked questions",
  intro:
    "Everything you need to know about designing, ordering, and receiving your bracelet.",
  groups: [
    {
      title: "Designing & products",
      items: [
        {
          q: "How do I design a bracelet?",
          a: "Open the studio, pick a base, then add beads and charms and arrange them by hand in 3D. The price updates as you go. When you're happy, add it to your cart.",
        },
        {
          q: "Are the bracelets really handmade?",
          a: "Yes. Every bracelet is made to order by hand in Egypt after you place your order — nothing is pre-made or sitting in a warehouse.",
        },
        {
          q: "What are the stones made of?",
          a: "We use real stones and quality bases. Each stone lists its type and meaning in the studio and on its product page.",
        },
      ],
    },
    {
      title: "Orders & delivery",
      items: [
        {
          q: "How long does it take to receive my order?",
          a: "Because each piece is handmade to order, allow a few days for crafting plus delivery time to your governorate (shown at checkout). We'll call to confirm your order first.",
        },
        {
          q: "Do you deliver everywhere in Egypt?",
          a: "Yes — we deliver to all governorates. The shipping fee and estimated time are calculated from your governorate at checkout.",
        },
        {
          q: "How do I track my order?",
          a: "Use the order number from your confirmation on the Track your order page, verified by the phone number you used at checkout.",
        },
      ],
    },
    {
      title: "Payment & returns",
      items: [
        {
          q: "How do I pay?",
          a: "Cash on Delivery — you pay in cash when your bracelet arrives. Card and wallet payments are coming soon.",
        },
        {
          q: "Can I return or exchange a bracelet?",
          a: "Because every piece is custom-made for you, we handle returns case by case for quality issues. See our Returns policy for details.",
        },
      ],
    },
  ],
} as const;

type PolicySection = { heading: string; body: string[] };
type Policy = { title: string; updated: string; intro: string; sections: PolicySection[] };

export const policies: Record<"shipping" | "returns" | "privacy", Policy> = {
  shipping: {
    title: "Shipping",
    updated: "July 2026",
    intro:
      "How and when your handmade bracelet reaches you. Every piece is made to order, so timing includes crafting plus delivery.",
    sections: [
      {
        heading: "Where we deliver",
        body: [
          "We deliver to all 27 governorates in Egypt. Your shipping fee is calculated from the governorate you choose at checkout and shown before you place your order.",
        ],
      },
      {
        heading: "Timing",
        body: [
          "Because each bracelet is handmade after you order, please allow a few days for crafting before dispatch. Delivery time then depends on your governorate; an estimate is shown at checkout.",
          "We call to confirm every order before we begin crafting, using the phone number you provide.",
        ],
      },
      {
        heading: "Shipping fees",
        body: [
          "Fees are flat per governorate and shown at checkout. Greater Cairo and the Delta are lower; frontier governorates are higher due to distance.",
        ],
      },
    ],
  },
  returns: {
    title: "Returns & exchanges",
    updated: "July 2026",
    intro:
      "Every bracelet is custom-made for you, so please design carefully. Here's how we handle returns and any issues.",
    sections: [
      {
        heading: "Made-to-order items",
        body: [
          "Because your bracelet is handmade to your exact design, we can't accept returns simply for a change of mind. Please review your design and wrist size before ordering.",
        ],
      },
      {
        heading: "Quality issues",
        body: [
          "If your bracelet arrives damaged, faulty, or not matching your design, contact us within 48 hours of delivery with photos and your order number. We'll repair, remake, or refund it.",
        ],
      },
      {
        heading: "How to reach us",
        body: [
          "Message us on WhatsApp or email with your order number and a clear photo. We'll make it right.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy policy",
    updated: "July 2026",
    intro:
      "We respect your privacy and collect only what we need to make and deliver your order.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Contact details (name, phone, and email if provided), your delivery address, your saved designs, and your order history. If you sign in, we store your account profile.",
        ],
      },
      {
        heading: "How we use it",
        body: [
          "To confirm, craft, and deliver your orders, to provide support, and to improve the studio and shop. We never sell your data.",
        ],
      },
      {
        heading: "Who we share it with",
        body: [
          "Only the partners needed to run the service — our delivery courier (to ship your order) and our hosting/database providers. They process your data on our behalf.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "You can view and manage your saved designs and orders from your account, and contact us any time to update or delete your information.",
        ],
      },
    ],
  },
};
