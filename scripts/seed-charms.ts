/**
 * Catalog charms maintenance:
 *  • upsert the real photo-charms (rendered as extruded 3D charms in the studio
 *    when their image is /charms/<slug>.png);
 *  • hide the earlier low-res grid charms;
 *  • revert charms that should fall back to their procedural shape.
 * Idempotent. Run: npx tsx scripts/seed-charms.ts
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, inArray } from "drizzle-orm";
import postgres from "postgres";

import * as schema from "../src/lib/db/schema";

config({ path: ".env.local" });

const GOLD = "#B08D57";

// Two locked-in presets for photo-charms:
//   charm (pendant)  → 11mm, processed with `auto`   → hangs from its bail loop.
//   bead  (round)    → 7mm,  processed with `center` → threads through the middle.
const SIZE = { charm: "11.0", bead: "7.0" } as const;

// Real photo-charms (each has /charms/<slug>.png + .json). `kind` sets the size.
//   model: true  → a real 3D model charm (/charms/<slug>.glb) instead of a photo;
//                  `mm` overrides its size (models are often taller than wide).
const PHOTO_CHARMS: {
  slug: string; name: string; meaning: string;
  kind: keyof typeof SIZE; egp: number; sortOrder: number;
  model?: boolean; mm?: string;
}[] = [
  { slug: "starlight-heart", name: "Starlight Heart", meaning: "A whole universe of love.", kind: "charm", egp: 130, sortOrder: 1 },
  { slug: "pink-pave", name: "Pink Pavé", meaning: "A little blush of sparkle.", kind: "bead", egp: 150, sortOrder: 2 },
  { slug: "love-locks", name: "Love Locks", meaning: "Two hearts, locked as one.", kind: "charm", egp: 185, sortOrder: 3 },
  { slug: "crowned-heart", name: "Crowned Heart", meaning: "A little royalty for your wrist.", kind: "bead", egp: 160, sortOrder: 4 },
  { slug: "amber-pumpkin", name: "Amber Pumpkin", meaning: "A little autumn magic.", kind: "charm", egp: 175, sortOrder: 5 },
  { slug: "golden-crown", name: "Golden Crown", meaning: "Wear your crown.", kind: "charm", egp: 165, sortOrder: 6 },
  { slug: "keyheart", name: "Key to My Heart", meaning: "You hold the key.", kind: "charm", egp: 220, sortOrder: 7, model: true, mm: "14.0" },
];

// The earlier low-res grid charms — remove them entirely (no longer wanted).
const DELETE_SLUGS = ["key", "padlock", "butterfly", "feather"];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set.");
  const client = postgres(databaseUrl, { prepare: false, max: 1 });
  const db = drizzle(client, { schema, casing: "snake_case" });

  for (const c of PHOTO_CHARMS) {
    const values = {
      name: c.name,
      slug: c.slug,
      meaning: c.meaning,
      colorHex: GOLD,
      finish: "metallic" as const,
      charmShape: "custom" as const,
      diameterMm: c.mm ?? SIZE[c.kind],
      priceInPiastres: Math.round(c.egp * 100),
      imageUrl: c.model ? `/charms/${c.slug}.glb` : `/charms/${c.slug}.png`,
      stockQuantity: 60,
      isActive: true,
      sortOrder: c.sortOrder,
    };
    const [existing] = await db
      .select({ id: schema.charms.id })
      .from(schema.charms)
      .where(eq(schema.charms.slug, c.slug))
      .limit(1);
    if (existing) {
      await db.update(schema.charms).set({ ...values, updatedAt: new Date() }).where(eq(schema.charms.id, existing.id));
      console.log(`  ✓ updated ${c.slug}`);
    } else {
      await db.insert(schema.charms).values(values);
      console.log(`  ✓ inserted ${c.slug}`);
    }
  }

  if (DELETE_SLUGS.length) {
    await db.delete(schema.charms).where(inArray(schema.charms.slug, DELETE_SLUGS));
    console.log(`  ✓ deleted ${DELETE_SLUGS.join(", ")}`);
  }

  await client.end();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
