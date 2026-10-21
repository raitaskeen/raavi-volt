import { headers } from "next/headers";
import { db } from "@/lib/cf";

const DEFAULT_LIMIT = 10; // requests per window
const WINDOW = 60; // seconds

/**
 * Returns false when this client exceeded `limit` requests for `action` in the
 * current one-minute window. Backed by D1 (free tier); fails open on errors.
 */
export async function rateLimit(action: string, limit = DEFAULT_LIMIT) {
  const h = await headers();
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % WINDOW);
  try {
    const row = await db()
      .prepare(
        `INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)
         ON CONFLICT(key) DO UPDATE SET
           count = CASE WHEN window_start = excluded.window_start THEN count + 1 ELSE 1 END,
           window_start = excluded.window_start
         RETURNING count`,
      )
      .bind(`${action}:${ip}`, windowStart)
      .first<{ count: number }>();
    // Occasionally prune stale rows so the table stays tiny.
    if (Math.random() < 0.01) {
      await db().prepare("DELETE FROM rate_limits WHERE window_start < ?").bind(now - 3600).run();
    }
    return (row?.count ?? 0) <= limit;
  } catch (err) {
    console.error("rate limit check failed", err);
    return true;
  }
}
