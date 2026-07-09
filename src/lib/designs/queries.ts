import "server-only";

import { and, asc, desc, eq, gte, ilike, inArray, lte } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  bases,
  beads,
  charms,
  designLikes,
  designs,
  profiles,
} from "@/lib/db/schema";
import type { DesignComponent } from "@/lib/db/schema";
import type {
  GalleryCard,
  GalleryFilters,
  GalleryItem,
} from "@/lib/designs/types";

import { getCurrentUser } from "@/lib/auth/guards";

/** Public gallery: approved public designs + brand designs, paginated. */
export async function getGalleryDesigns(
  filters: GalleryFilters = {}
): Promise<{ items: GalleryCard[]; hasMore: boolean }> {
  const { sort = "newest", search, minPiastres, maxPiastres, offset = 0 } = filters;
  const limit = Math.min(filters.limit ?? 24, 48);

  const conditions = [
    eq(designs.status, "published_public"),
    eq(designs.moderationStatus, "approved"),
  ];
  if (search) conditions.push(ilike(designs.name, `%${search}%`));
  if (typeof minPiastres === "number")
    conditions.push(gte(designs.priceSnapshotInPiastres, minPiastres));
  if (typeof maxPiastres === "number")
    conditions.push(lte(designs.priceSnapshotInPiastres, maxPiastres));

  const orderBy =
    sort === "most_liked"
      ? [desc(designs.likesCount), desc(designs.createdAt)]
      : sort === "price_asc"
        ? [asc(designs.priceSnapshotInPiastres)]
        : sort === "price_desc"
          ? [desc(designs.priceSnapshotInPiastres)]
          : [desc(designs.createdAt)];

  const rows = await db
    .select({
      id: designs.id,
      publicId: designs.publicId,
      name: designs.name,
      thumbnailUrl: designs.thumbnailUrl,
      priceInPiastres: designs.priceSnapshotInPiastres,
      likesCount: designs.likesCount,
      creatorName: profiles.displayName,
    })
    .from(designs)
    .leftJoin(profiles, eq(designs.ownerId, profiles.id))
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(limit + 1)
    .offset(offset);

  return { items: rows.slice(0, limit), hasMore: rows.length > limit };
}

/** Gallery page + the current viewer's liked state for each card. */
export async function getGalleryPage(
  filters: GalleryFilters = {}
): Promise<{ items: GalleryItem[]; hasMore: boolean }> {
  const user = await getCurrentUser();
  const { items, hasMore } = await getGalleryDesigns(filters);
  const liked = user
    ? await getLikedDesignIds(
        items.map((i) => i.id),
        user.id
      )
    : new Set<string>();
  return {
    items: items.map((i) => ({ ...i, liked: liked.has(i.id) })),
    hasMore,
  };
}

export type ResolvedDesignPart = {
  kind: "bead" | "charm";
  name: string;
  meaning: string | null;
  colorHex: string;
  priceInPiastres: number;
};

/** Resolve a design's componentsJson to ordered display parts (stone meanings). */
async function resolveParts(
  components: DesignComponent[]
): Promise<ResolvedDesignPart[]> {
  const beadIds = components.filter((c) => c.kind === "bead").map((c) => c.refId);
  const charmIds = components.filter((c) => c.kind === "charm").map((c) => c.refId);

  const [beadRows, charmRows] = await Promise.all([
    beadIds.length
      ? db
          .select({ id: beads.id, name: beads.name, meaning: beads.meaning, colorHex: beads.colorHex, price: beads.priceInPiastres })
          .from(beads)
          .where(inArray(beads.id, beadIds))
      : Promise.resolve([]),
    charmIds.length
      ? db
          .select({ id: charms.id, name: charms.name, meaning: charms.meaning, colorHex: charms.colorHex, price: charms.priceInPiastres })
          .from(charms)
          .where(inArray(charms.id, charmIds))
      : Promise.resolve([]),
  ]);

  const beadMap = new Map(beadRows.map((r) => [r.id, r]));
  const charmMap = new Map(charmRows.map((r) => [r.id, r]));

  return components
    .map((c): ResolvedDesignPart | null => {
      const row = c.kind === "bead" ? beadMap.get(c.refId) : charmMap.get(c.refId);
      if (!row) return null;
      return {
        kind: c.kind,
        name: row.name,
        meaning: row.meaning,
        colorHex: row.colorHex,
        priceInPiastres: row.price,
      };
    })
    .filter((p): p is ResolvedDesignPart => p !== null);
}

export type PublicDesign = {
  id: string;
  publicId: string;
  name: string;
  thumbnailUrl: string | null;
  priceInPiastres: number;
  likesCount: number;
  sizeCm: string;
  creatorName: string | null;
  baseName: string | null;
  parts: ResolvedDesignPart[];
};

