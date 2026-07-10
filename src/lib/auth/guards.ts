import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

/**
 * The current Supabase auth user, or null.
 *
 * Wrapped in React `cache()` so every caller in a single request/render shares
 * ONE `getUser()` result. `getUser()` is a network round trip to Supabase Auth,
 * and this function is reached many times per page (the cart badge in the root
 * layout, route guards, and the page's own logic). Without this, each call was
 * an independent remote call, stacking hundreds of ms of latency onto every
 * navigation. The cache is per-request, so it never leaks between users.
 */
export const getCurrentUser = cache(async function getCurrentUser(): Promise<
  User | null
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Require a signed-in user; redirect to sign-in otherwise. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/**
 * Ensure a profile row exists for the user (idempotent). A safety net in case
 * the auth trigger ever misses an account — anything that writes a foreign key
 * to profiles (saving designs, liking) should call this first.
 */
export async function ensureProfile(user: User): Promise<void> {
  await db
    .insert(profiles)
    .values({
      id: user.id,
      fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
    })
    .onConflictDoNothing();
}

/** Whether the current user is an admin (false if signed out). */
export async function currentUserIsAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  return profile?.role === "admin";
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
