"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { UPGRADE_DISMISS_COOKIE } from "./usage";

/** Snooze the "time to upgrade your AI provider" banner for a week. It returns
 *  once the cookie expires (while the condition still holds). */
export async function dismissAiUpgradeBanner() {
  const jar = await cookies();
  jar.set(UPGRADE_DISMISS_COOKIE, "1", {
    maxAge: 7 * 24 * 60 * 60,
    httpOnly: true,
    sameSite: "lax",
    path: "/admin",
  });
  revalidatePath("/admin");
}
