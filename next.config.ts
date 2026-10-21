import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Images are compressed to WebP in the browser before upload and served
  // from R2 with immutable caching, so the Next image optimizer isn't needed.
  images: { unoptimized: true },
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

// Exposes D1/R2 bindings (via Wrangler's local emulation) to `next dev`.
// WRANGLER_PERSIST_DIR: optional short state dir (same value you pass to
// `wrangler --persist-to`) for Windows paths that hit the 260-char limit.
const persistDir = process.env.WRANGLER_PERSIST_DIR;
initOpenNextCloudflareForDev(persistDir ? { persist: { path: `${persistDir}/v3` } } : undefined);
