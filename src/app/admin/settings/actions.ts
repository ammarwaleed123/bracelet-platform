"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { setCommissionPercent } from "@/lib/commerce/commissions";

export async function updateCommissionPercent(percent: number) {
  await requireAdmin();
  await setCommissionPercent(percent);
  revalidatePath("/admin/settings");
}
