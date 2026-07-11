"use client";

import { useEffect, useState } from "react";

/** Renders a QR code (dynamically-imported generator) linking to the AR URL so
 *  a desktop/unsupported visitor can hop to their phone. */
export function QrCode({ url, size = 200 }: { url: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void import("qrcode").then(async (mod) => {
      const png = await mod.default.toDataURL(url, {
        width: size,
        margin: 1,
        color: { dark: "#2b2622", light: "#faf8f5" },
      });
      if (alive) setDataUrl(png);
    });
    return () => {
      alive = false;
    };
  }, [url, size]);

  return (
    <div
      className="flex items-center justify-center rounded-2xl border border-border bg-cream p-3"
      style={{ width: size + 24, height: size + 24 }}
    >
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt={`QR code linking to ${url}`} width={size} height={size} />
      ) : (
        <div className="size-full animate-pulse rounded-lg bg-sand/70" />
      )}
    </div>
  );
}
