import Link from "next/link";
import { Sparkles } from "lucide-react";

import { AI } from "@/lib/ai/config";
import { getAiUsage, isUpgradeBannerDismissed } from "@/lib/ai/usage";
import { dismissAiUpgradeBanner } from "@/lib/ai/admin-actions";

// The owner-facing switch guide lives in the repo; link to it on GitHub.
const GUIDE_URL =
  "https://github.com/ammarwaleed123/bracelet-platform/blob/main/docs/AI-PROVIDER-SWITCH.md";

/** Admin overview section: the "time to upgrade" banner (when warranted and not
 *  snoozed) plus a small AI-designer usage panel. */
export async function AiAdminSection() {
  const [usage, dismissed] = await Promise.all([
    getAiUsage(),
    isUpgradeBannerDismissed(),
  ]);
  const showBanner = usage.shouldUpgrade && !dismissed;

  return (
    <div className="space-y-4">
      {showBanner && (
        <div className="rounded-2xl border border-gold/50 bg-gold-tint/50 p-5">
          <p className="font-serif text-lg text-ink">
            Time to upgrade your AI provider
          </p>
          <p className="mt-1.5 text-sm text-ink-soft">
            The AI designer runs on Gemini&apos;s free tier — fine to launch on,
            but it offers no reliability guarantee and may use inputs to improve
            Google&apos;s products. {usage.reasons.join(" ")} Moving to a paid
            tier protects reliability and customer privacy.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Link
              href={GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-gold-strong"
            >
              How to switch →
            </Link>
            <form action={dismissAiUpgradeBanner}>
              <button
                type="submit"
                className="text-sm text-ink-soft underline-offset-2 hover:text-ink hover:underline"
              >
                Remind me next week
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-gold" aria-hidden />
          <p className="label-caps">AI designer usage</p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <Stat label="Last 7 days" value={usage.weeklyGenerations} />
          <Stat
            label="Busiest day"
            value={`${usage.maxDailyGenerations} / ${usage.quota}`}
          />
          <Stat label="Delivered orders" value={usage.deliveredOrders} />
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          Free daily quota ≈ {usage.quota}. The upgrade prompt appears past{" "}
          {usage.quotaThreshold}/day or {AI.ordersUpgradeThreshold} delivered
          orders.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="font-serif text-2xl tabular-nums text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-ink-soft">{label}</p>
    </div>
  );
}
