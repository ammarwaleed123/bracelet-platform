/**
 * Seed / refresh the shipping zones (all 27 Egyptian governorates) with the
 * placeholder rates from src/content/egypt.ts. Idempotent: upserts by zone name.
 *
 * Run: npm run db:seed:shipping
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";

import * as schema from "../src/lib/db/schema";
import { SHIPPING_ZONES } from "../src/content/egypt";

config({ path: ".env.local" });

const egpToPiastres = (egp: number) => Math.round(egp * 100);

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set.");

  const client = postgres(databaseUrl, { prepare: false, max: 1 });
  const db = drizzle(client, { schema, casing: "snake_case" });

  console.log("🚚 Seeding shipping zones…");
  for (const z of SHIPPING_ZONES) {
    const [existing] = await db
      .select({ id: schema.shippingZones.id })
      .from(schema.shippingZones)
      .where(eq(schema.shippingZones.name, z.name))
      .limit(1);

    const values = {
      name: z.name,
      governorates: z.governorates,
      feeInPiastres: egpToPiastres(z.feeEgp),
      estimatedDays: z.estimatedDays,
      sortOrder: z.sortOrder,
      isActive: true,
    };

    if (existing) {
      await db
        .update(schema.shippingZones)
        .set(values)
        .where(eq(schema.shippingZones.id, existing.id));
    } else {
      await db.insert(schema.shippingZones).values(values);
    }
    console.log(`  ✓ ${z.name} (${z.governorates.length} governorates)`);
  }

  await client.end();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
