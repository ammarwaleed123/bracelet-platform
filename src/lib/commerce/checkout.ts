"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  bases,
  beads,
  cartItems,
  charms,
  designs,
  orderEvents,
  orderItems,
  orders,
} from "@/lib/db/schema";
import type { DesignComponent } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/guards";
import { getCartId } from "@/lib/cart/cart";
import { computeDesignPriceInPiastres } from "@/lib/designs/pricing";
import { shippingForGovernorate } from "@/lib/commerce/shipping";
import {
  incrementDiscountUse,
  validateDiscountCode,
} from "@/lib/commerce/discounts";

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Enter your name.").max(80),
  customerPhone: z
    .string()
    .trim()
    .regex(/^0\d{10}$/, "Enter a valid Egyptian phone (e.g. 01012345678)."),
  customerEmail: z.string().trim().email().optional().or(z.literal("")),
  governorate: z.string().trim().min(1, "Choose your governorate."),
  line1: z.string().trim().min(3, "Enter your street address.").max(160),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  area: z.string().trim().max(80).optional().or(z.literal("")),
  landmark: z.string().trim().max(120).optional().or(z.literal("")),
  discountCode: z.string().trim().max(40).optional().or(z.literal("")),
  // Optional pinned GPS location (from the browser) to help the courier.
  geoLat: z.number().min(-90).max(90).optional(),
  geoLng: z.number().min(-180).max(180).optional(),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string };

/** Current cart subtotal, recomputed server-side (never trust the client). */
async function currentCartSubtotal(): Promise<number> {
  const cartId = await getCartId();
  if (!cartId) return 0;
  const rows = await db
    .select({
      baseId: designs.baseId,
      components: designs.componentsJson,
      quantity: cartItems.quantity,
    })
    .from(cartItems)
    .innerJoin(designs, eq(cartItems.designId, designs.id))
    .where(eq(cartItems.cartId, cartId));
  let subtotal = 0;
  for (const r of rows) {
    const unit = await computeDesignPriceInPiastres(r.baseId, r.components);
    subtotal += unit * r.quantity;
  }
  return subtotal;
}

/** Validate a discount code for the checkout UI (authoritative amount). */
export async function previewDiscount(
  code: string
): Promise<{ ok: true; discountInPiastres: number; code: string } | { ok: false; error: string }> {
  const subtotal = await currentCartSubtotal();
  if (subtotal <= 0) return { ok: false, error: "Your cart is empty." };
  const res = await validateDiscountCode(code, subtotal);
  if (!res.ok) return res;
  return { ok: true, discountInPiastres: res.discountInPiastres, code: res.code };
}

