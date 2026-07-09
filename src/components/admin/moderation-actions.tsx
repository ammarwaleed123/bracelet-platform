"use client";

import { useTransition } from "react";

import { approveDesign, rejectDesign } from "@/app/admin/gallery/actions";
import { Button } from "@/components/ui/button";

export function ModerationActions({ designId }: { designId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => approveDesign(designId))}
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        className="border-destructive/30 text-destructive hover:bg-destructive/10"
        onClick={() => startTransition(() => rejectDesign(designId))}
      >
        Reject
      </Button>
    </div>
  );
}
