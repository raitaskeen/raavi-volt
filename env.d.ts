import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    MEDIA: R2Bucket;
    /** Password for /admin. Set with `wrangler secret put ADMIN_PASSWORD`. */
    ADMIN_PASSWORD: string;
    /** Random 32+ char string used to sign admin sessions. */
    SESSION_SECRET: string;
    /** Workers Rate Limiting binding (optional in local dev). */
    RATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
  }
}

export {};