/** Format the sequence value as BR-YYYY-000123. */
function formatOrderNumber(seq: number): string {
  return `BR-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}

export async function placeOrder(
  input: CheckoutInput
): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }
  const d = parsed.data;

  const user = await getCurrentUser();
  const cartId = await getCartId();
  if (!cartId) return { ok: false, error: "Your cart is empty." };

  // Load cart contents with everything needed to price + snapshot each line.
  const items = await db
    .select({
      designId: designs.id,
      ownerId: designs.ownerId,
      name: designs.name,
      thumbnailUrl: designs.thumbnailUrl,
      baseId: designs.baseId,
      sizeCm: designs.sizeCm,
      components: designs.componentsJson,
      quantity: cartItems.quantity,
      note: cartItems.note,
    })
    .from(cartItems)
    .innerJoin(designs, eq(cartItems.designId, designs.id))
    .where(eq(cartItems.cartId, cartId));

  if (items.length === 0) return { ok: false, error: "Your cart is empty." };

  // Shipping fee for the chosen governorate.
  const shipping = await shippingForGovernorate(d.governorate);
  if (!shipping) {
    return { ok: false, error: "We don't ship to that governorate yet." };
  }

  // Recompute every line price server-side and build the immutable snapshots.
  let subtotal = 0;
  const lineSnapshots = await Promise.all(
    items.map(async (it) => {
      const unit = await computeDesignPriceInPiastres(it.baseId, it.components);
      subtotal += unit * it.quantity;
      return {
        designId: it.designId,
        designName: it.name,
        designThumbnailUrl: it.thumbnailUrl,
        designSnapshotJson: {
          baseId: it.baseId,
          sizeCm: it.sizeCm,
          components: it.components,
        },
        unitPriceInPiastres: unit,
        quantity: it.quantity,
        note: it.note,
        // Commission earner = the design's owner, unless the buyer owns it.
        creatorId:
          it.ownerId && it.ownerId !== user?.id ? it.ownerId : null,
      };
    })
  );

  // Validate + apply a discount code, if any.
  let discountInPiastres = 0;
  let discountCodeId: string | null = null;
  if (d.discountCode) {
    const res = await validateDiscountCode(d.discountCode, subtotal);
    if (!res.ok) return { ok: false, error: res.error };
    discountInPiastres = res.discountInPiastres;
    discountCodeId = res.codeId;
  }

  const total = subtotal + shipping.feeInPiastres - discountInPiastres;

  // Aggregate component demand across all lines for a stock check.
  const baseNeed = new Map<string, number>();
  const beadNeed = new Map<string, number>();
  const charmNeed = new Map<string, number>();
  for (const it of items) {
    if (it.baseId) baseNeed.set(it.baseId, (baseNeed.get(it.baseId) ?? 0) + it.quantity);
    for (const c of it.components as DesignComponent[]) {
      const map = c.kind === "bead" ? beadNeed : charmNeed;
      map.set(c.refId, (map.get(c.refId) ?? 0) + it.quantity);
    }
  }

  try {
    const orderNumber = await db.transaction(async (tx) => {
      // --- Stock check (fail the whole order if anything is short) ---
      await assertStock(tx, bases, baseNeed);
      await assertStock(tx, beads, beadNeed);
      await assertStock(tx, charms, charmNeed);

      // --- Decrement component stock ---
      await decrementStock(tx, bases, baseNeed);
      await decrementStock(tx, beads, beadNeed);
      await decrementStock(tx, charms, charmNeed);

      // --- Human-friendly order number ---
      const seqRows = (await tx.execute(
        sql`select nextval('order_number_seq') as n`
      )) as unknown as { n: number | string }[];
      const orderNumber = formatOrderNumber(Number(seqRows[0]?.n ?? 0));

      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          userId: user?.id ?? null,
          // COD orders are confirmed on placement (no manual confirm step).
          status: "confirmed",
          paymentMethod: "cod",
          paymentStatus: "unpaid",
          subtotalInPiastres: subtotal,
          shippingInPiastres: shipping.feeInPiastres,
          discountInPiastres,
          totalInPiastres: total,
          customerName: d.customerName,
          customerPhone: d.customerPhone,
          customerEmail: d.customerEmail || null,
          shippingAddressJson: {
            line1: d.line1,
            line2: d.line2 || undefined,
            area: d.area || undefined,
            governorate: d.governorate,
            landmark: d.landmark || undefined,
            geo:
              d.geoLat != null && d.geoLng != null
                ? { lat: d.geoLat, lng: d.geoLng }
                : undefined,
          },
          governorate: d.governorate,
          discountCodeId,
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });

      await tx.insert(orderItems).values(
        lineSnapshots.map((l) => ({ ...l, orderId: order!.id }))
      );

      await tx.insert(orderEvents).values({
        orderId: order!.id,
        status: "confirmed",
        note: "Order placed and confirmed.",
      });

      // Clear the cart.
      await tx.delete(cartItems).where(eq(cartItems.cartId, cartId));

      return order!.orderNumber;
    });

    if (discountCodeId) await incrementDiscountUse(discountCodeId);

    revalidatePath("/", "layout");
    revalidatePath("/account");
    return { ok: true, orderNumber };
  } catch (e) {
    const message =
      e instanceof Error && e.message.startsWith("STOCK:")
        ? e.message.slice(6)
        : "Something went wrong placing your order. Please try again.";
    return { ok: false, error: message };
  }
}

/* ---- stock helpers (operate on bases/beads/charms uniformly) ---- */

type StockTable = typeof bases | typeof beads | typeof charms;

async function assertStock(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  table: StockTable,
  need: Map<string, number>
) {
  if (need.size === 0) return;
  const ids = [...need.keys()];
  const rows = await tx
    .select({ id: table.id, name: table.name, stock: table.stockQuantity })
    .from(table)
    .where(inArray(table.id, ids));
  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const [id, qty] of need) {
    const row = byId.get(id);
    if (!row || row.stock < qty) {
      throw new Error(
        `STOCK:"${row?.name ?? "An item"}" is out of stock. Please adjust your cart.`
      );
    }
  }
}

async function decrementStock(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  table: StockTable,
  need: Map<string, number>
) {
  for (const [id, qty] of need) {
    await tx
      .update(table)
      .set({ stockQuantity: sql`${table.stockQuantity} - ${qty}` })
      .where(and(eq(table.id, id), sql`${table.stockQuantity} >= ${qty}`));
  }
}
