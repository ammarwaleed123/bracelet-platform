import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Design saves include a compact thumbnail; give server actions headroom.
    serverActions: { bodySizeLimit: "3mb" },
  },
  // Pin the tracing root to this project. An unrelated lockfile in the home
  // directory otherwise makes Next infer the wrong workspace root, which
  // breaks output file tracing on Vercel.
  outputFileTracingRoot: path.join(import.meta.dirname, "."),
  images: {
    // Supabase Storage serves catalog and design imagery.
    // The project ref host is added to .env-driven config once provisioned;
    // remotePatterns is widened per-milestone as real buckets come online.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
