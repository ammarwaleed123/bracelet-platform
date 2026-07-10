"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { cartItems, designs } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/guards";
import { saveDesign, type SaveDesignInput } from "@/lib/designs/actions";
import { compositionKey } from "@/lib/designs/composition";
import {
  cartItemBelongsToCart,
  getCartId,
  getOrCreateCart,
} from "@/lib/cart/cart";

export type CartActionResult = { ok: true } | { ok: false; error: string };
export type QuantityResult =
  | { ok: true; quantity: number }
  | { ok: false; error: string };
export type StudioCartResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const MAX_QTY = 20;

/**
 * Buyable designs: any published gallery design, a brand design (no owner), or
 * one the current user owns. Guests may buy public/brand designs.
 */
async function assertBuyable(designId: string): Promise<CartActionResult> {
  const [design] = await db
    .select({ status: designs.status, ownerId: designs.ownerId })
    .from(designs)
    .where(eq(designs.id, designId))
    .limit(1);
  if (!design) return { ok: false, error: "Design not found." };
  const user = await getCurrentUser();
  const buyable =
    design.status === "published_public" ||
    design.ownerId === null ||
    (user != null && design.ownerId === user.id);
  if (!buyable) return { ok: false, error: "This design isn't available to buy." };
  return { ok: true };
}

/**
 * Add a design to the cart (increments if already present). Price is never
 * taken from the client — it's recomputed at render and at order creation.
 */
export async function addToCart(
  designId: string,
  note?: string
): Promise<CartActionResult> {
  const ok = await assertBuyable(designId);
  if (!ok.ok) return ok;

  const cartId = await getOrCreateCart();

  // If the same design is already in the cart, bump its quantity instead.
  const [existing] = await db
    .select({ id: cartItems.id, quantity: cartItems.quantity })
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.designId, designId)))
    .limit(1);

  if (existing) {
    await db
      .update(cartItems)
      .set({
        quantity: Math.min(MAX_QTY, existing.quantity + 1),
        ...(note ? { note } : {}),
      })
      .where(eq(cartItems.id, existing.id));
  } else {
    await db.insert(cartItems).values({
      cartId,
      designId,
      quantity: 1,
      note: note?.trim() || null,
    });
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout"); // header badge
  return { ok: true };
}

/**
 * Add the bracelet currently in the studio to the cart, merging by composition:
 * if the cart already contains a line for the same bracelet (same base + size +
 * beads/charms in order — even if named differently), bump that line's quantity
 * instead of adding a second line. Otherwise persist a fresh cart draft and add
 * it. Works for guests (anonymous draft) too.
 */
export async function addStudioDesignToCart(
  input: SaveDesignInput
): Promise<StudioCartResult> {
  const cartId = await getOrCreateCart();
  const key = compositionKey(
    input.baseId ?? null,
    Number(input.sizeCm),
    input.components
  );

  const rows = await db
    .select({
      itemId: cartItems.id,
      designId: cartItems.designId,
      quantity: cartItems.quantity,
      baseId: designs.baseId,
      sizeCm: designs.sizeCm,
      components: designs.componentsJson,
    })
    .from(cartItems)
    .innerJoin(designs, eq(cartItems.designId, designs.id))
    .where(eq(cartItems.cartId, cartId));

  const match = rows.find((r) => {
    const ordered = [...r.components].sort((a, b) => a.slot - b.slot);
    return compositionKey(r.baseId, Number(r.sizeCm), ordered) === key;
  });

  if (match) {
    await db
      .update(cartItems)
      .set({ quantity: Math.min(MAX_QTY, match.quantity + 1) })
      .where(eq(cartItems.id, match.itemId));
    revalidatePath("/cart");
    revalidatePath("/", "layout");
    return { ok: true, id: match.designId };
  }

  // No match — persist a fresh draft (never reuse an id) and add a new line.
  const saved = await saveDesign({ ...input, designId: undefined, saveToAccount: false });
  if (!saved.ok) return { ok: false, error: saved.error };
  const res = await addToCart(saved.id);
  if (!res.ok) return res;
  return { ok: true, id: saved.id };
}

/**
 * Set the quantity of a design in the cart directly (drives the +/− stepper on
 * design pages and gallery cards). Quantity 0 removes the line. Returns the new
 * quantity so the client can reconcile.
 */
export async function setDesignQuantity(
  designId: string,
  quantity: number
): Promise<QuantityResult> {
  const qty = Math.max(0, Math.min(MAX_QTY, Math.round(quantity)));

  const [existing] = await (async () => {
    const cartId = await getCartId();
    if (!cartId) return [];
    return db
      .select({ id: cartItems.id })
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.designId, designId)))
      .limit(1);
  })();

  if (qty === 0) {
    if (existing) await db.delete(cartItems).where(eq(cartItems.id, existing.id));
  } else if (existing) {
    await db.update(cartItems).set({ quantity: qty }).where(eq(cartItems.id, existing.id));
  } else {
    const ok = await assertBuyable(designId);
    if (!ok.ok) return ok;
    const cartId = await getOrCreateCart();
    await db.insert(cartItems).values({ cartId, designId, quantity: qty });
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { ok: true, quantity: qty };
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  const cartId = await getCartId();
  if (!cartId || !(await cartItemBelongsToCart(itemId, cartId))) return;
  const qty = Math.max(1, Math.min(MAX_QTY, Math.round(quantity)));
  await db.update(cartItems).set({ quantity: qty }).where(eq(cartItems.id, itemId));
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function updateCartItemNote(itemId: string, note: string) {
  const cartId = await getCartId();
  if (!cartId || !(await cartItemBelongsToCart(itemId, cartId))) return;
  await db
    .update(cartItems)
    .set({ note: note.trim().slice(0, 240) || null })
    .where(eq(cartItems.id, itemId));
  revalidatePath("/cart");
}

export async function removeCartItem(itemId: string) {
  const cartId = await getCartId();
  if (!cartId || !(await cartItemBelongsToCart(itemId, cartId))) return;
  await db.delete(cartItems).where(eq(cartItems.id, itemId));
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function clearCart() {
  const cartId = await getCartId();
  if (!cartId) return;
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}
