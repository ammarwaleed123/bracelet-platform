import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Drizzle database client (server-only).
 *
 * Lazily initialized so importing this module never requires DATABASE_URL at
 * build time — the connection is opened on first query. Configured for the
 * Supabase connection pooler (`prepare: false`, as pgBouncer runs in
 * transaction mode). Use `snake_case` casing to match the schema.
 */
let _db: PostgresJsDatabase<typeof schema> | undefined;

function createDb(): PostgresJsDatabase<typeof schema> {
  const client = postgres(env.databaseUrl, { prepare: false });
  return drizzle(client, { schema, casing: "snake_case" });
}

export const db: PostgresJsDatabase<typeof schema> = new Proxy(
  {} as PostgresJsDatabase<typeof schema>,
  {
    get(_target, prop, receiver) {
      _db ??= createDb();
      return Reflect.get(_db, prop, receiver);
    },
  }
);

export { schema };
