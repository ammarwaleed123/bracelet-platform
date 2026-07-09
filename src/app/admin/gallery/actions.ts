"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { designs } from "@/lib/db/schema";

export async function approveDesign(id: string) {
  await requireAdmin();
  await db
    .update(designs)
    .set({ moderationStatus: "approved" })
    .where(eq(designs.id, id));
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export async function rejectDesign(id: string) {
  await requireAdmin();
  await db
    .update(designs)
    .set({ moderationStatus: "rejected" })
    .where(eq(designs.id, id));
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

/** Admin removes any design from the gallery entirely. */
export async function deleteGalleryDesign(id: string) {
  await requireAdmin();
  await db.delete(designs).where(eq(designs.id, id));
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}
