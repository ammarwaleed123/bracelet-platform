"use client";

import { useTransition } from "react";

import { setOrderStatus, markOrderPaid } from "@/app/admin/orders/actions";
import { Button } from "@/components/ui/button";

const NEXT_ACTIONS: Record<string, { label: string; status: string }[]> = {
  pending_confirmation: [
    { label: "Confirm order", status: "confirmed" },
    { label: "Cancel", status: "cancelled" },
  ],
  confirmed: [
    { label: "Start crafting", status: "crafting" },
    { label: "Cancel", status: "cancelled" },
  ],
  crafting: [
    { label: "Mark shipped", status: "shipped" },
    { label: "Cancel", status: "cancelled" },
  ],
  shipped: [{ label: "Mark delivered", status: "delivered" }],
  delivered: [],
  cancelled: [],
};

export function OrderStatusControls({
  orderNumber,
  status,
  paymentStatus,
}: {
  orderNumber: string;
  status: string;
  paymentStatus: string;
}) {
  const [pending, startTransition] = useTransition();
  const actions = NEXT_ACTIONS[status] ?? [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((a) => (
        <Button
          key={a.status}
          size="sm"
          variant={a.status === "cancelled" ? "outline" : "primary"}
          disabled={pending}
          className={
            a.status === "cancelled"
              ? "border-destructive/30 text-destructive hover:bg-destructive/10"
              : undefined
          }
          onClick={() =>
            startTransition(() => setOrderStatus(orderNumber, a.status as never))
          }
        >
          {a.label}
        </Button>
      ))}

      {paymentStatus !== "paid" && status !== "cancelled" && (
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => startTransition(() => markOrderPaid(orderNumber))}
        >
          Mark paid
        </Button>
      )}

      {actions.length === 0 && paymentStatus === "paid" && (
        <span className="text-sm text-ink-soft">No further actions.</span>
      )}
    </div>
  );
}
