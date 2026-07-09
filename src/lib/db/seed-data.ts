/**
 * Representative catalog seed data (milestone 1.2).
 *
 * This is placeholder-but-realistic content so the site looks alive on first
 * deploy (spec §10). Prices are in EGP for readability and converted to
 * integer piastres by the seed runner. Replace with real inventory via the
 * admin later. Imagery is intentionally omitted (null) — the studio renders
 * beads from colorHex/material params, and the UI falls back to color
 * swatches, so there are no broken image links before real photos exist.
 */

export type BeadFinish = "polished" | "matte" | "faceted" | "metallic";
export type BaseType = "chain" | "cord" | "bangle";
export type CharmShape = "heart" | "star" | "moon" | "letter" | "custom";

export const seedCategories = [
  { name: "Birthstones", slug: "birthstones" },
  { name: "Love", slug: "love" },
  { name: "Protection", slug: "protection" },
  { name: "Healing", slug: "healing" },
  { name: "Minimalist", slug: "minimalist" },
  { name: "Celestial", slug: "celestial" },
  { name: "Ocean", slug: "ocean" },
  { name: "Earth", slug: "earth" },
] as const;

export type SeedBase = {
  name: string;
  type: BaseType;
  material: string;
  colorHex: string;
  egp: number;
  stock: number;
};

export const seedBases: SeedBase[] = [
  { name: "Gold-Filled Cable Chain", type: "chain", material: "14k gold-filled", colorHex: "#C7A15A", egp: 450, stock: 40 },
  { name: "Sterling Silver Chain", type: "chain", material: "925 sterling silver", colorHex: "#C9CDD2", egp: 380, stock: 40 },
  { name: "Rose Gold Chain", type: "chain", material: "rose gold-filled", colorHex: "#D8A79B", egp: 470, stock: 30 },
  { name: "Black Waxed Cord", type: "cord", material: "waxed polyester", colorHex: "#2B2B2B", egp: 180, stock: 100 },
  { name: "Ivory Silk Cord", type: "cord", material: "silk", colorHex: "#EDE6D6", egp: 200, stock: 80 },
  { name: "Gold Bangle", type: "bangle", material: "brass, gold-plated", colorHex: "#C7A15A", egp: 600, stock: 25 },
];

export type SeedBead = {
  name: string;
  stoneType: string;
  meaning: string;
  colorHex: string;
  finish: BeadFinish;
  diameterMm: number;
  egp: number;
  categories: string[];
  /** Optional PBR transmission override for translucent stones (0–1). */
  transmission?: number;
};

