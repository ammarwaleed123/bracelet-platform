import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * Supabase client for use in Client Components (browser).
 * Uses the public anon key; row-level security enforces access.
 */
export function createClient() {
  return createBrowserClient(env.supabase.url, env.supabase.anonKey);
}
