import Link from "next/link";
import { asc } from "drizzle-orm";

import { db } from "@/lib/db";
import { charms } from "@/lib/db/schema";
import { formatPrice } from "@/lib/utils";
import {
  ActiveBadge,
  AdminTable,
  ListHeader,
  StockCell,
  Swatch,
} from "@/components/admin/list";

export default async function CharmsPage() {
  const rows = await db
    .select()
    .from(charms)
    .orderBy(asc(charms.sortOrder), asc(charms.name));

  return (
    <div>
      <ListHeader
        title="Charms"
        count={rows.length}
        newHref="/admin/charms/new"
        newLabel="New charm"
      />
      <AdminTable>
        <thead className="bg-linen text-ink-soft">
          <tr>
            <th className="w-14 px-4 py-3" />
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Shape</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Stock</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((charm) => (
            <tr
              key={charm.id}
              className="border-t border-border transition-colors hover:bg-linen"
            >
              <td className="px-4 py-3">
                <Swatch
                  colorHex={charm.colorHex}
                  imageUrl={charm.imageUrl}
                  label={charm.name}
                />
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/charms/${charm.id}`}
                  className="font-medium text-ink hover:text-gold"
                >
                  {charm.name}
                </Link>
              </td>
              <td className="px-4 py-3 capitalize text-ink-soft">
                {charm.charmShape}
                {charm.letterValue ? ` · ${charm.letterValue}` : ""}
              </td>
              <td className="px-4 py-3 tabular-nums">
                {formatPrice(charm.priceInPiastres)}
              </td>
              <td className="px-4 py-3">
                <StockCell qty={charm.stockQuantity} />
              </td>
              <td className="px-4 py-3">
                <ActiveBadge active={charm.isActive} />
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
