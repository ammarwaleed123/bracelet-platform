import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * App-wide navigation fallback. Rendered the instant a link is clicked, before
 * the destination's server render arrives — so every navigation gives immediate
 * visual feedback instead of a frozen page. Individual routes can override this
 * with their own `loading.tsx` for a closer-fitting skeleton.
 */
export default function Loading() {
  return (
    <Container className="py-12">
      <span className="sr-only" role="status">
        Loading…
      </span>
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border p-4">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="mt-4 h-4 w-2/3" />
            <Skeleton className="mt-2 h-4 w-1/3" />
          </div>
        ))}
      </div>
    </Container>
  );
}
