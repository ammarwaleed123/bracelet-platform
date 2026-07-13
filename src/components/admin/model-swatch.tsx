"use client";

import dynamic from "next/dynamic";

// Lazy-load the 3D bundle so only pages that actually render a model charm
// (charms list) pull in three.js — the other admin lists stay light.
const CharmModelThumb = dynamic(
  () => import("@/components/studio/charm-thumb").then((m) => m.CharmModelThumb),
  { ssr: false, loading: () => null }
);

/** Admin list thumbnail for a real 3D-model (.glb) charm. */
export function ModelSwatch({ url }: { url: string }) {
  return (
    <span className="block size-9 overflow-hidden rounded-lg border border-border bg-linen">
      <CharmModelThumb url={url} />
    </span>
  );
}
