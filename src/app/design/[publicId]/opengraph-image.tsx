import { ImageResponse } from "next/og";

import { getDesignPassport } from "@/lib/designs/queries";
import { formatPassportNo } from "@/lib/passport/passport";
import { site } from "@/content/site";

export const alt = "Bracelet Passport";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CREAM = "#faf8f5";
const INK = "#211e1a";
const INK_SOFT = "#6f685c";
const GOLD = "#957544";
const BORDER = "#e6ded1";

// NOTE: this route runs on the Node runtime (it queries the DB), where
// `fetch(new URL(...))` can't read a bundled font file. So we rely on
// ImageResponse's built-in default font rather than loading Fraunces.
export default async function Image({
  params,
}: {
  // Awaiting works whether Next passes params as a promise or a plain object.
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const design = await getDesignPassport(publicId);

  const name = design?.name ?? "Bracelet Passport";
  const passportNo = design ? formatPassportNo(design.publicId) : site.name.toUpperCase();
  const year = design ? new Date(design.createdAt).getFullYear().toString() : "";
  const colors = (design?.parts ?? []).map((p) => p.colorHex).slice(0, 14);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: CREAM,
          padding: "64px 72px",
        }}
      >
        {/* Top row: wordmark + label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: 4, color: INK }}>
            {site.name.toUpperCase()}
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: 6, color: GOLD }}>
            BRACELET PASSPORT
          </div>
        </div>

        {/* Name */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 20 }}>
          <div
            style={{
              fontSize: 82,
              fontWeight: 700,
              lineHeight: 1.05,
              color: INK,
              maxWidth: 1000,
            }}
          >
            {name}
          </div>

          {/* Bead colour strip — the design's real palette */}
          <div style={{ display: "flex", marginTop: 40 }}>
            {colors.length > 0 ? (
              colors.map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 44,
                    backgroundColor: c,
                    marginRight: 14,
                    border: "1px solid rgba(0,0,0,0.10)",
                  }}
                />
              ))
            ) : (
              <div style={{ display: "flex", fontSize: 24, color: INK_SOFT }}>
                {site.tagline}
              </div>
            )}
          </div>
        </div>

        {/* Bottom row: passport number + provenance */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${BORDER}`,
            paddingTop: 24,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 600, color: INK_SOFT }}>
            {passportNo}
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: INK_SOFT }}>
            {year ? `Handmade in Egypt · ${year}` : "Handmade in Egypt"}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
