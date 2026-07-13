"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import {
  ensureProfile,
  getCurrentUser,
  requireUser,
} from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  designLikes,
  designs,
  orderItems,
  orders,
  profiles,
} from "@/lib/db/schema";
import { computeDesignPriceInPiastres } from "@/lib/designs/pricing";
import { compositionKey } from "@/lib/designs/composition";
import {
  uploadDesignSvgThumbnail,
  uploadDesignThumbnail,
} from "@/lib/designs/storage";
import { renderDesignThumbnailSvg } from "@/lib/designs/thumbnail";

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
  /**
   * Whether this should appear in the customer's "Your designs" list. Add-to-
   * cart passes false, persisting a hidden `draft` purely to back the cart line;
   * the explicit Save passes true (default), promoting it to a saved design.
   */
  saveToAccount: z.boolean().optional(),
  /** How the design originated. AI-designer concepts pass "ai_designer". */
  source: z.enum(["studio", "ai_designer"]).optional(),
});

export type SaveDesignInput = z.input<typeof saveSchema>;
export type SaveDesignResult =
  | { ok: true; id: string; publicId: string }
  | { ok: false; error: string; existingPublicId?: string };

export async function saveDesign(
  input: SaveDesignInput
): Promise<SaveDesignResult> {
  // Guests can add to cart / order without an account (anonymous draft). Only
  // saving to "Your designs" or publishing to the gallery needs a sign-in.
  const user = await getCurrentUser();
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid design." };
  }
  const d = parsed.data;
  const promote = d.saveToAccount !== false; // Save = true; add-to-cart = false

  if (promote && !user) {
    return {
      ok: false,
      error: "Sign in to save your design and add it to the gallery.",
    };
  }
  if (user) await ensureProfile(user); // guarantees the owner_id FK target exists
  const ownerId = user?.id ?? null;

  // Price is always recomputed server-side from the catalog.
  const price = await computeDesignPriceInPiastres(d.baseId, d.components);
  const componentsJson = d.components.map((c, slot) => ({
    slot,
    kind: c.kind,
    refId: c.refId,
  }));

  // Block saving a design the customer already has (identical base + size +
  // beads/charms in the same order). Only applies to real saves, not cart
  // drafts, and ignores the design being edited itself.
  if (promote && user) {
    const key = compositionKey(d.baseId, d.sizeCm, d.components);
    const owned = await db
      .select({
        id: designs.id,
        publicId: designs.publicId,
        baseId: designs.baseId,
        sizeCm: designs.sizeCm,
        components: designs.componentsJson,
      })
      .from(designs)
      .where(and(eq(designs.ownerId, user.id), ne(designs.status, "draft")));
    const dup = owned.find((o) => {
      if (d.designId && o.id === d.designId) return false;
      const ordered = [...o.components].sort((a, b) => a.slot - b.slot);
      return compositionKey(o.baseId, Number(o.sizeCm), ordered) === key;
    });
    if (dup) {
      return {
        ok: false,
        error: "You already have this design saved.",
        existingPublicId: dup.publicId,
      };
    }
  }

  let designId: string;
  let publicId: string;

  if (d.designId) {
    // Update if it belongs to the user, or the user is an admin (curation).
    const [existing] = await db
      .select({
        id: designs.id,
        ownerId: designs.ownerId,
        publicId: designs.publicId,
        status: designs.status,
      })
      .from(designs)
      .where(eq(designs.id, d.designId))
      .limit(1);
    if (!existing) return { ok: false, error: "Design not found." };
    // Owner (incl. a guest updating their own anonymous draft) may update; a
    // logged-in admin may update any design for curation.
    if (existing.ownerId !== ownerId) {
      if (!user) return { ok: false, error: "Design not found." };
      const [profile] = await db
        .select({ role: profiles.role })
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1);
      if (profile?.role !== "admin") {
        return { ok: false, error: "Design not found." };
      }
    }
    designId = existing.id;
    publicId = existing.publicId;

    // Save promotes a draft to a visible saved design (but never downgrades a
    // published one). Add-to-cart leaves the status untouched.
    const promotedStatus =
      promote && existing.status === "draft" ? "saved" : existing.status;

    await db
      .update(designs)
      .set({
        name: d.name,
        status: promotedStatus,
        baseId: d.baseId,
        sizeCm: String(d.sizeCm),
        componentsJson,
        priceSnapshotInPiastres: price,
        updatedAt: new Date(),
      })
      .where(eq(designs.id, designId));
  } else {
    publicId = nanoid(10);
    const [row] = await db
      .insert(designs)
      .values({
        publicId,
        ownerId,
        name: d.name,
        // Add-to-cart persists a hidden draft; Save creates a visible design.
        status: promote ? "saved" : "draft",
        source: d.source ?? "studio",
        baseId: d.baseId,
        sizeCm: String(d.sizeCm),
        componentsJson,
        priceSnapshotInPiastres: price,
        forkedFromDesignId: d.forkedFromDesignId ?? null,
      })
      .returning({ id: designs.id });
    designId = row!.id;
  }

  // Thumbnail: use the captured studio canvas when we have one; otherwise render
  // a flat-lay SVG server-side (so AI-designer concepts saved / added to cart
  // still get a preview instead of "No preview"). Best-effort either way.
  try {
    let url: string | null = null;
    if (d.thumbnailDataUrl) {
      url = await uploadDesignThumbnail(d.thumbnailDataUrl, designId);
    } else {
      const svg = await renderDesignThumbnailSvg(d.baseId, d.components, d.sizeCm);
      if (svg) url = await uploadDesignSvgThumbnail(svg, designId);
    }
    if (url) {
      await db
        .update(designs)
        .set({ thumbnailUrl: url })
        .where(eq(designs.id, designId));
    }
  } catch {
    // Thumbnail is best-effort; the design still saves without it.
  }

  revalidatePath("/account");
  return { ok: true, id: designId, publicId };
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
 * Submit a design to the public gallery.
 *
 * Admins publish directly (auto-approved). Customers go to moderation (pending)
 * and an admin approves them. Optional opt-in creator display name.
 *
 * NOTE: the purchase-gate ("a customer must have BOUGHT the design to publish")
 * is wired in after milestone 1.5, when orders exist. For now, a customer's
 * submission goes straight to the moderation queue.
 */
export type PublishResult = { ok: true } | { ok: false; error: string };

export async function publishDesign(
  designId: string,
  displayName?: string
): Promise<PublishResult> {
  const user = await requireUser();
  await ensureProfile(user);
  if (!(await assertOwner(designId, user.id)))
    return { ok: false, error: "Design not found." };

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  const isAdmin = profile?.role === "admin";

  // Purchase-gate: customers may publish a design only once they've ordered it.
  if (!isAdmin) {
    const [bought] = await db
      .select({ id: orderItems.id })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orderItems.designId, designId),
          eq(orders.userId, user.id),
          ne(orders.status, "cancelled")
        )
      )
      .limit(1);
    if (!bought) {
      return {
        ok: false,
        error:
          "You can add a design to the gallery once you've ordered it — buy it first, then publish.",
      };
    }
  }

  const name = displayName?.trim();
  if (name) {
    await db
      .update(profiles)
      .set({ displayName: name.slice(0, 40) })
      .where(eq(profiles.id, user.id));
  }

  await db
    .update(designs)
    .set({
      status: "published_public",
      moderationStatus: isAdmin ? "approved" : "pending",
    })
    .where(eq(designs.id, designId));
  revalidatePath("/account");
  revalidatePath("/gallery");
  return { ok: true };
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
  await ensureProfile(user); // guarantees the user_id FK target exists
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
