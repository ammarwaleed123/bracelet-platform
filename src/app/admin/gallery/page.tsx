import Link from "next/link";
import Image from "next/image";
import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { designs, profiles } from "@/lib/db/schema";
import { cn, formatPrice } from "@/lib/utils";
import { AdminTable } from "@/components/admin/list";
import { GalleryRowActions } from "@/components/admin/moderation-actions";

export default async function AdminGalleryPage() {
  const rows = await db
    .select({
      id: designs.id,
      publicId: designs.publicId,
      name: designs.name,
      thumbnailUrl: designs.thumbnailUrl,
      price: designs.priceSnapshotInPiastres,
      creator: profiles.displayName,
      moderationStatus: designs.moderationStatus,
    })
    .from(designs)
    .leftJoin(profiles, eq(designs.ownerId, profiles.id))
    .where(eq(designs.status, "published_public"))
    // Pending first (needs action), then most recent.
    .orderBy(
      sql`case when ${designs.moderationStatus} = 'pending' then 0 else 1 end`,
      desc(designs.createdAt)
    );

  const pendingCount = rows.filter(
    (r) => r.moderationStatus === "pending"
  ).length;

  return (
    <div>
      <h2 className="mb-2 font-serif text-xl text-ink">
        Gallery designs <span className="text-ink-soft">({rows.length})</span>
      </h2>
      <p className="mb-6 text-sm text-ink-soft">
        {pendingCount > 0
          ? `${pendingCount} awaiting review. `
          : "Nothing awaiting review. "}
        Approve or reject community submissions, edit any design in the studio,
        or remove one from the gallery.
      </p>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-ink-soft">
          No published designs yet.
        </div>
      ) : (
        <AdminTable>
          <thead className="bg-linen text-ink-soft">
            <tr>
              <th className="w-16 px-4 py-3" />
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Creator</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-t border-border align-middle">
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
                  <StatusBadge status={d.moderationStatus} />
                </td>
                <td className="px-4 py-3">
                  <GalleryRowActions
                    designId={d.id}
                    publicId={d.publicId}
                    isPending={d.moderationStatus === "pending"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "approved" && "bg-gold-tint text-gold-strong",
        status === "pending" && "bg-sand text-ink",
        status === "rejected" && "bg-destructive/10 text-destructive"
      )}
    >
      {status}
    </span>
  );
}
