import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * Refresh the Supabase auth session on every matched request and mirror the
 * updated auth cookies onto the response. This keeps server-rendered pages in
 * sync with the user's session. Route protection (e.g. /account, /admin) is
 * layered on in later milestones once those routes exist.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.supabase.url,
    env.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // IMPORTANT: touch the user so the SSR client refreshes the token. Do not
  // run other logic between creating the client and this call.
  await supabase.auth.getUser();

  return response;
}
