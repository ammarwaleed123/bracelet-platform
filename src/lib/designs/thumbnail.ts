import "server-only";

import { inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { bases, beads, charms } from "@/lib/db/schema";

/**
 * Server-side flat-lay thumbnail generator. Renders a bracelet as a top-down
 * SVG of its real beads/colours — no browser or WebGL needed. Used to give
 * designs a preview when there's no captured canvas (e.g. AI-designer concepts,
 * which are saved/added-to-cart without ever opening the studio). Mirrors the
 * layout math in `computeLayout` so the preview matches the 3D scene.
 */

type Part = { colorHex: string; diameterMm: number };

function layout(diametersMm: number[], sizeCm: number) {
  const diamsCm = diametersMm.map((d) => d / 10);
  const sumLen = diamsCm.reduce((a, b) => a + b, 0);
  const circumference = Math.max(sumLen, sizeCm);
  const radius = circumference / (2 * Math.PI);
  let cursor = 0;
  const items = diamsCm.map((d) => {
    const center = cursor + d / 2;
    cursor += d;
    const angle = Math.PI / 2 - (center / circumference) * Math.PI * 2;
    return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, r: d / 2 };
  });
  return { radius, items };
}

/** Build a flat-lay bracelet SVG string from a base colour + ordered parts. */
export function buildBraceletSvg(
  baseColor: string,
  parts: Part[],
  sizeCm: number
): string {
  const W = 500;
  const pad = 56;
  const { radius, items } = layout(
    parts.map((p) => p.diameterMm),
    sizeCm
  );
  const maxBead = parts.length
    ? Math.max(...parts.map((p) => p.diameterMm / 20))
    : 0.4;
  const scale = (W / 2 - pad) / (radius + maxBead || 1);
  const cx = W / 2;
  const cy = W / 2;

  const ring = `<circle cx="${cx}" cy="${cy}" r="${(radius * scale).toFixed(
    1
  )}" fill="none" stroke="${baseColor}" stroke-width="${Math.max(
    2,
    radius * scale * 0.05
  ).toFixed(1)}" opacity="0.9"/>`;

  const beadShapes = items
    .map((it, i) => {
      const px = cx + it.x * scale;
      const py = cy + it.z * scale;
      const pr = Math.max(4, it.r * scale);
      const color = parts[i]!.colorHex;
      return (
        `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${pr.toFixed(
          1
        )}" fill="${color}" stroke="rgba(0,0,0,0.12)" stroke-width="1"/>` +
        `<ellipse cx="${(px - pr * 0.3).toFixed(1)}" cy="${(
          py -
          pr * 0.35
        ).toFixed(1)}" rx="${(pr * 0.35).toFixed(1)}" ry="${(pr * 0.25).toFixed(
          1
        )}" fill="rgba(255,255,255,0.45)"/>`
      );
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}" viewBox="0 0 ${W} ${W}"><rect width="${W}" height="${W}" fill="#f7f4ef"/>${ring}${beadShapes}</svg>`;
}

/**
 * Build the flat-lay SVG for a design from its components, looking up colours +
 * diameters from the catalog. Returns null if there's nothing to draw.
 */
export async function renderDesignThumbnailSvg(
  baseId: string | null,
  components: { kind: "bead" | "charm"; refId: string }[],
  sizeCm: number
): Promise<string | null> {
  if (components.length === 0) return null;

  const beadIds = components.filter((c) => c.kind === "bead").map((c) => c.refId);
  const charmIds = components.filter((c) => c.kind === "charm").map((c) => c.refId);

  const [beadRows, charmRows, baseRow] = await Promise.all([
    beadIds.length
      ? db
          .select({ id: beads.id, colorHex: beads.colorHex, diameterMm: beads.diameterMm })
          .from(beads)
          .where(inArray(beads.id, beadIds))
      : Promise.resolve([]),
    charmIds.length
      ? db
          .select({ id: charms.id, colorHex: charms.colorHex, diameterMm: charms.diameterMm })
          .from(charms)
          .where(inArray(charms.id, charmIds))
      : Promise.resolve([]),
    baseId
      ? db
          .select({ colorHex: bases.colorHex })
          .from(bases)
          .where(inArray(bases.id, [baseId]))
          .limit(1)
      : Promise.resolve([]),
  ]);

  const byId = new Map(
    [...beadRows, ...charmRows].map((r) => [r.id, r] as const)
  );

  const parts: Part[] = components
    .map((c) => byId.get(c.refId))
    .filter((r): r is { id: string; colorHex: string; diameterMm: string } =>
      Boolean(r)
    )
    .map((r) => ({ colorHex: r.colorHex, diameterMm: Number(r.diameterMm) }));

  if (parts.length === 0) return null;

  const baseColor = baseRow[0]?.colorHex ?? "#C7A15A";
  return buildBraceletSvg(baseColor, parts, sizeCm);
}
