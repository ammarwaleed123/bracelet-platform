import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

/**
 * Supabase client authenticated with the service-role key. This BYPASSES
 * row-level security and must never be imported into client code — the
 * `server-only` guard above turns any such import into a build error.
 *
 * Used for privileged server operations like Storage uploads.
 */
export function createAdminClient() {
  return createClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
