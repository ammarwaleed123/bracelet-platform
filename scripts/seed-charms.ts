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

// Real photo-charms (each has /charms/<slug>.png + .json).
const PHOTO_CHARMS = [
  { slug: "starlight-heart", name: "Starlight Heart", meaning: "A whole universe of love.", diameterMm: "16.0", egp: 130, sortOrder: 1 },
];

// Earlier low-res grid charms to hide.
const HIDE = ["key", "padlock"];
// Charms to send back to their procedural shape (drop the low-res photo).
const REVERT = ["butterfly", "feather"];

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
      diameterMm: c.diameterMm,
      priceInPiastres: Math.round(c.egp * 100),
      imageUrl: `/charms/${c.slug}.png`,
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

  if (HIDE.length) {
    await db.update(schema.charms).set({ isActive: false, updatedAt: new Date() }).where(inArray(schema.charms.slug, HIDE));
    console.log(`  ✓ hid ${HIDE.join(", ")}`);
  }
  if (REVERT.length) {
    await db.update(schema.charms).set({ imageUrl: null, updatedAt: new Date() }).where(inArray(schema.charms.slug, REVERT));
    console.log(`  ✓ reverted ${REVERT.join(", ")} to procedural`);
  }

  await client.end();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
