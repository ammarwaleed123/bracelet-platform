"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";
import {
  errorMessage,
  firstZodError,
  str,
  type ActionState,
} from "@/lib/admin/parse";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  sortOrder: z.coerce.number().int(),
});

function parse(fd: FormData) {
  return schema.safeParse({
    name: str(fd, "name"),
    sortOrder: fd.get("sortOrder") ?? 0,
  });
}

export async function createCategory(
  _prev: ActionState,
  fd: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parse(fd);
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  try {
    await db.insert(categories).values({
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      sortOrder: parsed.data.sortOrder,
    });
  } catch (e) {
    return { error: errorMessage(e) };
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(
  _prev: ActionState,
  fd: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) return { error: "Missing id." };
  const parsed = parse(fd);
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  try {
    await db
      .update(categories)
      .set({
        name: parsed.data.name,
        slug: slugify(parsed.data.name),
        sortOrder: parsed.data.sortOrder,
      })
      .where(eq(categories.id, id));
  } catch (e) {
    return { error: errorMessage(e) };
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}
