import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModelSwatch } from "@/components/admin/model-swatch";

/** List-page header with a title, count, and a "New" action. */
export function ListHeader({
  title,
  count,
  newHref,
  newLabel,
}: {
  title: string;
  count: number;
  newHref: string;
  newLabel: string;
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h2 className="font-serif text-xl text-ink">
        {title} <span className="text-ink-soft">({count})</span>
      </h2>
      <Button asChild size="sm">
        <Link href={newHref}>{newLabel}</Link>
      </Button>
    </div>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        active ? "bg-gold-tint text-gold-strong" : "bg-sand text-ink-soft"
      )}
    >
      {active ? "Active" : "Hidden"}
    </span>
  );
}

/** Stock quantity, flagged when out of or low on stock. */
export function StockCell({ qty }: { qty: number }) {
  const tone =
    qty === 0 ? "text-destructive" : qty <= 5 ? "text-gold-strong" : "text-ink";
  return <span className={cn("tabular-nums", tone)}>{qty}</span>;
}

/** A component thumbnail: a live 3D render for model (.glb) charms, the uploaded
 *  image for photo components, or a color swatch fallback. */
export function Swatch({
  colorHex,
  imageUrl,
  label,
}: {
  colorHex: string;
  imageUrl?: string | null;
  label: string;
}) {
  // Real 3D-model charms store a `.glb` in imageUrl — render the model itself
  // instead of trying (and failing) to load it as a flat image.
  if (imageUrl && /\.glb$/i.test(imageUrl)) {
    return <ModelSwatch url={imageUrl} />;
  }
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt=""
        width={36}
        height={36}
        unoptimized
        className="size-9 rounded-lg border border-border object-cover"
      />
    );
  }
  return (
    <span
      aria-label={`${label} color swatch`}
      className="block size-9 rounded-lg border border-border"
      style={{ backgroundColor: colorHex }}
    />
  );
}

/** Shared table shell classes for the admin lists. */
export function AdminTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        {children}
      </table>
    </div>
  );
}
