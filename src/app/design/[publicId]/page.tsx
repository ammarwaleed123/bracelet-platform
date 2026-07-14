import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { formatPrice } from "@/lib/utils";
import { getDesignPassport, getLikedDesignIds } from "@/lib/designs/queries";
import { getDesignQuantityInCart } from "@/lib/cart/cart";
import { getCurrentUser } from "@/lib/auth/guards";
import { formatBornOn, formatPassportNo } from "@/lib/passport/passport";
import { passportQrSvg } from "@/lib/passport/qr";
import { passport } from "@/content/passport";
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
  const design = await getDesignPassport(publicId);
  if (!design) return { title: "Bracelet Passport" };
  const by =
    design.isPublic && design.creatorName ? ` by ${design.creatorName}` : "";
  return {
    title: design.name,
    description: `Bracelet Passport — ${design.name}${by}. Handmade to order in Egypt · ${formatPrice(
      design.priceInPiastres
    )}.`,
    // The share image is wired automatically by ./opengraph-image.tsx.
  };
}

export default async function PassportPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const user = await getCurrentUser();
  const design = await getDesignPassport(publicId, user?.id);
  if (!design) notFound();

  const [liked, cartQuantity, qrSvg] = await Promise.all([
    user && design.isPublic
      ? getLikedDesignIds([design.id], user.id).then((s) => s.has(design.id))
      : Promise.resolve(false),
    design.isBuyable
      ? getDesignQuantityInCart(design.id)
      : Promise.resolve(0),
    passportQrSvg(design.publicId),
  ]);

  const passportNo = formatPassportNo(design.publicId);
  const bornOn = formatBornOn(design.createdAt);

  // Back link depends on how the viewer arrived: gallery, their account, or a
  // shared/scanned capability link (no back — offer the studio instead).
  const back = design.isPublic
    ? { href: "/gallery", label: passport.actions.backGallery }
    : design.isOwner
      ? { href: "/account", label: passport.actions.backAccount }
      : null;

  return (
    <Container className="py-10 sm:py-14">
      {back ? (
        <Link
          href={back.href}
          className="mb-6 inline-flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
        >
          ← {back.label}
        </Link>
      ) : (
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
        >
          ← {passport.actions.home}
        </Link>
      )}

      <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        {/* Document header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-linen px-6 py-4 sm:px-8">
          <p className="label-caps text-gold-strong">{passport.eyebrow}</p>
          <p className="font-mono text-xs tracking-wider text-ink-soft">
            {passport.passportNo} {passportNo}
          </p>
        </div>

        {/* Hero + details */}
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-linen">
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
                {passport.noPreview}
              </span>
            )}
          </div>

          <div className="flex flex-col">
            <h1 className="font-serif text-3xl text-ink sm:text-4xl">
              {design.name}
            </h1>
            {design.isPublic && design.creatorName && (
              <p className="mt-1.5 text-ink-soft">
                {passport.creatorPrefix} {design.creatorName}
              </p>
            )}

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5">
              <Meta label={passport.bornOn} value={bornOn} />
              <Meta
                label={passport.wristSize}
                value={`${Number(design.sizeCm).toFixed(1)} cm`}
              />
              {design.baseName && (
                <Meta label={passport.base} value={design.baseName} />
              )}
              <Meta label={passport.madeIn} value="Egypt" />
              <Meta
                label={passport.value}
                value={formatPrice(design.priceInPiastres)}
              />
            </dl>

            <div className="mt-auto pt-8">
              <div className="flex flex-wrap items-center gap-3">
                {design.isBuyable ? (
                  <>
                    <AddToCartButton
                      designId={design.id}
                      initialQuantity={cartQuantity}
                      size="lg"
                    />
                    <Button asChild size="lg" variant="outline">
                      <Link href={`/studio/${design.publicId}`}>
                        {passport.actions.customize}
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button asChild size="lg">
                    <Link href="/studio">{passport.actions.designYours}</Link>
                  </Button>
                )}
                <ShareButton url={`/design/${design.publicId}`} />
                {design.isPublic && (
                  <LikeButton
                    designId={design.id}
                    liked={liked}
                    count={design.likesCount}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Materials & meanings + QR */}
        <div className="grid gap-10 border-t border-border p-6 sm:p-8 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="label-caps mb-4">{passport.materials.title}</h2>
            {design.parts.length > 0 ? (
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
            ) : (
              <p className="text-sm text-ink-soft">{passport.noPreview}</p>
            )}
          </div>

          {/* QR — the bridge to the physical card in the box */}
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-linen p-5 lg:w-56">
            <div
              className="size-36 [&>svg]:size-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="text-center text-sm font-medium text-ink">
              {passport.qr.title}
            </p>
            <p className="text-center text-xs leading-relaxed text-ink-soft">
              {passport.qr.hint}
            </p>
          </div>
        </div>

        {/* Design history */}
        <div className="border-t border-border p-6 sm:p-8">
          <h2 className="label-caps mb-3">{passport.history.title}</h2>
          {design.lineage.length > 0 ? (
            <ol className="space-y-1.5 text-sm">
              {design.lineage.map((a, i) => (
                <li key={a.publicId} className="flex flex-wrap items-center gap-1.5">
                  <span className="text-ink-soft">
                    {i === 0 ? passport.history.lead : "↳"}
                  </span>
                  <Link
                    href={`/design/${a.publicId}`}
                    className="font-medium text-ink underline-offset-2 hover:text-gold hover:underline"
                  >
                    {a.name}
                  </Link>
                  {a.creatorName && (
                    <span className="text-ink-soft">
                      {passport.history.by} {a.creatorName}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink-soft">{passport.history.original}</p>
          )}
        </div>
      </article>
    </Container>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-caps text-[0.65rem] text-ink-soft">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}
