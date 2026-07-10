/**
 * Egypt shipping zones — placeholder Cash-on-Delivery rates covering all 27
 * governorates. Fees are editable in admin before launch; these are sensible
 * defaults (cheaper near Greater Cairo, higher for frontier governorates).
 *
 * The full governorate list for the checkout selector is derived from these
 * zones, so every governorate always maps to exactly one fee.
 */
export type ShippingZoneSeed = {
  name: string;
  governorates: string[];
  feeEgp: number;
  estimatedDays: string;
  sortOrder: number;
};

export const SHIPPING_ZONES: ShippingZoneSeed[] = [
  {
    name: "Greater Cairo",
    governorates: ["Cairo", "Giza", "Qalyubia"],
    feeEgp: 50,
    estimatedDays: "1–2 days",
    sortOrder: 1,
  },
  {
    name: "Alexandria & Delta",
    governorates: [
      "Alexandria",
      "Beheira",
      "Gharbia",
      "Kafr El Sheikh",
      "Dakahlia",
      "Damietta",
      "Monufia",
      "Sharqia",
    ],
    feeEgp: 70,
    estimatedDays: "2–3 days",
    sortOrder: 2,
  },
  {
    name: "Canal & Suez",
    governorates: ["Port Said", "Ismailia", "Suez"],
    feeEgp: 75,
    estimatedDays: "2–4 days",
    sortOrder: 3,
  },
  {
    name: "Upper Egypt",
    governorates: [
      "Beni Suef",
      "Faiyum",
      "Minya",
      "Asyut",
      "Sohag",
      "Qena",
      "Luxor",
      "Aswan",
    ],
    feeEgp: 90,
    estimatedDays: "3–5 days",
    sortOrder: 4,
  },
  {
    name: "Frontier & Coast",
    governorates: [
      "Red Sea",
      "New Valley",
      "Matrouh",
      "North Sinai",
      "South Sinai",
    ],
    feeEgp: 120,
    estimatedDays: "4–7 days",
    sortOrder: 5,
  },
];

/** All 27 governorates, alphabetically, for the checkout selector. */
export const GOVERNORATES: string[] = SHIPPING_ZONES.flatMap(
  (z) => z.governorates
).sort((a, b) => a.localeCompare(b));