export const seedBeads: SeedBead[] = [
  { name: "Amethyst", stoneType: "Amethyst", meaning: "Calm and intuition.", colorHex: "#9B6FC7", finish: "faceted", diameterMm: 8, egp: 120, categories: ["healing", "birthstones"], transmission: 0.5 },
  { name: "Rose Quartz", stoneType: "Rose Quartz", meaning: "Unconditional love.", colorHex: "#F1C7CE", finish: "polished", diameterMm: 8, egp: 95, categories: ["love", "healing"] },
  { name: "Clear Quartz", stoneType: "Quartz", meaning: "Clarity and amplification.", colorHex: "#F4F4F2", finish: "faceted", diameterMm: 8, egp: 85, categories: ["healing", "minimalist"], transmission: 0.7 },
  { name: "Turquoise", stoneType: "Turquoise", meaning: "Protection and healing.", colorHex: "#3FB6B2", finish: "matte", diameterMm: 8, egp: 130, categories: ["protection", "ocean"] },
  { name: "Lapis Lazuli", stoneType: "Lapis Lazuli", meaning: "Wisdom and truth.", colorHex: "#26418F", finish: "polished", diameterMm: 8, egp: 140, categories: ["ocean", "healing"] },
  { name: "Malachite", stoneType: "Malachite", meaning: "Transformation.", colorHex: "#1F7A5A", finish: "polished", diameterMm: 8, egp: 135, categories: ["earth", "protection"] },
  { name: "Tiger's Eye", stoneType: "Tiger's Eye", meaning: "Courage and confidence.", colorHex: "#9C6B2E", finish: "polished", diameterMm: 8, egp: 100, categories: ["earth", "protection"] },
  { name: "Black Onyx", stoneType: "Onyx", meaning: "Grounding and strength.", colorHex: "#1B1B1B", finish: "polished", diameterMm: 8, egp: 90, categories: ["protection", "minimalist"] },
  { name: "Green Aventurine", stoneType: "Aventurine", meaning: "Luck and opportunity.", colorHex: "#4F9E77", finish: "polished", diameterMm: 8, egp: 90, categories: ["earth", "healing"] },
  { name: "Citrine", stoneType: "Citrine", meaning: "Abundance and joy.", colorHex: "#E8B23A", finish: "faceted", diameterMm: 8, egp: 150, categories: ["birthstones", "healing"], transmission: 0.5 },
  { name: "Aquamarine", stoneType: "Aquamarine", meaning: "Serenity of the sea.", colorHex: "#8FCFD6", finish: "faceted", diameterMm: 8, egp: 160, categories: ["ocean", "birthstones"], transmission: 0.6 },
  { name: "Garnet", stoneType: "Garnet", meaning: "Passion and energy.", colorHex: "#7B1E2B", finish: "faceted", diameterMm: 8, egp: 150, categories: ["love", "birthstones"], transmission: 0.4 },
  { name: "Moonstone", stoneType: "Moonstone", meaning: "Intuition and new beginnings.", colorHex: "#E7E9EC", finish: "polished", diameterMm: 8, egp: 145, categories: ["celestial", "healing"], transmission: 0.4 },
  { name: "Labradorite", stoneType: "Labradorite", meaning: "Magic and transformation.", colorHex: "#4C5A6A", finish: "polished", diameterMm: 8, egp: 155, categories: ["celestial", "protection"] },
  { name: "Carnelian", stoneType: "Carnelian", meaning: "Vitality and motivation.", colorHex: "#C4552B", finish: "polished", diameterMm: 8, egp: 100, categories: ["earth", "healing"] },
  { name: "Amazonite", stoneType: "Amazonite", meaning: "Harmony and balance.", colorHex: "#5FC7B0", finish: "matte", diameterMm: 8, egp: 110, categories: ["ocean", "healing"] },
  { name: "Sodalite", stoneType: "Sodalite", meaning: "Truth and clear thinking.", colorHex: "#2C4A8A", finish: "polished", diameterMm: 8, egp: 105, categories: ["ocean", "healing"] },
  { name: "Jade", stoneType: "Jade", meaning: "Prosperity and serenity.", colorHex: "#3E9E6E", finish: "polished", diameterMm: 8, egp: 160, categories: ["earth", "healing"] },
  { name: "Hematite", stoneType: "Hematite", meaning: "Focus and grounding.", colorHex: "#5A5A60", finish: "metallic", diameterMm: 8, egp: 95, categories: ["protection", "minimalist"] },
  { name: "Freshwater Pearl", stoneType: "Pearl", meaning: "Purity and grace.", colorHex: "#F3EEE6", finish: "polished", diameterMm: 7, egp: 130, categories: ["love", "minimalist"] },
  { name: "Opal", stoneType: "Opal", meaning: "Hope and imagination.", colorHex: "#E9E3DA", finish: "polished", diameterMm: 8, egp: 200, categories: ["celestial", "birthstones"], transmission: 0.4 },
  { name: "Peridot", stoneType: "Peridot", meaning: "Renewal and growth.", colorHex: "#9BC24A", finish: "faceted", diameterMm: 8, egp: 150, categories: ["earth", "birthstones"], transmission: 0.5 },
  { name: "Ruby", stoneType: "Ruby", meaning: "Love and vitality.", colorHex: "#9B1B30", finish: "faceted", diameterMm: 7, egp: 320, categories: ["love", "birthstones"], transmission: 0.4 },
  { name: "Sapphire", stoneType: "Sapphire", meaning: "Wisdom and nobility.", colorHex: "#1F3A93", finish: "faceted", diameterMm: 7, egp: 330, categories: ["ocean", "birthstones"], transmission: 0.4 },
  { name: "Emerald", stoneType: "Emerald", meaning: "Growth and renewal.", colorHex: "#1E7A4D", finish: "faceted", diameterMm: 7, egp: 340, categories: ["earth", "birthstones"], transmission: 0.4 },
  { name: "Smoky Quartz", stoneType: "Quartz", meaning: "Grounding and release.", colorHex: "#6B5545", finish: "faceted", diameterMm: 8, egp: 100, categories: ["earth", "protection"], transmission: 0.5 },
  { name: "Rhodonite", stoneType: "Rhodonite", meaning: "Compassion and self-worth.", colorHex: "#C0567A", finish: "polished", diameterMm: 8, egp: 110, categories: ["love", "healing"] },
  { name: "Fluorite", stoneType: "Fluorite", meaning: "Focus and clarity.", colorHex: "#6E8FB0", finish: "faceted", diameterMm: 8, egp: 120, categories: ["healing", "celestial"], transmission: 0.6 },
  { name: "Pyrite", stoneType: "Pyrite", meaning: "Wealth and willpower.", colorHex: "#C9A227", finish: "metallic", diameterMm: 8, egp: 105, categories: ["earth", "protection"] },
  { name: "Obsidian", stoneType: "Obsidian", meaning: "Protection and truth.", colorHex: "#141414", finish: "polished", diameterMm: 8, egp: 90, categories: ["protection", "minimalist"] },
  { name: "Blue Chalcedony", stoneType: "Chalcedony", meaning: "Calm communication.", colorHex: "#A9C6D4", finish: "matte", diameterMm: 8, egp: 115, categories: ["ocean", "healing"] },
  { name: "Prehnite", stoneType: "Prehnite", meaning: "Healing and hope.", colorHex: "#B7CE8E", finish: "polished", diameterMm: 8, egp: 120, categories: ["earth", "healing"] },
  { name: "Kyanite", stoneType: "Kyanite", meaning: "Alignment and calm.", colorHex: "#3E6FA3", finish: "polished", diameterMm: 8, egp: 130, categories: ["ocean", "healing"] },
  { name: "Howlite", stoneType: "Howlite", meaning: "Patience and calm.", colorHex: "#EDEDE8", finish: "matte", diameterMm: 8, egp: 80, categories: ["minimalist", "healing"] },
  { name: "Unakite", stoneType: "Unakite", meaning: "Balance of body and soul.", colorHex: "#7C9C6E", finish: "polished", diameterMm: 8, egp: 95, categories: ["earth", "love"] },
  { name: "Bloodstone", stoneType: "Bloodstone", meaning: "Courage and vitality.", colorHex: "#2F5E45", finish: "matte", diameterMm: 8, egp: 100, categories: ["protection", "earth"] },
  { name: "Apatite", stoneType: "Apatite", meaning: "Motivation and clarity.", colorHex: "#2FA0A8", finish: "faceted", diameterMm: 8, egp: 120, categories: ["ocean", "healing"], transmission: 0.5 },
  { name: "Sunstone", stoneType: "Sunstone", meaning: "Joy and warmth.", colorHex: "#D2743A", finish: "polished", diameterMm: 8, egp: 125, categories: ["celestial", "healing"] },
  { name: "Iolite", stoneType: "Iolite", meaning: "Inner vision.", colorHex: "#5560A6", finish: "faceted", diameterMm: 8, egp: 135, categories: ["celestial", "healing"], transmission: 0.5 },
  { name: "Morganite", stoneType: "Morganite", meaning: "Divine love.", colorHex: "#E7B7A9", finish: "faceted", diameterMm: 8, egp: 170, categories: ["love", "birthstones"], transmission: 0.5 },
];

