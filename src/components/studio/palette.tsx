"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import { cn, formatPrice } from "@/lib/utils";
import { useStudioStore } from "@/lib/studio/store";
import { fits, indexCatalog } from "@/lib/studio/derive";
import type { StudioBead, StudioCatalog, StudioCharm } from "@/lib/studio/types";

type Tab = "bead" | "charm";

export function Palette({ catalog }: { catalog: StudioCatalog }) {
  const [tab, setTab] = useState<Tab>("bead");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const index = useMemo(() => indexCatalog(catalog), [catalog]);
  const sizeCm = useStudioStore((s) => s.sizeCm);
  const components = useStudioStore((s) => s.components);
  const addComponent = useStudioStore((s) => s.addComponent);

  const items = tab === "bead" ? catalog.beads : catalog.charms;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category && !item.categoryIds.includes(category)) return false;
      if (!q) return true;
      const stone =
        "stoneType" in item ? (item.stoneType ?? "") : "";
      return (
        item.name.toLowerCase().includes(q) ||
        stone.toLowerCase().includes(q)
      );
    });
  }, [items, query, category]);

  // Only show category chips that actually apply to the active tab.
  const visibleCategories = useMemo(() => {
    const used = new Set(items.flatMap((i) => i.categoryIds));
    return catalog.categories.filter((c) => used.has(c.id));
  }, [items, catalog.categories]);

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex gap-1 rounded-full bg-sand p-1">
        {(["bead", "charm"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setCategory(null);
            }}
            className={cn(
              "flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === t ? "bg-card text-ink shadow-sm" : "text-ink-soft"
            )}
          >
            {t === "bead" ? "Beads" : "Charms"}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={tab === "bead" ? "Search stones…" : "Search charms…"}
        className="mt-3 h-10 w-full rounded-xl border border-input bg-card px-4 text-sm text-ink placeholder:text-stone focus-visible:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {/* Category chips */}
      {visibleCategories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip active={category === null} onClick={() => setCategory(null)}>
            All
          </Chip>
          {visibleCategories.map((c) => (
            <Chip
              key={c.id}
              active={category === c.id}
              onClick={() => setCategory(category === c.id ? null : c.id)}
            >
              {c.name}
            </Chip>
          ))}
        </div>
      )}

      {/* Items */}
      <div className="mt-4 grid grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-2">
        {filtered.map((item) => {
          const outOfStock = item.stockQuantity <= 0;
          const willFit = fits(index, sizeCm, components, item.diameterMm);
          const disabled = outOfStock || !willFit;
          return (
            <PaletteCard
              key={item.id}
              item={item}
              disabled={disabled}
              disabledReason={
                outOfStock ? "Out of stock" : !willFit ? "Won't fit" : undefined
              }
              onAdd={() => addComponent(tab, item.id)}
            />
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-ink-soft">
            Nothing matches that search.
          </p>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-gold bg-gold-tint text-gold-strong"
          : "border-border text-ink-soft hover:bg-sand"
      )}
    >
      {children}
    </button>
  );
}

function PaletteCard({
  item,
  disabled,
  disabledReason,
  onAdd,
}: {
  item: StudioBead | StudioCharm;
  disabled: boolean;
  disabledReason?: string;
  onAdd: () => void;
}) {
  const meaning = item.meaning ?? undefined;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onAdd}
      title={meaning}
      aria-label={`Add ${item.name}${meaning ? ` — ${meaning}` : ""}`}
      className={cn(
        "group flex flex-col rounded-xl border border-border bg-card p-2 text-left transition-all",
        disabled
          ? "cursor-not-allowed opacity-55"
          : "hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-soft"
      )}
    >
      <div className="relative mb-2 aspect-square overflow-hidden rounded-lg">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <span
            className="block size-full"
            style={{ backgroundColor: item.colorHex }}
            aria-hidden
          />
        )}
        {disabledReason && (
          <span className="absolute inset-x-1 bottom-1 rounded bg-ink/80 px-1.5 py-0.5 text-center text-[10px] font-medium text-cream">
            {disabledReason}
          </span>
        )}
      </div>
      <span className="line-clamp-1 text-xs font-medium text-ink">
        {item.name}
      </span>
      <span className="text-xs text-ink-soft">
        {formatPrice(item.priceInPiastres)}
      </span>
    </button>
  );
}
