import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    MEDIA: R2Bucket;
    /** Password for /admin. Set with `wrangler secret put ADMIN_PASSWORD`. */
    ADMIN_PASSWORD: string;
    /** Random 32+ char string used to sign admin sessions. */
    SESSION_SECRET: string;
    /** WhatsApp Cloud API permanent access token (System User token). */
    WHATSAPP_TOKEN?: string;
    /** WhatsApp Cloud API phone number ID (not the phone number itself). */
    WHATSAPP_PHONE_NUMBER_ID?: string;
    /** Owner’s personal WhatsApp (e.g. 923001234567) for alerts and admin commands. */
    WHATSAPP_ADMIN_NUMBER?: string;
    /** Meta app secret — verifies webhook signatures (X-Hub-Signature-256). */
    WHATSAPP_APP_SECRET?: string;
    /** Any string you choose; Meta echoes it when you register the webhook URL. */
    WHATSAPP_VERIFY_TOKEN?: string;
    /** Optional override, e.g. a mock server in tests. Defaults to the Graph API. */
    WHATSAPP_API_BASE?: string;
    /** Workers Rate Limiting binding (optional in local dev). */
    RATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
  }
}

export {};
