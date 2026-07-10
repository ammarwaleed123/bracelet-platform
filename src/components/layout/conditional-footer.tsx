"use client";

import { usePathname } from "next/navigation";

import { SiteFooter } from "./site-footer";

/**
 * The studio is a full-screen, app-like experience that fills the viewport
 * exactly (header + fixed-height stage/panel). Rendering the marketing footer
 * beneath it would make the whole page scroll and drag the pinned bracelet out
 * of view, so we omit the footer on studio routes.
 */
export function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/studio")) return null;
  return <SiteFooter />;
}
