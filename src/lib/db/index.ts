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
 *
 * The underlying postgres client is cached on `globalThis` so Next.js hot
 * reload in dev (and warm serverless instances in prod) reuse a single, bounded
 * connection pool instead of leaking a new one on every module re-evaluation —
 * which otherwise exhausts the Supabase pooler (EMAXCONN, limit 200).
 */
const globalForDb = globalThis as unknown as {
  _pgClient?: ReturnType<typeof postgres>;
};

let _db: PostgresJsDatabase<typeof schema> | undefined;

function createDb(): PostgresJsDatabase<typeof schema> {
  const client =
    globalForDb._pgClient ??
    (globalForDb._pgClient = postgres(env.databaseUrl, {
      prepare: false, // Supabase transaction pooler (pgBouncer)
      max: 10, // cap connections so we never approach the pooler limit
      idle_timeout: 20, // release idle connections after 20s
    }));
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
