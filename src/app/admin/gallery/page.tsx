import Link from "next/link";
import Image from "next/image";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { designs, profiles } from "@/lib/db/schema";
import { formatPrice } from "@/lib/utils";
import { AdminTable } from "@/components/admin/list";
import { ModerationActions } from "@/components/admin/moderation-actions";

export default async function AdminGalleryPage() {
  const pending = await db
    .select({
      id: designs.id,
      publicId: designs.publicId,
      name: designs.name,
      thumbnailUrl: designs.thumbnailUrl,
      price: designs.priceSnapshotInPiastres,
      creator: profiles.displayName,
      createdAt: designs.createdAt,
    })
    .from(designs)
    .leftJoin(profiles, eq(designs.ownerId, profiles.id))
    .where(
      and(
        eq(designs.status, "published_public"),
        eq(designs.moderationStatus, "pending")
      )
    )
    .orderBy(desc(designs.createdAt));

  return (
    <div>
      <h2 className="mb-2 font-serif text-xl text-ink">
        Moderation queue{" "}
        <span className="text-ink-soft">({pending.length})</span>
      </h2>
      <p className="mb-6 text-sm text-ink-soft">
        Community designs awaiting review. Approved designs appear in the public
        gallery.
      </p>

      {pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-ink-soft">
          Nothing to review right now.
        </div>
      ) : (
        <AdminTable>
          <thead className="bg-linen text-ink-soft">
            <tr>
              <th className="w-16 px-4 py-3" />
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Creator</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Review</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="relative size-12 overflow-hidden rounded-lg border border-border bg-linen">
                    {d.thumbnailUrl && (
                      <Image
                        src={d.thumbnailUrl}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/design/${d.publicId}`}
                    className="font-medium text-ink hover:text-gold"
                    target="_blank"
                  >
                    {d.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {d.creator ?? "Anonymous"}
                </td>
                <td className="px-4 py-3 tabular-nums">{formatPrice(d.price)}</td>
                <td className="px-4 py-3">
                  <ModerationActions designId={d.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
