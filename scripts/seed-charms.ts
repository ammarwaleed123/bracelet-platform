/**
 * Upsert the four real product charms (antique-gold key, padlock, butterfly,
 * feather) with their processed photo assets under /charms. The studio renders
 * any charm whose imageUrl is /charms/<name>.png as a real extruded 3D charm.
 * Idempotent (upsert by slug). Run: npx tsx scripts/seed-charms.ts
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";

import * as schema from "../src/lib/db/schema";

config({ path: ".env.local" });

const GOLD = "#B08D57";

const CHARMS = [
  { slug: "key", name: "Vintage Key", meaning: "Unlock what's meant for you.", diameterMm: "15.0", egp: 90, sortOrder: 1 },
  { slug: "padlock", name: "Padlock", meaning: "Keep what matters close.", diameterMm: "14.0", egp: 95, sortOrder: 2 },
  { slug: "butterfly", name: "Butterfly", meaning: "Growth and change.", diameterMm: "15.0", egp: 100, sortOrder: 3 },
  { slug: "feather", name: "Feather", meaning: "Freedom and lightness.", diameterMm: "15.0", egp: 85, sortOrder: 4 },
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set.");
  const client = postgres(databaseUrl, { prepare: false, max: 1 });
  const db = drizzle(client, { schema, casing: "snake_case" });

  for (const c of CHARMS) {
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
      await db
        .update(schema.charms)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(schema.charms.id, existing.id));
      console.log(`  ✓ updated ${c.slug}`);
    } else {
      await db.insert(schema.charms).values(values);
      console.log(`  ✓ inserted ${c.slug}`);
    }
  }

  await client.end();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
