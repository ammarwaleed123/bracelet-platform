import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { shippingZones } from "@/lib/db/schema";

export type ShippingQuote = {
  zoneId: string;
  zoneName: string;
  feeInPiastres: number;
  estimatedDays: string | null;
};

/** Active shipping zones, ordered for display. */
export async function getActiveShippingZones() {
  return db
    .select()
    .from(shippingZones)
    .where(eq(shippingZones.isActive, true))
    .orderBy(asc(shippingZones.sortOrder));
}

/** The shipping fee for a governorate, or null if it isn't covered. */
export async function shippingForGovernorate(
  governorate: string
): Promise<ShippingQuote | null> {
  const zones = await getActiveShippingZones();
  const zone = zones.find((z) => z.governorates.includes(governorate));
  if (!zone) return null;
  return {
    zoneId: zone.id,
    zoneName: zone.name,
    feeInPiastres: zone.feeInPiastres,
    estimatedDays: zone.estimatedDays,
  };
}
