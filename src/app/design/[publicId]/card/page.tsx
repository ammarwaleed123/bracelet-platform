import Link from "next/link";
import { notFound } from "next/navigation";

import { getDesignPassport } from "@/lib/designs/queries";
import { formatPassportNo } from "@/lib/passport/passport";
import { passportQrSvg } from "@/lib/passport/qr";
import { passport } from "@/content/passport";
import { site } from "@/content/site";
import { PrintButton } from "@/components/passport/print-button";

export const metadata = { title: "Passport card", robots: { index: false } };

/** A print-ready passport card to drop in the box: brand mark, the design's
 *  palette, its passport number, and a QR to the live passport. */
export default async function PassportCardPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const [design, qrSvg] = await Promise.all([
    getDesignPassport(publicId),
    passportQrSvg(publicId),
  ]);
  if (!design) notFound();

  const passportNo = formatPassportNo(design.publicId);
  const colors = design.parts.map((p) => p.colorHex).slice(0, 12);

  return (
    <div className="mx-auto max-w-md px-4 py-10 print:p-0">
      {/* Screen-only controls (hidden when printing) */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          href={`/design/${design.publicId}`}
          className="inline-flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
        >
          ← {design.name}
        </Link>
        <PrintButton label={passport.card.print} />
      </div>
      <p className="mb-6 text-sm text-ink-soft print:hidden">
        {passport.card.fulfilmentNote}
      </p>

      {/* The card */}
      <div
        className="mx-auto flex w-full max-w-[340px] flex-col items-center rounded-2xl border border-border bg-cream px-7 py-8 text-center shadow-soft print:mx-0 print:w-[85mm] print:max-w-none print:rounded-none print:border-black/15 print:shadow-none [print-color-adjust:exact]"
      >
        <p className="font-serif text-2xl tracking-wide text-ink">
          {site.name}
        </p>
        <p className="label-caps mt-1 text-gold-strong">{passport.card.kicker}</p>

        {/* Palette motif */}
        {colors.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
            {colors.map((c, i) => (
              <span
                key={i}
                className="size-4 rounded-full border border-black/10"
                style={{ backgroundColor: c }}
                aria-hidden
              />
            ))}
          </div>
        )}

        <p className="mt-6 font-serif text-xl text-ink">{design.name}</p>
        <p className="mt-1 font-mono text-xs tracking-wider text-ink-soft">
          {passportNo}
        </p>

        {/* QR */}
        <div
          className="mt-6 size-40 [&>svg]:size-full"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <p className="mt-4 max-w-[15rem] text-xs leading-relaxed text-ink-soft">
          {passport.card.scan}
        </p>
        <p className="mt-3 font-serif text-xs italic text-ink-soft">
          {site.tagline}
        </p>
      </div>
    </div>
  );
}
