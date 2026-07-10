import { cn } from "@/lib/utils";

/**
 * A neutral shimmer placeholder used by route `loading.tsx` files so navigation
 * paints instant feedback while the server renders. Honors reduced-motion.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-md bg-sand/70 motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  );
}
