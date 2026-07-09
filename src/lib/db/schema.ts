import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Database schema.
 *
 * Milestone 1.1 establishes the wiring and the first table only. The full
 * catalog, design, and commerce schema (docs/PHASE-1-SPEC.md §3) lands in
 * milestone 1.2. New tables are added here and migrated via `npm run
 * db:generate` + `db:migrate`.
 */

/** Site roles; admin unlocks the /admin area (spec §9). */
export const userRole = pgEnum("user_role", ["customer", "admin"]);

/**
 * Application-level user profile, keyed by the Supabase Auth user id.
 * Auth itself lives in Supabase's `auth.users`; this mirrors the bits the app
 * owns (display name, role) so we can join and role-gate without hitting the
 * auth schema directly.
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // matches auth.users.id
  fullName: text("full_name"),
  role: userRole("role").notNull().default("customer"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
