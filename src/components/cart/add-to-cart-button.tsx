"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag } from "lucide-react";

import { setDesignQuantity } from "@/lib/cart/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Add-to-cart control that becomes a quantity stepper once the design is in the
 * cart, with a contextual "View cart" link. `initialQuantity` comes from the
 * server so the control reflects the cart on load.
 */
export function AddToCartButton({
  designId,
  initialQuantity = 0,
  size = "default",
  variant = "primary",
  label = "Add to cart",
  showViewCart = true,
  className,
}: {
  designId: string;
  initialQuantity?: number;
  size?: "sm" | "default" | "lg";
  variant?: "primary" | "outline" | "secondary";
  label?: string;
  showViewCart?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(initialQuantity);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  // Synchronous source of truth so rapid clicks accumulate correctly, plus a
  // request sequence so out-of-order server responses can't flip the count.
  const qtyRef = useRef(initialQuantity);
  const seqRef = useRef(0);

  const change = (delta: number) => {
    const next = Math.max(0, qtyRef.current + delta);
    if (next === qtyRef.current) return;
    qtyRef.current = next;
    setQty(next); // optimistic
    setError(null);
    const seq = ++seqRef.current;
    startTransition(async () => {
      const res = await setDesignQuantity(designId, next);
      if (seq !== seqRef.current) return; // superseded by a newer click
      if (res.ok) {
        qtyRef.current = res.quantity;
        setQty(res.quantity);
        router.refresh(); // sync header badge / cart page
      } else {
        setError(res.error);
      }
    });
  };

  if (qty <= 0) {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <Button type="button" size={size} variant={variant} onClick={() => change(1)}>
          <ShoppingBag aria-hidden /> {label}
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  const compact = size === "sm";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-full border border-border bg-card">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => change(-1)}
            className={cn(
              "flex items-center justify-center text-ink-soft transition-colors hover:text-ink",
              compact ? "size-8" : "size-10"
            )}
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span
            className={cn(
              "text-center text-sm tabular-nums",
              compact ? "w-6" : "w-8"
            )}
          >
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => change(1)}
            className={cn(
              "flex items-center justify-center text-ink-soft transition-colors hover:text-ink",
              compact ? "size-8" : "size-10"
            )}
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
        {showViewCart && (
          <Button asChild size={compact ? "sm" : size} variant="outline">
            <Link href="/cart">View cart</Link>
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
