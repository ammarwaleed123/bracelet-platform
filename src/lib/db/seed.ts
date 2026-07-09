import { config } from "dotenv";
import { isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { nanoid } from "nanoid";
import postgres from "postgres";

import * as schema from "./schema";
import { baseParams, beadParams } from "@/lib/catalog/params";
import {
  seedBases,
  seedBeads,
  seedCategories,
  seedCharms,
  seedCollections,
  seedDesigns,
} from "./seed-data";

// Standalone script (`npm run db:seed`), outside Next — load env + own client.
config({ path: ".env.local" });

/** URL/slug-safe: lowercase, non-alphanumerics collapsed to single hyphens. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const egpToPiastres = (egp: number) => Math.round(egp * 100);

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in."
    );
  }

  const client = postgres(databaseUrl, { prepare: false, max: 1 });
  const db = drizzle(client, { schema, casing: "snake_case" });

  console.log("🌱 Seeding catalog…");

  // 1) Clear existing seed data. Only brand designs (no owner) are removed so
  //    real user designs are never touched. Join tables cascade on delete.
  await db.delete(schema.collectionDesigns);
  await db.delete(schema.designs).where(isNull(schema.designs.ownerId));
  await db.delete(schema.collections);
  await db.delete(schema.beadCategories);
  await db.delete(schema.charmCategories);
  await db.delete(schema.beads);
  await db.delete(schema.charms);
  await db.delete(schema.bases);
  await db.delete(schema.categories);

  // 2) Categories.
  const categoryRows = await db
    .insert(schema.categories)
    .values(
      seedCategories.map((c, i) => ({ name: c.name, slug: c.slug, sortOrder: i }))
    )
    .returning({ id: schema.categories.id, slug: schema.categories.slug });
  const categoryId = new Map(categoryRows.map((r) => [r.slug, r.id]));

  // 3) Bases.
  const baseRows = await db
    .insert(schema.bases)
    .values(
      seedBases.map((b, i) => ({
        name: b.name,
        slug: slugify(b.name),
        type: b.type,
        material: b.material,
        colorHex: b.colorHex,
        priceInPiastres: egpToPiastres(b.egp),
        model3dParams: baseParams(b.type, b.colorHex),
        stockQuantity: b.stock,
        sortOrder: i,
      }))
    )
    .returning({
      id: schema.bases.id,
      slug: schema.bases.slug,
      price: schema.bases.priceInPiastres,
    });
  const base = new Map(baseRows.map((r) => [r.slug, r]));

  // 4) Beads (+ category links).
  const beadRows = await db
    .insert(schema.beads)
    .values(
      seedBeads.map((b, i) => ({
        name: b.name,
        slug: slugify(b.name),
        stoneType: b.stoneType,
        meaning: b.meaning,
        colorHex: b.colorHex,
        finish: b.finish,
        diameterMm: String(b.diameterMm),
        priceInPiastres: egpToPiastres(b.egp),
        material3dParams: beadParams(b.finish, b.colorHex, b.transmission),
        stockQuantity: 100,
        sortOrder: i,
      }))
    )
    .returning({
      id: schema.beads.id,
      slug: schema.beads.slug,
      price: schema.beads.priceInPiastres,
    });
  const bead = new Map(beadRows.map((r) => [r.slug, r]));

  const beadCategoryValues = seedBeads.flatMap((b) => {
    const beadId = bead.get(slugify(b.name))!.id;
    return b.categories
      .map((slug) => categoryId.get(slug))
      .filter((id): id is string => Boolean(id))
      .map((catId) => ({ beadId, categoryId: catId }));
  });
  if (beadCategoryValues.length) {
    await db.insert(schema.beadCategories).values(beadCategoryValues);
  }

  // 5) Charms (+ category links).
  const charmRows = await db
    .insert(schema.charms)
    .values(
      seedCharms.map((c, i) => ({
        name: c.name,
        slug: slugify(c.name),
        meaning: c.meaning,
        colorHex: c.colorHex,
        finish: "metallic" as const,
        charmShape: c.shape,
        letterValue: c.letterValue ?? null,
        priceInPiastres: egpToPiastres(c.egp),
        material3dParams: beadParams("metallic", c.colorHex),
        stockQuantity: 100,
        sortOrder: i,
      }))
    )
    .returning({
      id: schema.charms.id,
      slug: schema.charms.slug,
      price: schema.charms.priceInPiastres,
    });
  const charm = new Map(charmRows.map((r) => [r.slug, r]));

  const charmCategoryValues = seedCharms.flatMap((c) => {
    const charmId = charm.get(slugify(c.name))!.id;
    return c.categories
      .map((slug) => categoryId.get(slug))
      .filter((id): id is string => Boolean(id))
      .map((catId) => ({ charmId, categoryId: catId }));
  });
  if (charmCategoryValues.length) {
    await db.insert(schema.charmCategories).values(charmCategoryValues);
  }

  // 6) Collections.
  const collectionRows = await db
    .insert(schema.collections)
    .values(
      seedCollections.map((c, i) => ({
        name: c.name,
        slug: c.slug,
        description: c.description,
        sortOrder: i,
      }))
    )
    .returning({ id: schema.collections.id, slug: schema.collections.slug });
  const collectionId = new Map(collectionRows.map((r) => [r.slug, r.id]));

  // 7) Brand designs — price recomputed from the catalog, never trusted input.
  let designCount = 0;
  const collectionLinks: { collectionId: string; designId: string; sortOrder: number }[] = [];

  for (const plan of seedDesigns) {
    const baseRow = base.get(plan.baseSlug);
    if (!baseRow) throw new Error(`Seed design "${plan.name}": unknown base ${plan.baseSlug}`);

    const components = plan.components.map((ref, slot) => {
      const [kind, slug] = ref.split(":") as ["bead" | "charm", string];
      const row = kind === "bead" ? bead.get(slug) : charm.get(slug);
      if (!row) throw new Error(`Seed design "${plan.name}": unknown ${kind} ${slug}`);
      return { slot, kind, refId: row.id, price: row.price };
    });

    const priceSnapshot =
      baseRow.price + components.reduce((sum, c) => sum + c.price, 0);

    const [designRow] = await db
      .insert(schema.designs)
      .values({
        publicId: nanoid(10),
        ownerId: null,
        name: plan.name,
        status: "published_public",
        baseId: baseRow.id,
        sizeCm: String(plan.sizeCm),
        componentsJson: components.map((c) => ({
          slot: c.slot,
          kind: c.kind,
          refId: c.refId,
        })),
        priceSnapshotInPiastres: priceSnapshot,
      })
      .returning({ id: schema.designs.id });

    designCount++;
    plan.collections.forEach((slug, i) => {
      const cid = collectionId.get(slug);
      if (cid && designRow) {
        collectionLinks.push({ collectionId: cid, designId: designRow.id, sortOrder: i });
      }
    });
  }

  if (collectionLinks.length) {
    await db.insert(schema.collectionDesigns).values(collectionLinks);
  }

  console.log(
    `✅ Seeded ${seedCategories.length} categories, ${baseRows.length} bases, ` +
      `${beadRows.length} beads, ${charmRows.length} charms, ` +
      `${collectionRows.length} collections, ${designCount} brand designs.`
  );

  await client.end();
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
