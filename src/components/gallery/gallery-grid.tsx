"use client";

import { useState, useTransition } from "react";

import type { GalleryFilters, GalleryItem } from "@/lib/designs/types";
import { fetchGalleryPage } from "@/app/gallery/actions";
import { Button } from "@/components/ui/button";
import { DesignCard } from "./design-card";

const PAGE_SIZE = 24;

export function GalleryGrid({
  initialItems,
  initialHasMore,
  filters,
  cartQuantities = {},
}: {
  initialItems: GalleryItem[];
  initialHasMore: boolean;
  filters: GalleryFilters;
  /** designId → quantity in cart, for the add-to-cart steppers. */
  cartQuantities?: Record<string, number>;
}) {
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [pending, startTransition] = useTransition();

  const loadMore = () => {
    startTransition(async () => {
      const res = await fetchGalleryPage({
        ...filters,
        offset: items.length,
        limit: PAGE_SIZE,
      });
      setItems((prev) => [...prev, ...res.items]);
      setHasMore(res.hasMore);
    });
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-20 text-center">
        <p className="font-serif text-xl text-ink">No designs yet</p>
        <p className="mt-2 text-sm text-ink-soft">
          Be the first — design a bracelet in the studio and share it here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <DesignCard
            key={item.id}
            item={item}
            cartQuantity={cartQuantities[item.id] ?? 0}
          />
        ))}
      </div>
      {hasMore && (
        <div className="mt-10 text-center">
          <Button variant="outline" onClick={loadMore} disabled={pending}>
            {pending ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
