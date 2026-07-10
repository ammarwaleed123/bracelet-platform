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

/* ----- commerce enums (milestone 1.5) ----- */

export const orderStatus = pgEnum("order_status", [
  "pending_confirmation",
  "confirmed",
  "crafting",
  "shipped",
  "delivered",
  "cancelled",
]);

export const paymentMethod = pgEnum("payment_method", [
  "cod",
  "paymob_card",
  "paymob_wallet",
]);

export const paymentStatus = pgEnum("payment_status", [
  "unpaid",
  "paid",
  "refunded",
]);

export const discountType = pgEnum("discount_type", ["percent", "fixed"]);

/** Lifecycle of a creator commission entry. */
export const commissionStatus = pgEnum("commission_status", [
  "accrued",
  "reversed",
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

/** Delivery address captured at checkout (stored on the order as jsonb). */
export type ShippingAddress = {
  line1: string;
  line2?: string;
  /** District / area within the governorate. */
  area?: string;
  governorate: string;
  landmark?: string;
  /** Optional pinned GPS location to help the courier find the address. */
  geo?: { lat: number; lng: number };
};

/**
 * Immutable snapshot of a purchased design, stored on the order item so orders
 * survive later edits/deletes of the design or catalog (spec §3).
 */
export type OrderItemDesignSnapshot = {
  baseId: string | null;
  sizeCm: string;
  components: DesignComponent[];
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

/* ------------------------------------------------------- shipping zones -- */

/** Governorate → flat COD shipping fee. Seeded with editable placeholders. */
export const shippingZones = pgTable("shipping_zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  /** Governorate names this zone covers (matched to the checkout selector). */
  governorates: text("governorates").array().notNull().default([]),
  feeInPiastres: integer("fee_in_piastres").notNull(),
  estimatedDays: text("estimated_days"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

/* -------------------------------------------------------- discount codes -- */

export const discountCodes = pgTable("discount_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  type: discountType("type").notNull(),
  /** For `percent`: whole percent (e.g. 10). For `fixed`: piastres off. */
  value: integer("value").notNull(),
  minSubtotalInPiastres: integer("min_subtotal_in_piastres")
    .notNull()
    .default(0),
  /** Null = unlimited uses. */
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ---------------------------------------------------------------- carts -- */

/** One open cart per user (or per guest session token). */
export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id, {
    onDelete: "cascade",
  }),
  /** Opaque token stored in a cookie for guest carts. */
  sessionToken: text("session_token").unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id")
    .notNull()
    .references(() => carts.id, { onDelete: "cascade" }),
  designId: uuid("design_id")
    .notNull()
    .references(() => designs.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  /** Optional per-item gift message. */
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* --------------------------------------------------------------- orders -- */

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Human-friendly, e.g. BR-2026-000123. Primary tracking identifier. */
  orderNumber: text("order_number").notNull().unique(),
  userId: uuid("user_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  status: orderStatus("status").notNull().default("pending_confirmation"),
  paymentMethod: paymentMethod("payment_method").notNull().default("cod"),
  paymentStatus: paymentStatus("payment_status").notNull().default("unpaid"),
  subtotalInPiastres: integer("subtotal_in_piastres").notNull(),
  shippingInPiastres: integer("shipping_in_piastres").notNull().default(0),
  discountInPiastres: integer("discount_in_piastres").notNull().default(0),
  /** Store credit spent on this order (applies to the discounted product cost
   *  only — never shipping). Refunded to the buyer's balance if cancelled. */
  storeCreditAppliedInPiastres: integer("store_credit_applied_in_piastres")
    .notNull()
    .default(0),
  storeCreditRefundedAt: timestamp("store_credit_refunded_at", {
    withTimezone: true,
  }),
  totalInPiastres: integer("total_in_piastres").notNull(),
  customerName: text("customer_name").notNull(),
  /** Required — the primary contact channel in Egypt; gates guest tracking. */
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  shippingAddressJson: jsonb("shipping_address_json")
    .$type<ShippingAddress>()
    .notNull(),
  governorate: text("governorate").notNull(),
  discountCodeId: uuid("discount_code_id").references(() => discountCodes.id, {
    onDelete: "set null",
  }),
  placedAt: timestamp("placed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Line item snapshot — immutable once placed. Stores the design's name, price,
 * thumbnail and full component snapshot at purchase time. `creatorId` is the
 * design owner at purchase (null for brand/guest designs); it powers the
 * exact-purchase commission wired after commerce works.
 */
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  designId: uuid("design_id").references(() => designs.id, {
    onDelete: "set null",
  }),
  designName: text("design_name").notNull(),
  designThumbnailUrl: text("design_thumbnail_url"),
  designSnapshotJson: jsonb("design_snapshot_json")
    .$type<OrderItemDesignSnapshot>()
    .notNull(),
  unitPriceInPiastres: integer("unit_price_in_piastres").notNull(),
  quantity: integer("quantity").notNull().default(1),
  note: text("note"),
  /** Design owner at purchase time — the commission earner (exact buys only). */
  creatorId: uuid("creator_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
});

/** Status timeline entries powering the tracking page (spec §3, §8). */
export const orderEvents = pgTable("order_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: orderStatus("status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ----------------------------------------------------------- settings -- */

/** Simple key/value app settings (e.g. commission_percent). */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------------------------ commission entries -- */

/**
 * Creator commission ledger. One row per order_item that earned a commission
 * (unique on order_item_id → idempotent crediting). The creator's running
 * balance lives in profiles.store_credit_in_piastres; this table makes it
 * auditable and reversible when an order is cancelled.
 */
export const commissionEntries = pgTable("commission_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  orderItemId: uuid("order_item_id")
    .notNull()
    .unique()
    .references(() => orderItems.id, { onDelete: "cascade" }),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  designId: uuid("design_id").references(() => designs.id, {
    onDelete: "set null",
  }),
  amountInPiastres: integer("amount_in_piastres").notNull(),
  status: commissionStatus("status").notNull().default("accrued"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

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

export const cartsRelations = relations(carts, ({ many }) => ({
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  design: one(designs, {
    fields: [cartItems.designId],
    references: [designs.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(profiles, {
    fields: [orders.userId],
    references: [profiles.id],
  }),
  discountCode: one(discountCodes, {
    fields: [orders.discountCodeId],
    references: [discountCodes.id],
  }),
  items: many(orderItems),
  events: many(orderEvents),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  design: one(designs, {
    fields: [orderItems.designId],
    references: [designs.id],
  }),
  creator: one(profiles, {
    fields: [orderItems.creatorId],
    references: [profiles.id],
  }),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, {
    fields: [orderEvents.orderId],
    references: [orders.id],
  }),
}));

export const commissionEntriesRelations = relations(
  commissionEntries,
  ({ one }) => ({
    order: one(orders, {
      fields: [commissionEntries.orderId],
      references: [orders.id],
    }),
    creator: one(profiles, {
      fields: [commissionEntries.creatorId],
      references: [profiles.id],
    }),
    design: one(designs, {
      fields: [commissionEntries.designId],
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
export type ShippingZone = typeof shippingZones.$inferSelect;
export type NewShippingZone = typeof shippingZones.$inferInsert;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type NewDiscountCode = typeof discountCodes.$inferInsert;
export type Cart = typeof carts.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type CommissionEntry = typeof commissionEntries.$inferSelect;
