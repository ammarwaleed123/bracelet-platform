"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { designLikes, designs, profiles } from "@/lib/db/schema";
import { computeDesignPriceInPiastres } from "@/lib/designs/pricing";
import { uploadDesignThumbnail } from "@/lib/designs/storage";

const componentSchema = z.object({
  kind: z.enum(["bead", "charm"]),
  refId: z.string().uuid(),
});

const saveSchema = z.object({
  designId: z.string().uuid().optional(),
  forkedFromDesignId: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name your design.").max(60),
  baseId: z.string().uuid().nullable(),
  sizeCm: z.number().min(14).max(22),
  components: z.array(componentSchema).max(80),
  thumbnailDataUrl: z.string().startsWith("data:image/").optional(),
});

export type SaveDesignInput = z.input<typeof saveSchema>;
export type SaveDesignResult =
  | { ok: true; id: string; publicId: string }
  | { ok: false; error: string };

export async function saveDesign(
  input: SaveDesignInput
): Promise<SaveDesignResult> {
  const user = await requireUser();
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid design." };
  }
  const d = parsed.data;

  // Price is always recomputed server-side from the catalog.
  const price = await computeDesignPriceInPiastres(d.baseId, d.components);
  const componentsJson = d.components.map((c, slot) => ({
    slot,
    kind: c.kind,
    refId: c.refId,
  }));

  let designId = d.designId;

  if (designId) {
    // Update only if it belongs to the user.
    const [owned] = await db
      .select({ id: designs.id })
      .from(designs)
      .where(and(eq(designs.id, designId), eq(designs.ownerId, user.id)))
      .limit(1);
    if (!owned) return { ok: false, error: "Design not found." };

    await db
      .update(designs)
      .set({
        name: d.name,
        baseId: d.baseId,
        sizeCm: String(d.sizeCm),
        componentsJson,
        priceSnapshotInPiastres: price,
        updatedAt: new Date(),
      })
      .where(eq(designs.id, designId));
  } else {
    const [row] = await db
      .insert(designs)
      .values({
        publicId: nanoid(10),
        ownerId: user.id,
        name: d.name,
        status: "saved",
        baseId: d.baseId,
        sizeCm: String(d.sizeCm),
        componentsJson,
        priceSnapshotInPiastres: price,
        forkedFromDesignId: d.forkedFromDesignId ?? null,
      })
      .returning({ id: designs.id });
    designId = row!.id;
  }

  if (d.thumbnailDataUrl) {
    try {
      const url = await uploadDesignThumbnail(d.thumbnailDataUrl, designId);
      if (url) {
        await db
          .update(designs)
          .set({ thumbnailUrl: url })
          .where(eq(designs.id, designId));
      }
    } catch {
      // Thumbnail is best-effort; the design still saves without it.
    }
  }

  const [saved] = await db
    .select({ publicId: designs.publicId })
    .from(designs)
    .where(eq(designs.id, designId))
    .limit(1);

  revalidatePath("/account");
  return { ok: true, id: designId, publicId: saved!.publicId };
}

async function assertOwner(designId: string, userId: string) {
  const [owned] = await db
    .select({ id: designs.id })
    .from(designs)
    .where(and(eq(designs.id, designId), eq(designs.ownerId, userId)))
    .limit(1);
  return Boolean(owned);
}

export async function renameDesign(designId: string, name: string) {
  const user = await requireUser();
  const trimmed = name.trim().slice(0, 60);
  if (!trimmed || !(await assertOwner(designId, user.id))) return;
  await db.update(designs).set({ name: trimmed }).where(eq(designs.id, designId));
  revalidatePath("/account");
}

export async function deleteDesign(designId: string) {
  const user = await requireUser();
  if (!(await assertOwner(designId, user.id))) return;
  await db.delete(designs).where(eq(designs.id, designId));
  revalidatePath("/account");
}

/**
 * Submit a design to the public gallery. Goes to moderation (pending) before
 * it appears publicly. Optional opt-in creator display name.
 *
 * NOTE: the purchase-gate ("must have bought it to publish") is wired in after
 * milestone 1.5, when orders exist. For now, publishing goes to moderation.
 */
export async function publishDesign(designId: string, displayName?: string) {
  const user = await requireUser();
  if (!(await assertOwner(designId, user.id))) return;

  const name = displayName?.trim();
  if (name) {
    await db
      .update(profiles)
      .set({ displayName: name.slice(0, 40) })
      .where(eq(profiles.id, user.id));
  }

  await db
    .update(designs)
    .set({ status: "published_public", moderationStatus: "pending" })
    .where(eq(designs.id, designId));
  revalidatePath("/account");
}

export async function unpublishDesign(designId: string) {
  const user = await requireUser();
  if (!(await assertOwner(designId, user.id))) return;
  await db
    .update(designs)
    .set({ status: "saved" })
    .where(eq(designs.id, designId));
  revalidatePath("/account");
  revalidatePath("/gallery");
}

export async function likeDesign(designId: string) {
  const user = await requireUser();
  const inserted = await db
    .insert(designLikes)
    .values({ designId, userId: user.id })
    .onConflictDoNothing()
    .returning({ designId: designLikes.designId });
  if (inserted.length) {
    await db
      .update(designs)
      .set({ likesCount: sql`${designs.likesCount} + 1` })
      .where(eq(designs.id, designId));
  }
}

export async function unlikeDesign(designId: string) {
  const user = await requireUser();
  const deleted = await db
    .delete(designLikes)
    .where(
      and(eq(designLikes.designId, designId), eq(designLikes.userId, user.id))
    )
    .returning({ designId: designLikes.designId });
  if (deleted.length) {
    await db
      .update(designs)
      .set({ likesCount: sql`GREATEST(${designs.likesCount} - 1, 0)` })
      .where(eq(designs.id, designId));
  }
}
