import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

// Seed runs as a standalone script (`npm run db:seed`), outside Next, so load
// .env.local and open our own connection rather than reusing the app client.
config({ path: ".env.local" });

/**
 * Seed script skeleton.
 *
 * Milestone 1.1 wires this up and proves the connection. The real catalog
 * (~6 bases, ~40 beads, ~15 charms, 3 collections, ~20 brand designs — see
 * docs/PHASE-1-SPEC.md §10) is populated in milestone 1.2 once those tables
 * exist. Keep this idempotent: running it repeatedly must be safe.
 */
async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in."
    );
  }

  const client = postgres(databaseUrl, { prepare: false, max: 1 });
  const db = drizzle(client, { schema, casing: "snake_case" });

  console.log("🌱 Seeding database…");

  // TODO(1.2): insert catalog, collections, and brand designs here.
  // Placeholder verifies the connection is live and the schema is reachable.
  void db;

  console.log("✅ Seed complete (skeleton — catalog arrives in milestone 1.2).");

  await client.end();
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
