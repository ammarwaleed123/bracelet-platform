"use client";

import { useState, useTransition } from "react";

import { trackOrder, type TrackResult } from "@/lib/commerce/track-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderTracker } from "@/components/commerce/order-tracker";

/**
 * Phone-gated tracking for guests: enter the phone used on the order to reveal
 * its status. Once verified, the tracker renders in place.
 */
export function TrackGate({ orderNumber }: { orderNumber: string }) {
  const [pending, startTransition] = useTransition();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<TrackResult, { ok: true }> | null>(
    null
  );

  if (result) {
    return (
      <OrderTracker
        order={result.order}
        items={result.items}
        events={result.events}
      />
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await trackOrder(orderNumber, phone);
          if (res.ok) setResult(res);
          else setError(res.error);
        });
      }}
      className="mx-auto max-w-sm rounded-2xl border border-border bg-card p-6"
    >
      <p className="label-caps mb-1">Order {orderNumber}</p>
      <h1 className="font-serif text-2xl text-ink">Track your order</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Enter the phone number you used at checkout.
      </p>
      <Input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        inputMode="tel"
        placeholder="01012345678"
        className="mt-4"
        required
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" className="mt-4 w-full" disabled={pending}>
        {pending ? "Checking…" : "View status"}
      </Button>
    </form>
  );
}
