/** Canonical key for a design's composition (base + size + ordered parts).
 *  Two designs with the same key are the "same bracelet" regardless of name. */
export function compositionKey(
  baseId: string | null,
  sizeCm: number,
  components: { kind: string; refId: string }[]
): string {
  const parts = components.map((c) => `${c.kind}:${c.refId}`).join(",");
  return `${baseId ?? "-"}|${Number(sizeCm)}|${parts}`;
}
