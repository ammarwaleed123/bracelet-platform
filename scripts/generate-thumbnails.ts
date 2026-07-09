/**
 * Generate PLACEHOLDER thumbnails for brand/seed designs that have none.
 *
 * These are flat, top-down SVG renders of each bracelet's real beads/colors —
 * enough to make the gallery look alive without a browser/WebGL. They are meant
 * to be REPLACED with real product photography (or studio renders) before
 * production. Customer-created designs already get real captured thumbnails.
 *
 * Run: npx tsx scripts/generate-thumbnails.ts
 */
import { config } from "dotenv";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

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

function buildSvg(baseColor: string, parts: Part[], sizeCm: number): string {
  const W = 500;
  const pad = 56;
  const { radius, items } = layout(
    parts.map((p) => p.diameterMm),
    sizeCm
  );
  const maxBead = parts.length ? Math.max(...parts.map((p) => p.diameterMm / 20)) : 0.4;
  const scale = (W / 2 - pad) / (radius + maxBead || 1);
  const cx = W / 2;
  const cy = W / 2;

  const ring = `<circle cx="${cx}" cy="${cy}" r="${(radius * scale).toFixed(1)}" fill="none" stroke="${baseColor}" stroke-width="${Math.max(2, radius * scale * 0.05).toFixed(1)}" opacity="0.9"/>`;

  const beads = items
    .map((it, i) => {
      const px = cx + it.x * scale;
      const py = cy + it.z * scale;
      const pr = Math.max(4, it.r * scale);
      const color = parts[i]!.colorHex;
      return (
        `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${pr.toFixed(1)}" fill="${color}" stroke="rgba(0,0,0,0.12)" stroke-width="1"/>` +
        `<ellipse cx="${(px - pr * 0.3).toFixed(1)}" cy="${(py - pr * 0.35).toFixed(1)}" rx="${(pr * 0.35).toFixed(1)}" ry="${(pr * 0.25).toFixed(1)}" fill="rgba(255,255,255,0.45)"/>`
      );
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}" viewBox="0 0 ${W} ${W}"><rect width="${W}" height="${W}" fill="#f7f4ef"/>${ring}${beads}</svg>`;
}

async function main() {
  const designs = await sql`
    select d.id, d.size_cm, d.components_json, b.color_hex as base_color
    from designs d left join bases b on b.id = d.base_id
    where d.thumbnail_url is null`;

  console.log(`Generating thumbnails for ${designs.length} designs…`);
  let done = 0;

  for (const d of designs) {
    const components = (d.components_json as { kind: string; refId: string }[]) ?? [];
    const beadIds = components.filter((c) => c.kind === "bead").map((c) => c.refId);
    const charmIds = components.filter((c) => c.kind === "charm").map((c) => c.refId);

    const [beadRows, charmRows] = await Promise.all([
      beadIds.length
        ? sql`select id, color_hex, diameter_mm from beads where id in ${sql(beadIds)}`
        : Promise.resolve([]),
      charmIds.length
        ? sql`select id, color_hex, diameter_mm from charms where id in ${sql(charmIds)}`
        : Promise.resolve([]),
    ]);
    const byId = new Map<string, { color_hex: string; diameter_mm: string }>();
    for (const r of [...beadRows, ...charmRows]) byId.set(r.id, r);

    const parts: Part[] = components
      .map((c) => byId.get(c.refId))
      .filter((r): r is { color_hex: string; diameter_mm: string } => Boolean(r))
      .map((r) => ({ colorHex: r.color_hex, diameterMm: Number(r.diameter_mm) }));

    const svg = buildSvg(d.base_color ?? "#C7A15A", parts, Number(d.size_cm));
    const path = `brand/${d.id}.svg`;

    const { error } = await supabase.storage
      .from("designs")
      .upload(path, Buffer.from(svg), {
        contentType: "image/svg+xml",
        upsert: true,
      });
    if (error) {
      console.error(`  ✗ ${d.id}: ${error.message}`);
      continue;
    }
    const { data } = supabase.storage.from("designs").getPublicUrl(path);
    await sql`update designs set thumbnail_url = ${data.publicUrl} where id = ${d.id}`;
    done++;
  }

  console.log(`✅ Generated ${done} placeholder thumbnails.`);
  await sql.end();
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});
