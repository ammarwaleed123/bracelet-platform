/**
 * Bracelet Passport helpers — the small, framework-agnostic bits shared by the
 * passport page, the printable card, and the OG image. (QR generation lives in
 * `./qr` because it pulls in a Node library.)
 */

/**
 * Present a design's `publicId` (an unguessable 10-char nanoid) as a human
 * "passport number", e.g. `AUR-XY3KF-9QM2A`. Cosmetic only — the real id in the
 * URL keeps its original case; nobody types this (they scan the QR).
 */
export function formatPassportNo(publicId: string): string {
  const clean = publicId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const padded = clean.padEnd(10, "0").slice(0, 10);
  return `AUR-${padded.slice(0, 5)}-${padded.slice(5, 10)}`;
}

/** Absolute URL for a design's passport — used by the QR + share image so the
 *  code always points at the real (production) domain, never a relative path. */
export function passportUrl(publicId: string): string {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${base}/design/${publicId}`;
}

/** "Born on" date for the passport — the design's creation date, long form. */
export function formatBornOn(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
