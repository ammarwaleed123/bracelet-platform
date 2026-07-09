"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import {
  approveDesign,
  deleteGalleryDesign,
  rejectDesign,
} from "@/app/admin/gallery/actions";
import { Button } from "@/components/ui/button";

export function GalleryRowActions({
  designId,
  publicId,
  isPending,
}: {
  designId: string;
  publicId: string;
  isPending: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      {isPending && (
        <>
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
        </>
      )}

      <Button asChild size="sm" variant="outline">
        <Link href={`/studio/${publicId}`}>Edit</Link>
      </Button>

      {confirmingDelete ? (
        <>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmingDelete(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => startTransition(() => deleteGalleryDesign(designId))}
          >
            Confirm delete
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10"
          onClick={() => setConfirmingDelete(true)}
        >
          Delete
        </Button>
      )}
    </div>
  );
}
