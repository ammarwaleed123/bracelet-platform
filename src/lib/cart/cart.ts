import "server-only";

import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/lib/db";
import { carts, cartItems, designs } from "@/lib/db/schema";
import { ensureProfile, getCurrentUser } from "@/lib/auth/guards";
import { computeDesignPriceInPiastres } from "@/lib/designs/pricing";

const CART_COOKIE = "cart_token";
const CART_MAX_AGE = 60 * 60 * 24 * 60; // 60 days

/** Resolve the current cart id (user cart, else guest cookie). Read-only. */
export async function getCartId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user) {
    const [c] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, user.id))
      .limit(1);
    return c?.id ?? null;
  }
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return null;
  const [c] = await db
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.sessionToken, token))
    .limit(1);
  return c?.id ?? null;
}

/**
 * Ensure a cart exists and return its id. Only safe to call from a server
 * action / route handler (it may set the guest cookie). Merges a guest cart
 * into the user's cart on first authenticated write so items aren't lost after
 * signing in.
 */
export async function getOrCreateCart(): Promise<string> {
  const user = await getCurrentUser();
  const jar = await cookies();

  if (user) {
    await ensureProfile(user); // FK target for carts.userId
    let [c] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, user.id))
      .limit(1);
    if (!c) {
      [c] = await db
        .insert(carts)
        .values({ userId: user.id })
        .returning({ id: carts.id });
    }
    const cartId = c!.id;

    // Merge any guest cart into the user cart, then drop the guest cookie.
    const token = jar.get(CART_COOKIE)?.value;
    if (token) {
      const [guest] = await db
        .select({ id: carts.id })
        .from(carts)
        .where(eq(carts.sessionToken, token))
        .limit(1);
      if (guest && guest.id !== cartId) {
        await db
          .update(cartItems)
          .set({ cartId })
          .where(eq(cartItems.cartId, guest.id));
        await db.delete(carts).where(eq(carts.id, guest.id));
      }
      jar.delete(CART_COOKIE);
    }
    return cartId;
  }

  // Guest: reuse the cookie cart or create one.
  const existingToken = jar.get(CART_COOKIE)?.value;
  if (existingToken) {
    const [c] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.sessionToken, existingToken))
      .limit(1);
    if (c) return c.id;
  }
  const token = nanoid(24);
  const [c] = await db
    .insert(carts)
    .values({ sessionToken: token })
    .returning({ id: carts.id });
  jar.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: CART_MAX_AGE,
    path: "/",
  });
  return c!.id;
}

export type CartLine = {
  itemId: string;
  designId: string;
  publicId: string;
  name: string;
  thumbnailUrl: string | null;
  ownerId: string | null;
  quantity: number;
  note: string | null;
  unitPriceInPiastres: number;
  lineTotalInPiastres: number;
};

/** Cart lines with prices recomputed server-side from the live catalog. */
export async function getCartLines(): Promise<CartLine[]> {
  const cartId = await getCartId();
  if (!cartId) return [];

  const rows = await db
    .select({
      itemId: cartItems.id,
      designId: designs.id,
      publicId: designs.publicId,
      name: designs.name,
      thumbnailUrl: designs.thumbnailUrl,
      ownerId: designs.ownerId,
      baseId: designs.baseId,
      components: designs.componentsJson,
      quantity: cartItems.quantity,
      note: cartItems.note,
    })
    .from(cartItems)
    .innerJoin(designs, eq(cartItems.designId, designs.id))
    .where(eq(cartItems.cartId, cartId))
    .orderBy(cartItems.createdAt);

  return Promise.all(
    rows.map(async (r) => {
      const unit = await computeDesignPriceInPiastres(r.baseId, r.components);
      return {
        itemId: r.itemId,
        designId: r.designId,
        publicId: r.publicId,
        name: r.name,
        thumbnailUrl: r.thumbnailUrl,
        ownerId: r.ownerId,
        quantity: r.quantity,
        note: r.note,
        unitPriceInPiastres: unit,
        lineTotalInPiastres: unit * r.quantity,
      };
    })
  );
}

/** Map of designId → quantity in the current cart (for stepper buttons). */
export async function getCartDesignQuantities(): Promise<
  Record<string, number>
> {
  const cartId = await getCartId();
  if (!cartId) return {};
  const rows = await db
    .select({ designId: cartItems.designId, quantity: cartItems.quantity })
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId));
  const map: Record<string, number> = {};
  for (const r of rows) map[r.designId] = r.quantity;
  return map;
}

/** Quantity of a single design in the current cart (0 if not present). */
export async function getDesignQuantityInCart(
  designId: string
): Promise<number> {
  const cartId = await getCartId();
  if (!cartId) return 0;
  const [row] = await db
    .select({ quantity: cartItems.quantity })
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.designId, designId)))
    .limit(1);
  return row?.quantity ?? 0;
}

/** Total item quantity in the current cart (for the header badge). */
export async function getCartCount(): Promise<number> {
  const cartId = await getCartId();
  if (!cartId) return 0;
  const rows = await db
    .select({ quantity: cartItems.quantity })
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId));
  return rows.reduce((sum, r) => sum + r.quantity, 0);
}

/** Count + subtotal for the header badge and mobile cart bar in one pass. */
export async function getCartSummary(): Promise<{
  count: number;
  subtotalInPiastres: number;
}> {
  const lines = await getCartLines();
  return {
    count: lines.reduce((s, l) => s + l.quantity, 0),
    subtotalInPiastres: lines.reduce((s, l) => s + l.lineTotalInPiastres, 0),
  };
}

/** Cart item helper used by the delete/quantity actions to enforce ownership. */
export async function cartItemBelongsToCart(itemId: string, cartId: string) {
  const [row] = await db
    .select({ id: cartItems.id })
    .from(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)))
    .limit(1);
  return Boolean(row);
}
