"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { cartItems, designs } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/guards";
import {
  cartItemBelongsToCart,
  getCartId,
  getOrCreateCart,
} from "@/lib/cart/cart";

export type CartActionResult = { ok: true } | { ok: false; error: string };

const MAX_QTY = 20;

/**
 * Add a design to the cart. Buyable designs: any published gallery design, a
 * brand design (no owner), or one the current user owns. Price is never taken
 * from the client — it's recomputed at render and at order creation.
 */
export async function addToCart(
  designId: string,
  note?: string
): Promise<CartActionResult> {
  const [design] = await db
    .select({ id: designs.id, status: designs.status, ownerId: designs.ownerId })
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
