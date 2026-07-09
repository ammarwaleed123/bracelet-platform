import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Database schema — milestone 1.2 (catalog, designs, collections).
 *
 * Scope decision: the commerce tables from docs/PHASE-1-SPEC.md §3 (carts,
 * orders, discounts, shipping, reviews) are intentionally deferred to
 * milestone 1.5, where they are designed alongside the checkout logic. This
 * file covers the catalog + design data model the studio and gallery need.
 *
 * Conventions:
 * - Money is ALWAYS integer piastres (1 EGP = 100 piastres). Never floats.
 * - Every catalog entity carries stockQuantity + isActive; the studio disables
 *   (never hides) out-of-stock or inactive items.
 * - 3D/material params are typed jsonb so the studio reads them directly.
 */

/* ---------------------------------------------------------------- enums -- */

/** Site roles; admin unlocks the /admin area (spec §9). */
export const userRole = pgEnum("user_role", ["customer", "admin"]);

export const baseType = pgEnum("base_type", ["chain", "cord", "bangle"]);

export const beadFinish = pgEnum("bead_finish", [
  "polished",
  "matte",
  "faceted",
  "metallic",
]);

export const charmShape = pgEnum("charm_shape", [
  "heart",
  "star",
  "moon",
  "letter",
  "custom",
]);

export const designStatus = pgEnum("design_status", [
  "draft",
  "saved",
  "published_private",
  "published_public",
]);

/** Moderation state for community designs submitted to the public gallery. */
export const moderationStatus = pgEnum("moderation_status", [
  "pending",
  "approved",
  "rejected",
]);

/* --------------------------------------------------------- json shapes -- */

/** Params the studio uses to render a base (torus/cord path + material). */
export type Model3dParams = {
  radius?: number;
  thickness?: number;
  color?: string;
  metalness?: number;
  roughness?: number;
};

/** PBR material params for a bead/charm mesh. */
export type Material3dParams = {
  color: string;
  roughness?: number;
  metalness?: number;
  transmission?: number;
};

/**
 * One placed component in a saved design. Ordered by `slot` around the
 * bracelet. `kind` selects which catalog table `refId` points at. This shape
 * is versioned by designs.designSchemaVersion so old designs survive schema
 * evolution (CLAUDE.md).
 */
export type DesignComponent = {
  slot: number;
  kind: "bead" | "charm";
  refId: string;
};

/* ------------------------------------------------------------ profiles -- */

/**
 * Application-level user profile, keyed by the Supabase Auth user id. A DB
 * trigger (see migration) inserts a row on signup; role gates /admin.
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // matches auth.users.id
  fullName: text("full_name"),
  /** Opt-in public name shown as "Designed by …" on gallery designs. */
  displayName: text("display_name"),
  /** Creator earnings held as store credit (integer piastres). The commission
   *  engine that fills this lands after milestone 1.5 (needs orders). */
  storeCreditInPiastres: integer("store_credit_in_piastres")
    .notNull()
    .default(0),
  role: userRole("role").notNull().default("customer"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ---------------------------------------------------------- categories -- */

/** Shared taxonomy for beads and charms; drives studio + gallery filters. */
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});

/* --------------------------------------------------------------- bases -- */

