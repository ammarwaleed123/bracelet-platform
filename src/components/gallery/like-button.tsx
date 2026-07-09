"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { likeDesign, unlikeDesign } from "@/lib/designs/actions";

/**
 * Optimistic like toggle. If the viewer isn't signed in, the underlying action
 * redirects to sign-in (liking requires an account).
 */
export function LikeButton({
  designId,
  liked,
  count,
}: {
  designId: string;
  liked: boolean;
  count: number;
}) {
  const [isLiked, setIsLiked] = useState(liked);
  const [n, setN] = useState(count);
  const [, startTransition] = useTransition();

  const toggle = () => {
    const next = !isLiked;
    setIsLiked(next);
    setN((c) => Math.max(0, c + (next ? 1 : -1)));
    startTransition(() =>
      next ? likeDesign(designId) : unlikeDesign(designId)
    );
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isLiked}
      aria-label={isLiked ? "Unlike" : "Like"}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors",
        isLiked ? "text-gold" : "text-ink-soft hover:text-ink"
      )}
    >
      <Heart className={cn("size-4", isLiked && "fill-current")} aria-hidden />
      <span className="tabular-nums">{n}</span>
    </button>
  );
}