export type SeedCharm = {
  name: string;
  shape: CharmShape;
  meaning: string;
  colorHex: string;
  egp: number;
  categories: string[];
  letterValue?: string;
};

export const seedCharms: SeedCharm[] = [
  { name: "Gold Heart", shape: "heart", meaning: "Love you carry with you.", colorHex: "#C7A15A", egp: 160, categories: ["love"] },
  { name: "Silver Heart", shape: "heart", meaning: "Love you carry with you.", colorHex: "#C9CDD2", egp: 140, categories: ["love"] },
  { name: "Gold Star", shape: "star", meaning: "Follow your light.", colorHex: "#C7A15A", egp: 150, categories: ["celestial"] },
  { name: "Silver Star", shape: "star", meaning: "Follow your light.", colorHex: "#C9CDD2", egp: 130, categories: ["celestial"] },
  { name: "Crescent Moon", shape: "moon", meaning: "Trust your phases.", colorHex: "#C7A15A", egp: 170, categories: ["celestial"] },
  { name: "Evil Eye", shape: "custom", meaning: "Protection from harm.", colorHex: "#1F5FA8", egp: 150, categories: ["protection"] },
  { name: "Hamsa Hand", shape: "custom", meaning: "Blessing and protection.", colorHex: "#C7A15A", egp: 180, categories: ["protection"] },
  { name: "Cross", shape: "custom", meaning: "Faith and guidance.", colorHex: "#C7A15A", egp: 160, categories: ["protection"] },
  { name: "Infinity", shape: "custom", meaning: "Endless connection.", colorHex: "#C7A15A", egp: 150, categories: ["love", "minimalist"] },
  { name: "Butterfly", shape: "custom", meaning: "Growth and change.", colorHex: "#C7A15A", egp: 170, categories: ["earth"] },
  { name: "Lotus", shape: "custom", meaning: "Rising in serenity.", colorHex: "#C7A15A", egp: 175, categories: ["healing"] },
  { name: "Feather", shape: "custom", meaning: "Freedom and lightness.", colorHex: "#C9CDD2", egp: 140, categories: ["earth", "minimalist"] },
  { name: "Lightning Bolt", shape: "custom", meaning: "Energy and drive.", colorHex: "#C7A15A", egp: 150, categories: ["celestial"] },
  { name: "Initial — Gold", shape: "letter", meaning: "Make it yours.", colorHex: "#C7A15A", egp: 190, categories: ["minimalist"], letterValue: "A" },
  { name: "Initial — Silver", shape: "letter", meaning: "Make it yours.", colorHex: "#C9CDD2", egp: 170, categories: ["minimalist"], letterValue: "M" },
];

