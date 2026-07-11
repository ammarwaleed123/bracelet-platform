/**
 * Environment access.
 *
 * Values are read lazily and validated only when first used, so the app can
 * build (`next build`) before secrets are provisioned. Missing values throw a
 * clear, actionable error at the point of use rather than a cryptic crash.
 * See .env.example for the full list.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable "${name}". Copy .env.example to .env.local and fill it in.`
    );
  }
  return value;
}

export const env = {
  supabase: {
    /** Public — safe to expose to the browser. */
    get url() {
      return required("NEXT_PUBLIC_SUPABASE_URL");
    },
    /** Public anon key — safe to expose to the browser. */
    get anonKey() {
      return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    },
    /** Server-only. Never import this into a client component. */
    get serviceRoleKey() {
      return required("SUPABASE_SERVICE_ROLE_KEY");
    },
  },
  /** Server-only Postgres connection string used by Drizzle. */
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  /** Public canonical site URL; falls back to localhost in development. */
  get siteUrl() {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  },
  /** Feature flags. Public (NEXT_PUBLIC_*) so they gate on client + server. */
  features: {
    /** AR "See It On My Wrist" prototype route (/studio/ar). */
    get ar() {
      return process.env.NEXT_PUBLIC_FEATURE_AR === "true";
    },
  },
};
