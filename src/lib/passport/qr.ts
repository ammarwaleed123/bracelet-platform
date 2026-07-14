import "server-only";

import QRCode from "qrcode";

import { passportUrl } from "./passport";

/**
 * Render a QR code for a passport URL as an inline SVG string (server-side, no
 * client JS — works in the page and when printed). Transparent background so it
 * sits on any surface; ink-coloured modules to match the brand.
 */
export async function passportQrSvg(publicId: string): Promise<string> {
  return QRCode.toString(passportUrl(publicId), {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#2b2b2b", light: "#00000000" },
  });
}
