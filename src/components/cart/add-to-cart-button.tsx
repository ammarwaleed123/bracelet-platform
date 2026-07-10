"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag } from "lucide-react";

import { addToCart } from "@/lib/cart/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Adds a design to the cart. On success it flips to a brief "Added" state and
 * refreshes so the header badge updates. Usable on the design page, gallery
 * cards, and anywhere a saved/gallery design is shown.
 */
export function AddToCartButton({
  designId,
  className,
  size = "default",
  variant = "primary",
  label = "Add to cart",
}: {
  designId: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "primary" | "outline" | "secondary";
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = () =>
    startTransition(async () => {
      setError(null);
      const res = await addToCart(designId);
      if (res.ok) {
        setAdded(true);
        router.refresh();
        setTimeout(() => setAdded(false), 1800);
      } else {
        setError(res.error);
      }
    });

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button
        type="button"
        size={size}
        variant={variant}
        disabled={pending}
        onClick={onClick}
      >
        {added ? (
          <>
            <Check aria-hidden /> Added
          </>
        ) : (
          <>
            <ShoppingBag aria-hidden /> {label}
          </>
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
