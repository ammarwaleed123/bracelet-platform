import { Skeleton } from "@/components/ui/skeleton";

/**
 * Studio-specific fallback. The 3D scene and catalog are heavy, so show the
 * studio's stage + palette shape immediately on navigation rather than the
 * generic card grid.
 */
export default function StudioLoading() {
  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col lg:flex-row">
      <span className="sr-only" role="status">
        Loading the studio…
      </span>
      {/* Stage */}
      <div className="relative flex-1 bg-linen">
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="size-56 rounded-full bg-sand/60" />
        </div>
      </div>
      {/* Palette */}
      <div className="border-t border-border bg-background p-5 lg:w-96 lg:border-l lg:border-t-0">
        <Skeleton className="h-5 w-32" />
        <div className="mt-5 grid grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-11 w-full rounded-full" />
      </div>
    </div>
  );
}
