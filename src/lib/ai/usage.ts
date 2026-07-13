import "server-only";

import { cookies } from "next/headers";
import { count, eq, gte } from "drizzle-orm";

import { db } from "@/lib/db";
import { aiGenerations, orders } from "@/lib/db/schema";
import { AI } from "./config";

/** Cookie that snoozes the upgrade banner for a week (see admin-actions.ts). */
export const UPGRADE_DISMISS_COOKIE = "ai_upgrade_dismissed";

export type AiUsage = {
  deliveredOrders: number;
  weeklyGenerations: number;
  maxDailyGenerations: number;
  quota: number;
  quotaThreshold: number;
  shouldUpgrade: boolean;
  reasons: string[];
};

/**
 * Numbers behind the "time to upgrade your AI provider" banner + usage panel.
 * Upgrade is recommended once real volume arrives (delivered orders) or a day's
 * generations pass 60% of the free daily quota — either signals the free tier is
 * about to become a reliability/privacy risk.
 */
export async function getAiUsage(): Promise<AiUsage> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [[delivered], [weekly], recent] = await Promise.all([
    db.select({ n: count() }).from(orders).where(eq(orders.status, "delivered")),
    db
      .select({ n: count() })
      .from(aiGenerations)
      .where(gte(aiGenerations.createdAt, weekAgo)),
    db
      .select({ createdAt: aiGenerations.createdAt })
      .from(aiGenerations)
      .where(gte(aiGenerations.createdAt, twoWeeksAgo)),
  ]);

  const byDay = new Map<string, number>();
  for (const r of recent) {
    const day = r.createdAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const maxDailyGenerations = byDay.size ? Math.max(...byDay.values()) : 0;

  const deliveredOrders = delivered?.n ?? 0;
  const weeklyGenerations = weekly?.n ?? 0;
  const quota = AI.dailyFreeQuota;
  const quotaThreshold = Math.round(quota * 0.6);

  const reasons: string[] = [];
  if (deliveredOrders >= AI.ordersUpgradeThreshold) {
    reasons.push(
      `You've delivered ${deliveredOrders} orders — real customers are relying on this.`
    );
  }
  if (maxDailyGenerations > quotaThreshold) {
    reasons.push(
      `A day recently used ${maxDailyGenerations} of the ~${quota} free daily generations.`
    );
  }

  return {
    deliveredOrders,
    weeklyGenerations,
    maxDailyGenerations,
    quota,
    quotaThreshold,
    shouldUpgrade: reasons.length > 0,
    reasons,
  };
}

export async function isUpgradeBannerDismissed(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(UPGRADE_DISMISS_COOKIE)?.value === "1";
}
