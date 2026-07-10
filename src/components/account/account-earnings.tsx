import { cn, formatPrice } from "@/lib/utils";
import type { CreatorEarning } from "@/lib/commerce/commissions";

export function AccountEarnings({
  earnings,
  storeCreditInPiastres,
}: {
  earnings: CreatorEarning[];
  storeCreditInPiastres: number;
}) {
  if (earnings.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-linen px-5 py-4">
        <p className="text-sm text-ink-soft">Store credit balance</p>
        <p className="font-serif text-xl text-gold-strong">
          {formatPrice(storeCreditInPiastres)}
        </p>
      </div>
      <ul className="divide-y divide-border">
        {earnings.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between gap-4 px-5 py-3"
          >
            <div>
              <p className="text-sm font-medium text-ink">
                {e.designName ?? "A design"}
              </p>
              <p className="text-xs text-ink-soft">
                {new Date(e.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <span
              className={cn(
                "text-sm font-medium tabular-nums",
                e.status === "reversed"
                  ? "text-ink-soft line-through"
                  : "text-gold-strong"
              )}
            >
              + {formatPrice(e.amountInPiastres)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
