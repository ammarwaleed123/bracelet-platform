import type { Metadata } from "next";

import { gallery } from "@/content/site";
import { getGalleryPage } from "@/lib/designs/queries";
import type { GallerySort } from "@/lib/designs/types";
import { Container } from "@/components/layout/container";
import { FilterBar } from "@/components/gallery/filter-bar";
import { GalleryGrid } from "@/components/gallery/gallery-grid";

export const metadata: Metadata = {
  title: "Gallery",
  description: gallery.subhead,
};

const VALID_SORTS: GallerySort[] = [
  "newest",
  "most_liked",
  "price_asc",
  "price_desc",
];

function toPiastres(value?: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const search = first(sp.q)?.trim() || undefined;
  const sortParam = first(sp.sort) as GallerySort | undefined;
  const sort: GallerySort =
    sortParam && VALID_SORTS.includes(sortParam) ? sortParam : "newest";
  const minPiastres = toPiastres(first(sp.min));
  const maxPiastres = toPiastres(first(sp.max));

  const filters = { sort, search, minPiastres, maxPiastres };
  const { items, hasMore } = await getGalleryPage({
    ...filters,
    offset: 0,
    limit: 24,
  });

  return (
    <Container className="py-12">
      <header className="mb-8">
        <p className="label-caps">{gallery.eyebrow}</p>
        <h1 className="mt-2 font-serif text-4xl text-ink">{gallery.title}</h1>
        <p className="mt-3 max-w-xl text-ink-soft">{gallery.subhead}</p>
      </header>

      <div className="mb-8">
        <FilterBar current={{ search: search ?? "", sort }} />
      </div>

      <GalleryGrid
        key={JSON.stringify(filters)}
        initialItems={items}
        initialHasMore={hasMore}
        filters={filters}
      />
    </Container>
  );
}
