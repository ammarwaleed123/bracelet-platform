/**
 * Suggest a poetic default name for a design from its stones — a deliberate
 * differentiator (never "Untitled", per spec §4). Deterministic for a given
 * set of stones so the suggestion is stable, but varied across designs.
 */

const NOUNS = [
  "Reverie",
  "Bloom",
  "Tide",
  "Ember",
  "Halo",
  "Muse",
  "Aura",
  "Song",
  "Dream",
  "Glow",
  "Whisper",
  "Talisman",
];

const ADJECTIVES = [
  "Golden",
  "Midnight",
  "Serene",
  "Velvet",
  "Celestial",
  "Gentle",
  "Radiant",
  "Quiet",
  "Wild",
  "Sacred",
];

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * @param stoneNames ordered names of the placed components (beads/charms).
 */
export function suggestDesignName(stoneNames: string[]): string {
  if (stoneNames.length === 0) return "Blank Canvas";

  const primary = stoneNames[0]!.split(" ").slice(-1)[0]!; // last word, e.g. "Quartz"
  const seed = hash(stoneNames.join("|"));

  const noun = NOUNS[seed % NOUNS.length]!;
  const adjective = ADJECTIVES[(seed >> 3) % ADJECTIVES.length]!;

  // Alternate between "<Stone> <Noun>" and "<Adjective> <Stone>".
  return seed % 2 === 0 ? `${primary} ${noun}` : `${adjective} ${primary}`;
}
