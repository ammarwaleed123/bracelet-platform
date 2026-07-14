"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Triggers the browser print dialog for the passport card. */
export function PrintButton({ label }: { label: string }) {
  return (
    <Button size="sm" onClick={() => window.print()}>
      <Printer aria-hidden /> {label}
    </Button>
  );
}
