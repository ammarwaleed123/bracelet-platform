"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";

import { cn, formatPrice } from "@/lib/utils";
import type { UserDesign } from "@/lib/designs/queries";
import {
  deleteDesign,
  publishDesign,
  renameDesign,
  unpublishDesign,
} from "@/lib/designs/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AccountDesigns({ designs }: { designs: UserDesign[] }) {
  if (designs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-14 text-center">
        <p className="text-ink">You haven&rsquo;t saved any designs yet.</p>
        <Button asChild className="mt-4">
          <Link href="/studio">Open the studio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {designs.map((design) => (
        <DesignRow key={design.id} design={design} />
      ))}
    </div>
  );
}

function statusLabel(design: UserDesign) {
  if (design.status !== "published_public") return { text: "Private", tone: "sand" };
  if (design.moderationStatus === "pending")
    return { text: "In review", tone: "gold" };
  if (design.moderationStatus === "rejected")
    return { text: "Not approved", tone: "destructive" };
  return { text: "Public", tone: "gold" };
}

function DesignRow({ design }: { design: UserDesign }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(design.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const badge = statusLabel(design);
  const isPublished = design.status === "published_public";

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <Link
        href={`/design/${design.publicId}`}
        className="relative block aspect-square bg-linen"
      >
        {design.thumbnailUrl ? (
          <Image
            src={design.thumbnailUrl}
            alt={design.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-sm text-stone">
            No preview
          </span>
        )}
        <span
          className={cn(
            "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium",
            badge.tone === "gold" && "bg-gold-tint text-gold-strong",
            badge.tone === "sand" && "bg-sand text-ink-soft",
            badge.tone === "destructive" && "bg-destructive/10 text-destructive"
          )}
        >
          {badge.text}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-3">
        {editing ? (
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              className="h-9"
            />
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await renameDesign(design.id, name);
                  setEditing(false);
                })
              }
            >
              Save
            </Button>
          </div>
        ) : (
          <p className="line-clamp-1 font-medium text-ink">{design.name}</p>
        )}
        <p className="mt-0.5 text-sm text-ink-soft">
          {formatPrice(design.priceInPiastres)}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/studio/${design.publicId}`}>Open</Link>
          </Button>
          {!editing && (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Rename
            </Button>
          )}
          {isPublished ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => startTransition(() => unpublishDesign(design.id))}
            >
              Unpublish
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => startTransition(() => publishDesign(design.id))}
            >
              Publish
            </Button>
          )}
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
                onClick={() => startTransition(() => deleteDesign(design.id))}
              >
                Confirm
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
      </div>
    </div>
  );
}