export const seedCollections = [
  { name: "Everyday Gold", slug: "everyday-gold", description: "Quiet gold pieces for every day." },
  { name: "Celestial", slug: "celestial", description: "Moons, stars, and midnight blues." },
  { name: "Ocean Calm", slug: "ocean-calm", description: "The serenity of sea and sky." },
] as const;

/**
 * Brand design plans. Components are referenced by catalog slug and resolved to
 * ids by the seed runner; prices are recomputed server-side from the catalog.
 */
export type SeedDesign = {
  name: string;
  baseSlug: string;
  sizeCm: number;
  /** Ordered around the bracelet; "bead:" or "charm:" prefixed slugs. */
  components: string[];
  collections: string[];
};

export const seedDesigns: SeedDesign[] = [
  { name: "Morning Calm", baseSlug: "gold-filled-cable-chain", sizeCm: 17, components: ["bead:amethyst", "bead:rose-quartz", "bead:clear-quartz", "bead:amethyst", "bead:rose-quartz", "charm:crescent-moon"], collections: ["everyday-gold"] },
  { name: "Sea Glass", baseSlug: "sterling-silver-chain", sizeCm: 18, components: ["bead:aquamarine", "bead:blue-chalcedony", "bead:amazonite", "bead:aquamarine", "bead:blue-chalcedony", "charm:silver-star"], collections: ["ocean-calm"] },
  { name: "Midnight Sky", baseSlug: "gold-filled-cable-chain", sizeCm: 18, components: ["bead:lapis-lazuli", "bead:sodalite", "bead:labradorite", "bead:lapis-lazuli", "charm:crescent-moon", "charm:gold-star"], collections: ["celestial", "ocean-calm"] },
  { name: "Golden Hour", baseSlug: "gold-filled-cable-chain", sizeCm: 17, components: ["bead:citrine", "bead:sunstone", "bead:carnelian", "bead:citrine", "charm:gold-heart"], collections: ["everyday-gold"] },
  { name: "Rose Whisper", baseSlug: "rose-gold-chain", sizeCm: 16.5, components: ["bead:morganite", "bead:rose-quartz", "bead:rhodonite", "bead:morganite", "charm:gold-heart"], collections: ["everyday-gold"] },
  { name: "Grounded", baseSlug: "black-waxed-cord", sizeCm: 18, components: ["bead:black-onyx", "bead:hematite", "bead:tiger-s-eye", "bead:black-onyx", "bead:smoky-quartz"], collections: [] },
  { name: "Evil Eye Guard", baseSlug: "black-waxed-cord", sizeCm: 17.5, components: ["bead:black-onyx", "bead:hematite", "charm:evil-eye", "bead:hematite", "bead:black-onyx"], collections: ["everyday-gold"] },
  { name: "Forest Floor", baseSlug: "gold-filled-cable-chain", sizeCm: 18, components: ["bead:malachite", "bead:green-aventurine", "bead:jade", "bead:prehnite", "charm:lotus"], collections: [] },
  { name: "Serene Blue", baseSlug: "sterling-silver-chain", sizeCm: 17.5, components: ["bead:kyanite", "bead:apatite", "bead:sodalite", "bead:kyanite", "charm:silver-heart"], collections: ["ocean-calm"] },
  { name: "Moonchild", baseSlug: "sterling-silver-chain", sizeCm: 17, components: ["bead:moonstone", "bead:labradorite", "bead:opal", "bead:moonstone", "charm:crescent-moon"], collections: ["celestial"] },
  { name: "First Light", baseSlug: "ivory-silk-cord", sizeCm: 16.5, components: ["bead:freshwater-pearl", "bead:howlite", "bead:clear-quartz", "bead:freshwater-pearl"], collections: ["everyday-gold"] },
  { name: "Warrior", baseSlug: "black-waxed-cord", sizeCm: 18.5, components: ["bead:bloodstone", "bead:tiger-s-eye", "bead:carnelian", "bead:pyrite", "charm:lightning-bolt"], collections: [] },
  { name: "Amethyst Dream", baseSlug: "gold-filled-cable-chain", sizeCm: 17, components: ["bead:amethyst", "bead:iolite", "bead:fluorite", "bead:amethyst", "charm:gold-star"], collections: ["celestial"] },
  { name: "Citrus Bloom", baseSlug: "gold-filled-cable-chain", sizeCm: 17, components: ["bead:citrine", "bead:peridot", "bead:sunstone", "bead:citrine", "charm:butterfly"], collections: ["everyday-gold"] },
  { name: "Precious", baseSlug: "gold-filled-cable-chain", sizeCm: 16.5, components: ["bead:ruby", "bead:sapphire", "bead:emerald", "charm:gold-heart"], collections: [] },
  { name: "Tranquil Jade", baseSlug: "ivory-silk-cord", sizeCm: 17.5, components: ["bead:jade", "bead:prehnite", "bead:unakite", "bead:jade", "charm:lotus"], collections: [] },
  { name: "Protector", baseSlug: "black-waxed-cord", sizeCm: 18, components: ["bead:obsidian", "bead:black-onyx", "charm:hamsa-hand", "bead:black-onyx", "bead:obsidian"], collections: ["everyday-gold"] },
  { name: "Ocean Deep", baseSlug: "sterling-silver-chain", sizeCm: 18, components: ["bead:sapphire", "bead:lapis-lazuli", "bead:kyanite", "bead:sapphire", "charm:silver-star"], collections: ["ocean-calm"] },
  { name: "Soft Pearl", baseSlug: "rose-gold-chain", sizeCm: 16, components: ["bead:freshwater-pearl", "bead:morganite", "bead:freshwater-pearl", "bead:morganite", "charm:infinity"], collections: ["everyday-gold"] },
  { name: "Starlit Bangle", baseSlug: "gold-bangle", sizeCm: 18, components: ["charm:gold-star", "charm:crescent-moon", "charm:gold-star"], collections: ["celestial"] },
];
