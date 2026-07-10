"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag } from "lucide-react";

import { useStudioStore } from "@/lib/studio/store";
import { indexCatalog, resolveComponents } from "@/lib/studio/derive";
import { suggestDesignName } from "@/lib/studio/naming";
import { captureThumbnail } from "@/lib/studio/capture";
import { saveDesign } from "@/lib/designs/actions";
import { addToCart } from "@/lib/cart/actions";
import type { StudioCatalog } from "@/lib/studio/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

/**
 * Adds the customer's finished bracelet to the cart. If the design isn't saved
 * yet it saves it first (naming + thumbnail), then adds it — so a customer can
 * buy the exact bracelet they designed.
 */
export function AddToCartStudio({ catalog }: { catalog: StudioCatalog }) {
  const index = useMemo(() => indexCatalog(catalog), [catalog]);
  const [open, setOpen] = useState(false);
  const components = useStudioStore((s) => s.components);
  const hasComponents = components.length > 0;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        disabled={!hasComponents}
        onClick={() => setOpen(true)}
        title={hasComponents ? "Add this bracelet to your cart" : "Add a stone first"}
      >
        <ShoppingBag aria-hidden /> Add to cart
      </Button>
      {open && <AddToCartDialog index={index} onClose={() => setOpen(false)} />}
    </>
  );
}

function AddToCartDialog({
  index,
  onClose,
}: {
  index: ReturnType<typeof indexCatalog>;
  onClose: () => void;
}) {
  const router = useRouter();
  const baseId = useStudioStore((s) => s.baseId);
  const sizeCm = useStudioStore((s) => s.sizeCm);
  const components = useStudioStore((s) => s.components);
  const savedDesignId = useStudioStore((s) => s.savedDesignId);
  const forkedFromId = useStudioStore((s) => s.forkedFromId);
  const existingName = useStudioStore((s) => s.designName);
  const setSaveMeta = useStudioStore((s) => s.setSaveMeta);

  const suggestion = useMemo(() => {
    const names = resolveComponents(index, components).map((c) => c.name);
    return existingName ?? suggestDesignName(names);
  }, [index, components, existingName]);

  const [name, setName] = useState(suggestion);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();

  const addExisting = () => {
    setError(null);
    startTransition(async () => {
      // Persist any latest edits before adding, so the cart matches the studio.
      const result = await saveDesign({
        designId: savedDesignId ?? undefined,
        forkedFromDesignId: forkedFromId ?? undefined,
        name,
        baseId,
        sizeCm,
        components: components.map((c) => ({ kind: c.kind, refId: c.refId })),
        thumbnailDataUrl: captureThumbnail() ?? undefined,
        // Don't file it under "Your designs" — this only backs the cart line.
        saveToAccount: false,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaveMeta({ savedDesignId: result.id, designName: name });
      const res = await addToCart(result.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAdded(true);
      router.refresh();
    });
  };

  return (
    <Modal title={added ? "Added to cart" : "Add to cart"} onClose={onClose}>
      {added ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold-tint text-gold-strong">
              <Check className="size-6" />
            </div>
            <p className="text-sm text-ink-soft">
              Your bracelet is in the cart.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={onClose}>
                Keep editing
              </Button>
              <Button asChild>
                <Link href="/cart">View cart</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="cart-design-name" className="label-caps block">
                Name your bracelet
              </label>
              <Input
                id="cart-design-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                autoFocus
              />
              <p className="text-xs text-ink-soft">
                We&apos;ll save it to your designs and add it to your cart.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={addExisting} disabled={pending || !name.trim()}>
                {pending ? "Adding…" : "Save & add to cart"}
              </Button>
            </div>
          </div>
        )}
    </Modal>
  );
}