/** A single public (or owner-visible) design for /design/[publicId]. */
export async function getPublicDesign(
  publicId: string,
  viewerId?: string
): Promise<PublicDesign | null> {
  const [row] = await db
    .select({
      id: designs.id,
      publicId: designs.publicId,
      name: designs.name,
      thumbnailUrl: designs.thumbnailUrl,
      priceInPiastres: designs.priceSnapshotInPiastres,
      likesCount: designs.likesCount,
      sizeCm: designs.sizeCm,
      componentsJson: designs.componentsJson,
      status: designs.status,
      moderationStatus: designs.moderationStatus,
      ownerId: designs.ownerId,
      creatorName: profiles.displayName,
      baseName: bases.name,
    })
    .from(designs)
    .leftJoin(profiles, eq(designs.ownerId, profiles.id))
    .leftJoin(bases, eq(designs.baseId, bases.id))
    .where(eq(designs.publicId, publicId))
    .limit(1);

  if (!row) return null;
  const isPublic =
    row.status === "published_public" && row.moderationStatus === "approved";
  const isOwner = viewerId && row.ownerId === viewerId;
  if (!isPublic && !isOwner) return null;

  return {
    id: row.id,
    publicId: row.publicId,
    name: row.name,
    thumbnailUrl: row.thumbnailUrl,
    priceInPiastres: row.priceInPiastres,
    likesCount: row.likesCount,
    sizeCm: row.sizeCm,
    creatorName: row.creatorName,
    baseName: row.baseName,
    parts: await resolveParts(row.componentsJson),
  };
}

export type UserDesign = {
  id: string;
  publicId: string;
  name: string;
  thumbnailUrl: string | null;
  priceInPiastres: number;
  status: (typeof designs.status.enumValues)[number];
  moderationStatus: (typeof designs.moderationStatus.enumValues)[number];
};

export async function getUserDesigns(userId: string): Promise<UserDesign[]> {
  return db
    .select({
      id: designs.id,
      publicId: designs.publicId,
      name: designs.name,
      thumbnailUrl: designs.thumbnailUrl,
      priceInPiastres: designs.priceSnapshotInPiastres,
      status: designs.status,
      moderationStatus: designs.moderationStatus,
    })
    .from(designs)
    .where(eq(designs.ownerId, userId))
    .orderBy(desc(designs.updatedAt));
}

export type StudioLoadDesign = {
  name: string;
  baseId: string | null;
  sizeCm: number;
  components: { kind: "bead" | "charm"; refId: string }[];
  /** Set when the viewer owns it — saving updates this design. */
  ownedDesignId: string | null;
  /** Set when opening someone else's public design — saving forks (lineage). */
  forkFromId: string | null;
};

/**
 * Load a design into the studio. If the viewer owns it, it opens for editing;
 * otherwise a public design opens as a fork (records lineage on next save).
 */
export async function getDesignForStudio(
  publicId: string,
  viewerId?: string,
  isAdmin = false
): Promise<StudioLoadDesign | null> {
  const [row] = await db
    .select({
      id: designs.id,
      name: designs.name,
      baseId: designs.baseId,
      sizeCm: designs.sizeCm,
      componentsJson: designs.componentsJson,
      status: designs.status,
      moderationStatus: designs.moderationStatus,
      ownerId: designs.ownerId,
    })
    .from(designs)
    .where(eq(designs.publicId, publicId))
    .limit(1);

  if (!row) return null;
  const isOwner = viewerId && row.ownerId === viewerId;
  const isPublic =
    row.status === "published_public" && row.moderationStatus === "approved";
  // Admins may edit any design in place; owners edit their own; others fork
  // only public, approved designs.
  const canEdit = Boolean(isOwner) || isAdmin;
  if (!canEdit && !isPublic) return null;

  return {
    name: row.name,
    baseId: row.baseId,
    sizeCm: Number(row.sizeCm),
    components: row.componentsJson.map((c) => ({ kind: c.kind, refId: c.refId })),
    ownedDesignId: canEdit ? row.id : null,
    forkFromId: canEdit ? null : row.id,
  };
}

/** Whether the viewer has liked each of the given design ids. */
export async function getLikedDesignIds(
  designIds: string[],
  userId: string
): Promise<Set<string>> {
  if (designIds.length === 0) return new Set();
  const rows = await db
    .select({ id: designLikes.designId })
    .from(designLikes)
    .where(
      and(
        eq(designLikes.userId, userId),
        inArray(designLikes.designId, designIds)
      )
    );
  return new Set(rows.map((r) => r.id));
}
