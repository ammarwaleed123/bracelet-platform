import { getCommissionPercent } from "@/lib/commerce/commissions";
import { CommissionSetting } from "@/components/admin/commission-setting";

export default async function AdminSettingsPage() {
  const percent = await getCommissionPercent();

  return (
    <div>
      <h2 className="mb-2 font-serif text-xl text-ink">Settings</h2>
      <p className="mb-6 text-sm text-ink-soft">
        Store-wide settings.
      </p>

      <div className="max-w-lg rounded-2xl border border-border bg-card p-6">
        <h3 className="font-serif text-lg text-ink">Creator commission</h3>
        <p className="mt-1 text-sm text-ink-soft">
          When a customer buys someone else&apos;s gallery design and the order
          is delivered &amp; paid, the design&apos;s creator earns this share of
          the item price as store credit. Reversed if the order is cancelled.
        </p>
        <div className="mt-5">
          <CommissionSetting percent={percent} />
        </div>
      </div>
    </div>
  );
}
