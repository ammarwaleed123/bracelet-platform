import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getStudioCatalog } from "@/lib/catalog/studio";
import { getDesignForStudio } from "@/lib/designs/queries";
import { getCurrentUser } from "@/lib/auth/guards";
import { StudioShell } from "@/components/studio/studio-shell";

export const metadata: Metadata = { title: "Studio" };

// The route param is the design's shareable publicId.
export default async function StudioDesignPage({
  params,
}: {
  params: Promise<{ designId: string }>;
}) {
  const { designId } = await params;
  const user = await getCurrentUser();

  const [catalog, initial] = await Promise.all([
    getStudioCatalog(),
    getDesignForStudio(designId, user?.id),
  ]);

  if (!initial) notFound();
  if (catalog.bases.length === 0) notFound();

  return <StudioShell catalog={catalog} initial={initial} />;
}
