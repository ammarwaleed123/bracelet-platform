import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/** Whether this is a speculative router prefetch (hover / viewport), not a real
 *  navigation. Next sends these while the user is just moving around the page. */
function isPrefetch(request: NextRequest): boolean {
  return (
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch" ||
    (request.headers.get("sec-purpose")?.includes("prefetch") ?? false)
  );
}

export async function middleware(request: NextRequest) {
  // Prefetches don't need a session refresh — skip the Supabase Auth round trip
  // so hovering links stays cheap. The real navigation still refreshes below.
  if (isPrefetch(request)) return NextResponse.next({ request });
  return updateSession(request);
}

export const config = {
  // Run on all routes except static assets and image optimization files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
