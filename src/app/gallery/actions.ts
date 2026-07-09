"use server";

import { getGalleryPage } from "@/lib/designs/queries";
import type { GalleryFilters } from "@/lib/designs/types";

/** Load-more for the gallery grid (client-invoked). */
export async function fetchGalleryPage(filters: GalleryFilters) {
  return getGalleryPage(filters);
}
