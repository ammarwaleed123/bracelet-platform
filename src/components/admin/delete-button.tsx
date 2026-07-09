"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

/**
 * Deletes via a bound server action after a confirm. The action performs the
 * delete and redirects back to the list.
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
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      className="border-destructive/30 text-destructive hover:bg-destructive/10"
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          startTransition(() => action());
        }
      }}
    >
      {pending ? "Deleting…" : children}
    </Button>
  );
}
