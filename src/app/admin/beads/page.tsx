import Link from "next/link";
import { asc } from "drizzle-orm";

import { db } from "@/lib/db";
import { beads } from "@/lib/db/schema";
import { formatPrice } from "@/lib/utils";
import {
  ActiveBadge,
  AdminTable,
  ListHeader,
  StockCell,
  Swatch,
} from "@/components/admin/list";

export default async function BeadsPage() {
  const rows = await db
    .select()
    .from(beads)
    .orderBy(asc(beads.sortOrder), asc(beads.name));

  return (
    <div>
      <ListHeader
        title="Beads"
        count={rows.length}
        newHref="/admin/beads/new"
        newLabel="New bead"
      />
      <AdminTable>
        <thead className="bg-linen text-ink-soft">
          <tr>
            <th className="w-14 px-4 py-3" />
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Finish</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Stock</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((bead) => (
            <tr
              key={bead.id}
              className="border-t border-border transition-colors hover:bg-linen"
            >
              <td className="px-4 py-3">
                <Swatch
                  colorHex={bead.colorHex}
                  imageUrl={bead.imageUrl}
                  label={bead.name}
                />
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/beads/${bead.id}`}
                  className="font-medium text-ink hover:text-gold"
                >
                  {bead.name}
                </Link>
                {bead.stoneType && (
                  <span className="ml-2 text-xs text-ink-soft">
                    {bead.stoneType}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 capitalize text-ink-soft">
                {bead.finish}
              </td>
              <td className="px-4 py-3 tabular-nums">
                {formatPrice(bead.priceInPiastres)}
              </td>
              <td className="px-4 py-3">
                <StockCell qty={bead.stockQuantity} />
              </td>
              <td className="px-4 py-3">
                <ActiveBadge active={bead.isActive} />
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
