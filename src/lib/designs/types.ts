/** Client-safe gallery types (no server-only imports). */

export type GallerySort = "newest" | "most_liked" | "price_asc" | "price_desc";

export type GalleryCard = {
  id: string;
  publicId: string;
  name: string;
  thumbnailUrl: string | null;
  priceInPiastres: number;
  likesCount: number;
  creatorName: string | null;
};

export type GalleryFilters = {
  sort?: GallerySort;
  search?: string;
  minPiastres?: number;
  maxPiastres?: number;
  offset?: number;
  limit?: number;
};

/** A gallery card plus whether the current viewer has liked it. */
export type GalleryItem = GalleryCard & { liked: boolean };
