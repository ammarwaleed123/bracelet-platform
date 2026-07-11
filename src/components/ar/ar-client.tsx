"use client";

import dynamic from "next/dynamic";

import { arContent } from "@/content/ar";
import type { StudioCatalog } from "@/lib/studio/types";

// Client-only: the AR experience touches camera + WebGL + WASM, so never SSR it.
const ArExperience = dynamic(
  () => import("./ar-experience").then((m) => m.ArExperience),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-linen">
        <div className="size-10 rounded-full border-2 border-border border-t-gold motion-safe:animate-spin" />
        <p className="font-serif text-lg text-ink-soft">{arContent.loading}</p>
      </div>
    ),
  }
);

export function ArClient({
  catalog,
  siteUrl,
}: {
  catalog: StudioCatalog;
  siteUrl: string;
}) {
  return <ArExperience catalog={catalog} siteUrl={siteUrl} />;
}
