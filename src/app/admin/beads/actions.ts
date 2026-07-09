"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { beadCategories, beads } from "@/lib/db/schema";
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
  stoneType: z.string().trim().optional(),
  meaning: z.string().trim().optional(),
  colorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #9B6FC7."),
  finish: z.enum(["polished", "matte", "faceted", "metallic"]),
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
    stoneType: str(fd, "stoneType"),
    meaning: str(fd, "meaning"),
    colorHex: str(fd, "colorHex"),
    finish: str(fd, "finish"),
    diameterMm: fd.get("diameterMm"),
    priceEgp: fd.get("priceEgp"),
    stockQuantity: fd.get("stockQuantity"),
    sortOrder: fd.get("sortOrder") ?? 0,
    isActive: bool(fd, "isActive"),
  });
}

/** Replace a bead's category links with the selected set. */
async function setCategories(beadId: string, categoryIds: string[]) {
  await db.delete(beadCategories).where(eq(beadCategories.beadId, beadId));
  if (categoryIds.length) {
    await db
      .insert(beadCategories)
      .values(categoryIds.map((categoryId) => ({ beadId, categoryId })));
  }
}

export async function createBead(
  _prev: ActionState,
  fd: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parse(fd);
  if (!parsed.success) return { error: firstZodError(parsed.error) };
  const d = parsed.data;
  const categoryIds = fd.getAll("categories").map(String);

  try {
    const imageUrl = await uploadCatalogImage(file(fd, "image"), "beads");
    const [row] = await db
      .insert(beads)
      .values({
        name: d.name,
        slug: slugify(d.name),
        description: d.description,
        stoneType: d.stoneType,
        meaning: d.meaning,
        colorHex: d.colorHex,
        finish: d.finish,
        diameterMm: String(d.diameterMm),
        priceInPiastres: egpToPiastres(d.priceEgp),
        material3dParams: beadParams(d.finish, d.colorHex),
        stockQuantity: d.stockQuantity,
        sortOrder: d.sortOrder,
        isActive: d.isActive,
        imageUrl,
      })
      .returning({ id: beads.id });
    if (row) await setCategories(row.id, categoryIds);
  } catch (e) {
    return { error: errorMessage(e) };
  }

  revalidatePath("/admin/beads");
  redirect("/admin/beads");
}

export async function updateBead(
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
    const imageUrl = await uploadCatalogImage(file(fd, "image"), "beads");
    await db
      .update(beads)
      .set({
        name: d.name,
        slug: slugify(d.name),
        description: d.description,
        stoneType: d.stoneType,
        meaning: d.meaning,
        colorHex: d.colorHex,
        finish: d.finish,
        diameterMm: String(d.diameterMm),
        priceInPiastres: egpToPiastres(d.priceEgp),
        material3dParams: beadParams(d.finish, d.colorHex),
        stockQuantity: d.stockQuantity,
        sortOrder: d.sortOrder,
        isActive: d.isActive,
        ...(imageUrl ? { imageUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(beads.id, id));
    await setCategories(id, categoryIds);
  } catch (e) {
    return { error: errorMessage(e) };
  }

  revalidatePath("/admin/beads");
  redirect("/admin/beads");
}

export async function deleteBead(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(beads).where(eq(beads.id, id));
  revalidatePath("/admin/beads");
  redirect("/admin/beads");
}
