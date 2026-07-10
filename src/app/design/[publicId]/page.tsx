import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { formatPrice } from "@/lib/utils";
import { getPublicDesign, getLikedDesignIds } from "@/lib/designs/queries";
import { getCurrentUser } from "@/lib/auth/guards";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { LikeButton } from "@/components/gallery/like-button";
import { ShareButton } from "@/components/gallery/share-button";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicId: string }>;
}): Promise<Metadata> {
  const { publicId } = await params;
  const design = await getPublicDesign(publicId);
  if (!design) return { title: "Design" };
  return {
    title: design.name,
    description: `A handmade bracelet design${
      design.creatorName ? ` by ${design.creatorName}` : ""
    } — ${formatPrice(design.priceInPiastres)}.`,
    openGraph: {
      title: design.name,
      images: design.thumbnailUrl ? [{ url: design.thumbnailUrl }] : undefined,
    },
  };
}

export default async function DesignPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const user = await getCurrentUser();
  const design = await getPublicDesign(publicId, user?.id);
  if (!design) notFound();

  const liked = user
    ? (await getLikedDesignIds([design.id], user.id)).has(design.id)
    : false;

  return (
    <Container className="py-12">
      <Link
        href="/gallery"
        className="mb-6 inline-flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        ← Back to gallery
      </Link>
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Visual */}
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-linen">
          {design.thumbnailUrl ? (
            <Image
              src={design.thumbnailUrl}
              alt={design.name}
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <span className="flex size-full items-center justify-center text-stone">
              No preview
            </span>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="font-serif text-4xl text-ink">{design.name}</h1>
          {design.creatorName && (
            <p className="mt-2 text-ink-soft">Designed by {design.creatorName}</p>
          )}

          <div className="mt-4 flex items-center gap-4">
            <span className="font-serif text-2xl text-ink">
              {formatPrice(design.priceInPiastres)}
            </span>
            <LikeButton
              designId={design.id}
              liked={liked}
              count={design.likesCount}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-start gap-3">
            <AddToCartButton designId={design.id} size="lg" />
            <Button asChild size="lg" variant="outline">
              <Link href={`/studio/${design.publicId}`}>Customize this design</Link>
            </Button>
            <ShareButton url={`/design/${design.publicId}`} />
          </div>

          <dl className="mt-8 space-y-1 text-sm text-ink-soft">
            {design.baseName && (
              <div className="flex gap-2">
                <dt className="text-ink">Base:</dt>
                <dd>{design.baseName}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="text-ink">Wrist size:</dt>
              <dd>{Number(design.sizeCm).toFixed(1)} cm</dd>
            </div>
          </dl>

          {/* Stone meanings — the lifestyle layer */}
          {design.parts.length > 0 && (
            <div className="mt-8">
              <h2 className="label-caps mb-3">Stones & meanings</h2>
              <ul className="space-y-3">
                {design.parts.map((part, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 size-4 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: part.colorHex }}
                      aria-hidden
                    />
                    <div>
                      <p className="text-sm font-medium text-ink">{part.name}</p>
                      {part.meaning && (
                        <p className="text-sm text-ink-soft">{part.meaning}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
