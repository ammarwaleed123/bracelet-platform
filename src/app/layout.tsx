import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

import { site } from "@/content/site";
import { getCartCount } from "@/lib/cart/cart";
import { getCurrentUser } from "@/lib/auth/guards";
import { SiteHeader } from "@/components/layout/site-header";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { SignupPromo } from "@/components/layout/signup-promo";
import { MobileCartBar } from "@/components/cart/mobile-cart-bar";
import "./globals.css";

// Serif display face for headlines.
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT"],
});

// Humanist sans for UI and body.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf8f5",
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Only the item count (a single cheap query) — no per-item price recompute.
  const cartCount = await getCartCount();
  // Free: getCartCount already resolved (and cached) the current user.
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      {/* suppressHydrationWarning: browser extensions inject attributes on
          <body> (e.g. password managers) before React hydrates — harmless. */}
      <body className="flex min-h-dvh flex-col antialiased" suppressHydrationWarning>
        <SiteHeader cartCount={cartCount} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <ConditionalFooter />
        <MobileCartBar count={cartCount} />
        {!user && <SignupPromo />}
      </body>
    </html>
  );
}
