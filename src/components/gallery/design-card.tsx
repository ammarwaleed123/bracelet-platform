import Link from "next/link";
import Image from "next/image";

import { formatPrice } from "@/lib/utils";
import type { GalleryItem } from "@/lib/designs/types";
import { Button } from "@/components/ui/button";
import { LikeButton } from "./like-button";

export function DesignCard({ item }: { item: GalleryItem }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lift">
      <Link
        href={`/design/${item.publicId}`}
        className="relative block aspect-square overflow-hidden bg-linen"
      >
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt={item.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-sm text-stone">
            No preview
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/design/${item.publicId}`}
            className="line-clamp-1 font-medium text-ink hover:text-gold"
          >
            {item.name}
          </Link>
          <LikeButton designId={item.id} liked={item.liked} count={item.likesCount} />
        </div>
        {item.creatorName && (
          <p className="mt-0.5 text-xs text-ink-soft">by {item.creatorName}</p>
        )}
        <div className="mt-auto pt-3">
          <span className="block tabular-nums text-sm text-ink">
            {formatPrice(item.priceInPiastres)}
          </span>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="mt-2 w-full"
          >
            <Link href={`/studio/${item.publicId}`}>Customize</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
