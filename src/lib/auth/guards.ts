import "server-only";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

/** The current Supabase auth user, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Require a signed-in user; redirect to sign-in otherwise. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/**
 * Require an admin. Reads the role from `profiles` (via Drizzle, which runs on
 * the Postgres role and is the authoritative check). Non-admins are sent home
 * rather than shown a 403, so the admin area is effectively invisible.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }
  return user;
}
