"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { charmCategories, charms } from "@/lib/db/schema";
import { beadParams } from "@/lib/catalog/params";
import { uploadCatalogImage } from "@/lib/catalog/storage";
import { egpToPiastres, slugify } from "@/lib/utils";
import {
  bool,
  errorMessage,
  file,
  firstZodError,
  str,
  type ActionState,
} from "@/lib/admin/parse";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  description: z.string().trim().optional(),
  meaning: z.string().trim().optional(),
  colorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #C7A15A."),
  finish: z.enum(["polished", "matte", "faceted", "metallic"]),
  charmShape: z.enum(["heart", "star", "moon", "letter", "custom"]),
  letterValue: z.string().trim().max(2).optional(),
  diameterMm: z.coerce.number().positive("Diameter must be greater than 0."),
  priceEgp: z.coerce.number().min(0, "Price must be 0 or more."),
  stockQuantity: z.coerce.number().int().min(0, "Stock must be 0 or more."),
  sortOrder: z.coerce.number().int(),
  isActive: z.boolean(),
});

function parse(fd: FormData) {
  return schema.safeParse({
    name: str(fd, "name"),
    description: str(fd, "description"),
    meaning: str(fd, "meaning"),
    colorHex: str(fd, "colorHex"),
    finish: str(fd, "finish"),
    charmShape: str(fd, "charmShape"),
    letterValue: str(fd, "letterValue"),
    diameterMm: fd.get("diameterMm"),
    priceEgp: fd.get("priceEgp"),
    stockQuantity: fd.get("stockQuantity"),
    sortOrder: fd.get("sortOrder") ?? 0,
    isActive: bool(fd, "isActive"),
  });
}

async function setCategories(charmId: string, categoryIds: string[]) {
  await db.delete(charmCategories).where(eq(charmCategories.charmId, charmId));
  if (categoryIds.length) {
    await db
      .insert(charmCategories)
      .values(categoryIds.map((categoryId) => ({ charmId, categoryId })));
  }
}

export async function createCharm(
  _prev: ActionState,
  fd: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parse(fd);
  if (!parsed.success) return { error: firstZodError(parsed.error) };
  const d = parsed.data;
  const categoryIds = fd.getAll("categories").map(String);

  try {
    const imageUrl = await uploadCatalogImage(file(fd, "image"), "charms");
    const [row] = await db
      .insert(charms)
      .values({
        name: d.name,
        slug: slugify(d.name),
        description: d.description,
        meaning: d.meaning,
        colorHex: d.colorHex,
        finish: d.finish,
        charmShape: d.charmShape,
        letterValue: d.charmShape === "letter" ? (d.letterValue ?? null) : null,
        diameterMm: String(d.diameterMm),
        priceInPiastres: egpToPiastres(d.priceEgp),
        material3dParams: beadParams(d.finish, d.colorHex),
        stockQuantity: d.stockQuantity,
        sortOrder: d.sortOrder,
        isActive: d.isActive,
        imageUrl,
      })
      .returning({ id: charms.id });
    if (row) await setCategories(row.id, categoryIds);
  } catch (e) {
    return { error: errorMessage(e) };
  }

  revalidatePath("/admin/charms");
  redirect("/admin/charms");
}

export async function updateCharm(
  _prev: ActionState,
  fd: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) return { error: "Missing id." };
  const parsed = parse(fd);
  if (!parsed.success) return { error: firstZodError(parsed.error) };
  const d = parsed.data;
  const categoryIds = fd.getAll("categories").map(String);

  try {
    const imageUrl = await uploadCatalogImage(file(fd, "image"), "charms");
    await db
      .update(charms)
      .set({
        name: d.name,
        slug: slugify(d.name),
        description: d.description,
        meaning: d.meaning,
        colorHex: d.colorHex,
        finish: d.finish,
        charmShape: d.charmShape,
        letterValue: d.charmShape === "letter" ? (d.letterValue ?? null) : null,
        diameterMm: String(d.diameterMm),
        priceInPiastres: egpToPiastres(d.priceEgp),
        material3dParams: beadParams(d.finish, d.colorHex),
        stockQuantity: d.stockQuantity,
        sortOrder: d.sortOrder,
        isActive: d.isActive,
        ...(imageUrl ? { imageUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(charms.id, id));
    await setCategories(id, categoryIds);
  } catch (e) {
    return { error: errorMessage(e) };
  }

  revalidatePath("/admin/charms");
  redirect("/admin/charms");
}

export async function deleteCharm(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(charms).where(eq(charms.id, id));
  revalidatePath("/admin/charms");
  redirect("/admin/charms");
}
