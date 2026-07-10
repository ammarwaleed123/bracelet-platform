"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Sends the visitor to the tracking page for the order number they enter. */
export function TrackLookup() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = orderNumber.trim();
        if (n) router.push(`/orders/${encodeURIComponent(n)}/track`);
      }}
      className="flex flex-col gap-3 sm:flex-row"
    >
      <Input
        value={orderNumber}
        onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
        placeholder="Order number (e.g. BR-2026-000123)"
        aria-label="Order number"
        className="flex-1"
        required
      />
      <Button type="submit" size="lg">
        Track order
      </Button>
    </form>
  );
}
