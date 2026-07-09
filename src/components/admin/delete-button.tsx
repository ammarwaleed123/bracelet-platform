"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

/**
 * Two-step inline delete: the first click reveals "Confirm / Cancel" in place
 * (no native browser dialog). Confirm runs the bound server action, which
 * deletes and redirects back to the list.
 */
export function DeleteButton({
  action,
  confirmMessage = "Delete this item? This cannot be undone.",
  children = "Delete",
}: {
  action: () => Promise<void>;
  confirmMessage?: string;
  children?: React.ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        className="border-destructive/30 text-destructive hover:bg-destructive/10"
        onClick={() => setConfirming(true)}
      >
        {children}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-ink-soft sm:inline">
        {confirmMessage}
      </span>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => setConfirming(false)}
      >
        Cancel
      </Button>
      <Button
        type="button"
        disabled={pending}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onClick={() => startTransition(() => action())}
      >
        {pending ? "Deleting…" : "Confirm delete"}
      </Button>
    </div>
  );
}
