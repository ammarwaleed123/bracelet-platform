"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { bases } from "@/lib/db/schema";
import { baseParams } from "@/lib/catalog/params";
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
  type: z.enum(["chain", "cord", "bangle"]),
  material: z.string().trim().optional(),
  colorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #C7A15A."),
  priceEgp: z.coerce.number().min(0, "Price must be 0 or more."),
  stockQuantity: z.coerce.number().int().min(0, "Stock must be 0 or more."),
  sortOrder: z.coerce.number().int(),
  isActive: z.boolean(),
});

function parse(fd: FormData) {
  return schema.safeParse({
    name: str(fd, "name"),
    description: str(fd, "description"),
    type: str(fd, "type"),
    material: str(fd, "material"),
    colorHex: str(fd, "colorHex"),
    priceEgp: fd.get("priceEgp"),
    stockQuantity: fd.get("stockQuantity"),
    sortOrder: fd.get("sortOrder") ?? 0,
    isActive: bool(fd, "isActive"),
  });
}

export async function createBase(
  _prev: ActionState,
  fd: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parse(fd);
  if (!parsed.success) return { error: firstZodError(parsed.error) };
  const d = parsed.data;

  try {
    const imageUrl = await uploadCatalogImage(file(fd, "image"), "bases");
    await db.insert(bases).values({
      name: d.name,
      slug: slugify(d.name),
      description: d.description,
      type: d.type,
      material: d.material,
      colorHex: d.colorHex,
      priceInPiastres: egpToPiastres(d.priceEgp),
      model3dParams: baseParams(d.type, d.colorHex),
      stockQuantity: d.stockQuantity,
      sortOrder: d.sortOrder,
      isActive: d.isActive,
      imageUrl,
    });
  } catch (e) {
    return { error: errorMessage(e) };
  }

  revalidatePath("/admin/bases");
  redirect("/admin/bases");
}

export async function updateBase(
  _prev: ActionState,
  fd: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) return { error: "Missing id." };
  const parsed = parse(fd);
  if (!parsed.success) return { error: firstZodError(parsed.error) };
  const d = parsed.data;

  try {
    const imageUrl = await uploadCatalogImage(file(fd, "image"), "bases");
    await db
      .update(bases)
      .set({
        name: d.name,
        slug: slugify(d.name),
        description: d.description,
        type: d.type,
        material: d.material,
        colorHex: d.colorHex,
        priceInPiastres: egpToPiastres(d.priceEgp),
        model3dParams: baseParams(d.type, d.colorHex),
        stockQuantity: d.stockQuantity,
        sortOrder: d.sortOrder,
        isActive: d.isActive,
        // Only replace the image when a new one was uploaded.
        ...(imageUrl ? { imageUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(bases.id, id));
  } catch (e) {
    return { error: errorMessage(e) };
  }

  revalidatePath("/admin/bases");
  redirect("/admin/bases");
}

export async function deleteBase(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(bases).where(eq(bases.id, id));
  revalidatePath("/admin/bases");
  redirect("/admin/bases");
}