export const bases = pgTable("bases", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  type: baseType("type").notNull(),
  material: text("material"),
  colorHex: text("color_hex").notNull().default("#C7A15A"),
  priceInPiastres: integer("price_in_piastres").notNull(),
  imageUrl: text("image_url"),
  model3dParams: jsonb("model_3d_params").$type<Model3dParams>(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* --------------------------------------------------------------- beads -- */

export const beads = pgTable("beads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  stoneType: text("stone_type"),
  /** The "lifestyle" layer: what the stone symbolizes. */
  meaning: text("meaning"),
  colorHex: text("color_hex").notNull().default("#FFFFFF"),
  finish: beadFinish("finish").notNull().default("polished"),
  diameterMm: numeric("diameter_mm", { precision: 4, scale: 1 })
    .notNull()
    .default("8.0"),
  priceInPiastres: integer("price_in_piastres").notNull(),
  imageUrl: text("image_url"),
  material3dParams: jsonb("material_3d_params").$type<Material3dParams>(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  /** Reserved for Phase 3 unlockables — always false in Phase 1. */
  isPremium: boolean("is_premium").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* -------------------------------------------------------------- charms -- */

/** Same shape as beads, plus charm-specific fields (spec §3). */
export const charms = pgTable("charms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  stoneType: text("stone_type"),
  meaning: text("meaning"),
  colorHex: text("color_hex").notNull().default("#C7A15A"),
  finish: beadFinish("finish").notNull().default("metallic"),
  diameterMm: numeric("diameter_mm", { precision: 4, scale: 1 })
    .notNull()
    .default("10.0"),
  priceInPiastres: integer("price_in_piastres").notNull(),
  imageUrl: text("image_url"),
  material3dParams: jsonb("material_3d_params").$type<Material3dParams>(),
  charmShape: charmShape("charm_shape").notNull().default("custom"),
  /** For initial/letter charms; null otherwise. */
  letterValue: text("letter_value"),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isPremium: boolean("is_premium").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------------------------- category join tables -- */

export const beadCategories = pgTable(
  "bead_categories",
  {
    beadId: uuid("bead_id")
      .notNull()
      .references(() => beads.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.beadId, t.categoryId] })]
);

export const charmCategories = pgTable(
  "charm_categories",
  {
    charmId: uuid("charm_id")
      .notNull()
      .references(() => charms.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.charmId, t.categoryId] })]
);

/* ------------------------------------------------------------- designs -- */

export const designs = pgTable("designs", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Short nanoid for share URLs (/design/[publicId]). */
  publicId: text("public_id").notNull().unique(),
  /** Nullable — guests can design. Null owner = brand-curated design. */
  ownerId: uuid("owner_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  status: designStatus("status").notNull().default("draft"),
  /** For public submissions. Defaults to approved so brand/curated designs are
   *  visible immediately; customer submissions are set to pending on publish. */
  moderationStatus: moderationStatus("moderation_status")
    .notNull()
    .default("approved"),
  baseId: uuid("base_id").references(() => bases.id, { onDelete: "set null" }),
  sizeCm: numeric("size_cm", { precision: 4, scale: 1 })
    .notNull()
    .default("18.0"),
  componentsJson: jsonb("components_json")
    .$type<DesignComponent[]>()
    .notNull()
    .default([]),
  designSchemaVersion: integer("design_schema_version").notNull().default(1),
  /** Price computed server-side on save; never trust the client. */
  priceSnapshotInPiastres: integer("price_snapshot_in_piastres")
    .notNull()
    .default(0),
  thumbnailUrl: text("thumbnail_url"),
  likesCount: integer("likes_count").notNull().default(0),
  /** Inspiration lineage; becomes Passport "design history" in Phase 2. */
  forkedFromDesignId: uuid("forked_from_design_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const designLikes = pgTable(
  "design_likes",
  {
    designId: uuid("design_id")
      .notNull()
      .references(() => designs.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  // Composite PK already enforces one like per (design, user).
  (t) => [primaryKey({ columns: [t.designId, t.userId] })]
);

/* --------------------------------------------------------- collections -- */

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  heroImageUrl: text("hero_image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const collectionDesigns = pgTable(
  "collection_designs",
  {
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    designId: uuid("design_id")
      .notNull()
      .references(() => designs.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.collectionId, t.designId] })]
);

/* ----------------------------------------------------------- relations -- */

export const beadsRelations = relations(beads, ({ many }) => ({
  categories: many(beadCategories),
}));

export const charmsRelations = relations(charms, ({ many }) => ({
  categories: many(charmCategories),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  beads: many(beadCategories),
  charms: many(charmCategories),
}));

export const beadCategoriesRelations = relations(beadCategories, ({ one }) => ({
  bead: one(beads, {
    fields: [beadCategories.beadId],
    references: [beads.id],
  }),
  category: one(categories, {
    fields: [beadCategories.categoryId],
    references: [categories.id],
  }),
}));

export const charmCategoriesRelations = relations(
  charmCategories,
  ({ one }) => ({
    charm: one(charms, {
      fields: [charmCategories.charmId],
      references: [charms.id],
    }),
    category: one(categories, {
      fields: [charmCategories.categoryId],
      references: [categories.id],
    }),
  })
);

export const designsRelations = relations(designs, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [designs.ownerId],
    references: [profiles.id],
  }),
  base: one(bases, {
    fields: [designs.baseId],
    references: [bases.id],
  }),
  collections: many(collectionDesigns),
  likes: many(designLikes),
}));

export const collectionsRelations = relations(collections, ({ many }) => ({
  designs: many(collectionDesigns),
}));

export const collectionDesignsRelations = relations(
  collectionDesigns,
  ({ one }) => ({
    collection: one(collections, {
      fields: [collectionDesigns.collectionId],
      references: [collections.id],
    }),
    design: one(designs, {
      fields: [collectionDesigns.designId],
      references: [designs.id],
    }),
  })
);

/* --------------------------------------------------------------- types -- */

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Base = typeof bases.$inferSelect;
export type NewBase = typeof bases.$inferInsert;
export type Bead = typeof beads.$inferSelect;
export type NewBead = typeof beads.$inferInsert;
export type Charm = typeof charms.$inferSelect;
export type NewCharm = typeof charms.$inferInsert;
export type Design = typeof designs.$inferSelect;
export type NewDesign = typeof designs.$inferInsert;
export type Collection = typeof collections.$inferSelect;
