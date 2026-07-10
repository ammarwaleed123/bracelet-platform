"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";

import { formatPrice } from "@/lib/utils";
import type { CartLine } from "@/lib/cart/cart";
import {
  removeCartItem,
  updateCartItemNote,
  updateCartItemQuantity,
} from "@/lib/cart/actions";
import { Button } from "@/components/ui/button";

export function CartView({
  lines,
  subtotalInPiastres,
}: {
  lines: CartLine[];
  subtotalInPiastres: number;
}) {
  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-20 text-center">
        <p className="font-serif text-xl text-ink">Your cart is empty</p>
        <p className="mt-2 text-sm text-ink-soft">
          Design a bracelet or explore the gallery to get started.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href="/studio">Open the studio</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/gallery">Browse the gallery</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <ul className="divide-y divide-border">
        {lines.map((line) => (
          <CartRow key={line.itemId} line={line} />
        ))}
      </ul>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-serif text-lg text-ink">Summary</h2>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-ink-soft">Subtotal</span>
            <span className="tabular-nums text-ink">
              {formatPrice(subtotalInPiastres)}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            Shipping &amp; any discount are calculated at checkout.
          </p>
          <Button asChild size="lg" className="mt-6 w-full">
            <Link href="/checkout">Proceed to checkout</Link>
          </Button>
        </div>
      </aside>
    </div>
  );
}

function CartRow({ line }: { line: CartLine }) {
  const [pending, startTransition] = useTransition();
  const [showNote, setShowNote] = useState(Boolean(line.note));
  const [note, setNote] = useState(line.note ?? "");

  const setQty = (q: number) =>
    startTransition(() => updateCartItemQuantity(line.itemId, q));

  return (
    <li className="flex gap-4 py-5">
      <Link
        href={`/design/${line.publicId}`}
        className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-border bg-linen"
      >
        {line.thumbnailUrl && (
          <Image
            src={line.thumbnailUrl}
            alt={line.name}
            fill
            unoptimized
            sizes="96px"
            className="object-cover"
          />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/design/${line.publicId}`}
            className="line-clamp-1 font-medium text-ink hover:text-gold"
          >
            {line.name}
          </Link>
          <span className="tabular-nums text-sm text-ink">
            {formatPrice(line.lineTotalInPiastres)}
          </span>
        </div>
        <span className="mt-0.5 text-xs text-ink-soft">
          {formatPrice(line.unitPriceInPiastres)} each
        </span>

        <div className="mt-auto flex items-center gap-4 pt-3">
          <div className="flex items-center rounded-full border border-border">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={pending || line.quantity <= 1}
              onClick={() => setQty(line.quantity - 1)}
              className="flex size-8 items-center justify-center text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <span className="w-8 text-center text-sm tabular-nums">
              {line.quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={pending}
              onClick={() => setQty(line.quantity + 1)}
              className="flex size-8 items-center justify-center text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowNote((s) => !s)}
            className="text-xs text-ink-soft underline-offset-2 hover:text-ink hover:underline"
          >
            {showNote ? "Hide gift note" : "Add gift note"}
          </button>

          <button
            type="button"
            aria-label="Remove from cart"
            disabled={pending}
            onClick={() => startTransition(() => removeCartItem(line.itemId))}
            className="ml-auto text-ink-soft transition-colors hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>

        {showNote && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() =>
              startTransition(() => updateCartItemNote(line.itemId, note))
            }
            rows={2}
            maxLength={240}
            placeholder="Gift message or special request…"
            className="mt-3 w-full rounded-xl border border-input bg-card px-3 py-2 text-base text-ink placeholder:text-stone focus-visible:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
          />
        )}
      </div>
    </li>
  );
}
