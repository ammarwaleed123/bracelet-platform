import Link from "next/link";
import { asc } from "drizzle-orm";

import { db } from "@/lib/db";
import { bases } from "@/lib/db/schema";
import { formatPrice } from "@/lib/utils";
import {
  ActiveBadge,
  AdminTable,
  ListHeader,
  StockCell,
  Swatch,
} from "@/components/admin/list";

export default async function BasesPage() {
  const rows = await db
    .select()
    .from(bases)
    .orderBy(asc(bases.sortOrder), asc(bases.name));

  return (
    <div>
      <ListHeader
        title="Bases"
        count={rows.length}
        newHref="/admin/bases/new"
        newLabel="New base"
      />
      <AdminTable>
        <thead className="bg-linen text-ink-soft">
          <tr>
            <th className="w-14 px-4 py-3" />
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Stock</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((base) => (
            <tr
              key={base.id}
              className="border-t border-border transition-colors hover:bg-linen"
            >
              <td className="px-4 py-3">
                <Swatch
                  colorHex={base.colorHex}
                  imageUrl={base.imageUrl}
                  label={base.name}
                />
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/bases/${base.id}`}
                  className="font-medium text-ink hover:text-gold"
                >
                  {base.name}
                </Link>
              </td>
              <td className="px-4 py-3 capitalize text-ink-soft">{base.type}</td>
              <td className="px-4 py-3 tabular-nums">
                {formatPrice(base.priceInPiastres)}
              </td>
              <td className="px-4 py-3">
                <StockCell qty={base.stockQuantity} />
              </td>
              <td className="px-4 py-3">
                <ActiveBadge active={base.isActive} />
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
